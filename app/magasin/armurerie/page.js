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
// PAGE ARMURERIE
// =====================================================

export default function ArmureriePage() {

  const [joueur, setJoueur] =
    useState(null);

  const [objet, setObjet] =
    useState(null);

  const [possede, setPossede] =
    useState(false);

  const [bloque, setBloque] =
    useState(false);

  const [chargement, setChargement] =
    useState(true);

  const [achatEnCours, setAchatEnCours] =
    useState(false);

  const [objetOuvert, setObjetOuvert] =
    useState(false);

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

      setMessage(
        "❌ Profil joueur introuvable."
      );

      setChargement(false);

      return;
    }


    setJoueur(
      joueurData
    );


    // =====================================================
    // LANCE-OBUS
    // =====================================================

    const {
      data: objetData,
      error: erreurObjet,
    } =
      await supabase
        .from("objets")
        .select(
          "code,nom,description,prix,icone,rarete,magasin"
        )
        .eq(
          "code",
          "lance-obus"
        )
        .maybeSingle();


    if (
      erreurObjet ||
      !objetData
    ) {

      setMessage(
        "❌ Lance-Obus introuvable."
      );

      setChargement(false);

      return;
    }


    setObjet(
      objetData
    );


    // =====================================================
    // POSSÉDÉ
    // =====================================================

    const {
      data: inventaireData,
    } =
      await supabase
        .from("inventaires")
        .select("id")
        .eq(
          "joueur_id",
          joueurData.id
        )
        .eq(
          "objet_code",
          "lance-obus"
        )
        .maybeSingle();


    setPossede(
      Boolean(inventaireData)
    );


    // =====================================================
    // BLOQUÉ
    // =====================================================

    const {
      data: blocageData,
    } =
      await supabase
        .from("blocages_objets")
        .select("joueur_id")
        .eq(
          "joueur_id",
          joueurData.id
        )
        .eq(
          "objet_code",
          "lance-obus"
        )
        .maybeSingle();


    setBloque(
      Boolean(blocageData)
    );


    setChargement(false);
  }


  // =====================================================
  // ACHETER
  // =====================================================

  async function acheterLanceObus() {

    setMessage("");


    if (
      !joueur ||
      !objet
    ) {
      return;
    }


    if (
      bloque ||
      possede
    ) {
      return;
    }


    if (
      Number(joueur.obus) <
      Number(objet.prix)
    ) {

      setMessage(
        `❌ Il te manque ${
          Number(objet.prix) -
          Number(joueur.obus)
        } Obus.`
      );

      return;
    }


    const confirmation =
      window.confirm(
        `Acheter le Lance-Obus pour ${Number(
          objet.prix
        ).toLocaleString(
          "fr-FR"
        )} Obus ?`
      );


    if (!confirmation) {
      return;
    }


    setAchatEnCours(true);


    const {
      data,
      error,
    } =
      await supabase.rpc(
        "acheter_objet",
        {
          p_objet_code:
            "lance-obus",
        }
      );


    if (error) {

      setMessage(
        "❌ " +
        error.message
      );

      setAchatEnCours(false);

      return;
    }


    setJoueur(
      (ancien) => ({
        ...ancien,

        obus:
          data?.nouveau_solde ??
          ancien.obus,
      })
    );


    setPossede(true);


    setMessage(
      "✅ Lance-Obus acheté ! Il est maintenant dans ton inventaire."
    );


    setAchatEnCours(false);
  }


  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (chargement) {

    return (

      <main className="container">

        <div className="logo">
          💥
        </div>

        <h1>
          ARMURERIE
        </h1>

        <div className="card">
          <p>
            Chargement de l&apos;Armurerie...
          </p>
        </div>

      </main>
    );
  }


  // =====================================================
  // ERREUR
  // =====================================================

  if (
    !joueur ||
    !objet
  ) {

    return (

      <main className="container">

        <div className="logo">
          💥
        </div>

        <h1>
          ARMURERIE
        </h1>

        <div className="card">

          <p>
            {message}
          </p>

        </div>

      </main>
    );
  }


  // =====================================================
  // RARETÉ
  // =====================================================

  const rarete =
    RARETES[
      objet.rarete
    ] ||
    RARETES.commun;


  const pasAssezObus =
    Number(joueur.obus) <
    Number(objet.prix);


  // =====================================================
  // TEXTE DU BOUTON
  // =====================================================

  let texteBouton =
    `💰 ACHETER — ${Number(
      objet.prix
    ).toLocaleString(
      "fr-FR"
    )} OBUS`;


  if (achatEnCours) {

    texteBouton =
      "ACHAT EN COURS...";

  } else if (bloque) {

    texteBouton =
      "🔒 BLOQUÉ POUR VOUS";

  } else if (possede) {

    texteBouton =
      "✅ DÉJÀ POSSÉDÉ";

  } else if (pasAssezObus) {

    texteBouton =
      "❌ PAS ASSEZ D'OBUS";
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
        💥
      </div>

      <h1>
        ARMURERIE
      </h1>

      <p className="subtitle">
        Armes et objets offensifs
      </p>


      {/* ================================================= */}
      {/* RETOUR + SOLDE */}
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
            window.location.href =
              "/magasin";
          }}
          title="Retour au magasin"
          style={{
            position: "absolute",
            top: "15px",
            left: "15px",
            width: "42px",
            height: "42px",
            margin: "0",
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
      {/* ARMES */}
      {/* 4 PAR LIGNE */}
      {/* ================================================= */}

      <div className="armurerie-grille">


        {/* ================================================= */}
        {/* LANCE-OBUS */}
        {/* ================================================= */}

        <button
          type="button"
          className="arme-card"
          style={{
            "--rarete":
              rarete.couleur,
          }}
          onClick={() => {

            setMessage("");

            setObjetOuvert(true);
          }}
        >


          {/* ================================================= */}
          {/* NOM */}
          {/* ================================================= */}

          <div className="arme-card-nom">
            Lance-Obus
          </div>


          {/* ================================================= */}
          {/* RARETÉ */}
          {/* ================================================= */}

          <div className="arme-card-rarete">
            ({rarete.nom})
          </div>


          {/* ================================================= */}
          {/* IMAGE */}
          {/* ================================================= */}

          <div className="arme-card-image">
            💥
          </div>


          {/* ================================================= */}
          {/* PRIX */}
          {/* ================================================= */}

          <div className="arme-card-prix">

            💰{" "}

            {Number(
              objet.prix
            ).toLocaleString(
              "fr-FR"
            )}{" "}

            Obus

          </div>


          {/* ================================================= */}
          {/* BLOQUÉ */}
          {/* ================================================= */}

          {bloque && (

            <div className="arme-card-cadenas">
              🔒
            </div>

          )}

        </button>

      </div>


      {/* ================================================= */}
      {/* FENÊTRE LANCE-OBUS */}
      {/* ================================================= */}

      {objetOuvert && (

        <div
          className="arme-overlay"
          onClick={() =>
            setObjetOuvert(false)
          }
        >

          <div
            className="arme-popup"
            style={{
              "--rarete":
                rarete.couleur,
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >


            {/* ================================================= */}
            {/* FERMER */}
            {/* ================================================= */}

            <button
              type="button"
              className="arme-popup-fermer"
              onClick={() =>
                setObjetOuvert(false)
              }
            >
              ✕
            </button>


            {/* ================================================= */}
            {/* NOM */}
            {/* ================================================= */}

            <h2>
              Lance-Obus
            </h2>

            <div className="arme-popup-rarete">
              ({rarete.nom})
            </div>


            {/* ================================================= */}
            {/* IMAGE */}
            {/* ================================================= */}

            <div className="arme-popup-image">
              💥
            </div>


            {/* ================================================= */}
            {/* DESCRIPTION */}
            {/* ================================================= */}

            <p>
              Le Lance-Obus permet de
              tirer sur un autre membre
              de La Tribu des Obus.
            </p>


            <div className="arme-popup-regles">

              <p>
                🎯 Maximum :{" "}
                <strong>
                  30 utilisations par jour
                </strong>
              </p>

              <p>
                💣 À chaque tir :{" "}
                <strong>
                  -1 Obus pour toi
                </strong>
              </p>

              <p>
                💥 La cible :{" "}
                <strong>
                  -2 Obus
                </strong>
              </p>

              <p>
                🎒 Quantité :{" "}
                <strong>
                  1 seul Lance-Obus
                </strong>
              </p>

            </div>


            {/* ================================================= */}
            {/* PRIX */}
            {/* ================================================= */}

            <div className="arme-popup-prix">

              💰{" "}

              {Number(
                objet.prix
              ).toLocaleString(
                "fr-FR"
              )}{" "}

              Obus

            </div>


            {/* ================================================= */}
            {/* OBJET BLOQUÉ */}
            {/* ================================================= */}

            {bloque && (

              <div className="arme-popup-bloque">

                🔒 Cet objet a été
                bloqué pour ton compte
                par l&apos;administration.

              </div>

            )}


            {/* ================================================= */}
            {/* ACHETER */}
            {/* ================================================= */}

            <button
              type="button"
              className="arme-popup-acheter"
              onClick={
                acheterLanceObus
              }
              disabled={
                achatEnCours ||
                bloque ||
                possede ||
                pasAssezObus
              }
            >
              {texteBouton}
            </button>


            {/* ================================================= */}
            {/* MESSAGE */}
            {/* ================================================= */}

            {message && (

              <p className="arme-popup-message">
                {message}
              </p>

            )}

          </div>

        </div>

      )}

    </main>
  );
}
