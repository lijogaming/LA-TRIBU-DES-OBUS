"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  createClient,
} from "@supabase/supabase-js";


// =====================================================
// SUPABASE
// =====================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);


// =====================================================
// RARETÉS
// =====================================================

const RARETES = {

  commun: {
    nom: "Commun",
    couleur: "#8b8b8b",
  },

  rare: {
    nom: "Rare",
    couleur: "#3b82f6",
  },

  epique: {
    nom: "Épique",
    couleur: "#a855f7",
  },

  legendaire: {
    nom: "Légendaire",
    couleur: "#e9bd58",
  },

};


// =====================================================
// PAGE INVENTAIRE
// =====================================================

export default function InventairePage() {

  const [joueur, setJoueur] =
    useState(null);

  const [inventaire, setInventaire] =
    useState([]);

  const [chargement, setChargement] =
    useState(true);

  const [objetOuvert, setObjetOuvert] =
    useState(null);

  const [cibles, setCibles] =
    useState([]);

  const [cible, setCible] =
    useState("");

  const [utilisations, setUtilisations] =
    useState(0);

  const [limite, setLimite] =
    useState(30);

  // =====================================================
// NOMBRE DE TIRS
// =====================================================

const [nombreTirs, setNombreTirs] =
  useState("1");
  const [tirEnCours, setTirEnCours] =
  useState(false);


// =====================================================
// NOMBRE D'OBUS À TIRER
// =====================================================

const [nombreTirs, setNombreTirs] =
  useState(1);


const [message, setMessage] =
  useState("");

  // =====================================================
  // INITIALISATION
  // =====================================================

  useEffect(() => {
    initialiser();
  }, []);


  async function initialiser() {

    setChargement(true);


    // =====================================================
    // UTILISATEUR
    // =====================================================

    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();


    if (!user) {

      window.location.href =
        "/";

      return;
    }


    // =====================================================
    // JOUEUR
    // =====================================================

    const {
      data: joueurData,
      error: erreurJoueur,
    } =
      await supabase
        .from("joueurs")
        .select(
          "id,pseudo,obus"
        )
        .eq(
          "auth_user_id",
          user.id
        )
        .maybeSingle();


    if (
      erreurJoueur ||
      !joueurData
    ) {

      setChargement(false);

      return;
    }


    setJoueur(
      joueurData
    );


    // =====================================================
    // INVENTAIRE
    // =====================================================

    const {
      data: inventaireData,
      error: erreurInventaire,
    } =
      await supabase
        .from("inventaires")
        .select(
          "id,objet_code,nouveau,created_at"
        )
        .eq(
          "joueur_id",
          joueurData.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );


    if (erreurInventaire) {

      console.error(
        erreurInventaire
      );

      setInventaire([]);

      setChargement(false);

      return;
    }


    const lignes =
      inventaireData || [];


    // =====================================================
    // CHARGER LES INFORMATIONS DES OBJETS
    // =====================================================

    const inventaireComplet = [];


    for (
      const ligne
      of lignes
    ) {

      const {
        data: objetData,
      } =
        await supabase
          .from("objets")
          .select(
            "code,nom,description,prix,icone,rarete,magasin"
          )
          .eq(
            "code",
            ligne.objet_code
          )
          .maybeSingle();


      if (objetData) {

        inventaireComplet.push({
          ...ligne,
          objet:
            objetData,
        });
      }
    }


    setInventaire(
      inventaireComplet
    );


    setChargement(false);
  }


  // =====================================================
  // OUVRIR UN OBJET
  // =====================================================

  async function ouvrirObjet(
    element
  ) {

    setObjetOuvert(
      element
    );

    setMessage("");

    setCible("");


    // =====================================================
    // RETIRER LE ! NOUVEL OBJET
    // =====================================================

    if (element.nouveau) {

      const {
        error,
      } =
        await supabase.rpc(
          "marquer_objet_vu",
          {
            p_objet_code:
              element.objet_code,
          }
        );


      if (!error) {

        setInventaire(
          (ancien) =>
            ancien.map(
              (item) =>
                item.id ===
                element.id
                  ? {
                      ...item,
                      nouveau:
                        false,
                    }
                  : item
            )
        );


        setObjetOuvert(
          (ancien) => ({
            ...ancien,
            nouveau:
              false,
          })
        );
      }
    }


    // =====================================================
    // LANCE-OBUS
    // =====================================================

    if (
      element.objet_code ===
      "lance-obus"
    ) {

      await chargerLanceObus();
    }
  }


  // =====================================================
  // CHARGER LES INFOS DU LANCE-OBUS
  // =====================================================

  async function chargerLanceObus() {

    // =====================================================
    // COMPTEUR DU JOUR
    // =====================================================

    const {
      data: statut,
      error: erreurStatut,
    } =
      await supabase.rpc(
        "statut_lance_obus"
      );


    if (!erreurStatut) {

      setUtilisations(
        Number(
          statut?.utilisations ??
          0
        )
      );

      setLimite(
        Number(
          statut?.limite ??
          30
        )
      );
    }


    // =====================================================
    // LISTE DES CIBLES
    // =====================================================

    const {
      data: listeCibles,
      error: erreurCibles,
    } =
      await supabase.rpc(
        "lister_cibles_lance_obus"
      );


    if (erreurCibles) {

      console.error(
        erreurCibles
      );

      setCibles([]);

      return;
    }


    setCibles(
      listeCibles || []
    );
  }


// =====================================================
// TIRER AVEC LE LANCE-OBUS
// =====================================================

async function tirer() {

  setMessage("");


  // =====================================================
  // NOMBRE DE TIRS
  // =====================================================

  const tirs =
    Number(nombreTirs);


  if (
    !Number.isInteger(tirs) ||
    tirs < 1 ||
    tirs > 30
  ) {

    setMessage(
      "❌ Entre un nombre de tirs entre 1 et 30."
    );

    return;
  }


  // =====================================================
  // CIBLE
  // =====================================================

  if (!cible) {

    setMessage(
      "❌ Choisis un membre de la Tribu."
    );

    return;
  }


  // =====================================================
  // LIMITE QUOTIDIENNE
  // =====================================================

  const tirsRestants =
    limite -
    utilisations;


  if (
    tirs >
    tirsRestants
  ) {

    setMessage(
      `❌ Il te reste seulement ${tirsRestants} tir(s) aujourd'hui.`
    );

    return;
  }


  // =====================================================
  // SOLDE
  // =====================================================

  if (
    Number(joueur.obus) <
    tirs
  ) {

    setMessage(
      `❌ Il te faut ${tirs} Obus pour effectuer ce tir.`
    );

    return;
  }


  // =====================================================
  // CIBLE CHOISIE
  // =====================================================

  const joueurCible =
    cibles.find(
      (j) =>
        j.id === cible
    );


  const degats =
    tirs * 2;


  // =====================================================
  // CONFIRMATION
  // =====================================================

  const confirmation =
    window.confirm(
      `Tirer ${tirs} Obus sur ${joueurCible?.pseudo} ?\n\nTu perdras ${tirs} Obus.\n${joueurCible?.pseudo} perdra ${degats} Obus.`
    );


  if (!confirmation) {
    return;
  }


  // =====================================================
  // ENVOI
  // =====================================================

  setTirEnCours(true);


  const {
    data,
    error,
  } =
    await supabase.rpc(
      "utiliser_lance_obus",
      {
        p_cible_id:
          cible,

        p_nombre_tirs:
          tirs,
      }
    );


  if (error) {

    setMessage(
      "❌ " +
      error.message
    );

    setTirEnCours(false);

    return;
  }


  // =====================================================
  // NOUVEAU SOLDE
  // =====================================================

  setJoueur(
    (ancien) => ({
      ...ancien,

      obus:
        data?.nouveau_solde ??
        ancien.obus,
    })
  );


  // =====================================================
  // NOUVEAU COMPTEUR
  // =====================================================

  setUtilisations(
    Number(
      data?.utilisations ??
      utilisations +
        tirs
    )
  );


  // =====================================================
  // MESSAGE
  // =====================================================

  setMessage(
    `💥 ${data?.cible || joueurCible?.pseudo} a pris ${data?.degats || degats} Obus dans la tête !`
  );


  setCible("");

  setNombreTirs("1");

  setTirEnCours(false);
}
  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (chargement) {

    return (

      <main className="container">

        <div className="logo">
          🎒
        </div>

        <h1>
          INVENTAIRE
        </h1>

        <div className="card">

          <p>
            Chargement de ton inventaire...
          </p>

        </div>

      </main>
    );
  }


  // =====================================================
  // JOUEUR INTROUVABLE
  // =====================================================

  if (!joueur) {

    return (

      <main className="container">

        <div className="logo">
          🎒
        </div>

        <h1>
          INVENTAIRE
        </h1>

        <div className="card">

          <p>
            Profil joueur introuvable.
          </p>

        </div>

      </main>
    );
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <main className="container">


      {/* ================================================= */}
      {/* TITRE */}
      {/* ================================================= */}

      <div className="logo">
        🎒
      </div>


      <h1>
        INVENTAIRE
      </h1>


      <p className="subtitle">
        Tes objets et récompenses
      </p>


      {/* ================================================= */}
      {/* RETOUR + SOLDE */}
      {/* ================================================= */}

      <div
        className="card"
        style={{
          position:
            "relative",

          paddingTop:
            "70px",
        }}
      >

        <button
          onClick={() => {
            window.location.href =
              "/";
          }}
          title="Retour"
          style={{
            position:
              "absolute",

            top:
              "15px",

            left:
              "15px",

            width:
              "42px",

            height:
              "42px",

            margin:
              "0",

            padding:
              "0",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",
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
          TON SAC
        </p>


        <h2>
          💰{" "}
          {Number(
            joueur.obus
          ).toLocaleString(
            "fr-FR"
          )}{" "}
          Obus
        </h2>

      </div>


      {/* ================================================= */}
      {/* INVENTAIRE VIDE */}
      {/* ================================================= */}

      {inventaire.length ===
        0 && (

        <div
          className="card"
          style={{
            marginTop:
              "30px",
          }}
        >

          <div
            style={{
              fontSize:
                "60px",
            }}
          >
            🎒
          </div>

          <h2>
            Inventaire vide
          </h2>

          <p>
            Tu ne possèdes encore aucun objet.
          </p>

        </div>

      )}


      {/* ================================================= */}
      {/* OBJETS */}
      {/* ================================================= */}

      {inventaire.length >
        0 && (

        <div className="inventaire-grille">

          {inventaire.map(
            (element) => {

              const rarete =
                RARETES[
                  element.objet
                    .rarete
                ] ||
                RARETES.commun;


              return (

                <button
                  type="button"
                  key={
                    element.id
                  }
                  className="inventaire-objet"
                  style={{
                    "--rarete":
                      rarete.couleur,
                  }}
                  onClick={() =>
                    ouvrirObjet(
                      element
                    )
                  }
                >

                  {/* ===================================== */}
                  {/* NOUVEAU */}
                  {/* ===================================== */}

                  {element.nouveau && (

                    <div className="inventaire-nouveau">
                      !
                    </div>

                  )}


                  {/* ===================================== */}
                  {/* NOM */}
                  {/* ===================================== */}

                  <div className="inventaire-objet-nom">
                    {element.objet.nom}
                  </div>


                  {/* ===================================== */}
                  {/* RARETÉ */}
                  {/* ===================================== */}

                  <div className="inventaire-objet-rarete">
                    ({rarete.nom})
                  </div>


                  {/* ===================================== */}
                  {/* IMAGE */}
                  {/* ===================================== */}

                  <div className="inventaire-objet-image">

                    {element.objet_code ===
                    "lance-obus"
                      ? "💥"
                      : element.objet.icone}

                  </div>

                </button>

              );
            }
          )}

        </div>

      )}


      {/* ================================================= */}
      {/* FENÊTRE OBJET */}
      {/* ================================================= */}

      {objetOuvert && (() => {

        const rarete =
          RARETES[
            objetOuvert.objet
              .rarete
          ] ||
          RARETES.commun;


        return (

          <div
            className="inventaire-overlay"
            onClick={() =>
              setObjetOuvert(null)
            }
          >

            <div
              className="inventaire-popup"
              style={{
                "--rarete":
                  rarete.couleur,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
            >


              {/* ========================================= */}
              {/* FERMER */}
              {/* ========================================= */}

              <button
                type="button"
                className="inventaire-popup-fermer"
                onClick={() =>
                  setObjetOuvert(null)
                }
              >
                ✕
              </button>


              {/* ========================================= */}
              {/* NOM */}
              {/* ========================================= */}

              <h2>
                {objetOuvert.objet.nom}
              </h2>


              <div className="inventaire-popup-rarete">
                ({rarete.nom})
              </div>


              {/* ========================================= */}
              {/* IMAGE */}
              {/* ========================================= */}

              <div className="inventaire-popup-image">

                {objetOuvert.objet_code ===
                "lance-obus"
                  ? "💥"
                  : objetOuvert.objet.icone}

              </div>


              {/* ========================================= */}
              {/* LANCE-OBUS */}
              {/* ========================================= */}

              {objetOuvert.objet_code ===
                "lance-obus" && (

                <>

                  <p>
                    Le Lance-Obus peut être utilisé
                    jusqu&apos;à 30 fois par jour.
                    Chaque tir te coûte 1 Obus et
                    retire 2 Obus au membre touché.
                  </p>


                  {/* ===================================== */}
                  {/* COMPTEUR */}
                  {/* ===================================== */}

                  <div className="lance-obus-compteur">

                    <span>
                      UTILISATIONS AUJOURD&apos;HUI
                    </span>

                    <strong>
                      {utilisations} / {limite}
                    </strong>

                  </div>
{/* ===================================== */}
{/* NOMBRE D'OBUS À TIRER */}
{/* ===================================== */}

<div className="lance-obus-quantite">

  <p className="label">
    NOMBRE D&apos;OBUS À TIRER
  </p>


  <div className="lance-obus-quantite-boutons">

    {[1, 2, 10, 15, 30].map(
      (nombre) => {

        const depasseLimite =
          utilisations +
          nombre >
          limite;

        return (

          <button
            type="button"
            key={nombre}
            disabled={
              tirEnCours ||
              depasseLimite
            }
            className={
              nombreTirs ===
              nombre
                ? "lance-obus-quantite-bouton lance-obus-quantite-actif"
                : "lance-obus-quantite-bouton"
            }
            onClick={() =>
              setNombreTirs(
                nombre
              )
            }
          >
            {nombre}
          </button>

        );
      }
    )}

  </div>


  <p className="lance-obus-degats">

    Tu dépenses{" "}
    <strong>
      {nombreTirs} Obus
    </strong>

    {" • "}

    La cible perd{" "}

    <strong>
      {nombreTirs * 2} Obus
    </strong>

  </p>

</div>

                  {/* ===================================== */}
                  {/* CIBLE */}
                  {/* ===================================== */}

                  <div className="lance-obus-cible">

                    <p className="label">
                      CHOISIS TA CIBLE
                    </p>


                    <select
                      value={
                        cible
                      }
                      onChange={(e) =>
                        setCible(
                          e.target.value
                        )
                      }
                    >

                      <option value="">
                        Choisir un membre...
                      </option>


                      {cibles.map(
                        (autreJoueur) => (

                          <option
                            key={
                              autreJoueur.id
                            }
                            value={
                              autreJoueur.id
                            }
                          >
                            {autreJoueur.pseudo}
                            {" — "}
                            {autreJoueur.grade}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* ===================================== */}
                  {/* TIR */}
                  {/* ===================================== */}

                  <button
                    type="button"
                    className="lance-obus-tirer"
                    onClick={
                      tirer
                    }
                    disabled={
                      tirEnCours ||
                      utilisations >=
                        limite
                    }
                  >

                    {tirEnCours
  ? "💥 TIR EN COURS..."
  : utilisations >= limite
  ? "🚫 30 / 30 — LIMITE ATTEINTE"
  : `💥 TIRER ${
      nombreTirs || 0
    } OBUS`}

                  </button>


                  {/* ===================================== */}
                  {/* MESSAGE */}
                  {/* ===================================== */}

                  {message && (

                    <p className="lance-obus-message">
                      {message}
                    </p>

                  )}

                </>

              )}

            </div>

          </div>

        );

      })()}

    </main>
  );
}
