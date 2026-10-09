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
// PAGE MAGASIN
// =====================================================

export default function MagasinPage() {

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

  const [message, setMessage] =
    useState("");

  const [magasinOuvert, setMagasinOuvert] =
    useState("Armurerie");

  const [objetOuvert, setObjetOuvert] =
    useState(false);


  // =====================================================
  // INITIALISATION
  // =====================================================

  useEffect(() => {
    initialiser();
  }, []);


  async function initialiser() {

    setChargement(true);
    setMessage("");


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

      window.location.href = "/";

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
          "code,nom,description,prix,icone,actif,unique_par_joueur,magasin,rarete"
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
  // ACHETER LE LANCE-OBUS
  // =====================================================

  async function acheterLanceObus() {

    setMessage("");


    if (
      !joueur ||
      !objet
    ) {
      return;
    }


    if (bloque) {

      setMessage(
        "🔒 Le Lance-Obus a été bloqué pour ton compte."
      );

      return;
    }


    if (possede) {

      setMessage(
        "✅ Tu possèdes déjà le Lance-Obus."
      );

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
        ).toLocaleString("fr-FR")} Obus ?`
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
          🛒
        </div>

        <h1>
          MAGASIN
        </h1>

        <div className="card">

          <p>
            Chargement du magasin...
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
          🛒
        </div>

        <h1>
          MAGASIN
        </h1>

        <div className="card">

          <p>
            {message ||
              "Impossible de charger le magasin."}
          </p>

        </div>

      </main>
    );
  }


  // =====================================================
  // INFORMATIONS DE RARETÉ
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
    ).toLocaleString("fr-FR")} OBUS`;


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
        🛒
      </div>


      <h1>
        MAGASIN
      </h1>


      <p className="subtitle">
        Choisis ton magasin
      </p>


      {/* ================================================= */}
      {/* SOLDE + RETOUR */}
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
              "/";
          }}
          title="Retour"
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
          💰 {Number(
            joueur.obus
          ).toLocaleString(
            "fr-FR"
          )} Obus
        </h2>

      </div>


      {/* ================================================= */}
      {/* LES MAGASINS */}
      {/* 3 MAGASINS PAR LIGNE */}
      {/* ================================================= */}

      <div className="liste-magasins">


        {/* ================================================= */}
        {/* ARMURERIE */}
        {/* ================================================= */}

        <button
          type="button"
          className={
            magasinOuvert ===
            "Armurerie"
              ? "case-magasin case-magasin-active"
              : "case-magasin"
          }
          onClick={() =>
            setMagasinOuvert(
              "Armurerie"
            )
          }
        >

          <span className="case-magasin-icon">
            💥
          </span>

          <strong>
            Armurerie
          </strong>

          <span>
            Armes et objets offensifs
          </span>

        </button>


        {/* ================================================= */}
        {/* FUTUR MAGASIN 1 */}
        {/* ================================================= */}

        <button
          type="button"
          className="case-magasin case-magasin-ferme"
          disabled
        >

          <span className="case-magasin-icon">
            🔒
          </span>

          <strong>
            Prochainement
          </strong>

          <span>
            Futur magasin
          </span>

        </button>


        {/* ================================================= */}
        {/* FUTUR MAGASIN 2 */}
        {/* ================================================= */}

        <button
          type="button"
          className="case-magasin case-magasin-ferme"
          disabled
        >

          <span className="case-magasin-icon">
            🔒
          </span>

          <strong>
            Prochainement
          </strong>

          <span>
            Futur magasin
          </span>

        </button>

      </div>


      {/* ================================================= */}
      {/* ARMURERIE */}
      {/* ================================================= */}

      {magasinOuvert ===
        "Armurerie" && (

        <section className="armurerie-zone">


          {/* ================================================= */}
          {/* TITRE ARMURERIE */}
          {/* ================================================= */}

          <div className="armurerie-titre">

            <p className="label">
              MAGASIN
            </p>

            <h2>
              💥 Armurerie
            </h2>

          </div>


          {/* ================================================= */}
          {/* OBJETS DE L'ARMURERIE */}
          {/* 4 OBJETS PAR LIGNE */}
          {/* ================================================= */}

          <div className="armurerie-grille">


            {/* ================================================= */}
            {/* LANCE-OBUS */}
            {/* ================================================= */}

            <button
              type="button"
              className="objet-armurerie"
              style={{
                "--couleur-rarete":
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

              <div className="objet-armurerie-nom">
                Lance-Obus
              </div>


              {/* ================================================= */}
              {/* RARETÉ */}
              {/* ================================================= */}

              <div className="objet-armurerie-rarete">
                ({rarete.nom})
              </div>


              {/* ================================================= */}
              {/* IMAGE */}
              {/* ================================================= */}

              <div className="objet-armurerie-image">
                💥
              </div>


              {/* ================================================= */}
              {/* PRIX */}
              {/* ================================================= */}

              <div className="objet-armurerie-prix">

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

                <div className="objet-armurerie-badge">
                  🔒
                </div>

              )}

            </button>

          </div>

        </section>

      )}


      {/* ================================================= */}
      {/* FENÊTRE DU LANCE-OBUS */}
      {/* ================================================= */}

      {objetOuvert && (

        <div
          className="objet-detail-overlay"
          onClick={() =>
            setObjetOuvert(false)
          }
        >

          <div
            className="objet-detail-popup"
            style={{
              "--couleur-rarete":
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
              className="objet-detail-fermer"
              onClick={() =>
                setObjetOuvert(false)
              }
            >
              ✕
            </button>


            {/* ================================================= */}
            {/* NOM */}
            {/* ================================================= */}

            <div className="objet-detail-nom">
              Lance-Obus
            </div>


            <div className="objet-detail-rarete">
              ({rarete.nom})
            </div>


            {/* ================================================= */}
            {/* IMAGE */}
            {/* ================================================= */}

            <div className="objet-detail-image">
              💥
            </div>


            {/* ================================================= */}
            {/* DESCRIPTION */}
            {/* ================================================= */}

            <p>
              Le Lance-Obus permet de
              viser un autre membre de
              La Tribu des Obus.
            </p>


            <div className="objet-detail-regles">

              <p>
                🎯 Maximum :{" "}
                <strong>
                  30 utilisations par jour
                </strong>
              </p>

              <p>
                💣 À chaque tir :{" "}
                <strong>
                  tu perds 1 Obus
                </strong>
              </p>

              <p>
                💥 La cible perd :{" "}
                <strong>
                  2 Obus
                </strong>
              </p>

              <p>
                🎒 Quantité maximale :{" "}
                <strong>
                  1 par membre
                </strong>
              </p>

            </div>


            {/* ================================================= */}
            {/* PRIX */}
            {/* ================================================= */}

            <div className="objet-detail-prix">

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

              <div className="objet-detail-bloque">

                🔒 Le Lance-Obus a été
                bloqué pour ton compte
                par l&apos;administration.

              </div>

            )}


            {/* ================================================= */}
            {/* BOUTON ACHAT */}
            {/* ================================================= */}

            <button
              type="button"
              className="objet-detail-acheter"
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

              <p className="objet-detail-message">
                {message}
              </p>

            )}

          </div>

        </div>

      )}

    </main>
  );
}
