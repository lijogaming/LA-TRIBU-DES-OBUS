"use client";

import { useEffect, useMemo, useState } from "react";

const colonnes = {
  obus: "total_obus",
  membres: "nombre_membres",
  lives: "total_lives",
};

const medailles = { 1: "🥇", 2: "🥈", 3: "🥉" };

function nombre(valeur) {
  return Number(valeur || 0).toLocaleString("fr-FR");
}

export default function ClassementEntreprises({ supabase, recherche, tri }) {
  const [entreprises, setEntreprises] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [profilEntreprise, setProfilEntreprise] = useState(null);

  useEffect(() => {
    let actif = true;

    async function chargerEntreprises() {
      setChargement(true);
      setErreur("");

      const { data, error } = await supabase.rpc(
        "lister_classement_entreprises_visible"
      );

      if (!actif) return;

      if (error) {
        console.error("Erreur classement entreprises :", error);
        setErreur("Impossible de charger le classement des entreprises. Vérifie que la fonction Supabase DEV est installée.");
        setEntreprises([]);
      } else {
        setEntreprises(data || []);
      }

      setChargement(false);
    }

    chargerEntreprises();
    return () => { actif = false; };
  }, [supabase]);

  async function ouvrirProfil(entreprise) {
    setProfilEntreprise({
      nom: entreprise.entreprise_nom,
      position: entreprise.position,
      chargement: true,
    });

    const { data, error } = await supabase.rpc(
      "lister_profil_entreprise_visible",
      { p_entreprise_id: entreprise.entreprise_id }
    );

    if (error || !data) {
      setProfilEntreprise({
        nom: entreprise.entreprise_nom,
        position: entreprise.position,
        erreur: error?.message || "Cette entreprise n'existe plus.",
      });
      return;
    }

    setProfilEntreprise({ ...data, position: entreprise.position });
  }

  const entreprisesClassees = useMemo(() => {
    const terme = recherche.trim().toLocaleLowerCase("fr");
    const colonne = colonnes[tri] || colonnes.obus;

    const liste = entreprises
      .filter((entreprise) =>
        !terme ||
        String(entreprise.entreprise_nom || "")
          .toLocaleLowerCase("fr")
          .includes(terme)
      )
      .sort((a, b) =>
        Number(b[colonne] || 0) - Number(a[colonne] || 0) ||
        String(a.entreprise_nom || "").localeCompare(
          String(b.entreprise_nom || ""), "fr"
        )
      );

    let dernierScore;
    let dernierePosition = 0;
    return liste.map((entreprise, index) => {
      const score = Number(entreprise[colonne] || 0);
      const position = index > 0 && score === dernierScore
        ? dernierePosition
        : index + 1;
      dernierScore = score;
      dernierePosition = position;
      return { ...entreprise, position, score };
    });
  }, [entreprises, recherche, tri]);

  if (chargement) {
    return (
      <div className="card" style={{ marginTop: "20px" }}>
        <p>Chargement du classement des entreprises...</p>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="card" role="alert" style={{ marginTop: "20px" }}>
        <p>❌ {erreur}</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <p style={{ color: "#aaa", fontSize: "13px", textAlign: "center" }}>
        Chaque entreprise compte son patron et ses employés actifs.
        Les Obus et les lives correspondent aux sommes actuelles de leurs comptes.
      </p>

      {entreprisesClassees.length === 0 && (
        <div className="card">
          <p>Aucune entreprise trouvée.</p>
        </div>
      )}

      {entreprisesClassees.map((entreprise) => {
        const { position } = entreprise;
        const valeurAffichee = tri === "membres"
          ? `${nombre(entreprise.nombre_membres)} membres`
          : tri === "lives"
            ? `${nombre(entreprise.total_lives)} lives`
            : `${nombre(entreprise.total_obus)} Obus`;

        return (
          <div
            className="card classement-compact"
            key={entreprise.entreprise_id}
            role="button"
            tabIndex={0}
            aria-label={`Voir le profil de ${entreprise.entreprise_nom}`}
            onClick={() => ouvrirProfil(entreprise)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                ouvrirProfil(entreprise);
              }
            }}
            style={{
              cursor: "pointer",
              border: position === 1 ? "2px solid #FFE44D"
                : position === 2 ? "2px solid #C0C0C0"
                : position === 3 ? "2px solid #CD7F32"
                : undefined,
              background: position === 1 ? "#9c7800"
                : position === 2 ? "#555b63"
                : position === 3 ? "#6b3f24"
                : undefined,
              color: position <= 3 ? "#ffffff" : undefined,
              textShadow: position <= 3
                ? "0 2px 3px rgba(0,0,0,0.9)"
                : undefined,
            }}
          >
            <div className="classement-compact-position">
              {medailles[position] || position}
            </div>

            <strong className="classement-compact-pseudo" style={{ overflowWrap: "anywhere" }}>
              {entreprise.entreprise_nom}
            </strong>

            <strong className="classement-compact-valeur">
              {valeurAffichee}
            </strong>
          </div>
        );
      })}

      {profilEntreprise && (
        <div
          className="profil-classement-overlay"
          onClick={() => setProfilEntreprise(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={"Profil de l'entreprise " + profilEntreprise.nom}
            className="card profil-classement-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingTop: "72px",
              maxHeight: "min(90dvh, 800px)",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            <button
              type="button"
              title="Retour"
              aria-label="Retour au classement des entreprises"
              onClick={() => setProfilEntreprise(null)}
              style={{
                position: "absolute", top: "15px", left: "15px",
                width: "42px", height: "42px", padding: 0, margin: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#e9bd58", border: 0, borderRadius: "10px",
                color: "#111", cursor: "pointer",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M19 12H5 M11 6L5 12L11 18" stroke="currentColor"
                  strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <p className="label">PROFIL DE L'ENTREPRISE N°{profilEntreprise.position}</p>
            <h2 style={{ overflowWrap: "anywhere" }}>
              🏢 {profilEntreprise.nom}
            </h2>

            {profilEntreprise.chargement ? (
              <p>Chargement du profil...</p>
            ) : profilEntreprise.erreur ? (
              <p role="alert">❌ {profilEntreprise.erreur}</p>
            ) : (
              <>
                <p>💰 Obus de l'entreprise : <strong>{nombre(profilEntreprise.total_obus)} Obus</strong></p>
                <p>📊 Lives total de l'entreprise : <strong>{nombre(profilEntreprise.total_lives)} lives</strong></p>
                <p>👥 Membres : <strong>{nombre(profilEntreprise.nombre_membres)}</strong></p>

                <hr style={{ border: 0, borderTop: "1px solid #444", margin: "20px 0" }} />
                <p className="label">PATRON</p>
                <h3 style={{ overflowWrap: "anywhere" }}>{profilEntreprise.patron.pseudo}</h3>
                <p>💰 {nombre(profilEntreprise.patron.obus)} Obus</p>
                <p>📊 {nombre(profilEntreprise.patron.total_lives)} lives total</p>

                <hr style={{ border: 0, borderTop: "1px solid #444", margin: "20px 0" }} />
                <p className="label">EMPLOYÉS ACTIFS ({profilEntreprise.employes.length})</p>
                {profilEntreprise.employes.length === 0 ? (
                  <p>Aucun employé actuellement.</p>
                ) : (
                  profilEntreprise.employes.map((employe, index) => (
                    <div key={index} style={{
                      padding: "12px", border: "1px solid #444",
                      borderRadius: "12px", marginTop: "10px",
                      background: "#111",
                    }}>
                      <strong style={{ overflowWrap: "anywhere" }}>{employe.pseudo}</strong>
                      <p>💰 {nombre(employe.obus)} Obus</p>
                      <p>📊 {nombre(employe.total_lives)} lives total</p>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
