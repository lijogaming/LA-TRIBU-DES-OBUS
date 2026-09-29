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
  const [message, setMessage] = useState("Connexion en cours...");

  useEffect(() => {
    async function terminerConnexion() {
      const params = new URLSearchParams(window.location.search);

      const code = params.get("code");

      if (!code) {
        setMessage("Erreur : aucun code de connexion reçu.");
        return;
      }

      const { error } =
        await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error(error);
        setMessage(
          "Erreur pendant la connexion : " + error.message
        );
        return;
      }

      window.location.replace("/");
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
