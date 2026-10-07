"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export default function VirementPage() {
  const [joueur, setJoueur] = useState(null);
  const [joueursDon, setJoueursDon] = useState([]);
  const [destinataire, setDestinataire] = useState("");
  const [montant, setMontant] = useState("");
  const [message, setMessage] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    initialiser();
  }, []);

  async function initialiser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/";
      return;
    }

    const {
      data: joueurData,
      error: erreurJoueur,
    } = await supabase
      .from("joueurs")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (erreurJoueur || !joueurData) {
      setChargement(false);
      return;
    }

    setJoueur(joueurData);

    const {
      data: liste,
      error: erreurListe,
    } = await supabase.rpc(
      "lister_joueurs_don"
    );

    if (!erreurListe) {
      setJoueursDon(liste || []);
    }

    setChargement(false);
  }

  async function donnerObus() {
    setMessage("");

    if (!destinataire) {
      setMessage(
        "❌ Choisis un joueur."
      );
      return;
    }

    const valeur =
      Number(montant);

    if (
      !Number.isInteger(valeur) ||
      valeur <= 0
    ) {
      setMessage(
        "❌ Entre un nombre entier supérieur à 0."
      );
      return;
    }

    if (
      valeur >
      Number(joueur.obus)
    ) {
      setMessage(
        "❌ Tu n'as pas assez d'Obus."
      );
      return;
    }

    const joueurChoisi =
      joueursDon.find(
        (j) =>
          j.id === destinataire
      );

    const confirmation =
      window.confirm(
        `Envoyer ${valeur} Obus à ${joueurChoisi?.pseudo} ?`
      );

    if (!confirmation) {
      return;
    }

    setEnvoi(true);

    const {
      data,
      error,
    } = await supabase.rpc(
      "donner_obus",
      {
        p_destinataire_id:
          destinataire,

        p_montant:
          valeur,
      }
    );

    if (error) {
      setMessage(
        "❌ " +
          error.message
      );

      setEnvoi(false);
      return;
    }

    setJoueur(
      (ancien) => ({
        ...ancien,
        obus:
          data.nouveau_solde,
      })
    );

    setDestinataire("");
    setMontant("");

    setMessage(
      `✅ ${valeur} Obus envoyés à ${data.destinataire}.`
    );

    setEnvoi(false);
  }

  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (chargement) {
    return (
      <main className="container">
        <div className="logo">
          💸
        </div>

        <h1>
          VIREMENT
        </h1>

        <div className="card">
          <p>
            Chargement...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // PROFIL INTROUVABLE
  // =====================================================

  if (!joueur) {
    return (
      <main className="container">
        <div className="logo">
          💸
        </div>

        <h1>
          VIREMENT
        </h1>

        <div className="card">
          <p>
            Profil joueur introuvable.
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // VRAIE PAGE VIREMENT
  // =====================================================

  return (
    <main className="container">
      <div className="logo">
        💸
      </div>

      <h1>
        VIREMENT
      </h1>

      <p className="subtitle">
        Virement vers un membre de la Tribu
      </p>

      <div
        className="card"
        style={{
          position: "relative",
          paddingTop: "70px",
        }}
      >
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          title="Retour"
          style={{
            position: "absolute",
            top: "15px",
            left: "15px",
            width: "42px",
            height: "42px",
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
          TON SOLDE
        </p>

        <h2>
          💰 {joueur.obus} Obus
        </h2>
      </div>

      <div
        className="card"
        style={{
          marginTop: "20px",
        }}
      >
        <p className="label">
          DESTINATAIRE
        </p>

        <select
          value={destinataire}
          onChange={(e) =>
            setDestinataire(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            background: "#111",
            color: "white",
            border: "1px solid #444",
            marginBottom: "12px",
          }}
        >
          <option value="">
            Choisir un joueur...
          </option>

          {joueursDon.map(
            (autreJoueur) => (
              <option
                key={autreJoueur.id}
                value={autreJoueur.id}
              >
                {autreJoueur.pseudo}
                {" — "}
                {autreJoueur.grade}
              </option>
            )
          )}
        </select>

        <input
          type="number"
          min="1"
          step="1"
          value={montant}
          onChange={(e) =>
            setMontant(
              e.target.value
            )
          }
          placeholder="Nombre d'Obus..."
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            background: "#111",
            color: "white",
            border: "1px solid #444",
            marginBottom: "12px",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={donnerObus}
          disabled={envoi}
        >
          {envoi
            ? "💰 ENVOI..."
            : "💣 FAIRE LE VIREMENT"}
        </button>

        {message && (
          <p
            style={{
              marginTop: "15px",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
