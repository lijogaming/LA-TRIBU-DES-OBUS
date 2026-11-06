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

  useEffect(() => {
    let actif = true;

    async function chargerEntreprises() {
      setChargement(true);
      setErreur("");

      const { data, error } = await supabase.rpc(
        "lister_classement_entreprises"
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
            style={{
              cursor: "default",
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
    </div>
  );
}
