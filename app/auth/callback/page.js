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

export default function AuthCallback() {
  useEffect(() => {
    async function terminerConnexion() {
      try {
        // ==========================================
        // 1. RÉCUPÉRER LE CODE GOOGLE
        // ==========================================

        const params =
          new URLSearchParams(
            window.location.search
          );

        const code =
          params.get("code");

        if (!code) {
          throw new Error(
            "Code de connexion Google introuvable."
          );
        }

        // ==========================================
        // 2. CRÉER LA SESSION SUPABASE
        // ==========================================

        const {
          data,
          error,
        } =
          await supabase.auth
            .exchangeCodeForSession(code);

        if (error) {
          throw error;
        }

        const session =
          data.session;

        if (!session) {
          throw new Error(
            "Session Supabase introuvable."
          );
        }

        // ==========================================
        // 3. VÉRIFIER SI C'EST UN ADMIN
        // ==========================================

        const {
          data: estAdmin,
          error: adminError,
        } =
          await supabase.rpc(
            "est_admin"
          );

        if (
          !adminError &&
          estAdmin === true
        ) {
          window.location.href = "/";
          return;
        }

        // ==========================================
        // 4. RÉCUPÉRER LE TOKEN YOUTUBE
        // ==========================================

        const providerToken =
          session.provider_token;

        if (!providerToken) {
          throw new Error(
            "Autorisation YouTube introuvable. Reconnecte-toi avec Google."
          );
        }

        // On garde temporairement le token
        // uniquement dans cet onglet.
        sessionStorage.setItem(
          "youtube_provider_token",
          providerToken
        );

        // ==========================================
        // 5. IDENTIFIER LA CHAÎNE YOUTUBE DU JOUEUR
        // ==========================================

        const response =
          await fetch(
            "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
            {
              headers: {
                Authorization:
                  `Bearer ${providerToken}`,
              },
            }
          );

        const youtubeData =
          await response.json();

        if (!response.ok) {
          throw new Error(
            youtubeData?.error?.message ||
            "Erreur pendant la lecture du compte YouTube."
          );
        }

        const chaines =
          youtubeData.items || [];

        if (chaines.length === 0) {
          throw new Error(
            "Aucune chaîne YouTube trouvée sur ce compte Google."
          );
        }

        // Pour l'instant on utilise
        // la chaîne retournée par YouTube.
        const chaine =
          chaines[0];

        const channelId =
          chaine.id;

        const pseudo =
          chaine.snippet?.title ||
          "Joueur YouTube";

        // ==========================================
        // 6. LIER AU PROFIL DE LA TRIBU
        // ==========================================

        const {
          error: liaisonError,
        } =
          await supabase.rpc(
            "lier_compte_youtube",
            {
              p_channel_id:
                channelId,
              p_pseudo:
                pseudo,
            }
          );

        if (liaisonError) {
          throw liaisonError;
        }

        // ==========================================
        // 7. RETOUR AU SITE
        // ==========================================

        window.location.href = "/";

      } catch (erreur) {
        console.error(
          "Erreur callback :",
          erreur
        );

        alert(
          erreur?.message ||
          "Erreur pendant la connexion."
        );

        window.location.href = "/";
      }
    }

    terminerConnexion();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "30px",
      }}
    >
      <div>
        <h1>💣 LA TRIBU DES OBUS</h1>

        <p>
          Connexion Google / YouTube
          en cours...
        </p>
      </div>
    </main>
  );
}
