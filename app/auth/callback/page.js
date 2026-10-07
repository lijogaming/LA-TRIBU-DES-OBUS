"use client";

import { useEffect } from "react";
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

export default function AuthCallbackPage() {
  useEffect(() => {
    terminerConnexion();
  }, []);

  async function terminerConnexion() {
    try {
      const url =
        new URL(
          window.location.href
        );

      const code =
        url.searchParams.get(
          "code"
        );

      if (!code) {
        window.location.href = "/";
        return;
      }

      // =================================================
      // ÉCHANGE DU CODE GOOGLE
      // =================================================

      const {
        data,
        error,
      } =
        await supabase.auth
          .exchangeCodeForSession(
            code
          );

      if (error) {
        console.error(
          "Erreur session :",
          error
        );

        window.location.href = "/";
        return;
      }

      const session =
        data.session;

      if (!session) {
        window.location.href = "/";
        return;
      }

      // =================================================
      // TOKEN YOUTUBE
      // =================================================

      const youtubeToken =
        session.provider_token;

      if (youtubeToken) {
        sessionStorage.setItem(
          "youtube_provider_token",
          youtubeToken
        );
      }

      if (!youtubeToken) {
        console.log(
          "Token YouTube absent."
        );

        window.location.href = "/";
        return;
      }

      // =================================================
      // RÉCUPÉRER LA CHAÎNE YOUTUBE
      // =================================================

      const response =
        await fetch(
          "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
          {
            headers: {
              Authorization:
                `Bearer ${youtubeToken}`,
            },
          }
        );

      const youtubeData =
        await response.json();

      if (!response.ok) {
        console.error(
          "Erreur YouTube :",
          youtubeData
        );

        window.location.href = "/";
        return;
      }

      const chaine =
        youtubeData.items?.[0];

      if (!chaine?.id) {
        console.log(
          "Chaîne YouTube introuvable."
        );

        window.location.href = "/";
        return;
      }

      const pseudo =
        chaine.snippet?.title ||
        "Joueur";

      // =================================================
      // LIER LE PROFIL JOUEUR
      //
      // IMPORTANT :
      // on le fait aussi pour les administrateurs.
      // =================================================

      const {
        error:
          erreurLiaison,
      } =
        await supabase.rpc(
          "lier_compte_youtube",
          {
            p_channel_id:
              chaine.id,

            p_pseudo:
              pseudo,
          }
        );

      if (
        erreurLiaison
      ) {
        console.error(
          "Erreur liaison joueur :",
          erreurLiaison
        );
      }

      // =================================================
      // RETOUR AU SITE
      // =================================================

      window.location.href = "/";

    } catch (erreur) {
      console.error(
        "Erreur callback :",
        erreur
      );

      window.location.href = "/";
    }
  }

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
          Connexion en cours...
        </p>
      </div>
    </main>
  );
}
