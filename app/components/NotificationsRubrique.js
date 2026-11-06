"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Une enveloppe par rubrique : le patron reçoit son bilan dans Mes Entreprises,
// l'employé reçoit son salaire dans Mes Métiers.
export default function NotificationsRubrique({ supabase, joueurId, rubrique }) {
  // Types financiers existants + futurs événements de recrutement/négociation.
  const filtresTypes = rubrique === "entreprises"
    ? "type_notification.eq.bilan_entreprise,type_notification.like.patron_entreprise_%"
    : "type_notification.eq.salaire_entreprise,type_notification.like.metier_entreprise_%";
  const titre = rubrique === "entreprises" ? "Notifications de mon entreprise" : "Notifications de mes métiers";

  const [ouvert, setOuvert] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(null);

  useEffect(() => {
    if (!joueurId) {
      setNotifications([]);
      return;
    }
    let actif = true;

    async function charger() {
      const depuis = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      setChargement(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type_notification, message, lu, created_at")
        .eq("joueur_id", joueurId)
        .or(filtresTypes)
        .gte("created_at", depuis)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!actif) return;
      setChargement(false);
      if (error) {
        setErreur("Impossible de charger les notifications : " + error.message);
      } else {
        setNotifications(data || []);
        setErreur("");
      }
    }

    charger();
    const intervalle = setInterval(charger, 60000);
    return () => {
      actif = false;
      clearInterval(intervalle);
    };
  }, [joueurId, supabase, filtresTypes]);

  async function marquerLue(id) {
    setEnCours(id);
    const { error } = await supabase.rpc("marquer_notification_lue", {
      p_notification_id: id,
    });
    if (error) {
      setErreur("Impossible de marquer comme lue : " + error.message);
    } else {
      setNotifications((actuelles) =>
        actuelles.map((notification) =>
          notification.id === id ? { ...notification, lu: true } : notification
        )
      );
      setErreur("");
    }
    setEnCours(null);
  }

  if (!joueurId) return null;

  return (
    <>
      <button
        type="button"
        title={titre}
        aria-label={titre}
        aria-expanded={ouvert}
        onClick={() => setOuvert(true)}
        style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          width: "42px",
          height: "42px",
          padding: 0,
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid rgba(233, 189, 88, 0.65)",
          borderRadius: "10px",
          background: "#222",
          color: "white",
          cursor: "pointer",
          zIndex: 2,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M4 7 L12 13 L20 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        {notifications.some((notification) => !notification.lu) && (
          <Image
            src="/alerte-notification.png"
            alt=""
            width={19}
            height={22}
            style={{ position: "absolute", top: "-7px", right: "-7px" }}
          />
        )}
      </button>

      {ouvert && (
        <div className="reseaux-overlay" onClick={() => setOuvert(false)}>
          <div
            className="reseaux-popup notifications-popup"
            style={{ paddingTop: "70px" }}
            role="dialog"
            aria-modal="true"
            aria-label={titre}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOuvert(false)}
              title="Retour"
              aria-label="Retour à la page"
              style={{
                position: "absolute",
                top: "15px",
                left: "15px",
                right: "auto",
                width: "42px",
                height: "42px",
                margin: 0,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#e9bd58",
                border: "0",
                borderRadius: "10px",
                color: "#111",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
            <p className="label">LA TRIBU DES OBUS</p>
            <h2 className="reseaux-title">{titre}</h2>
            <p className="reseaux-subtitle">Tes événements des 14 derniers jours</p>
            {erreur && <p role="alert" style={{ color: "#ff8888" }}>{erreur}</p>}
            {chargement && notifications.length === 0 ? (
              <p>Chargement des notifications...</p>
            ) : notifications.length === 0 ? (
              <p>Aucune notification récente.</p>
            ) : (
              <div
                className="notifications-liste"
                aria-label="Historique des notifications, défilement à la molette"
                style={{
                  maxHeight: "360px",
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  paddingRight: "6px",
                }}
              >
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={
                      notification.lu
                        ? "notifications-item"
                        : "notifications-item notifications-item-nonlue"
                    }
                  >
                    <strong className="notifications-type">
                      {notification.type_notification.replaceAll("_", " ")}
                    </strong>
                    <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {notification.message}
                    </p>
                    <span className="notifications-date">
                      {new Date(notification.created_at).toLocaleString("fr-FR", {
                        timeZone: "Europe/Paris",
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                    {!notification.lu && (
                      <button
                        type="button"
                        className="notifications-marquer-lue"
                        disabled={enCours === notification.id}
                        onClick={() => marquerLue(notification.id)}
                      >
                        {enCours === notification.id ? "Enregistrement..." : "Marquer comme lu"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
