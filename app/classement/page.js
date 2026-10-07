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

      <div className="card">
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
          marginTop:
            "20px",
        }}
      >
        {joueursClasses.length ===
          0 && (
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
                key={
                  joueur.id
                }
                style={{
                  marginBottom:
                    "12px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "15px",
                }}
              >
                {/* POSITION */}

                <div
                  style={{
                    minWidth:
                      "50px",
                    textAlign:
                      "center",
                    fontSize:
                      position <=
                      3
                        ? "30px"
                        : "18px",
                    fontWeight:
                      "bold",
                  }}
                >
                  {medaille(
                    position
                  )}
                </div>

                {/* JOUEUR */}

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
                    }}
                  >
                    {
                      joueur.pseudo
                    }
                  </h2>{joueur.punition ? (
  <>
    <p
      style={{
        margin: "4px 0",
      }}
    >
      ⚠️ Punition :{" "}
      <strong>
        {joueur.punition}
      </strong>
    </p>

    <p
      style={{
        margin: "4px 0",
      }}
    >
      🎖️ Grade actuel :{" "}
      <strong>
        {joueur.officier_general
          ? "Officier général"
          : joueur.grade}
      </strong>
    </p>
  </>
) : (
  <p
    style={{
      margin: "4px 0",
    }}
  >
    🎖️ Grade :{" "}
    <strong>
      {joueur.officier_general
        ? "Officier général"
        : joueur.grade}
    </strong>
  </p>
)}

                  <p
                    style={{
                      margin:
                        "4px 0",
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

                  <p
                    style={{
                      margin:
                        "4px 0",
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

      <button
        onClick={() => {
          window.location.href =
            "/";
        }}
        style={{
          marginTop:
            "10px",
          marginBottom:
            "30px",
        }}
      >
        ← Retour au profil
      </button>
    </main>
  );
}
