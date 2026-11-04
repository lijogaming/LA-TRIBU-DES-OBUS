
"use client";

import { useEffect, useState } from "react";

const TAILLE_PAGE = 20;

export default function NotificationsAdmin({ supabase }) {
  const [notifications, setNotifications] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("");
  const [page, setPage] = useState(0);
  const [actualisation, setActualisation] = useState(0);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [encoreDisponible, setEncoreDisponible] =
    useState(false);

  // =====================================================
  // CHARGER L'HISTORIQUE ADMIN
  // =====================================================

  useEffect(() => {
    let actif = true;

    async function chargerNotifications() {
      setChargement(true);
      setErreur("");

      const { data, error } = await supabase.rpc(
        "admin_lister_notifications",
        {
          p_limite: TAILLE_PAGE + 1,
          p_decalage: page * TAILLE_PAGE,
          p_recherche: filtre,
        }
      );

      if (!actif) return;

      setChargement(false);

      if (error) {
        setErreur(
          "Impossible de charger l'historique : " +
            error.message
        );
        return;
      }

      const resultat = data || [];

      const nouvellesNotifications =
        resultat.slice(0, TAILLE_PAGE);

      setNotifications((anciennes) => {
        if (page === 0) {
          return nouvellesNotifications;
        }

        const identifiants = new Set(
          anciennes.map((n) => n.notification_id)
        );

        return [
          ...anciennes,
          ...nouvellesNotifications.filter(
            (n) => !identifiants.has(n.notification_id)
          ),
        ];
      });

      setEncoreDisponible(
        resultat.length > TAILLE_PAGE
      );
    }

    chargerNotifications();

    return () => {
      actif = false;
    };
  }, [supabase, page, filtre, actualisation]);

  // =====================================================
  // RECHERCHE
  // =====================================================

  function lancerRecherche(event) {
    event.preventDefault();

    setNotifications([]);
    setPage(0);
    setFiltre(recherche.trim());
    setActualisation((ancienne) => ancienne + 1);
  }

  // =====================================================
  // FORMAT DE DATE FRANÇAIS
  // =====================================================

  function formaterDate(date) {
    const valeur = new Date(date);

    const jour = valeur.toLocaleDateString(
      "fr-FR",
      {
        timeZone: "Europe/Paris",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );

    const heure = valeur
      .toLocaleTimeString("fr-FR", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(":", "h");

    return `Le ${jour} à ${heure}`;
  }

  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (
    <div
      className="card"
      style={{
        marginTop: "30px",
        marginBottom: "30px",
      }}
    >
      <p className="label">
        HISTORIQUE DES NOTIFICATIONS
      </p>

      <h2>
        📬 Notifications des joueurs
      </h2>

      <p>
        Retrouvez les notifications de tous les joueurs
        sur les 30 derniers jours.
      </p>

      {/* ============================================= */}
      {/* RECHERCHE */}
      {/* ============================================= */}

      <form
        onSubmit={lancerRecherche}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "20px",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          value={recherche}
          onChange={(event) =>
            setRecherche(event.target.value)
          }
          placeholder="Pseudo, événement ou message..."
          style={{
            flex: "1 1 200px",
            minWidth: 0,
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #444",
            background: "#111",
            color: "white",
          }}
        />

        <button
          type="submit"
          disabled={chargement}
        >
          Rechercher
        </button>
      </form>

      {/* ============================================= */}
      {/* ERREUR */}
      {/* ============================================= */}

      {erreur && (
        <p role="alert">
          ❌ {erreur}
        </p>
      )}

      {/* ============================================= */}
      {/* AUCUN RÉSULTAT */}
      {/* ============================================= */}

      {!chargement &&
        !erreur &&
        notifications.length === 0 && (
          <p>
            Aucune notification trouvée.
          </p>
        )}

      {/* ============================================= */}
      {/* LISTE DES NOTIFICATIONS */}
      {/* ============================================= */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {notifications.map((notification) => (
          <div
            key={notification.notification_id}
            style={{
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid #444",
              background: "#151515",
            }}
          >
            <p
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              👤 {notification.pseudo_joueur}
            </p>

            <p
              className="label"
              style={{
                marginBottom: "8px",
              }}
            >
              {notification.type_notification
                .replaceAll("_", " ")
                .toUpperCase()}
            </p>

            <p>
              {notification.message}
            </p>

            <p
              style={{
                marginTop: "12px",
                fontSize: "13px",
                opacity: 0.7,
              }}
            >
              {formaterDate(notification.created_at)}
              {" — "}
              {notification.lu ? "Lu" : "Non lu"}
            </p>
          </div>
        ))}
      </div>

      {/* ============================================= */}
      {/* CHARGEMENT */}
      {/* ============================================= */}

      {chargement && (
        <p
          style={{
            marginTop: "15px",
          }}
        >
          Chargement des notifications...
        </p>
      )}

      {/* ============================================= */}
      {/* AFFICHER PLUS */}
      {/* ============================================= */}

      {!chargement &&
        !erreur &&
        encoreDisponible && (
          <button
            type="button"
            onClick={() =>
              setPage((ancienne) => ancienne + 1)
            }
            style={{
              marginTop: "20px",
            }}
          >
            Afficher plus de notifications
          </button>
        )}
    </div>
  );
}
