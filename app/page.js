"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

const grades = [
  { nom: "Adgent", lives: 3 },
  { nom: "Adgent Lijo", lives: 7 },
  { nom: "Colonel", lives: 10 },
  { nom: "Colonel en Chef", lives: 15 },
  { nom: "Vice Amiral", lives: 20 },
  { nom: "Amiral", lives: 30 },
  { nom: "Général", lives: 40 },
  { nom: "Sergent", lives: 50 },
  { nom: "Sergent Chef", lives: 70 },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [joueur, setJoueur] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [conditionsAcceptees, setConditionsAcceptees] =
  useState(false);
  
  const [verificationSoldat, setVerificationSoldat] =
    useState(false);

  const [messageSoldat, setMessageSoldat] =
    useState("");

  // =====================================================
  // DONS D'OBUS
  // =====================================================

  const [joueursDon, setJoueursDon] =
    useState([]);

  const [destinataireDon, setDestinataireDon] =
    useState("");

  const [montantDon, setMontantDon] =
    useState("");

  const [messageDon, setMessageDon] =
    useState("");

  const [envoiDon, setEnvoiDon] =
    useState(false);

  // =====================================================
  // SESSION GOOGLE
  // =====================================================

  useEffect(() => {
    let actif = true;

    async function initialiser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!actif) return;

      setUser(session?.user ?? null);

      if (!session?.user) {
        setChargement(false);
      }
    }

    initialiser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(
          session?.user ?? null
        );

        if (!session?.user) {
          setJoueur(null);
          setAdmin(false);
          setChargement(false);
        }
      }
    );

    return () => {
      actif = false;
      subscription.unsubscribe();
    };
  }, []);

  // =====================================================
  // CHARGEMENT DU PROFIL
  // =====================================================

  useEffect(() => {
    if (!user) return;

    let actif = true;

    async function chargerProfil() {
      setChargement(true);

      const {
        data: estAdmin,
        error: erreurAdmin,
      } = await supabase.rpc(
        "est_admin"
      );

      if (!actif) return;

      if (erreurAdmin) {
        console.error(
          "Erreur admin :",
          erreurAdmin
        );

        setAdmin(false);
      } else {
        setAdmin(
          Boolean(estAdmin)
        );
      }

      const {
        data,
        error,
      } = await supabase
        .from("joueurs")
        .select("*")
        .eq(
          "auth_user_id",
          user.id
        )
        .maybeSingle();

      if (!actif) return;

      if (error) {
        console.error(
          "Erreur joueur :",
          error
        );

        setJoueur(null);
      } else {
        setJoueur(data);
      }

      setChargement(false);
    }

    chargerProfil();

    return () => {
      actif = false;
    };
  }, [user]);

  // =====================================================
  // CHARGER LES JOUEURS POUR LES DONS
  // =====================================================

  useEffect(() => {
    if (
      !joueur ||
      joueur.grade === "Civil"
    ) {
      setJoueursDon([]);
      return;
    }

    chargerJoueursDon();
  }, [joueur?.id, joueur?.grade]);

  async function chargerJoueursDon() {
    const {
      data,
      error,
    } = await supabase.rpc(
      "lister_joueurs_don"
    );

    if (error) {
      console.error(
        "Erreur liste joueurs :",
        error
      );

      setJoueursDon([]);
      return;
    }

    setJoueursDon(
      data || []
    );
  }

  // =====================================================
  // CONNEXION GOOGLE
  // =====================================================

  async function connexionGoogle() {
    const { error } =
      await supabase.auth
        .signInWithOAuth({
          provider: "google",

          options: {
            redirectTo:
              `${window.location.origin}/auth/callback`,

            scopes:
              "https://www.googleapis.com/auth/youtube.readonly",

            queryParams: {
              access_type:
                "offline",

              prompt:
                "consent",
            },
          },
        });

    if (error) {
      console.error(error);

      alert(
        "Erreur Google : " +
          error.message
      );
    }
  }

  // =====================================================
  // DÉCONNEXION
  // =====================================================

  async function deconnexion() {
    sessionStorage.removeItem(
      "youtube_provider_token"
    );

    await supabase.auth.signOut();

    setUser(null);
    setJoueur(null);
    setAdmin(false);

    window.location.href = "/";
  }

  // =====================================================
  // DEVENIR SOLDAT
  // =====================================================

  async function devenirSoldat() {
    try {
      setVerificationSoldat(true);

      setMessageSoldat(
        "🔎 Vérification de l'abonnement et du like..."
      );

      const {
        data: { session },
      } =
        await supabase.auth
          .getSession();

      if (!session) {
        setMessageSoldat(
          "❌ Tu dois être connecté au site."
        );

        return;
      }

      const youtubeToken =
        sessionStorage.getItem(
          "youtube_provider_token"
        );

      if (!youtubeToken) {
        setMessageSoldat(
          "⚠️ Autorisation YouTube absente. Déconnecte-toi puis reconnecte-toi avec Google."
        );

        return;
      }

      const response =
        await fetch(
          "/api/devenir-soldat",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                youtubeAccessToken:
                  youtubeToken,
              }),
          }
        );

      const resultat =
        await response.json();

      setMessageSoldat(
        resultat.message ||
          "Vérification terminée."
      );

      if (resultat.ok) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

    } catch (erreur) {
      console.error(
        "Erreur devenir Soldat :",
        erreur
      );

      setMessageSoldat(
        "❌ Une erreur est survenue pendant la vérification."
      );

    } finally {
      setVerificationSoldat(
        false
      );
    }
  }

  // =====================================================
  // DONNER DES OBUS
  // =====================================================

  async function donnerObus() {
    setMessageDon("");

    if (!destinataireDon) {
      setMessageDon(
        "❌ Choisis un joueur."
      );
      return;
    }

    const montant =
      Number(montantDon);

    if (
      !Number.isInteger(montant) ||
      montant <= 0
    ) {
      setMessageDon(
        "❌ Entre un nombre entier supérieur à 0."
      );
      return;
    }

    if (
      montant >
      Number(joueur.obus)
    ) {
      setMessageDon(
        "❌ Tu n'as pas assez d'Obus."
      );
      return;
    }

    const joueurChoisi =
      joueursDon.find(
        (j) =>
          j.id ===
          destinataireDon
      );

    const confirmation =
      window.confirm(
        `Envoyer ${montant} Obus à ${joueurChoisi?.pseudo || "ce joueur"} ?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setEnvoiDon(true);

      setMessageDon(
        "💰 Envoi des Obus..."
      );

      const {
        data,
        error,
      } = await supabase.rpc(
        "donner_obus",
        {
          p_destinataire_id:
            destinataireDon,

          p_montant:
            montant,
        }
      );

      if (error) {
        setMessageDon(
          "❌ " +
            error.message
        );

        return;
      }

      const nouveauSolde =
        Number(
          data?.nouveau_solde ??
          joueur.obus - montant
        );

      setJoueur(
        (ancien) => ({
          ...ancien,
          obus:
            nouveauSolde,
        })
      );

      setMontantDon("");
      setDestinataireDon("");

      setMessageDon(
        `✅ ${montant} Obus envoyés à ${data?.destinataire || joueurChoisi?.pseudo}.`
      );

    } catch (erreur) {
      console.error(
        "Erreur don :",
        erreur
      );

      setMessageDon(
        "❌ Impossible d'envoyer les Obus."
      );

    } finally {
      setEnvoiDon(false);
    }
  }

  // =====================================================
  // PROCHAIN GRADE
  // =====================================================

  function prochainGrade() {
    if (!joueur) {
      return null;
    }

    if (
      joueur.grade ===
      "Civil"
    ) {
      return {
        nom: "Soldat",

        texte:
          "Abonne-toi à la chaîne et like le live pour devenir Soldat.",
      };
    }

    if (
      joueur.officier_general
    ) {
      return {
        nom:
          "🏆 Grade ultime atteint",

        texte:
          "Bravo ! Tu as obtenu le meilleur grade de La Tribu des Obus : Officier général.",
      };
    }

    const prochain =
      grades.find(
        (grade) =>
          grade.lives >
          joueur.lives_depuis_soldat
      );

    if (!prochain) {
      return {
        nom:
          "Grade maximum automatique",

        texte:
          "70 lives atteints",
      };
    }

    return {
      nom:
        prochain.nom,

      texte:
        `${joueur.lives_depuis_soldat} / ${prochain.lives} lives`,
    };
  }

  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (chargement) {
    return (
      <main className="container">
        <div className="logo">
  <Image
    src="/logo-obus.png"
    alt="Logo La Tribu des Obus"
    width={150}
    height={150}
    priority
    style={{
      width: "150px",
      height: "auto",
    }}
  />
</div>

        <h1>
          LA TRIBU DES OBUS
        </h1>

        <div className="card">
          <p>
            Chargement du compte...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // NON CONNECTÉ
  // =====================================================

  if (!user) {
    return (
      <main className="container">
        <div className="logo">
  <Image
    src="/logo-obus.png"
    alt="Logo La Tribu des Obus"
    width={150}
    height={150}
    priority
    style={{
      width: "150px",
      height: "auto",
    }}
  />
</div>

        <h1>
          LA TRIBU DES OBUS
        </h1>

        <p className="subtitle">
          Rejoins la Tribu,
          participe aux lives et
          monte dans les grades.
        </p>

        <div className="card">
          <p className="label">
            TON AVENTURE COMMENCE ICI
          </p>

          <h2>
            Bienvenue dans La Tribu
            des Obus.
          </h2>

          <p>
            Connecte-toi avec ton
            compte Google pour
            accéder à ton profil,
            consulter ton grade et
            voir ton sac
            d&apos;Obus.
          </p>

          <div className="legal-consent">

  <label>
    <input
      type="checkbox"
      checked={conditionsAcceptees}
      onChange={(e) =>
        setConditionsAcceptees(
          e.target.checked
        )
      }
    />

    <span>
      J’ai lu et j’accepte les{" "}
      <a
        href="/cgu"
        target="_blank"
      >
        CGU
      </a>
      {" "}et la{" "}
      <a
        href="/confidentialite"
        target="_blank"
      >
        Politique de confidentialité
      </a>.
      {" "}J’accepte également les{" "}
      <a
        href="https://www.youtube.com/t/terms"
        target="_blank"
        rel="noreferrer"
      >
        Conditions d’utilisation de YouTube
      </a>.
    </span>
  </label>

</div>

<button
  onClick={
    connexionGoogle
  }
  disabled={
    !conditionsAcceptees
  }
  style={{
    opacity:
      conditionsAcceptees
        ? 1
        : 0.45,

    cursor:
      conditionsAcceptees
        ? "pointer"
        : "not-allowed",
  }}
>
  Se connecter avec Google
</button>
        </div>
      </main>
    );
  }

  // =====================================================
  // ADMIN SANS FICHE JOUEUR
  // =====================================================

  if (
    admin &&
    !joueur
  ) {
    return (
      <main className="container">
        <div className="logo">
          🛡️
        </div>

        <h1>
          LA TRIBU DES OBUS
        </h1>

        <div className="card">
          <p className="label">
            COMPTE ADMINISTRATEUR
          </p>

          <h2>
            Administration
          </h2>

          <p>
            Ton compte
            administrateur est
            correctement connecté.
          </p>

          <button
            onClick={() => {
              window.location.href =
                "/admin";
            }}
          >
            Ouvrir le panneau
            administrateur
          </button>
        </div>
      </main>
    );
  }

  // =====================================================
  // CONNECTÉ MAIS NON ASSOCIÉ
  // =====================================================

  if (!joueur) {
    return (
      <main className="container">
      <button
  onClick={deconnexion}
  title="Se déconnecter"
  style={{
    position: "absolute",
    top: "15px",
    right: "15px",
    width: "42px",
    height: "42px",
    padding: "0",
    background: "#c62828",
    border: "2px solid #ff5252",
    color: "white",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  }}
>
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 3V12"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />

    <path
      d="M7.1 5.8C4.6 7.4 3 10.1 3 13C3 18 7 22 12 22C17 22 21 18 21 13C21 10.1 19.4 7.4 16.9 5.8"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
  </svg>
</button>
        <div className="logo">
  <Image
    src="/logo-obus.png"
    alt="Logo La Tribu des Obus"
    width={150}
    height={150}
    priority
    style={{
      width: "150px",
      height: "auto",
    }}
  />
</div>

        <h1>
          LA TRIBU DES OBUS
        </h1>

        <div className="card">
          <p className="label">
            COMPTE CONNECTÉ
          </p>

          <h2>
            Profil joueur non
            associé
          </h2>

          <p>
            Ton compte Google
            fonctionne, mais il
            n&apos;est pas encore
            associé à un joueur de
            La Tribu des Obus.
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // PROFIL JOUEUR
  // =====================================================

  const prochain =
    prochainGrade();

  const gradeAffiche =
    joueur.punition
      ? joueur.punition
      : joueur.officier_general
        ? "Officier général"
        : joueur.grade;

  return (
    <main className="container">
      <div className="logo">
  <Image
    src="/logo-obus.png"
    alt="Logo La Tribu des Obus"
    width={150}
    height={150}
    priority
    style={{
      width: "150px",
      height: "auto",
    }}
  />
</div>

      <h1>
        LA TRIBU DES OBUS
      </h1>

      <p className="subtitle">
        Bienvenue {joueur.pseudo}
      </p>

      {/* ================================================= */}
      {/* ADMINISTRATEUR */}
      {/* ================================================= */}

      {admin && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
          }}
        >
          <p className="label">
            ADMINISTRATEUR
          </p>

          <button
            onClick={() => {
              window.location.href =
                "/admin";
            }}
          >
            Ouvrir le panneau administrateur
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* PROFIL DU JOUEUR */}
      {/* ================================================= */}

      <div
  className="card"
  style={{
    position: "relative",
    paddingTop: "70px",
  }}
>
  <button
  onClick={deconnexion}
  title="Se déconnecter"
  style={{
    position: "absolute",
    top: "15px",
    right: "15px",
    width: "42px",
    height: "42px",
    margin: "0",
    padding: "0",
    background: "#c62828",
    border: "2px solid #ff5252",
    color: "white",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 2,
  }}
>
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 3V12"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />

    <path
      d="M7.1 5.8C4.6 7.4 3 10.1 3 13C3 18 7 22 12 22C17 22 21 18 21 13C21 10.1 19.4 7.4 16.9 5.8"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
  </svg>
</button>

  <p className="label">
    PROFIL DU JOUEUR
  </p>

        <h2>
          {joueur.pseudo}
        </h2>

        <p>
          🎖️ Grade :{" "}
          <strong>
            {gradeAffiche}
          </strong>
        </p>

        <p>
          💰 Sac d&apos;Obus :{" "}
          <strong>
            {joueur.obus} Obus
          </strong>
        </p>

        <p>
          📺 Lives depuis Soldat :{" "}
          <strong>
            {joueur.lives_depuis_soldat}
          </strong>
        </p>
        <p>
          📊 Lives total :{" "}
          <strong>
            {joueur.total_lives}
          </strong>
        </p>

        {joueur.punition && (
          <p>
            ⚠️ Grade réel conservé :{" "}
            <strong>
              {joueur.grade}
            </strong>
          </p>
        )}

        <hr />

        <p className="label">
          {joueur.officier_general
            ? "FÉLICITATIONS"
            : "PROCHAINE ÉTAPE"}
        </p>

        <h2>
          {prochain?.nom}
        </h2>

        <p>
          {prochain?.texte}
        </p>

        {/* ============================================= */}
        {/* DEVENIR SOLDAT */}
        {/* ============================================= */}

        {joueur.grade === "Civil" && (
          <div
            style={{
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={
                devenirSoldat
              }
              disabled={
                verificationSoldat
              }
            >
              {verificationSoldat
                ? "🔎 VÉRIFICATION..."
                : "🪖 DEVENIR SOLDAT"}
            </button>

            {messageSoldat && (
              <p
                style={{
                  marginTop: "12px",
                }}
              >
                {messageSoldat}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* MENU DU JEU */}
      {/* ADMIN + JOUEURS */}
      {/* ================================================= */}
      
      <div className="menu-grid">
      
        {/* ================================================= */}
        {/* INVENTAIRE */}
        {/* ================================================= */}
      
        <div
          className="card menu-card"
          onClick={() => {
            window.location.href =
              "/inventaire";
          }}
        >
          <div className="menu-icon">
            🎒
          </div>
      
          <h2>
            Inventaire
          </h2>
      
          <p>
            Tes objets et récompenses
          </p>
        </div>
      
      
        {/* ================================================= */}
        {/* MAGASIN */}
        {/* ================================================= */}
      
        <div
          className="card menu-card"
          onClick={() => {
            window.location.href =
              "/magasin";
          }}
        >
          <div className="menu-icon">
            🛒
          </div>
      
          <h2>
            Magasin
          </h2>
      
          <p>
            Dépenser tes Obus
          </p>
        </div>
      
      
        {/* ================================================= */}
        {/* VIREMENT */}
        {/* ================================================= */}
      
        <div
          className="card menu-card"
          onClick={() => {
            window.location.href =
              "/virement";
          }}
        >
          <div className="menu-icon">
            💸
          </div>
      
          <h2>
            Virement
          </h2>
      
          <p>
            Envoyer des Obus
          </p>
        </div>
      
      
        {/* ================================================= */}
        {/* CLASSEMENT */}
        {/* ================================================= */}
      
        <div
          className="card menu-card"
          onClick={() => {
            window.location.href =
              "/classement";
          }}
        >
          <div className="menu-icon">
            🏆
          </div>
      
          <h2>
            Classement
          </h2>
      
          <p>
            Voir les meilleurs joueurs
          </p>
        </div>
      </div>
    </main>
  );
}
