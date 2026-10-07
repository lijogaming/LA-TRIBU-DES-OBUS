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
              b.lives_depuis_soldat
            ) -
            Number(
              a.lives_depuis_soldat
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

    return `#${position}`;
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
        joueur.lives_depuis_soldat
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
          placeholder="🔎 Rechercher un joueur..."
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
            📺 Lives
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

      return (
        <div
          className="card"
          key={joueur.id}
          style={{
            marginBottom: "12px",

            display: "flex",

            alignItems: "center",

            gap: "15px",

            color:
              position <= 3
                ? "#ffffff"
                : undefined,

            border:
              position === 1
                ? "2px solid #FFD700"
                : position === 2
                ? "2px solid #C0C0C0"
                : position === 3
                ? "2px solid #CD7F32"
                : undefined,

            background:
              position === 1
                ? "linear-gradient(135deg, #6b5500 0%, #2e2500 100%)"
                : position === 2
                ? "linear-gradient(135deg, #5d6268 0%, #282b2f 100%)"
                : position === 3
                ? "linear-gradient(135deg, #683d22 0%, #2f1b10 100%)"
                : undefined,

            boxShadow:
              position === 1
                ? "0 0 20px rgba(255, 215, 0, 0.30)"
                : position === 2
                ? "0 0 20px rgba(192, 192, 192, 0.25)"
                : position === 3
                ? "0 0 20px rgba(205, 127, 50, 0.28)"
                : undefined,

            textShadow:
              position <= 3
                ? "0 2px 4px rgba(0, 0, 0, 0.95)"
                : undefined,
          }}
        >
          {/* ================================================= */}
          {/* POSITION */}
          {/* ================================================= */}

          <div
            style={{
              minWidth: "50px",

              textAlign: "center",

              fontSize:
                position <= 3
                  ? "34px"
                  : "18px",

              fontWeight: "bold",
            }}
          >
            {medaille(
              position
            )}
          </div>


          {/* ================================================= */}
          {/* JOUEUR */}
          {/* ================================================= */}

          <div
            style={{
              flex: 1,
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 8px 0",

                fontSize:
                  "21px",

                color:
                  position <= 3
                    ? "#ffffff"
                    : undefined,

                fontWeight:
                  position <= 3
                    ? "900"
                    : undefined,

                textShadow:
                  position <= 3
                    ? "0 2px 4px rgba(0, 0, 0, 1)"
                    : undefined,
              }}
            >
              {
                joueur.pseudo
              }
            </h2>


            {/* ================================================= */}
            {/* GRADE ET PUNITION */}
            {/* ================================================= */}

            {joueur.punition ? (
              <>
                <p
                  style={{
                    margin:
                      "4px 0",

                    color:
                      position <= 3
                        ? "#ffffff"
                        : undefined,
                  }}
                >
                  ⚠️ Punition :{" "}
                  <strong>
                    {
                      joueur.punition
                    }
                  </strong>
                </p>

                <p
                  style={{
                    margin:
                      "4px 0",

                    color:
                      position <= 3
                        ? "#ffffff"
                        : undefined,
                  }}
                >
                  🎖️ Grade actuel :{" "}
                  <strong>
                    {
                      joueur.officier_general
                        ? "Officier général"
                        : joueur.grade
                    }
                  </strong>
                </p>
              </>
            ) : (
              <p
                style={{
                  margin:
                    "4px 0",

                  color:
                    position <= 3
                      ? "#ffffff"
                      : undefined,
                }}
              >
                🎖️ Grade :{" "}
                <strong>
                  {
                    joueur.officier_general
                      ? "Officier général"
                      : joueur.grade
                  }
                </strong>
              </p>
            )}


            {/* ================================================= */}
            {/* OBUS */}
            {/* ================================================= */}

            <p
              style={{
                margin:
                  "4px 0",

                color:
                  position <= 3
                    ? "#ffffff"
                    : undefined,
              }}
            >
              💰{" "}
              <strong>
                {
                  joueur.obus
                }{" "}
                Obus
              </strong>
            </p>


            {/* ================================================= */}
            {/* LIVES */}
            {/* ================================================= */}

            <p
              style={{
                margin:
                  "4px 0",

                color:
                  position <= 3
                    ? "#ffffff"
                    : undefined,
              }}
            >
              📺{" "}
              <strong>
                {
                  joueur.lives_depuis_soldat
                }{" "}
                lives
              </strong>
            </p>
          </div>
        </div>
      );
    }
  )}
</div>
      {/* ================================================= */}
      {/* RETOUR */}
      {/* ================================================= */}

    </main>
  );
}
