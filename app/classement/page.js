"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

// =====================================================
// ORDRE DES GRADES
// =====================================================

const ordreGrades = {
  Civil: 0,
  Soldat: 1,
  Adgent: 2,
  "Adgent Lijo": 3,
  Colonel: 4,
  "Colonel en Chef": 5,
  "Vice Amiral": 6,
  Amiral: 7,
  Général: 8,
  Sergent: 9,
  "Sergent Chef": 10,
  "Officier général": 11,
};

export default function ClassementPage() {
  const [joueurs, setJoueurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [
  joueurSelectionne,
  setJoueurSelectionne,
] = useState(null);
  const [classement, setClassement] =
    useState("obus");

  // =====================================================
  // CHARGEMENT
  // =====================================================

  useEffect(() => {
    chargerClassement();
  }, []);

  async function chargerClassement() {
    setChargement(true);
    setErreur("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/";
      return;
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "lister_classement"
    );

    if (error) {
      console.error(error);

      setErreur(
        "Impossible de charger le classement."
      );

      setChargement(false);
      return;
    }

    setJoueurs(
      data || []
    );

    setChargement(false);
  }

  // =====================================================
  // GRADE AFFICHÉ
  // =====================================================

  function gradeAffiche(joueur) {
    if (joueur.punition) {
      return joueur.punition;
    }

    if (joueur.officier_general) {
      return "Officier général";
    }

    return joueur.grade;
  }

  // =====================================================
  // SCORE DU GRADE
  // Les punitions ne modifient pas le vrai classement.
  // =====================================================

  function scoreGrade(joueur) {
    if (joueur.officier_general) {
      return 11;
    }

    return (
      ordreGrades[joueur.grade] ??
      0
    );
  }

  // =====================================================
  // FILTRAGE + TRI
  // =====================================================

  const joueursClasses =
    useMemo(() => {
      const terme =
        recherche
          .trim()
          .toLowerCase();

      let liste =
        joueurs.filter(
          (joueur) =>
            !terme ||
            joueur.pseudo
              ?.toLowerCase()
              .includes(terme)
        );

      liste =
        [...liste];

      if (
        classement ===
        "obus"
      ) {
        liste.sort(
          (a, b) =>
            Number(b.obus) -
            Number(a.obus)
        );
      }

      if (
        classement ===
        "lives"
      ) {
       liste.sort(
  (a, b) =>
    Number(
      b.total_lives ?? 0
    ) -
    Number(
      a.total_lives ?? 0
    )
);
      }

      if (
        classement ===
        "grade"
      ) {
        liste.sort(
          (a, b) => {
            const difference =
              scoreGrade(b) -
              scoreGrade(a);

            if (
              difference !==
              0
            ) {
              return difference;
            }

            return (
              Number(
                b.lives_depuis_soldat
              ) -
              Number(
                a.lives_depuis_soldat
              )
            );
          }
        );
      }

      return liste;
    }, [
      joueurs,
      recherche,
      classement,
    ]);

  // =====================================================
  // MÉDAILLE
  // =====================================================
  
  function medaille(position) {
    if (position === 1) {
      return "🥇";
    }
  
    if (position === 2) {
      return "🥈";
    }
  
    if (position === 3) {
      return "🥉";
    }
  
    return position;
  }
  
  // =====================================================
  // VALEUR UTILISÉE POUR LE CLASSEMENT
  // =====================================================

  function valeurClassement(joueur) {
    if (classement === "obus") {
      return Number(joueur.obus);
    }

    if (classement === "lives") {
  return Number(
    joueur.total_lives ?? 0
  );
}

    if (classement === "grade") {
      return scoreGrade(joueur);
    }

    return 0;
  }

  // =====================================================
  // POSITION AVEC ÉGALITÉS
  // =====================================================

  function positionJoueur(
    joueur,
    index
  ) {
    if (index === 0) {
      return 1;
    }

    const valeurActuelle =
      valeurClassement(joueur);

    const valeurPrecedente =
      valeurClassement(
        joueursClasses[index - 1]
      );

    if (
      valeurActuelle ===
      valeurPrecedente
    ) {
      // Même valeur = même place
      return positionJoueur(
        joueursClasses[index - 1],
        index - 1
      );
    }

    return index + 1;
  }
  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (chargement) {
    return (
      <main className="container">
        <div className="logo">
          🏆
        </div>

        <h1>
          CLASSEMENT
        </h1>

        <div className="card">
          <p>
            Chargement du classement...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="logo">
        🏆
      </div>

      <h1>
        CLASSEMENT
      </h1>

      <p className="subtitle">
        Les membres de La Tribu des Obus
      </p>

      {/* ================================================= */}
      {/* FILTRES */}
      {/* ================================================= */}

     <div
  className="card"
  style={{
    position: "relative",
    paddingTop: "70px",
  }}
>
  <button
    onClick={() => {
      window.location.href = "/";
    }}
    title="Retour"
    style={{
      position: "absolute",
      top: "15px",
      left: "15px",
      width: "42px",
      height: "42px",
      padding: "0",
      fontSize: "28px",
      fontWeight: "900",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg
  width="26"
  height="26"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M19 12H5"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
  />

  <path
    d="M11 6L5 12L11 18"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>
  </button>

  <p className="label">
    FILTRER LE CLASSEMENT
  </p>

        <input
          type="text"
          value={recherche}
          onChange={(e) =>
            setRecherche(
              e.target.value
            )
          }
          placeholder="🔎 Rechercher un membre..."
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border:
              "1px solid #444",
            background: "#111",
            color: "white",
            marginTop: "10px",
            marginBottom: "15px",
            boxSizing:
              "border-box",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          <button
            onClick={() =>
              setClassement(
                "obus"
              )
            }
            style={{
              opacity:
                classement ===
                "obus"
                  ? 1
                  : 0.55,
            }}
          >
            💰 Obus
          </button>

          <button
            onClick={() =>
              setClassement(
                "lives"
              )
            }
            style={{
              opacity:
                classement ===
                "lives"
                  ? 1
                  : 0.55,
            }}
          >
            📊 Lives total
          </button>

          <button
            onClick={() =>
              setClassement(
                "grade"
              )
            }
            style={{
              opacity:
                classement ===
                "grade"
                  ? 1
                  : 0.55,
            }}
          >
            🎖️ Grade
          </button>
        </div>
      </div>

      {/* ================================================= */}
      {/* ERREUR */}
      {/* ================================================= */}

      {erreur && (
        <div
          className="card"
          style={{
            marginTop:
              "20px",
          }}
        >
          <p>
            ❌ {erreur}
          </p>
        </div>
      )}

{/* ================================================= */}
{/* CLASSEMENT */}
{/* ================================================= */}

<div
  style={{
    marginTop: "20px",
  }}
>
  {joueursClasses.length === 0 && (
    <div className="card">
      <p>
        Aucun joueur trouvé.
      </p>
    </div>
  )}

  {joueursClasses.map(
    (
      joueur,
      index
    ) => {

      const position =
        positionJoueur(
          joueur,
          index
        );

      let valeurAffichee = "";

      if (
        classement === "obus"
      ) {
        valeurAffichee =
          `${joueur.obus} Obus`;
      }

      if (
  classement === "lives"
) {
  valeurAffichee =
    `${joueur.total_lives ?? 0} lives`;
}
      if (
        classement === "grade"
      ) {
        valeurAffichee =
          joueur.officier_general
            ? "Officier général"
            : joueur.grade;
      }

      return (
        <div
          className="card classement-compact"
          key={joueur.id}
          onClick={() =>
            setJoueurSelectionne(
              joueur
            )
          }
          style={{
            border:
              position === 1
                ? "2px solid #FFE44D"
                : position === 2
                ? "2px solid #C0C0C0"
                : position === 3
                ? "2px solid #CD7F32"
                : undefined,

            background:
              position === 1
                ? "#9c7800"
                : position === 2
                ? "#555b63"
                : position === 3
                ? "#6b3f24"
                : undefined,

            color:
              position <= 3
                ? "#ffffff"
                : undefined,

            textShadow:
              position <= 3
                ? "0 2px 3px rgba(0,0,0,0.9)"
                : undefined,
          }}
        >

          {/* ================================================= */}
          {/* POSITION */}
          {/* ================================================= */}

          <div className="classement-compact-position">
            {medaille(
              position
            )}
          </div>


          {/* ================================================= */}
          {/* PSEUDO */}
          {/* ================================================= */}

          <strong className="classement-compact-pseudo">
            {joueur.pseudo}
          </strong>


          {/* ================================================= */}
          {/* VALEUR DU CLASSEMENT */}
          {/* ================================================= */}

          <strong className="classement-compact-valeur">
            {valeurAffichee}
          </strong>

        </div>
      );
    }
  )}
</div>


{/* ================================================= */}
{/* PROFIL JOUEUR */}
{/* ================================================= */}

{joueurSelectionne && (

  <div
    className="profil-classement-overlay"
    onClick={() =>
      setJoueurSelectionne(
        null
      )
    }
  >

    <div
      className="card profil-classement-card"
      onClick={(e) =>
        e.stopPropagation()
      }
    >

      <button
        className="profil-classement-fermer"
        onClick={() =>
          setJoueurSelectionne(
            null
          )
        }
        title="Fermer"
      >
        ✕
      </button>


      <p className="label">
        PROFIL DU MEMBRE
      </p>

      <h2>
        {
          joueurSelectionne.pseudo
        }
      </h2>


      <p>
        🎖️ Grade :{" "}
        <strong>
          {
            joueurSelectionne.officier_general
              ? "Officier général"
              : joueurSelectionne.grade
          }
        </strong>
      </p>


      {joueurSelectionne.punition && (
        <p>
          ⚠️ Punition :{" "}
          <strong>
            {
              joueurSelectionne.punition
            }
          </strong>
        </p>
      )}


      <p>
        💰 Sac d&apos;Obus :{" "}
        <strong>
          {
            joueurSelectionne.obus
          }{" "}
          Obus
        </strong>
      </p>

      <p>
  📺 Lives depuis Soldat :{" "}
  <strong>
    {
      joueurSelectionne.lives_depuis_soldat ?? 0
    }
  </strong>
</p>

<p>
  📊 Lives total :{" "}
  <strong>
    {
      joueurSelectionne.total_lives ?? 0
    }
  </strong>
</p>
    </div>

  </div>

)}

      {/* ================================================= */}
      {/* RETOUR */}
      {/* ================================================= */}

    </main>
  );
}
