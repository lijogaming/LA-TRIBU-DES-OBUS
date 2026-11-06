"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Même connexion que app/virement/page.js et app/mes-entreprises/page.js.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const GRADES_EMPLOYE = [
  "Adgent", "Adgent Lijo", "Colonel", "Colonel en Chef",
  "Vice Amiral", "Amiral", "Général", "Sergent", "Sergent Chef",
];

const champStyle = {
  width: "100%",
  padding: "13px",
  borderRadius: "10px",
  background: "#111",
  color: "white",
  border: "1px solid #444",
  boxSizing: "border-box",
  font: "inherit",
};

const blocStyle = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: "12px",
  padding: "16px",
  marginTop: "12px",
};

function obus(valeur) {
  return Number(valeur || 0).toLocaleString("fr-FR");
}

function dateFR(valeur) {
  if (!valeur) return "—";
  const date = new Date(valeur);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function statutFR(statut) {
  return ({
    en_attente: "En attente de réponse",
    contre_proposition: "Contre-proposition reçue",
    acceptee: "Acceptée",
    refusee: "Refusée",
    retiree: "Retirée / contre-proposition refusée",
  })[statut] || statut;
}

export default function MesMetiersPage() {
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [joueur, setJoueur] = useState(null);
  const [entreprises, setEntreprises] = useState([]);
  const [emplois, setEmplois] = useState([]);
  const [candidatures, setCandidatures] = useState([]);
  const [saisies, setSaisies] = useState({});
  const [recherche, setRecherche] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    setChargement(true);
    try {
      const { data: session, error: erreurSession } = await supabase.auth.getUser();
      if (erreurSession) throw erreurSession;
      if (!session.user) {
        window.location.href = "/";
        return;
      }

      const { data: profil, error: erreurProfil } = await supabase
        .from("joueurs")
        .select("id, auth_user_id, pseudo, grade, officier_general, obus")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();
      if (erreurProfil) throw erreurProfil;
      setJoueur(profil || null);

      if (!profil) {
        setEntreprises([]);
        setEmplois([]);
        setCandidatures([]);
        return;
      }

      // Lectures seulement. Toutes les modifications passent par les RPC existantes.
      const [resultatEntreprises, resultatEmplois, resultatCandidatures] =
        await Promise.all([
          supabase
            .from("entreprises")
            .select("id, nom, categorie, patron_id")
            .order("nom", { ascending: true }),
          supabase
            .from("entreprises_employes")
            .select("id, entreprise_id, salaire, date_embauche")
            .eq("employe_id", profil.id)
            .is("date_fin", null)
            .order("date_embauche", { ascending: false }),
          supabase
            .from("entreprises_candidatures")
            .select(
              "id, entreprise_id, salaire_demande, motivation, statut, " +
                "salaire_contre_proposition, reponse_patron, blocage_jusquau, created_at"
            )
            .eq("candidat_id", profil.id)
            .order("created_at", { ascending: false }),
        ]);

      if (resultatEntreprises.error) throw resultatEntreprises.error;
      if (resultatEmplois.error) throw resultatEmplois.error;
      if (resultatCandidatures.error) throw resultatCandidatures.error;

      setEntreprises(resultatEntreprises.data || []);
      setEmplois(resultatEmplois.data || []);
      setCandidatures(resultatCandidatures.data || []);
    } catch (erreur) {
      setMessage("❌ Impossible de charger les métiers : " + erreur.message);
    } finally {
      setChargement(false);
    }
  }

  const nomsEntreprises = Object.fromEntries(
    entreprises.map((entreprise) => [entreprise.id, entreprise.nom])
  );

  const gradeAutorise = Boolean(
    joueur &&
      (joueur.officier_general || GRADES_EMPLOYE.includes(joueur.grade))
  );

  function nomEntreprise(id) {
    return nomsEntreprises[id] || "Entreprise";
  }

  function modifierSaisie(id, champ, valeur) {
    setSaisies((ancien) => ({
      ...ancien,
      [id]: { ...ancien[id], [champ]: valeur },
    }));
  }

  function demanderAction(rpc, parametres, titre, description, succes, apres) {
    if (enCours) return;
    setMessage("");
    setConfirmation({ rpc, parametres, titre, description, succes, apres });
  }

  async function confirmerAction() {
    if (!confirmation || enCours) return;
    const action = confirmation;
    setConfirmation(null);
    setEnCours(true);
    setMessage("");

    try {
      const { error } = await supabase.rpc(action.rpc, action.parametres);
      if (error) throw error;
      if (action.apres?.entrepriseId) {
        setSaisies((ancien) => ({
          ...ancien,
          [action.apres.entrepriseId]: { salaire: "", motivation: "" },
        }));
      }
      await chargerDonnees();
      setMessage("✅ " + action.succes);
    } catch (erreur) {
      setMessage("❌ " + erreur.message);
    } finally {
      setEnCours(false);
    }
  }

  function postuler(e, entreprise) {
    e.preventDefault();
    const saisie = saisies[entreprise.id] || {};
    const salaire = Number(saisie.salaire);
    const motivation = String(saisie.motivation || "").trim();

    if (!Number.isInteger(salaire) || salaire < 100 || salaire > 500) {
      setMessage("❌ Demande un salaire entier entre 100 et 500 Obus.");
      return;
    }
    if (!motivation) {
      setMessage("❌ Tu dois expliquer pourquoi tu souhaites être recruté.");
      return;
    }

    demanderAction(
      "postuler_entreprise",
      {
        p_entreprise_id: entreprise.id,
        p_salaire_demande: salaire,
        p_motivation: motivation,
      },
      "CONFIRMER LA CANDIDATURE",
      `Entreprise : ${entreprise.nom}\nSalaire demandé : ${obus(salaire)} Obus par live\n\nMotivation : ${motivation}`,
      "Candidature envoyée au patron.",
      { entrepriseId: entreprise.id }
    );
  }

  function repondre(candidature, accepter) {
    const salaire = candidature.salaire_contre_proposition;
    demanderAction(
      "repondre_contre_proposition_entreprise",
      { p_candidature_id: candidature.id, p_accepter: accepter },
      accepter ? "CONFIRMER L'EMBAUCHE" : "REFUSER LA PROPOSITION",
      accepter
        ? `Accepter le poste chez ${nomEntreprise(candidature.entreprise_id)} pour ${obus(salaire)} Obus par live ?`
        : `Refuser la contre-proposition de ${obus(salaire)} Obus chez ${nomEntreprise(candidature.entreprise_id)} ?`,
      accepter ? "Contre-proposition acceptée : tu es recruté !" : "Contre-proposition refusée."
    );
  }


function nouvelleContreProposition(candidature) {
  const salaire = Number(
    saisies[candidature.id]?.nouveauSalaire
  );

  const argument = String(
    saisies[candidature.id]?.argumentCandidat || ""
  ).trim();

  if (
    !Number.isInteger(salaire) ||
    salaire < 100 ||
    salaire > 500
  ) {
    setMessage(
      "❌ Propose un salaire entier entre 100 et 500 Obus."
    );
    return;
  }

  if (
    salaire ===
    Number(candidature.salaire_contre_proposition)
  ) {
    setMessage(
      "❌ Le nouveau salaire doit être différent de celui du patron."
    );
    return;
  }

  if (argument.length > 500) {
    setMessage(
      "❌ Ton argument ne peut pas dépasser 500 caractères."
    );
    return;
  }

  demanderAction(
    "contre_proposer_salaire_candidat_avec_argument",
    {
      p_candidature_id: candidature.id,
      p_salaire_propose: salaire,
      p_argument: argument,
    },
    "CONFIRMER LA CONTRE-PROPOSITION",
    `Proposer ${obus(salaire)} Obus par live à ${nomEntreprise(candidature.entreprise_id)} ?` +
      (argument ? `\n\nArgument : ${argument}` : ""),
    "Nouvelle contre-proposition envoyée au patron."
  );
}


  function demissionner(emploi) {
    demanderAction(
      "demissionner_entreprise",
      { p_entreprise_id: emploi.entreprise_id },
      "CONFIRMER LA DÉMISSION",
      `Quitter ${nomEntreprise(emploi.entreprise_id)} ? Ton contrat prendra fin immédiatement.`,
      "Démission enregistrée."
    );
  }

  const entreprisesFiltrees = entreprises.filter((entreprise) =>
    entreprise.nom.toLocaleLowerCase("fr").includes(recherche.trim().toLocaleLowerCase("fr"))
  );

  return (
    <main className="container">
      <div className="logo">💼</div>
      <h1>MES MÉTIERS</h1>
      <p className="subtitle">Recherche d'emploi et suivi de tes candidatures</p>

      <div className="card" style={{ position: "relative", paddingTop: "70px" }}>
        <button
          type="button"
          onClick={() => { window.location.href = "/"; }}
          title="Retour à l'accueil"
          aria-label="Retour à l'accueil"
          style={{
            position: "absolute", top: "15px", left: "15px", width: "42px",
            height: "42px", padding: 0, display: "flex", alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5 M11 6L5 12L11 18"
              stroke="currentColor" strokeWidth="3.5"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="label">TON PROFIL</p>
        <h2>💰 {joueur ? obus(joueur.obus) : "—"} Obus</h2>
        <p style={{ color: "#aaa", marginBottom: 0 }}>
          {joueur ? `${joueur.pseudo} — Grade : ${joueur.grade}` : "Connexion au profil..."}
        </p>
      </div>

      {message && (
        <div className="card" role="status" style={{ marginTop: "20px", overflowWrap: "anywhere" }}>
          {message}
        </div>
      )}

      {chargement ? (
        <div className="card" style={{ marginTop: "20px" }}>Chargement...</div>
      ) : !joueur ? (
        <div className="card" style={{ marginTop: "20px" }}>Profil joueur introuvable.</div>
      ) : (
        <>
          <div className="card" style={{ marginTop: "20px" }}>
            <h2>👷 MES EMPLOIS ({emplois.length})</h2>
            {emplois.length === 0 ? (
              <p>Tu n'as aucun contrat actif pour le moment.</p>
            ) : emplois.map((emploi) => {
              const dateAutorisee = new Date(emploi.date_embauche).getTime() + 7 * 24 * 60 * 60 * 1000;
              const peutDemissionner = Number.isFinite(dateAutorisee) && Date.now() >= dateAutorisee;
              return (
                <div key={emploi.id} style={blocStyle}>
                  <h3 style={{ overflowWrap: "anywhere" }}>🏢 {nomEntreprise(emploi.entreprise_id)}</h3>
                  <p><strong>Salaire :</strong> {obus(emploi.salaire)} Obus par live</p>
                  <p><strong>Embauché le :</strong> {dateFR(emploi.date_embauche)}</p>
                  <p style={{ color: "#aaa", fontSize: "14px" }}>
                    Salaire versé si toi et le patron êtes présents dans le chat du live.
                  </p>
                  {peutDemissionner ? (
                    <button
                      type="button" disabled={enCours}
                      onClick={() => demissionner(emploi)}
                      style={{ background: "#a52a2a", color: "white" }}
                    >
                      DÉMISSIONNER
                    </button>
                  ) : (
                    <p style={{ color: "#e5bd68", fontSize: "14px" }}>
                      Démission possible à partir du {dateFR(dateAutorisee)} (7 jours après l'embauche).
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card" style={{ marginTop: "20px" }}>
            <h2>📨 MES CANDIDATURES</h2>
            {candidatures.length === 0 ? (
              <p>Tu n'as encore envoyé aucune candidature.</p>
            ) : candidatures.map((candidature) => (
              <div key={candidature.id} style={blocStyle}>
                <h3 style={{ overflowWrap: "anywhere" }}>
                  🏢 {nomEntreprise(candidature.entreprise_id)}
                </h3>
                <p><strong>Statut :</strong> {statutFR(candidature.statut)}</p>
                <p><strong>Salaire demandé :</strong> {obus(candidature.salaire_demande)} Obus / live</p>
                <p style={{ color: "#aaa", fontSize: "13px" }}>
                  Envoyée le {dateFR(candidature.created_at)}
                </p>
                {candidature.reponse_patron && (
                  <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    <strong>Message du patron :</strong> {candidature.reponse_patron}
                  </p>
                )}
                {candidature.blocage_jusquau &&
                  new Date(candidature.blocage_jusquau).getTime() > Date.now() && (
                    <p style={{ color: "#ff8888" }}>
                      Nouvelle candidature bloquée jusqu'au {dateFR(candidature.blocage_jusquau)}.
                    </p>
                  )}
                {candidature.statut === "contre_proposition" && (
                  <div style={{
                    marginTop: "14px", padding: "16px", background: "#0c0c0c",
                    border: "1px solid #3b82f6", borderRadius: "12px",
                  }}>
                    <p className="label">CONTRE-PROPOSITION DU PATRON</p>
                    <h3 style={{ color: "#e5bd68" }}>
                      {obus(candidature.salaire_contre_proposition)} Obus / live
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <button
                        type="button" disabled={enCours}
                        onClick={() => repondre(candidature, false)}
                        style={{ background: "#333", color: "white" }}
                      >
                        REFUSER
                      </button>
                      <button
                        type="button" disabled={enCours}
                        onClick={() => repondre(candidature, true)}
                      >
                        ACCEPTER
                      </button>
                    </div>
                          
<div style={{ marginTop: "16px" }}>
  <p className="label">
    TA NOUVELLE PROPOSITION (100 À 500 OBUS)
  </p>

  <input
    type="number"
    min="100"
    max="500"
    step="1"
    placeholder="Ex. : 300"
    value={
      saisies[candidature.id]?.nouveauSalaire ?? ""
    }
    onChange={(e) =>
      modifierSaisie(
        candidature.id,
        "nouveauSalaire",
        e.target.value
      )
    }
    style={champStyle}
  />

  <button
    type="button"
    disabled={enCours}
    onClick={() =>
      nouvelleContreProposition(candidature)
    }
    style={{ marginTop: "10px" }}
  >

<div style={{ marginTop: "12px" }}>
  <p className="label" style={{ color: "#111" }}>
    ARGUMENT POUR MA CONTRE-PROPOSITION
  </p>

  <textarea
    placeholder="Explique pourquoi tu proposes ce salaire..."
    maxLength={500}
    rows={3}
    value={
      saisies[candidature.id]?.argumentCandidat ?? ""
    }
    onChange={(e) =>
      modifierSaisie(
        candidature.id,
        "argumentCandidat",
        e.target.value
      )
    }
    style={{
      ...champStyle,
      resize: "vertical",
    }}
  />

  <p
    style={{
      color: "#111",
      fontSize: "12px",
      textAlign: "right",
      margin: "5px 0 0",
    }}
  >
    {
      (saisies[candidature.id]?.argumentCandidat || "").length
    }/500 caractères
  </p>
</div>

    🤝 FAIRE UNE CONTRE-PROPOSITION
  </button>
</div>

                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: "20px" }}>
            <h2>🔎 RECHERCHER UNE ENTREPRISE</h2>
            <p>Postule auprès d'une entreprise. Le grade minimum requis est Adgent.</p>
            {!gradeAutorise && (
              <p style={{ color: "#ff8888" }}>
                Ton grade actuel ne permet pas encore de postuler.
              </p>
            )}
            <input
              type="search" value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une entreprise..." aria-label="Rechercher une entreprise"
              style={champStyle}
            />
            <p style={{ color: "#aaa", fontSize: "13px" }}>
              {entreprisesFiltrees.length} entreprise(s) trouvée(s). Chaque entreprise peut recruter jusqu'à 5 employés.
            </p>

            {entreprisesFiltrees.length === 0 ? (
              <p>Aucune entreprise trouvée.</p>
            ) : entreprisesFiltrees.map((entreprise) => {
              const actif = emplois.some((emploi) => emploi.entreprise_id === entreprise.id);
              const enAttente = candidatures.find(
                (c) => c.entreprise_id === entreprise.id &&
                  ["en_attente", "contre_proposition"].includes(c.statut)
              );
              const sesBlocages = candidatures
                .filter((c) => c.entreprise_id === entreprise.id && c.blocage_jusquau)
                .map((c) => new Date(c.blocage_jusquau).getTime());
              const finBlocage = sesBlocages.length ? Math.max(...sesBlocages) : 0;
              const bloque = Number.isFinite(finBlocage) && finBlocage > Date.now();
              const estPatron = entreprise.patron_id === joueur.id;
              const peutPostuler = gradeAutorise && !actif && !enAttente && !bloque && !estPatron;
              const saisie = saisies[entreprise.id] || {};

              return (
                <div key={entreprise.id} style={blocStyle}>
                  <h3 style={{ overflowWrap: "anywhere" }}>🏢 {entreprise.nom}</h3>
                  <p><strong>Catégorie :</strong> {entreprise.categorie}</p>
                  {estPatron ? (
                    <p>Tu es le patron de cette entreprise.</p>
                  ) : actif ? (
                    <p style={{ color: "#e5bd68" }}>Tu travailles déjà ici.</p>
                  ) : enAttente ? (
                    <p style={{ color: "#e5bd68" }}>
                      {statutFR(enAttente.statut)} — retrouve le dossier dans « Mes candidatures ».
                    </p>
                  ) : bloque ? (
                    <p style={{ color: "#ff8888" }}>
                      Candidatures bloquées jusqu'au {dateFR(finBlocage)}.
                    </p>
                  ) : !gradeAutorise ? (
                    <p>Grade Adgent minimum requis pour postuler.</p>
                  ) : (
                    <form onSubmit={(e) => postuler(e, entreprise)}>
                      <p className="label">SALAIRE DEMANDÉ (100 À 500 OBUS)</p>
                      <input
                        type="number" min="100" max="500" step="1" required
                        value={saisie.salaire ?? ""}
                        onChange={(e) => modifierSaisie(entreprise.id, "salaire", e.target.value)}
                        placeholder="Ex. : 250" style={champStyle}
                      />
                      <p className="label" style={{ marginTop: "14px" }}>TA MOTIVATION</p>
                      <textarea
                        required rows={3} value={saisie.motivation ?? ""}
                        onChange={(e) => modifierSaisie(entreprise.id, "motivation", e.target.value)}
                        placeholder="Pourquoi souhaites-tu rejoindre cette entreprise ?"
                        style={{ ...champStyle, resize: "vertical" }}
                      />
                      <button type="submit" disabled={enCours || !peutPostuler} style={{ marginTop: "12px" }}>
                        📨 ENVOYER MA CANDIDATURE
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {confirmation && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px", boxSizing: "border-box",
        }}>
          <div role="dialog" aria-modal="true" aria-label={confirmation.titre}
            style={{
              width: "100%", maxWidth: "440px", maxHeight: "calc(100dvh - 32px)",
              overflowY: "auto", boxSizing: "border-box", background: "#171717",
              border: "3px solid #3b82f6", borderRadius: "22px",
              padding: "24px 18px", color: "white",
              boxShadow: "0 15px 60px rgba(0,0,0,0.8)",
            }}>
            <h2 style={{
              textAlign: "center", color: "#e5bd68", fontSize: "23px",
              margin: "0 0 12px", lineHeight: "1.3",
            }}>
              💼 {confirmation.titre}
            </h2>
            <p style={{ color: "#bbb", textAlign: "center", fontSize: "14px", margin: "0 0 22px" }}>
              Vérifie les informations avant de confirmer.
            </p>
            <div style={{
              background: "#0c0c0c", border: "1px solid #444", borderRadius: "16px",
              padding: "20px 16px", marginBottom: "24px", textAlign: "center",
              whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: "1.6",
            }}>
              {confirmation.description}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button type="button" onClick={() => setConfirmation(null)} disabled={enCours}
                style={{
                  width: "100%", padding: "15px 8px", background: "#333", color: "white",
                  border: "1px solid #555", borderRadius: "12px",
                  fontSize: "15px", fontWeight: "bold", cursor: "pointer",
                }}>
                ANNULER
              </button>
              <button type="button" onClick={confirmerAction} disabled={enCours}
                style={{
                  width: "100%", padding: "15px 8px", background: "#e5bd68", color: "#111",
                  border: "none", borderRadius: "12px", fontSize: "15px",
                  fontWeight: "bold", cursor: "pointer",
                }}>
                CONFIRMER
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
