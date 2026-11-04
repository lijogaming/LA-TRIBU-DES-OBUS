
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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

// ==============================================
// PAGES INTERDITES AUX CIVILS
// ==============================================

const routesProtegees = [
  "/inventaire",
  "/magasin",
  "/virement",
];

function estRouteProtegee(chemin) {
  return routesProtegees.some(
    (route) =>
      chemin === route ||
      chemin.startsWith(route + "/")
  );
}

export default function ControleAcces({ children }) {
  const pathname = usePathname();

  const [autorisation, setAutorisation] = useState({
    chemin: null,
    accordee: false,
  });

  const protectionActive = estRouteProtegee(
    pathname || ""
  );

  useEffect(() => {
    if (!protectionActive) return;

    let annule = false;

    async function verifierAcces() {
      try {
        // Vérifier le compte connecté.
        const {
          data: { user },
          error: erreurAuth,
        } = await supabase.auth.getUser();

        if (annule) return;

        if (erreurAuth || !user) {
          window.location.replace("/");
          return;
        }

        // Préserver les autorisations administrateur.
        const {
          data: estAdmin,
          error: erreurAdmin,
        } = await supabase.rpc("est_admin");

        if (annule) return;

        if (!erreurAdmin && estAdmin === true) {
          setAutorisation({
            chemin: pathname,
            accordee: true,
          });
          return;
        }

        // Vérifier le grade du joueur.
        const {
          data: joueur,
          error: erreurJoueur,
        } = await supabase
          .from("joueurs")
          .select("grade")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (annule) return;

        if (
          erreurJoueur ||
          !joueur ||
          joueur.grade === "Civil"
        ) {
          window.location.replace("/");
          return;
        }

        // Joueur Soldat ou supérieur.
        setAutorisation({
          chemin: pathname,
          accordee: true,
        });
      } catch (erreur) {
        console.error(
          "Erreur contrôle d'accès :",
          erreur
        );

        if (!annule) {
          window.location.replace("/");
        }
      }
    }

    verifierAcces();

    return () => {
      annule = true;
    };
  }, [pathname, protectionActive]);

  // Les pages publiques ne sont pas concernées.
  if (!protectionActive) {
    return children;
  }

  // Ne pas afficher la page protégée
  // avant la vérification du joueur.
  if (
    !autorisation.accordee ||
    autorisation.chemin !== pathname
  ) {
    return (
      <main className="container">
        <div className="card">
          <p>Vérification des accès...</p>
        </div>
      </main>
    );
  }

  return children;
}
