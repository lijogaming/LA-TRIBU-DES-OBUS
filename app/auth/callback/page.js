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

export default function AuthCallback() {
  const [message, setMessage] = useState(
    "Connexion en cours..."
  );

  useEffect(() => {
    async function terminerConnexion() {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const code = params.get("code");

        if (!code) {
          throw new Error(
            "Aucun code de connexion reçu."
          );
        }

        // Transforme le code Google en session Supabase
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw error;
        }

        // ======================================
        // ADMIN : pas de création de joueur
        // ======================================

        const {
          data: estAdmin,
          error: erreurAdmin,
        } = await supabase.rpc("est_admin");

        if (erreurAdmin) {
          console.error(erreurAdmin);
        }

        if (estAdmin) {
          setMessage(
            "Compte administrateur reconnu..."
          );

          window.location.replace("/");
          return;
        }

        // ======================================
        // RÉCUPÉRATION DU TOKEN GOOGLE
        // ======================================

        const providerToken =
          data.session?.provider_token;

        if (!providerToken) {
          throw new Error(
            "Google n'a pas fourni l'autorisation YouTube. " +
            "Déconnecte-toi puis reconnecte-toi."
          );
        }

        setMessage(
          "Identification de ta chaîne YouTube..."
        );

        // ======================================
        // RÉCUPÉRATION DE LA CHAÎNE YOUTUBE
        // ======================================

        const response = await fetch(
          "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
          {
            headers: {
              Authorization: `Bearer ${providerToken}`,
            },
          }
        );

        const youtube = await response.json();

        if (!response.ok) {
          throw new Error(
            youtube?.error?.message ||
            "Impossible de récupérer la chaîne YouTube."
          );
        }

        const chaines = youtube.items || [];

        if (chaines.length === 0) {
          throw new Error(
            "Aucune chaîne YouTube trouvée sur ce compte Google."
          );
        }

        // Sécurité :
        // on ne choisit pas arbitrairement si plusieurs chaînes apparaissent
        if (chaines.length > 1) {
          throw new Error(
            "Plusieurs chaînes YouTube ont été détectées. " +
            "La sélection de chaîne sera ajoutée prochainement."
          );
        }

        const chaine = chaines[0];

        const channelId = chaine.id;
        const pseudo =
          chaine.snippet?.title || "Joueur";

        setMessage(
          `Chaîne détectée : ${pseudo}`
        );

        // ======================================
        // LIAISON AVEC LA FICHE JOUEUR
        // ======================================

        const { error: erreurLiaison } =
          await supabase.rpc(
            "lier_compte_youtube",
            {
              p_channel_id: channelId,
              p_pseudo: pseudo,
            }
          );

        if (erreurLiaison) {
          throw erreurLiaison;
        }

        setMessage(
          "Profil YouTube associé avec succès."
        );

        setTimeout(() => {
          window.location.replace("/");
        }, 700);

      } catch (erreur) {
        console.error(erreur);

        setMessage(
          "Erreur : " +
          (erreur?.message || "Erreur inconnue")
        );
      }
    }

    terminerConnexion();
  }, []);

  return (
    <main className="container">
      <div className="logo">💣</div>

      <h1>LA TRIBU DES OBUS</h1>

      <div className="card">
        <p>{message}</p>
      </div>
    </main>
  );
}
