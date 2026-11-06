"use client";

import { useEffect, useState } from "react";

const STATUTS = {
  en_attente: "En attente",
  contre_proposition: "En négociation",
  acceptee: "Acceptée",
  refusee: "Refusée",
  retiree: "Retirée",
};

const ACTIONS = {
  candidature: "Candidature envoyée",
  proposition_patron: "Proposition du patron",
  proposition_candidat: "Contre-proposition du candidat",
  acceptation: "Proposition acceptée",
  refus: "Proposition refusée",
  retrait: "Candidature retirée",
  modification: "Mise à jour de la candidature",
  etat_preexistant: "État conservé avant l'activation de l'historique",
};

function dateFR(date) {
  if (!date) return "Date inconnue";
  const valeur = new Date(date);
  if (Number.isNaN(valeur.getTime())) return "Date inconnue";
  return valeur.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function montant(valeur) {
  return valeur === null || valeur === undefined
    ? null
    : Number(valeur).toLocaleString("fr-FR") + " Obus / live";
}

export default function HistoriqueCandidatures({
  supabase,
  candidatures,
  mode,
  entrepriseId,
  joueurId,
  nomEntreprise,
  nomJoueur,
}) {
  const [ouvert, setOuvert] = useState(false);
  const [evenements, setEvenements] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!ouvert || !joueurId || (mode === "patron" && !entrepriseId)) return;
    let actif = true;

    async function chargerHistorique() {
      setChargement(true);
      setErreur("");

      let requete = supabase
        .from("entreprises_candidatures_historique")
        .select(
          "id, candidature_id, entreprise_id, candidat_id, candidat_pseudo, " +
          "action, acteur_role, statut, salaire_propose, message, date_evenement"
        )
        .order("date_evenement", { ascending: true })
        .limit(2000);

      if (mode === "patron") {
        requete = requete.eq("entreprise_id", entrepriseId);
      } else {
        requete = requete.eq("candidat_id", joueurId);
      }

      const { data, error } = await requete;
      if (!actif) return;
      setChargement(false);
      if (error) {
        setErreur("Le journal détaillé des échanges n'est pas encore disponible.");
        setEvenements([]);
      } else {
        setEvenements(data || []);
      }
    }

    chargerHistorique();
    return () => {
      actif = false;
    };
  }, [ouvert, supabase, mode, entrepriseId, joueurId]);

  if (!candidatures?.length) {
    return (
      <div className="card" style={{ marginTop: "20px" }}>
        <p className="label">HISTORIQUE DES CANDIDATURES</p>
        <p>Aucune candidature enregistrée.</p>
      </div>
    );
  }

  const evenementsParCandidature = new Map();
  for (const ligne of evenements) {
    const liste = evenementsParCandidature.get(ligne.candidature_id) || [];
    liste.push(ligne);
    evenementsParCandidature.set(ligne.candidature_id, liste);
  }

  return (
    <div className="card" style={{ marginTop: "20px", textAlign: "left" }}>
      <button
        type="button"
        onClick={() => setOuvert((valeur) => !valeur)}
        aria-expanded={ouvert}
        style={{
          width: "100%",
          margin: 0,
          padding: "15px",
          background: "#222",
          color: "#e9bd58",
          border: "1px solid rgba(233,189,88,0.65)",
          borderRadius: "10px",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        {ouvert ? "▴" : "▾"} HISTORIQUE DES CANDIDATURES ({candidatures.length})
      </button>

      {ouvert && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ color: "#aaa", fontSize: "13px" }}>
            Tous les dossiers, y compris ceux terminés. Les échanges sont présentés du
            plus ancien au plus récent. Les conversations antérieures à l'activation du
            journal ne peuvent pas être reconstituées.
          </p>

          {erreur && <p role="alert" style={{ color: "#e9bd58" }}>{erreur}</p>}
          {chargement && <p>Chargement des échanges...</p>}

          <div
            aria-label="Historique des candidatures, défilement à la molette"
            style={{
              maxHeight: "440px",
              overflowY: "auto",
              overscrollBehavior: "contain",
              paddingRight: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {candidatures.map((candidature) => {
              const echanges = evenementsParCandidature.get(candidature.id) || [];
              const dernier = echanges[echanges.length - 1];
              const titre = mode === "patron"
                ? dernier?.candidat_pseudo || nomJoueur(candidature.candidat_id)
                : nomEntreprise(candidature.entreprise_id);

              return (
                <details
                  key={candidature.id}
                  style={{
                    border: "1px solid #444",
                    borderRadius: "12px",
                    background: "#141414",
                    padding: "12px",
                  }}
                >
                  <summary style={{ cursor: "pointer", color: "#e9bd58", fontWeight: "bold" }}>
                    {titre} — {STATUTS[candidature.statut] || candidature.statut}
                    <span style={{ display: "block", color: "#999", fontWeight: "normal", fontSize: "12px", marginTop: "6px" }}>
                      Envoyée le {dateFR(candidature.created_at)}
                    </span>
                  </summary>
                  <div style={{ padding: "12px 2px 2px" }}>
                    <p style={{ color: "#ddd" }}>
                      <strong>Salaire initial conservé :</strong> {montant(candidature.salaire_demande) || "—"}
                    </p>
                    {candidature.motivation && (
                      <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#ddd" }}>
                        <strong>Motivation :</strong> {candidature.motivation}
                      </p>
                    )}
                    {candidature.blocage_jusquau && (
                      <p style={{ color: "#ccc" }}>
                        Blocage éventuel jusqu'au {dateFR(candidature.blocage_jusquau)}
                      </p>
                    )}
                    {echanges.length === 0 ? (
                      <p style={{ color: "#aaa" }}>
                        Aucun échange détaillé enregistré pour cette candidature.
                        Dernier état : {STATUTS[candidature.statut] || candidature.statut}.
                        {candidature.reponse_patron ? " Dernier message du patron : " + candidature.reponse_patron : ""}
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {echanges.map((evenement) => (
                          <div
                            key={evenement.id}
                            style={{
                              padding: "12px",
                              borderLeft: "3px solid #e9bd58",
                              borderRadius: "8px",
                              background: "#1c1c1c",
                            }}
                          >
                            <strong style={{ color: "#e9bd58" }}>
                              {ACTIONS[evenement.action] || "Mise à jour"}
                            </strong>
                            <p style={{ margin: "7px 0", fontSize: "12px", color: "#aaa" }}>
                              {dateFR(evenement.date_evenement)}
                              {" — "}
                              {evenement.acteur_role === "patron"
                                ? "Patron"
                                : evenement.acteur_role === "candidat"
                                  ? "Candidat"
                                  : "État enregistré"}
                            </p>
                            {evenement.salaire_propose !== null && evenement.salaire_propose !== undefined && (
                              <p style={{ margin: "7px 0", color: "#ddd" }}>
                                <strong>Salaire :</strong> {montant(evenement.salaire_propose)}
                              </p>
                            )}
                            {evenement.message && (
                              <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: "7px 0", color: "#ddd" }}>
                                <strong>Message :</strong> {evenement.message}
                              </p>
                            )}
                            <p style={{ fontSize: "12px", color: "#999", marginBottom: 0 }}>
                              Statut : {STATUTS[evenement.statut] || evenement.statut}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
