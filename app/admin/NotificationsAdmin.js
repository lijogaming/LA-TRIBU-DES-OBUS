"use client";

import { useEffect, useState } from "react";
import { rubriqueNotification } from "../notifications/categories";

const TAILLE_PAGE = 20;
const TAILLE_LOT = 50;
const MAX_LOTS = 80;

const styleChamp = {
  width: "100%",
  minWidth: 0,
  padding: "13px",
  border: "1px solid #444",
  borderRadius: "10px",
  background: "#111",
  color: "white",
  boxSizing: "border-box",
};

export default function NotificationsAdmin({ supabase, joueurs = [] }) {
  const [ouvert, setOuvert] = useState(false);
  const [joueurId, setJoueurId] = useState("");
  const [categorie, setCategorie] = useState("toutes");
  const [recherche, setRecherche] = useState("");
  const [rechercheActive, setRechercheActive] = useState("");
  const [page, setPage] = useState(0);
  const [actualisation, setActualisation] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [encoreDisponible, setEncoreDisponible] = useState(false);
  const [limiteAtteinte, setLimiteAtteinte] = useState(false);

  useEffect(() => {
    if (!ouvert) return;

    let actif = true;
    const selection = joueurs.find((joueur) => joueur.id === joueurId);
    // La RPC existante sait chercher par pseudo OU par texte.
    // Le filtrage exact du pseudo et de la catégorie se fait ensuite.
    const rechercheServeur = selection
      ? selection.pseudo
      : rechercheActive;

    async function charger() {
      setChargement(true);
      setErreur("");
      setNotifications([]);

      let decalage = 0;
      let encoreSurServeur = true;
      let nombreLots = 0;
      const correspondances = [];
      const besoin = (page + 1) * TAILLE_PAGE + 1;

      while (
        actif &&
        encoreSurServeur &&
        correspondances.length < besoin &&
        nombreLots < MAX_LOTS
      ) {
        const { data, error } = await supabase.rpc("admin_lister_notifications", {
          p_limite: TAILLE_LOT + 1,
          p_decalage: decalage,
          p_recherche: rechercheServeur,
        });

        if (!actif) return;
        if (error) {
          setErreur("Impossible de charger l'historique : " + error.message);
          setChargement(false);
          return;
        }

        const resultat = data || [];
        const lot = resultat.slice(0, TAILLE_LOT);
        encoreSurServeur = resultat.length > TAILLE_LOT;
        decalage += lot.length;
        nombreLots += 1;

        for (const notification of lot) {
          if (
            selection &&
            String(notification.pseudo_joueur || "").toLocaleLowerCase("fr") !==
              String(selection.pseudo || "").toLocaleLowerCase("fr")
          ) {
            continue;
          }

          if (
            categorie !== "toutes" &&
            rubriqueNotification(notification.type_notification) !== categorie
          ) {
            continue;
          }

          if (selection && rechercheActive) {
            const texte = [
              notification.message,
              notification.type_notification,
              notification.pseudo_joueur,
            ].join(" ").toLocaleLowerCase("fr");

            if (!texte.includes(rechercheActive.toLocaleLowerCase("fr"))) {
              continue;
            }
          }

          correspondances.push(notification);
        }

        if (!lot.length) encoreSurServeur = false;
      }

      if (!actif) return;

      setNotifications(
        correspondances.slice(page * TAILLE_PAGE, (page + 1) * TAILLE_PAGE)
      );
      setEncoreDisponible(
        correspondances.length > (page + 1) * TAILLE_PAGE || encoreSurServeur
      );
      setLimiteAtteinte(nombreLots >= MAX_LOTS && encoreSurServeur);
      setChargement(false);
    }

    charger();
    return () => {
      actif = false;
    };
  }, [supabase, ouvert, joueurId, categorie, page, rechercheActive, actualisation, joueurs]);

  function rechercher(e) {
    e.preventDefault();
    setPage(0);
    setRechercheActive(recherche.trim());
    setActualisation((valeur) => valeur + 1);
  }

  function formaterDate(date) {
    return new Date(date).toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  return (
    <div className="card" style={{ marginTop: "20px", marginBottom: "20px" }}>
      <p className="label">HISTORIQUE DES NOTIFICATIONS</p>

      <button
        type="button"
        onClick={() => setOuvert((valeur) => !valeur)}
        aria-expanded={ouvert}
        style={{
          width: "100%",
          background: "#222",
          border: "1px solid #e5bd68",
          borderRadius: "12px",
          color: "#e5bd68",
          padding: "15px",
        }}
      >
        {ouvert ? "− Masquer l'historique des notifications" : "+ Consulter l'historique des notifications"}
      </button>

      {ouvert && (
        <div style={{ marginTop: "20px" }}>
          <p style={{ color: "#aaa", fontSize: "13px" }}>
            Historique administrateur des 30 derniers jours. Choisis un joueur
            et une rubrique pour consulter uniquement les notifications correspondantes.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            <label style={{ textAlign: "left", color: "#e5bd68", fontSize: "13px" }}>
              JOUEUR
              <select
                aria-label="Filtrer par joueur"
                value={joueurId}
                onChange={(e) => {
                  setJoueurId(e.target.value);
                  setPage(0);
                }}
                style={{ ...styleChamp, marginTop: "8px" }}
              >
                <option value="">Tous les joueurs</option>
                {joueurs.map((joueur) => (
                  <option key={joueur.id} value={joueur.id}>
                    {joueur.pseudo}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ textAlign: "left", color: "#e5bd68", fontSize: "13px" }}>
              RUBRIQUE
              <select
                aria-label="Filtrer par rubrique"
                value={categorie}
                onChange={(e) => {
                  setCategorie(e.target.value);
                  setPage(0);
                }}
                style={{ ...styleChamp, marginTop: "8px" }}
              >
                <option value="toutes">Toutes les notifications</option>
                <option value="profil">👤 Profil</option>
                <option value="entreprises">🏢 Entreprises</option>
                <option value="metiers">💼 Métiers</option>
              </select>
            </label>
          </div>

          <form
            onSubmit={rechercher}
            style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px" }}
          >
            <input
              type="search"
              aria-label="Rechercher dans les notifications"
              placeholder="Rechercher un événement ou un message..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              style={{ ...styleChamp, flex: "1 1 220px", width: "auto" }}
            />
            <button type="submit" disabled={chargement}>Rechercher</button>
          </form>

          {erreur && <p role="alert" style={{ color: "#ff8888" }}>❌ {erreur}</p>}

          <div
            aria-label="Résultats de l'historique des notifications"
            style={{
              marginTop: "16px",
              maxHeight: "440px",
              overflowY: "auto",
              overscrollBehavior: "contain",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              paddingRight: "5px",
            }}
          >
            {chargement ? (
              <p>Recherche des notifications...</p>
            ) : !erreur && notifications.length === 0 ? (
              <p>Aucune notification trouvée pour ces filtres.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  style={{
                    border: "1px solid #444",
                    background: "#151515",
                    borderRadius: "10px",
                    padding: "14px",
                    textAlign: "left",
                  }}
                >
                  <strong style={{ color: "#e5bd68" }}>
                    👤 {notification.pseudo_joueur}
                  </strong>
                  <p className="label" style={{ margin: "9px 0" }}>
                    {String(notification.type_notification || "").replaceAll("_", " ")}
                  </p>
                  <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {notification.message}
                  </p>
                  <p style={{ color: "#999", fontSize: "12px", marginBottom: 0 }}>
                    {formaterDate(notification.created_at)}
                    {" — "}
                    {notification.lu ? "Lu" : "Non lu"}
                  </p>
                </div>
              ))
            )}
          </div>

          {!erreur && !chargement && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginTop: "15px" }}>
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((valeur) => Math.max(0, valeur - 1))}
                style={{ background: "#333", color: "white" }}
              >
                Précédent
              </button>
              <span style={{ color: "#e5bd68" }}>Page {page + 1}</span>
              <button
                type="button"
                disabled={!encoreDisponible}
                onClick={() => setPage((valeur) => valeur + 1)}
                style={{ background: "#333", color: "white" }}
              >
                Suivant
              </button>
            </div>
          )}

          {limiteAtteinte && !chargement && (
            <p style={{ color: "#e5bd68", fontSize: "12px" }}>
              Historique très volumineux : affine la recherche pour consulter les résultats plus anciens.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
