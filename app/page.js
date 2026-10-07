"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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

  const [verificationSoldat, setVerificationSoldat] =
    useState(false);

  const [messageSoldat, setMessageSoldat] =
    useState("");

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
  // CHARGEMENT DU PROFIL APRÈS CONNEXION
  // =====================================================

  useEffect(() => {
    if (!user) return;

    let actif = true;

    async function chargerProfil() {
      setChargement(true);

      // Vérifie si le compte est administrateur
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

      // Cherche une éventuelle fiche joueur
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

      // -----------------------------------------------
      // SESSION SUPABASE
      // -----------------------------------------------

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

      // -----------------------------------------------
      // TOKEN YOUTUBE
      // -----------------------------------------------

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

      // -----------------------------------------------
      // APPEL DE NOTRE API SERVEUR
      // -----------------------------------------------

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

      // -----------------------------------------------
      // PROMOTION RÉUSSIE
      // -----------------------------------------------

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
          💣
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
          💣
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

          <button
            onClick={
              connexionGoogle
            }
          >
            Se connecter avec
            Google
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

          <button
            onClick={
              deconnexion
            }
            style={{
              marginTop: "12px",
            }}
          >
            Se déconnecter
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
        <div className="logo">
          💣
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

          <button
            onClick={
              deconnexion
            }
          >
            Se déconnecter
          </button>
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
        💣
      </div>

      <h1>
        LA TRIBU DES OBUS
      </h1>

      <p className="subtitle">
        Bienvenue {joueur.pseudo}
      </p>

      {/* ============================================ */}
      {/* ADMIN */}
      {/* ============================================ */}

      {admin && (
        <div
          className="card"
          style={{
            marginBottom:
              "20px",
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
            Ouvrir le panneau
            administrateur
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* PROFIL */}
      {/* ============================================ */}

      <div className="card">
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
            {
              joueur.lives_depuis_soldat
            }
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

        {/* ========================================== */}
        {/* PROCHAINE ÉTAPE */}
        {/* ========================================== */}

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

        {/* ========================================== */}
        {/* BOUTON DEVENIR SOLDAT */}
        {/* ========================================== */}

        {joueur.grade ===
          "Civil" && (
          <div
            style={{
              marginTop:
                "20px",
              marginBottom:
                "20px",
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
                  marginTop:
                    "12px",
                }}
              >
                {messageSoldat}
              </p>
            )}
          </div>
        )}

        <button
          onClick={
            deconnexion
          }
        >
          Se déconnecter
        </button>
      </div>

      {/* ============================================ */}
      {/* RÉSUMÉ */}
      {/* ============================================ */}

      <div className="features">
        <div>
          <strong>
            🎖️ {gradeAffiche}
          </strong>

          <span>
            Ton grade actuel
          </span>
        </div>

        <div>
          <strong>
            💰 {joueur.obus} OBUS
          </strong>

          <span>
            Ton sac personnel
          </span>
        </div>

        <div>
          <strong>
            📺{" "}
            {
              joueur.lives_depuis_soldat
            }{" "}
            LIVES
          </strong>

          <span>
            Depuis ton passage
            Soldat
          </span>
        </div>
      </div>
    </main>
  );
}
