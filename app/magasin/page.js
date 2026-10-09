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
    // UTILISATEUR CONNECTÉ
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
    // CHARGER LE JOUEUR
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
    // CHARGER LE LANCE-OBUS
    // =====================================================

    const {
      data: objetData,
      error: erreurObjet,
    } =
      await supabase
        .from("objets")
        .select(
          "code,nom,description,prix,icone,actif,unique_par_joueur"
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
        "❌ Lance-Obus introuvable dans le magasin."
      );

      setChargement(false);

      return;
    }


    setObjet(
      objetData
    );


    // =====================================================
    // VÉRIFIER SI LE JOUEUR POSSÈDE L'OBJET
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
    // VÉRIFIER SI L'OBJET EST BLOQUÉ
    // =====================================================

    const {
      data: blocageData,
    } =
      await supabase
        .from(
          "blocages_objets"
        )
        .select(
          "joueur_id"
        )
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


    // =====================================================
    // OBJET BLOQUÉ
    // =====================================================

    if (bloque) {

      setMessage(
        "🔒 Cet objet a été bloqué pour ton compte."
      );

      return;
    }


    // =====================================================
    // OBJET DÉJÀ POSSÉDÉ
    // =====================================================

    if (possede) {

      setMessage(
        "✅ Tu possèdes déjà le Lance-Obus."
      );

      return;
    }


    // =====================================================
    // PAS ASSEZ D'OBUS
    // =====================================================

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


    // =====================================================
    // CONFIRMATION
    // =====================================================

    const confirmation =
      window.confirm(
        `Acheter le Lance-Obus pour ${objet.prix} Obus ?`
      );


    if (!confirmation) {
      return;
    }


    // =====================================================
    // ACHAT
    // =====================================================

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
  // PROFIL INTROUVABLE
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

          <button
            onClick={() => {
              window.location.href =
                "/";
            }}
          >
            Retour
          </button>

        </div>

      </main>
    );
  }


  // =====================================================
  // ÉTAT DU BOUTON
  // =====================================================

  const pasAssezObus =
    Number(joueur.obus) <
    Number(objet.prix);


  let texteBouton =
    "💰 ACHETER — 3 000 OBUS";


  if (achatEnCours) {

    texteBouton =
      "ACHAT EN COURS...";

  } else if (bloque) {

    texteBouton =
      "🔒 OBJET BLOQUÉ POUR VOUS";

  } else if (possede) {

    texteBouton =
      "✅ DÉJÀ POSSÉDÉ";

  } else if (pasAssezObus) {

    texteBouton =
      "❌ PAS ASSEZ D'OBUS";
  }


  // =====================================================
  // MAGASIN
  // =====================================================

  return (

    <main className="container">

      <div className="logo">
        🛒
      </div>


      <h1>
        MAGASIN
      </h1>


      <p className="subtitle">
        Dépense tes Obus
      </p>


      {/* ================================================= */}
      {/* SOLDE + RETOUR */}
      {/* ================================================= */}

      <div
        className="card"
        style={{
          position:
            "relative",

          paddingTop:
            "70px",

          marginBottom:
            "25px",
        }}
      >

        {/* ================================================= */}
        {/* RETOUR */}
        {/* ================================================= */}

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
          💰 {joueur.obus} Obus
        </h2>

      </div>


      {/* ================================================= */}
      {/* LANCE-OBUS */}
      {/* ================================================= */}

      <div
        className="card"
        style={{
          position:
            "relative",

          overflow:
            "hidden",

          border:
            bloque
              ? "1px solid #8f3232"
              : possede
              ? "1px solid #4d8f55"
              : "1px solid rgba(233, 189, 88, 0.65)",

          background:
            bloque
              ? "linear-gradient(180deg, #221313 0%, #121010 100%)"
              : "linear-gradient(180deg, #1b1a16 0%, #111 100%)",
        }}
      >


        {/* ================================================= */}
        {/* ÉTIQUETTE */}
        {/* ================================================= */}

        <div
          style={{
            display:
              "inline-block",

            padding:
              "6px 12px",

            marginBottom:
              "18px",

            border:
              "1px solid #5b4722",

            borderRadius:
              "999px",

            color:
              "#e9bd58",

            fontSize:
              "11px",

            fontWeight:
              "900",

            letterSpacing:
              "1.8px",
          }}
        >
          ARME DE LA TRIBU
        </div>


        {/* ================================================= */}
        {/* DESIGN */}
        {/* ================================================= */}

        <div
          style={{
            width:
              "120px",

            height:
              "120px",

            margin:
              "0 auto 18px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            borderRadius:
              "50%",

            border:
              "2px solid #6d5425",

            background:
              "radial-gradient(circle, #312410 0%, #141414 70%)",

            boxShadow:
              "0 0 35px rgba(233, 189, 88, 0.16)",

            fontSize:
              "64px",
          }}
        >
          💥
        </div>


        <h2
          style={{
            marginBottom:
              "5px",
          }}
        >
          Lance-Obus
        </h2>


        <p
          style={{
            color:
              "#e9bd58",

            fontWeight:
              "900",

            fontSize:
              "20px",

            margin:
              "8px 0 18px",
          }}
        >
          💰 3 000 Obus
        </p>


        <p>
          Tire sur les autres membres de
          la Tribu et fais-leur perdre des
          Obus.
        </p>


        <div
          style={{
            margin:
              "22px 0",

            padding:
              "15px",

            borderRadius:
              "12px",

            border:
              "1px solid #2f2f2f",

            background:
              "#0e0e0e",

            textAlign:
              "left",
          }}
        >

          <p
            style={{
              margin:
                "3px 0",
            }}
          >
            🎯 Maximum :
            {" "}
            <strong>
              30 tirs / jour
            </strong>
          </p>


          <p
            style={{
              margin:
                "3px 0",
            }}
          >
            💣 Chaque tir :
            {" "}
            <strong>
              -1 Obus pour toi
            </strong>
          </p>


          <p
            style={{
              margin:
                "3px 0",
            }}
          >
            💥 Cible :
            {" "}
            <strong>
              -2 Obus
            </strong>
          </p>


          <p
            style={{
              margin:
                "3px 0",
            }}
          >
            🎒 Limite :
            {" "}
            <strong>
              1 Lance-Obus par membre
            </strong>
          </p>

        </div>


        {/* ================================================= */}
        {/* BLOQUÉ */}
        {/* ================================================= */}

        {bloque && (

          <div
            style={{
              marginBottom:
                "15px",

              padding:
                "13px",

              borderRadius:
                "10px",

              background:
                "rgba(198, 40, 40, 0.13)",

              border:
                "1px solid rgba(255, 82, 82, 0.4)",

              color:
                "#ff7777",

              fontWeight:
                "bold",
            }}
          >
            🔒 Cet objet a été bloqué
            pour ton compte par
            l&apos;administration.
          </div>

        )}


        {/* ================================================= */}
        {/* ACHETÉ */}
        {/* ================================================= */}

        {!bloque &&
          possede && (

          <div
            style={{
              marginBottom:
                "15px",

              padding:
                "13px",

              borderRadius:
                "10px",

              background:
                "rgba(76, 175, 80, 0.12)",

              border:
                "1px solid rgba(76, 175, 80, 0.4)",

              color:
                "#7edc83",

              fontWeight:
                "bold",
            }}
          >
            ✅ Tu possèdes déjà cet
            objet. Retrouve-le dans ton
            inventaire.
          </div>

        )}


        {/* ================================================= */}
        {/* BOUTON ACHAT */}
        {/* ================================================= */}

        <button
          onClick={
            acheterLanceObus
          }
          disabled={
            achatEnCours ||
            bloque ||
            possede ||
            pasAssezObus
          }
          style={{
            opacity:
              achatEnCours ||
              bloque ||
              possede ||
              pasAssezObus
                ? 0.55
                : 1,

            cursor:
              achatEnCours ||
              bloque ||
              possede ||
              pasAssezObus
                ? "not-allowed"
                : "pointer",
          }}
        >
          {texteBouton}
        </button>


        {/* ================================================= */}
        {/* MESSAGE */}
        {/* ================================================= */}

        {message && (

          <p
            style={{
              marginTop:
                "18px",

              fontWeight:
                "bold",
            }}
          >
            {message}
          </p>

        )}

      </div>

    </main>
  );
}
