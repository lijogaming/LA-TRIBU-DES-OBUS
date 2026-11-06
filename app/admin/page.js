"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import NotificationsAdmin from "./NotificationsAdmin";
import EntreprisesAdmin from "./EntreprisesAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const grades = [
  "Civil",
  "Soldat",
  "Adgent",
  "Adgent Lijo",
  "Colonel",
  "Colonel en Chef",
  "Vice Amiral",
  "Amiral",
  "Général",
  "Sergent",
  "Sergent Chef",
  "Officier général",
  "Engueulé",
  "Prisonnier",
  "Esclave",
  "Exécuté",
];

export default function AdminPage() {
  const [chargement, setChargement] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [joueurs, setJoueurs] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [message, setMessage] = useState("");
  const [montants, setMontants] = useState({});
  const [nombresLives, setNombresLives] = useState({});
  const [nombresTotalLives, setNombresTotalLives] = useState({});
  const [joueurSelectionneId, setJoueurSelectionneId] = useState(null);

  useEffect(() => {
    verifierAdmin();
  }, []);

  // =====================================================
  // VÉRIFICATION ADMIN
  // =====================================================

  async function verifierAdmin() {
    setChargement(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAdmin(false);
      setChargement(false);
      return;
    }

    const { data, error } = await supabase.rpc(
      "est_admin"
    );

    if (error || !data) {
      setAdmin(false);
      setChargement(false);
      return;
    }

    setAdmin(true);

    await chargerJoueurs();

    setChargement(false);
  }

  // =====================================================
  // CHARGER LES JOUEURS
  // =====================================================

  async function chargerJoueurs() {
    const { data, error } = await supabase
      .from("joueurs")
      .select(
        "id,pseudo,grade,lives_depuis_soldat,total_lives,obus,punition,officier_general"
      )
      .order("pseudo");

    if (error) {
      setMessage(
        "Erreur : " + error.message
      );
      return;
    }

    setJoueurs(data || []);
  }

  // =====================================================
  // CHANGER LE GRADE
  // =====================================================

  async function changerGrade(
    joueurId,
    nouveauGrade
  ) {
    setMessage(
      "Modification du grade..."
    );

    const { error } =
      await supabase.rpc(
        "admin_definir_grade",
        {
          p_joueur_id: joueurId,
          p_grade: nouveauGrade,
        }
      );

    if (error) {
      setMessage(
        "Erreur : " + error.message
      );
      return;
    }

    setMessage(
      `Grade modifié : ${nouveauGrade}`
    );

    await chargerJoueurs();
  }

  // =====================================================
  // RETIRER UNE PUNITION
  // =====================================================

  async function retirerPunition(joueur) {
    const confirmation =
      window.confirm(
        `Retirer la punition de ${joueur.pseudo} ?`
      );

    if (!confirmation) {
      return;
    }

    setMessage(
      `Retrait de la punition de ${joueur.pseudo}...`
    );

    const { error } =
      await supabase.rpc(
        "admin_retirer_punition",
        {
          p_joueur_id: joueur.id,
        }
      );

    if (error) {
      setMessage(
        "Erreur : " + error.message
      );
      return;
    }

    setMessage(
      `✅ Punition retirée pour ${joueur.pseudo}.`
    );

    await chargerJoueurs();
  }

  // =====================================================
  // MODIFIER LES OBUS
  // =====================================================

  async function modifierObus(
    joueurId,
    montant
  ) {
    const valeur = Number(montant);

    if (
      !Number.isInteger(valeur) ||
      valeur === 0
    ) {
      setMessage(
        "Entre un montant d'Obus valide."
      );
      return;
    }

    setMessage(
      "Modification des Obus..."
    );

    const { error } =
      await supabase.rpc(
        "admin_modifier_obus",
        {
          p_joueur_id: joueurId,
          p_montant: valeur,
          p_description:
            "Modification depuis le panneau admin",
        }
      );

    if (error) {
      setMessage(
        "Erreur : " + error.message
      );
      return;
    }

    setMontants((ancien) => ({
      ...ancien,
      [joueurId]: "",
    }));

    setMessage(
      valeur > 0
        ? `+${valeur} Obus ajoutés.`
        : `${Math.abs(
            valeur
          )} Obus retirés.`
    );

    await chargerJoueurs();
  }

  // =====================================================
// MODIFIER LES LIVES DEPUIS SOLDAT
// =====================================================

async function modifierLives(
  joueurId,
  nombre
) {
  const valeur = Number(nombre);

  if (
    !Number.isInteger(valeur) ||
    valeur < 0
  ) {
    setMessage(
      "Entre un nombre de lives valide."
    );
    return;
  }

  setMessage(
    "Modification des lives depuis Soldat..."
  );

  const { error } = await supabase.rpc(
    "admin_definir_lives",
    {
      p_joueur_id: joueurId,
      p_nombre_lives: valeur,
    }
  );

  if (error) {
    setMessage(
      "Erreur : " + error.message
    );
    return;
  }

  setNombresLives(
    (ancien) => ({
      ...ancien,
      [joueurId]: "",
    })
  );

  setMessage(
    `Lives depuis Soldat définis à ${valeur}.`
  );

  await chargerJoueurs();
}


// =====================================================
// MODIFIER LES LIVES TOTAL
// =====================================================

async function modifierTotalLives(
  joueurId,
  nombre
) {
  const valeur = Number(nombre);

  if (
    !Number.isInteger(valeur) ||
    valeur < 0
  ) {
    setMessage(
      "Entre un total de lives valide."
    );
    return;
  }

  setMessage(
    "Modification des lives total..."
  );

  const { error } = await supabase.rpc(
    "admin_definir_total_lives",
    {
      p_joueur_id: joueurId,
      p_total_lives: valeur,
    }
  );

  if (error) {
    setMessage(
      "Erreur : " + error.message
    );
    return;
  }

  setNombresTotalLives(
    (ancien) => ({
      ...ancien,
      [joueurId]: "",
    })
  );

  setMessage(
    `Lives total définis à ${valeur}.`
  );

  await chargerJoueurs();
}

  // =====================================================
  // RECHERCHE
  // =====================================================

  const joueursFiltres =
    useMemo(() => {
      const terme =
        recherche
          .trim()
          .toLowerCase();

      if (!terme) {
        return joueurs;
      }

      return joueurs.filter(
        (joueur) =>
          joueur.pseudo
            .toLowerCase()
            .includes(terme)
      );
    }, [joueurs, recherche]);

  // =====================================================
  // GRADE À AFFICHER
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


  // La fiche complète s'ouvre séparément, sans allonger la liste défilante.
  function afficherFicheAdmin(joueur) {
    return (
      <>
              {/* ============================= */}
              {/* INFORMATIONS DU JOUEUR */}
              {/* ============================= */}

              <p>
                🎖️ Grade affiché :{" "}
                <strong>
                  {gradeAffiche(
                    joueur
                  )}
                </strong>
              </p>

              {joueur.punition && (
                <>
                  <p>
                    ⚠️ Grade réel :{" "}
                    <strong>
                      {joueur.officier_general
                        ? "Officier général"
                        : joueur.grade}
                    </strong>
                  </p>

                  <button
                    onClick={() =>
                      retirerPunition(
                        joueur
                      )
                    }
                    style={{
                      marginBottom:
                        "15px",
                    }}
                  >
                    ✅ Retirer la
                    punition
                  </button>
                </>
              )}

              <p>
                📺 Lives depuis
                Soldat :{" "}
                <strong>
                  {
                    joueur.lives_depuis_soldat
                  }
                </strong>
              </p>
              <p>
                📊 Lives total :{" "}
                <strong>
                  {joueur.total_lives}
                </strong>
              </p>
              <p>
                💰 Sac :{" "}
                <strong>
                  {joueur.obus} Obus
                </strong>
              </p>

              <hr />

              {/* ============================= */}
              {/* CHANGER LE GRADE */}
              {/* ============================= */}

              <p className="label">
                CHANGER LE GRADE
              </p>

              <select
                defaultValue=""
                onChange={(e) => {
                  const nouveauGrade =
                    e.target.value;

                  if (
                    nouveauGrade
                  ) {
                    changerGrade(
                      joueur.id,
                      nouveauGrade
                    );

                    e.target.value =
                      "";
                  }
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius:
                    "10px",
                  background:
                    "#111",
                  color: "white",
                  border:
                    "1px solid #444",
                }}
              >
                <option
                  value=""
                  disabled
                >
                  Choisir un grade...
                </option>

                {grades.map(
                  (grade) => (
                    <option
                      value={grade}
                      key={grade}
                    >
                      {grade}
                    </option>
                  )
                )}
              </select>

              <hr />

              {/* ============================= */}
              {/* MODIFIER LES OBUS */}
              {/* ============================= */}

              <p className="label">
                MODIFIER LES OBUS
              </p>

              <input
                type="number"
                value={
                  montants[
                    joueur.id
                  ] || ""
                }
                onChange={(e) =>
                  setMontants(
                    (ancien) => ({
                      ...ancien,
                      [joueur.id]:
                        e.target
                          .value,
                    })
                  )
                }
                placeholder="+500 ou -200"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid #444",
                  background:
                    "#111",
                  color: "white",
                  marginBottom:
                    "10px",
                }}
              />

              <button
                onClick={() =>
                  modifierObus(
                    joueur.id,
                    montants[
                      joueur.id
                    ]
                  )
                }
              >
                Valider les Obus
              </button>

              <hr />

              {/* ============================= */}
{/* MODIFIER LES LIVES DEPUIS SOLDAT */}
{/* ============================= */}

<p className="label">
  MODIFIER LES LIVES DEPUIS SOLDAT
</p>

<input
  type="number"
  min="0"
  value={
    nombresLives[
      joueur.id
    ] || ""
  }
  onChange={(e) =>
    setNombresLives(
      (ancien) => ({
        ...ancien,
        [joueur.id]:
          e.target.value,
      })
    )
  }
  placeholder={`Actuellement : ${joueur.lives_depuis_soldat}`}
  style={{
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #444",
    background: "#111",
    color: "white",
    marginBottom: "10px",
  }}
/>

<button
  onClick={() =>
    modifierLives(
      joueur.id,
      nombresLives[
        joueur.id
      ]
    )
  }
>
  Modifier les lives depuis Soldat
</button>


<hr />


{/* ============================= */}
{/* MODIFIER LES LIVES TOTAL */}
{/* ============================= */}

<p className="label">
  MODIFIER LES LIVES TOTAL
</p>

<input
  type="number"
  min="0"
  value={
    nombresTotalLives[
      joueur.id
    ] || ""
  }
  onChange={(e) =>
    setNombresTotalLives(
      (ancien) => ({
        ...ancien,
        [joueur.id]:
          e.target.value,
      })
    )
  }
  placeholder={`Actuellement : ${joueur.total_lives}`}
  style={{
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #444",
    background: "#111",
    color: "white",
    marginBottom: "10px",
  }}
/>

<button
  onClick={() =>
    modifierTotalLives(
      joueur.id,
      nombresTotalLives[
        joueur.id
      ]
    )
  }
>
  Modifier les lives total
</button>

      </>
    );
  }

  const joueurSelectionne =
    joueurs.find((joueur) => joueur.id === joueurSelectionneId) || null;

  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (chargement) {
    return (
      <main className="container">
        <div className="logo">
          🛡️
        </div>

        <h1>
          ADMINISTRATION
        </h1>

        <div className="card">
          <p>
            Chargement...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // ACCÈS REFUSÉ
  // =====================================================

  if (!admin) {
    return (
      <main className="container">
        <div className="logo">
          ⛔
        </div>

        <h1>
          ACCÈS REFUSÉ
        </h1>

        <div className="card">
          <p>
            Ce compte n&apos;est
            pas autorisé à accéder
            à l&apos;administration.
          </p>

          <button
            onClick={() =>
              (window.location.href =
                "/")
            }
          >
            Retour au site
          </button>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE ADMIN
  // =====================================================

  return (
    <main className="container">
      <div className="logo">
        🛡️
      </div>

      <h1>
        ADMINISTRATION
      </h1>

      <p className="subtitle">
        Gestion de La Tribu des Obus
      </p>

      {/* ============================= */}
      {/* RECHERCHE */}
      {/* ============================= */}

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
    RECHERCHER UN JOUEUR
  </p>

        <input
          value={recherche}
          onChange={(e) =>
            setRecherche(
              e.target.value
            )
          }
          placeholder="Pseudo du joueur..."
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border:
              "1px solid #444",
            background: "#111",
            color: "white",
            marginTop: "12px",
          }}
        />

        {message && (
          <p
            style={{
              marginTop: "16px",
            }}
          >
            {message}
          </p>
        )}

      {/* ============================= */}
      {/* LISTE DES JOUEURS */}
      {/* ============================= */}

      <div
        aria-label="Liste des joueurs, défilement à la molette"
        style={{
          marginTop: "20px",
          maxHeight: "242px",
          overflowY: "auto",
          overscrollBehavior: "contain",
          paddingRight: "6px",
        }}
      >
        {joueursFiltres.length ===
          0 && (
          <div className="card">
            <p>
              Aucun joueur trouvé.
            </p>
          </div>
        )}

        {joueursFiltres.map((joueur) => (
          <button
            type="button"
            key={joueur.id}
            onClick={() => setJoueurSelectionneId(joueur.id)}
            aria-label={`Consulter le profil de ${joueur.pseudo}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              width: "100%",
              margin: "0 0 10px",
              padding: "16px 18px",
              border: "1px solid #444",
              borderRadius: "11px",
              background: "#191919",
              color: "#e5bd68",
              textAlign: "left",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            <span style={{ overflowWrap: "anywhere" }}>{joueur.pseudo}</span>
            <span aria-hidden="true" style={{ fontSize: "23px" }}>›</span>
          </button>
        ))}
      </div>
</div>

<NotificationsAdmin supabase={supabase} joueurs={joueurs} />
<EntreprisesAdmin supabase={supabase} />

      {/* FICHE ADMINISTRATEUR : navigation identique à une fiche de classement. */}
      {joueurSelectionne && (
        <div
          role="presentation"
          onClick={() => setJoueurSelectionneId(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            padding: "20px",
            background: "rgba(0, 0, 0, 0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflowY: "auto",
          }}
        >
          <div
            className="card"
            role="dialog"
            aria-modal="true"
            aria-label={`Administration de ${joueurSelectionne.pseudo}`}
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "620px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "72px 30px 30px",
              border: "3px solid rgba(233, 189, 88, 0.65)",
              background: "#171717",
              textAlign: "left",
              boxSizing: "border-box",
            }}
          >
            <button
              type="button"
              aria-label="Retour à la recherche des joueurs"
              title="Retour"
              onClick={() => setJoueurSelectionneId(null)}
              style={{
                position: "absolute",
                top: "15px",
                left: "15px",
                width: "42px",
                height: "42px",
                margin: 0,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M19 12H5 M11 6L5 12L11 18"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <p className="label">PROFIL DU MEMBRE</p>
            <h2 style={{ overflowWrap: "anywhere" }}>{joueurSelectionne.pseudo}</h2>
            {afficherFicheAdmin(joueurSelectionne)}
          </div>
        </div>
      )}

    </main>
  );
}
