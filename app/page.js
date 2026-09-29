"use client";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export default function Home() {
  async function connexionGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  return (
    <main className="container">
      <div className="logo">💣</div>

      <h1>LA TRIBU DES OBUS</h1>

      <p className="subtitle">
        Rejoins la Tribu, participe aux lives et monte dans les grades.
      </p>

      <div className="card">
        <p className="label">TON AVENTURE COMMENCE ICI</p>

        <h2>Bienvenue dans La Tribu des Obus.</h2>

        <p>
          Connecte-toi avec ton compte Google pour accéder à ton profil,
          consulter ton grade et voir ton sac d&apos;Obus.
        </p>

        <button onClick={connexionGoogle}>
          Se connecter avec Google
        </button>
      </div>

      <div className="features">
        <div>
          <strong>🎖️ GRADES</strong>
          <span>Progresse en participant aux lives</span>
        </div>

        <div>
          <strong>💰 OBUS</strong>
          <span>Construis ta fortune</span>
        </div>

        <div>
          <strong>🏭 ENTREPRISES</strong>
          <span>Crée ton empire avec la Tribu</span>
        </div>
      </div>
    </main>
  );
}
