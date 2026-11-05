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
  const [confirmationOuverte, setConfirmationOuverte] =
    
    useState(false);
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

        if (envoi) {
      return;
    }

    if (!confirmationOuverte) {
      setConfirmationOuverte(true);
      return;
    }

    setConfirmationOuverte(false);

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
            Choisir un membre...
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
                {/* =====================================================
          FENÊTRE DE CONFIRMATION DU VIREMENT
      ===================================================== */}

      {confirmationOuverte && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirmation du virement"
            style={{
              width: "100%",
              maxWidth: "440px",
              maxHeight: "calc(100dvh - 32px)",
              overflowY: "auto",
              boxSizing: "border-box",
              background: "#171717",
              border: "3px solid #3b82f6",
              borderRadius: "22px",
              padding: "24px 18px",
              color: "white",
              boxShadow: "0 15px 60px rgba(0,0,0,0.8)",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                color: "#e5bd68",
                fontSize: "23px",
                margin: "0 0 12px",
              }}
            >
              💰 CONFIRMER LE VIREMENT
            </h2>

            <p
              style={{
                textAlign: "center",
                color: "#bbb",
                marginBottom: "24px",
                fontSize: "14px",
              }}
            >
              Vérifie les informations avant de
              confirmer ton virement.
            </p>

            <div
              style={{
                background: "#0c0c0c",
                border: "1px solid #444",
                borderRadius: "16px",
                padding: "18px 12px",
                marginBottom: "14px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#e5bd68",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  fontSize: "13px",
                  margin: "0 0 12px",
                }}
              >
                DESTINATAIRE
              </p>

              <div
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "19px",
                  overflowWrap: "anywhere",
                }}
              >
                {joueursDon.find(
                  (j) => j.id === destinataire
                )?.pseudo || "Membre sélectionné"}
              </div>
            </div>

            <div
              style={{
                background: "#0c0c0c",
                border: "1px solid #3b82f6",
                borderRadius: "16px",
                padding: "20px 12px",
                marginBottom: "14px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#e5bd68",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  fontSize: "13px",
                  margin: "0 0 12px",
                }}
              >
                MONTANT DU VIREMENT
              </p>

              <div
                style={{
                  fontSize: "30px",
                  fontWeight: "bold",
                  color: "#3b82f6",
                }}
              >
                💰 {Number(montant).toLocaleString("fr-FR")} Obus
              </div>
            </div>

            <div
              style={{
                background: "#0c0c0c",
                border: "1px solid #444",
                borderRadius: "16px",
                padding: "18px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "14px",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "#aaa" }}>
                  Solde actuel
                </span>

                <strong>
                  {Number(joueur.obus).toLocaleString("fr-FR")} Obus
                </strong>
              </div>

              <div
                style={{
                  borderTop: "1px solid #333",
                  paddingTop: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "#aaa" }}>
                  Solde après virement
                </span>

                <strong style={{ color: "#e5bd68" }}>
                  {(
                    Number(joueur.obus) - Number(montant)
                  ).toLocaleString("fr-FR")} Obus
                </strong>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setConfirmationOuverte(false)}
                disabled={envoi}
                style={{
                  width: "100%",
                  padding: "15px 8px",
                  background: "#333",
                  color: "white",
                  border: "1px solid #555",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                ANNULER
              </button>

              <button
                type="button"
                onClick={donnerObus}
                disabled={envoi}
                style={{
                  width: "100%",
                  padding: "15px 8px",
                  background: "#e5bd68",
                  color: "#111",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {envoi ? "ENVOI..." : "CONFIRMER"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
