"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import NotificationsRubrique from "../components/NotificationsRubrique";
import HistoriqueCandidatures from "../components/HistoriqueCandidatures";

// Même configuration Supabase que dans app/virement/page.js.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const GRADES_PATRON = [
  "Colonel",
  "Colonel en Chef",
  "Vice Amiral",
  "Amiral",
  "Général",
  "Sergent",
  "Sergent Chef",
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

const carteStyle = { marginTop: "20px" };
const ligneStyle = {
  padding: "16px",
  background: "#111",
  border: "1px solid #333",
  borderRadius: "12px",
  marginTop: "12px",
};

function afficherObus(valeur) {
  return Number(valeur || 0).toLocaleString("fr-FR");
}

export default function MesEntreprisesPage() {
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [joueur, setJoueur] = useState(null);
  const [entreprise, setEntreprise] = useState(null);
  const [statistiquesEntreprise, setStatistiquesEntreprise] = useState(null);
  const [employes, setEmployes] = useState([]);
  const [candidatures, setCandidatures] = useState([]);
  const [candidaturesOuvertes, setCandidaturesOuvertes] = useState(false);
  const [historiqueCandidatures, setHistoriqueCandidatures] = useState([]);
  const [pseudos, setPseudos] = useState({});
  const [blocagesPossibles, setBlocagesPossibles] = useState({});
  const [nom, setNom] = useState("");
  const [message, setMessage] = useState("");
  const [raisons, setRaisons] = useState({});
  const [blocages, setBlocages] = useState({});
  const [propositions, setPropositions] = useState({});
  const [messagesPropositions, setMessagesPropositions] = useState({});
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    setChargement(true);
    setStatistiquesEntreprise(null);

    try {
      const { data: session, error: erreurSession } =
        await supabase.auth.getUser();

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
        setEntreprise(null);
        setEmployes([]);
        setCandidatures([]);
        setHistoriqueCandidatures([]);
        return;
      }

      const { data: societe, error: erreurSociete } = await supabase
        .from("entreprises")
        .select("id, nom, patron_id, categorie, bonus_base_live, created_at")
        .eq("patron_id", profil.id)
        .maybeSingle();

      if (erreurSociete) throw erreurSociete;
      setEntreprise(societe || null);

      if (!societe) {
        setEmployes([]);
        setCandidatures([]);
        setHistoriqueCandidatures([]);
        setPseudos({});
        return;
      }

      const [reponseEmployes, reponseCandidatures, reponseClassement] = await Promise.all([
        supabase
          .from("entreprises_employes")
          .select("id, employe_id, salaire, date_embauche")
          .eq("entreprise_id", societe.id)
          .is("date_fin", null)
          .order("date_embauche", { ascending: true }),
        supabase
          .from("entreprises_candidatures")
          .select(
            "id, candidat_id, salaire_demande, motivation, statut, " +
            "salaire_contre_proposition, reponse_patron, argument_candidat, blocage_jusquau, created_at"          )
          .eq("entreprise_id", societe.id)
          .order("created_at", { ascending: false }),
        supabase.rpc("lister_classement_entreprises"),
      ]);

      if (reponseEmployes.error) throw reponseEmployes.error;
      if (reponseCandidatures.error) throw reponseCandidatures.error;

      if (reponseClassement.error) {
        console.error("Impossible de charger les statistiques de l'entreprise :", reponseClassement.error);
        setStatistiquesEntreprise(null);
      } else {
        setStatistiquesEntreprise(
          (reponseClassement.data || []).find(
            (ligne) => ligne.entreprise_id === societe.id
          ) || null
        );
      }

      const listeEmployes = reponseEmployes.data || [];
      const listeCandidatures = reponseCandidatures.data || [];
      setEmployes(listeEmployes);
      setCandidatures(
        listeCandidatures.filter((item) =>
          ["en_attente", "contre_proposition"].includes(item.statut)
        )
      );
      setHistoriqueCandidatures(listeCandidatures);

      const identifiants = [
        ...new Set([
          ...listeEmployes.map((element) => element.employe_id),
          ...listeCandidatures.map((element) => element.candidat_id),
        ]),
      ].filter(Boolean);

      
if (identifiants.length === 0) {
  setPseudos({});
  setBlocagesPossibles({});
} else {
  const { data: infos, error: erreurInfos } =
    await supabase.rpc(
      "infos_membres_entreprise",
      { p_entreprise_id: societe.id }
    );

  if (erreurInfos) throw erreurInfos;

  setPseudos(
    Object.fromEntries(
      (infos || []).map((j) => [j.joueur_id, j.pseudo])
    )
  );

  setBlocagesPossibles(
    Object.fromEntries(
      (infos || []).map((j) => [
        j.joueur_id,
        j.blocage_possible,
      ])
    )
  );
}

    } catch (erreur) {
      setMessage("❌ Chargement impossible : " + erreur.message);
    } finally {
      setChargement(false);
    }
  }

  function nomJoueur(id) {
    return pseudos[id] || `Joueur ${String(id || "").slice(0, 8)}`;
  }

  function demanderAction(rpc, parametres, titre, description, succes) {
    if (enCours) return;
    setMessage("");
    setConfirmation({ rpc, parametres, titre, description, succes });
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
      await chargerDonnees();
      setMessage("✅ " + action.succes);
    } catch (erreur) {
      const nomDejaPris =
        action.rpc === "creer_entreprise" &&
        /entreprises_nom_normalise_unique|nom d.{0,30}(déjà|deja|exist)|duplicate key.{0,50}nom/i.test(
          String(erreur.message || "")
        );
      setMessage(
        nomDejaPris
          ? "❌ Ce nom d'entreprise est déjà utilisé. Choisis un autre nom."
          : "❌ " + erreur.message
      );
    } finally {
      setEnCours(false);
    }
  }

  function demanderCreation(e) {
    e.preventDefault();
    const valeur = nom.trim();
    const longueur = Array.from(valeur).length;

    if (longueur < 3 || longueur > 30) {
      setMessage("❌ Le nom doit comporter entre 3 et 30 caractères.");
      return;
    }
    if (!joueur || Number(joueur.obus) < 1000) {
      setMessage("❌ Il faut au moins 1 000 Obus.");
      return;
    }

    demanderAction(
      "creer_entreprise",
      { p_nom: valeur },
      "CONFIRMER LA CRÉATION",
      `Créer « ${valeur} » pour 1 000 Obus ? Cette dépense est définitive.`,
      "Entreprise créée avec succès !"
    );
  }

  function accepter(candidature) {
    if (employes.length >= 5) return;
    demanderAction(
      "accepter_candidature_entreprise",
      { p_candidature_id: candidature.id },
      "CONFIRMER LE RECRUTEMENT",
      `Embaucher ${nomJoueur(candidature.candidat_id)} pour ` +
        `${candidature.salaire_demande} Obus par live ?`,
      "Candidature acceptée."
    );
  }

  function refuser(candidature) {
    const justification = (raisons[candidature.id] || "").trim();
    if (!justification) {
      setMessage("❌ Ajoute une justification avant de refuser.");
      return;
    }
    const bloquer = Boolean(
  blocages[candidature.id] &&
  blocagesPossibles[candidature.candidat_id]
);
    demanderAction(
      "refuser_candidature_entreprise",
      {
        p_candidature_id: candidature.id,
        p_justification: justification,
        p_bloquer: bloquer,
      },
      "CONFIRMER LE REFUS",
      `Refuser la candidature de ${nomJoueur(candidature.candidat_id)}` +
        (bloquer ? " et demander son blocage pendant 4 jours ?" : " ?"),
      "Candidature refusée."
    );
  }

  function contreProposition(candidature) {
    const salaire = Number(propositions[candidature.id]);
    if (!Number.isInteger(salaire) || salaire < 100 || salaire > 500) {
      setMessage("❌ Le salaire proposé doit être compris entre 100 et 500 Obus.");
      return;
    }
    if (salaire === candidature.salaire_demande) {
      setMessage("❌ La contre-proposition doit différer du salaire demandé.");
      return;
    }
    demanderAction(
      "proposer_salaire_entreprise",
      {
        p_candidature_id: candidature.id,
        p_salaire_propose: salaire,
        p_message: (messagesPropositions[candidature.id] || "").trim() || null,
      },
      "CONFIRMER LA CONTRE-PROPOSITION",
      `Proposer ${salaire} Obus par live à ` +
        `${nomJoueur(candidature.candidat_id)} ?`,
      "Contre-proposition envoyée."
    );
  }

  function licencier(emploi) {
    demanderAction(
      "licencier_employe_entreprise_cible",
      { p_entreprise_id: entreprise.id, p_employe_id: emploi.employe_id },
      "CONFIRMER LE LICENCIEMENT",
      `Licencier ${nomJoueur(emploi.employe_id)} ? ` +
        "Son contrat prendra fin immédiatement.",
      "Employé licencié."
    );
  }

  const patronAutorise = Boolean(
    joueur &&
      (joueur.officier_general || GRADES_PATRON.includes(joueur.grade))
  );
  return (
    <main className="container">
      <div className="logo">🏢</div>
      <h1>MES ENTREPRISES</h1>
      <p className="subtitle">Création et gestion de ton entreprise</p>

      <div className="card" style={{ position: "relative", paddingTop: "70px" }}>
        <NotificationsRubrique supabase={supabase} joueurId={joueur?.id} rubrique="entreprises" />
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          title="Retour à l'accueil"
          aria-label="Retour à l'accueil"
          style={{
            position: "absolute",
            top: "15px",
            left: "15px",
            width: "42px",
            height: "42px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5 M11 6L5 12L11 18"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {entreprise ? (
          <>
            <p className="label">OBUS DE L'ENTREPRISE</p>
            <h2>💰 {statistiquesEntreprise ? afficherObus(statistiquesEntreprise.total_obus) : "—"} Obus</h2>
            <p className="label" style={{ marginTop: "18px" }}>
              LIVES TOTAL DE L'ENTREPRISE
            </p>
            <h2 style={{ marginBottom: 0 }}>
              📊 {statistiquesEntreprise ? afficherObus(statistiquesEntreprise.total_lives) : "—"} lives
            </h2>
            <p style={{ color: "#aaa", fontSize: "13px", marginBottom: 0 }}>
              Totaux du patron et des employés actifs.
            </p>
          </>
        ) : (
          <>
            <p className="label">TON SOLDE</p>
            <h2>💰 {joueur ? afficherObus(joueur.obus) : "—"} Obus</h2>
            <p style={{ color: "#aaa", marginBottom: 0 }}>
              {joueur ? `Grade : ${joueur.grade}` : "Connexion au profil..."}
            </p>
          </>
        )}
      </div>

      {message && (
        <div
          className="card"
          role="status"
          style={{ ...carteStyle, overflowWrap: "anywhere" }}
        >
          {message}
        </div>
      )}

      {chargement ? (
        <div className="card" style={carteStyle}>
          <p>Chargement...</p>
        </div>
      ) : !joueur ? (
        <div className="card" style={carteStyle}>
          <p>Profil joueur introuvable.</p>
        </div>
      ) : !entreprise ? (
        <div className="card" style={carteStyle}>
          <h2>🏗️ CRÉER MON ENTREPRISE</h2>
          <p>Une entreprise par patron, dans la catégorie Armurerie.</p>
          <p>
            <strong>Grade minimum :</strong> Colonel ou Officier général
          </p>
          <p>
            <strong>Coût :</strong> 1 000 Obus
          </p>
          <p>
            <strong>Capacité :</strong> 5 employés maximum
          </p>
          <p>
            <strong>Rentabilité de base :</strong> entre +50 et +200 Obus par live,
            tirée au hasard une seule fois à la création. Le patron doit être présent
            au live pour recevoir ce bonus, même sans employé.
          </p>

          {!patronAutorise ? (
            <p style={{ color: "#f5b5b5" }}>
              Tu n'as pas encore le grade nécessaire pour créer une entreprise.
            </p>
          ) : Number(joueur.obus) < 1000 ? (
            <p style={{ color: "#f5b5b5" }}>
              Il te manque {afficherObus(1000 - Number(joueur.obus))} Obus.
            </p>
          ) : (
            <form onSubmit={demanderCreation}>
              <p className="label">NOM DE L'ENTREPRISE</p>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                minLength={3}
                maxLength={30}
                required
                placeholder="Nom de ton entreprise..."
                style={champStyle}
              />
              <p style={{ color: "#aaa", fontSize: "13px" }}>
                {Array.from(nom).length}/30 caractères
              </p>
              <button type="submit" disabled={enCours}>
                💣 CRÉER POUR 1 000 OBUS
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="card" style={carteStyle}>
          <p className="label">TON ENTREPRISE N°1</p>
          <h2 style={{ overflowWrap: "anywhere" }}>🏢 {entreprise.nom}</h2>
          <p>Catégorie : {entreprise.categorie}</p>
          <p>
            <strong>Rentabilité de base :</strong> +{afficherObus(entreprise.bonus_base_live)} Obus / live
            si tu es présent, même sans employé.
          </p>
          <p style={{ color: "#aaa", fontSize: "14px" }}>
            Chaque employé te fait gagner 500 Obus par live lorsque tu es présent.
            Il faut retirer de ces 500 Obus son salaire, compris entre 100 et 500 Obus.
            Exemple : pour un salaire de 100 Obus, tu gagnes 400 Obus,
            en plus de ta rentabilité de base.
          </p>

          <hr style={{ border: 0, borderTop: "1px solid #444", margin: "24px 0" }} />
          <h2>👥 EMPLOYÉS ({employes.length}/5)</h2>
            {employes.length === 0 ? (
              <p>Aucun employé pour le moment.</p>
            ) : (
              employes.map((emploi) => (
                <div key={emploi.id} style={ligneStyle}>
                  <h3 style={{ overflowWrap: "anywhere" }}>
                    {nomJoueur(emploi.employe_id)}
                  </h3>
                  <p>Salaire : {afficherObus(emploi.salaire)} Obus / live</p>
                  <p>
                    Gain patron : +{afficherObus(500 - emploi.salaire)} Obus
                    / live si présent
                  </p>
                  <button
                    type="button"
                    disabled={enCours}
                    onClick={() => licencier(emploi)}
                    style={{ background: "#a52a2a", color: "white" }}
                  >
                    LICENCIER CET EMPLOYÉ
                  </button>
                </div>
              ))
            )}
          <hr style={{ border: 0, borderTop: "1px solid #444", margin: "24px 0" }} />
          <button
            type="button"
            onClick={() => setCandidaturesOuvertes((ouvertes) => !ouvertes)}
            aria-expanded={candidaturesOuvertes}
            style={{
              width: "100%",
              margin: 0,
              padding: "15px",
              background: "#222",
              border: "1px solid #e5bd68",
              borderRadius: "12px",
              color: "#e5bd68",
              textAlign: "left",
            }}
          >
            {candidaturesOuvertes
              ? `− Masquer les candidatures en cours (${candidatures.length})`
              : `+ Consulter les candidatures en cours (${candidatures.length})`}
          </button>
          {candidaturesOuvertes && (
            <div
              style={{
                marginTop: "16px",
                maxHeight: "520px",
                overflowY: "auto",
                overscrollBehavior: "contain",
                paddingRight: "6px",
              }}
            >
            {employes.length >= 5 && (
              <p style={{ color: "#e5bd68" }}>
                Les 5 postes sont occupés. Tu peux consulter les candidatures,
                mais tu dois libérer un poste pour recruter.
              </p>
            )}
            {candidatures.length === 0 ? (
              <p>Aucune candidature en attente.</p>
            ) : (
              candidatures.map((candidature) => (
                <div key={candidature.id} style={ligneStyle}>
                  <h3 style={{ overflowWrap: "anywhere" }}>
                    {nomJoueur(candidature.candidat_id)}
                  </h3>
                  <p>
                    <strong>Salaire demandé :</strong>{" "}
                    {afficherObus(candidature.salaire_demande)} Obus / live
                  </p>
                  <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    <strong>Motivation :</strong> {candidature.motivation || "—"}
                  </p>

{candidature.argument_candidat && (
  <p
    style={{
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
      padding: "14px",
      background: "#1c1c1c",
      border: "1px solid #e5bd68",
      borderRadius: "10px",
      textAlign: "left",
    }}
  >
    <strong style={{ color: "#e5bd68" }}>
      🤝 Dernier argument du candidat :
    </strong>
    {" "}
    {candidature.argument_candidat}
  </p>
)}

                  {candidature.statut === "contre_proposition" ? (
                    <p style={{ color: "#e5bd68" }}>
                      Contre-proposition de {candidature.salaire_contre_proposition}{" "}
                      Obus envoyée. En attente de la réponse du candidat.
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={enCours || employes.length >= 5}
                        onClick={() => accepter(candidature)}
                      >
                        ✅ ACCEPTER LA CANDIDATURE
                      </button>

                      <div style={{ marginTop: "16px" }}>
                        <p className="label">AUTRE PROPOSITION DE SALAIRE</p>
                        <input
                          type="number"
                          min="100"
                          max="500"
                          step="1"
                          placeholder="Salaire entre 100 et 500 Obus"
                          value={propositions[candidature.id] || ""}
                          onChange={(e) =>
                            setPropositions((ancien) => ({
                              ...ancien,
                              [candidature.id]: e.target.value,
                            }))
                          }
                          style={champStyle}
                        />
                        <textarea
                          placeholder="Message facultatif au candidat..."
                          value={messagesPropositions[candidature.id] || ""}
                          onChange={(e) =>
                            setMessagesPropositions((ancien) => ({
                              ...ancien,
                              [candidature.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          style={{ ...champStyle, marginTop: "10px", resize: "vertical" }}
                        />
                        <button
                          type="button"
                          disabled={enCours}
                          onClick={() => contreProposition(candidature)}
                          style={{ marginTop: "10px" }}
                        >
                          🤝 ENVOYER LA CONTRE-PROPOSITION
                        </button>
                      </div>

                      <div style={{ marginTop: "20px" }}>
                        <p className="label">REFUSER LA CANDIDATURE</p>
                        <textarea
                          placeholder="Justification obligatoire..."
                          value={raisons[candidature.id] || ""}
                          onChange={(e) =>
                            setRaisons((ancien) => ({
                              ...ancien,
                              [candidature.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          style={{ ...champStyle, resize: "vertical" }}
                        />
                        
{blocagesPossibles[candidature.candidat_id] && (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "15px",
      margin: "18px 0",
      padding: "16px",
      background: blocages[candidature.id]
        ? "rgba(229, 189, 104, 0.12)"
        : "#1c1c1c",
      border: blocages[candidature.id]
        ? "2px solid #e5bd68"
        : "1px solid #444",
      borderRadius: "14px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }}
  >
    <input
      type="checkbox"
      checked={Boolean(blocages[candidature.id])}
      onChange={(e) =>
        setBlocages((ancien) => ({
          ...ancien,
          [candidature.id]: e.target.checked,
        }))
      }
      style={{
        position: "absolute",
        opacity: 0,
        width: "1px",
        height: "1px",
      }}
    />

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flex: 1,
      }}
    >
      <span style={{ fontSize: "24px" }}>
        ❗
      </span>

      <strong
        style={{
          fontSize: "14px",
          color: "#e5bd68",
          textAlign: "left",
        }}
      >
        Bloquer ce candidat pendant 4 jours
      </strong>
    </div>

    <span
      aria-hidden="true"
      style={{
        width: "48px",
        height: "26px",
        borderRadius: "30px",
        background: blocages[candidature.id]
          ? "#e5bd68"
          : "#444",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "4px",
          left: blocages[candidature.id]
            ? "26px"
            : "4px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: blocages[candidature.id]
            ? "#111"
            : "#ddd",
          transition: "left 0.2s ease",
        }}
      />
    </span>
  </label>
)}

                        <button
                          type="button"
                          disabled={enCours}
                          onClick={() => refuser(candidature)}
                          style={{ background: "#a52a2a", color: "white" }}
                        >
                          ❌ REFUSER LA CANDIDATURE
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
            </div>
          )}
          <hr style={{ border: 0, borderTop: "1px solid #444", margin: "24px 0" }} />
          <HistoriqueCandidatures
            supabase={supabase}
            candidatures={historiqueCandidatures}
            mode="patron"
            entrepriseId={entreprise.id}
            joueurId={joueur.id}
            nomEntreprise={() => entreprise.nom}
            nomJoueur={nomJoueur}
            integre
          />
        </div>
      )}

     
      {confirmation && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={confirmation.titre}
            style={{
              width: "100%",
              maxWidth: "440px",
              maxHeight: "calc(100dvh - 32px)",
              overflowY: "auto",
              boxSizing: "border-box",
              background: "#171717",
              border: "3px solid #3b82f6",
              borderRadius: "22px",
              padding: "28px 18px",
              color: "white",
              boxShadow: "0 15px 60px rgba(0,0,0,0.8)",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                color: "#e5bd68",
                fontSize: "23px",
                fontWeight: "bold",
                lineHeight: "1.3",
                margin: "0 0 12px",
              }}
            >
              💣 {confirmation.titre}
            </h2>

            <p
              style={{
                textAlign: "center",
                color: "#bbb",
                margin: "0 0 24px",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              Vérifie les informations avant de confirmer.
            </p>

            {confirmation.rpc === "creer_entreprise" ? (
              <>
                <div
                  style={{
                    background: "#0c0c0c",
                    border: "1px solid #444",
                    borderRadius: "16px",
                    padding: "18px 12px",
                    marginBottom: "14px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      color: "#e5bd68",
                      fontWeight: "bold",
                      letterSpacing: "2px",
                      fontSize: "13px",
                      margin: "0 0 12px",
                    }}
                  >
                    NOM DE L'ENTREPRISE
                  </p>

                  <div
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "19px",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {confirmation.parametres.p_nom}
                  </div>
                </div>

                <div
                  style={{
                    background: "#0c0c0c",
                    border: "1px solid #3b82f6",
                    borderRadius: "16px",
                    padding: "20px 12px",
                    marginBottom: "14px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      color: "#e5bd68",
                      fontWeight: "bold",
                      letterSpacing: "2px",
                      fontSize: "13px",
                      margin: "0 0 12px",
                    }}
                  >
                    COÛT DE CRÉATION
                  </p>

                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: "bold",
                      color: "#3b82f6",
                    }}
                  >
                    💰 1 000 Obus
                  </div>
                </div>

                <p
                  style={{
                    color: "#ff7777",
                    textAlign: "center",
                    fontSize: "13px",
                    margin: "0 0 24px",
                  }}
                >
                  Attention : cette dépense est définitive.
                </p>
              </>
            ) : (
              <div
                style={{
                  background: "#0c0c0c",
                  border: "1px solid #444",
                  borderRadius: "16px",
                  padding: "20px 16px",
                  marginBottom: "24px",
                  textAlign: "center",
                  lineHeight: "1.6",
                  overflowWrap: "anywhere",
                  whiteSpace: "pre-wrap",
                }}
              >
                {confirmation.description}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                disabled={enCours}
                style={{
                  width: "100%",
                  padding: "15px 8px",
                  background: "#333",
                  color: "white",
                  border: "1px solid #555",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                ANNULER
              </button>

              <button
                type="button"
                onClick={confirmerAction}
                disabled={enCours}
                style={{
                  width: "100%",
                  padding: "15px 8px",
                  background: "#e5bd68",
                  color: "#111",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                CONFIRMER
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
