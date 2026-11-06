"use client";

import { useEffect, useState } from "react";

const styleChamp = {
  width: "100%",
  minWidth: 0,
  padding: "13px",
  border: "1px solid #444",
  borderRadius: "10px",
  background: "#111",
  color: "white",
  boxSizing: "border-box",
  font: "inherit",
};

export default function EntreprisesAdmin({ supabase }) {
  const [ouvert, setOuvert] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [entreprises, setEntreprises] = useState([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [recherche, setRecherche] = useState("");
  const [nom, setNom] = useState("");
  const [salaires, setSalaires] = useState({});
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const entreprise = entreprises.find((e) => e.id === entrepriseId) || null;
  const termeRecherche = recherche.trim().toLocaleLowerCase("fr");
  const entreprisesFiltrees = entreprises.filter((e) =>
    !termeRecherche ||
    String(e.nom || "").toLocaleLowerCase("fr").includes(termeRecherche) ||
    String(e.patron_pseudo || "").toLocaleLowerCase("fr").includes(termeRecherche)
  );
  const boutonStyle = { width: "100%", marginTop: "12px", padding: "13px" };
  const rougeStyle = { ...boutonStyle, background: "#9d2929", color: "white" };

  useEffect(() => {
    if (ouvert) chargerEntreprises();
  }, [ouvert]);

  async function chargerEntreprises() {
    setChargement(true);
    try {
      const { data, error } = await supabase.rpc("admin_lister_entreprises");
      if (error) throw error;
      const liste = Array.isArray(data) ? data : [];
      setEntreprises(liste);
      setEntrepriseId((ancien) =>
        liste.some((e) => e.id === ancien) ? ancien : ""
      );
    } catch (e) {
      setErreur(true);
      setMessage("Impossible de charger les entreprises : " + e.message);
    } finally {
      setChargement(false);
    }
  }

  function selectionnerEntreprise(id) {
    const selection = entreprises.find((e) => e.id === id);
    setEntrepriseId(id);
    setNom(selection?.nom || "");
    setSalaires(Object.fromEntries(
      (selection?.employes || []).map((emp) => [emp.employe_id, String(emp.salaire)])
    ));
    setConfirmation(null);
    setMessage("");
  }

  function demanderRenommage() {
    if (!entreprise || enCours) return;
    const valeur = nom.trim();
    if (Array.from(valeur).length < 3 || Array.from(valeur).length > 30) {
      setErreur(true);
      setMessage("Le nom doit contenir entre 3 et 30 caractères.");
      return;
    }
    if (valeur === entreprise.nom) {
      setErreur(true);
      setMessage("Le nom est déjà identique.");
      return;
    }
    setMessage("");
    setConfirmation({
      titre: "CONFIRMER LE RENOMMAGE",
      description: "Renommer « " + entreprise.nom + " » en « " + valeur + " » ?",
      rpc: "admin_modifier_entreprise",
      parametres: { p_entreprise_id: entreprise.id, p_action: "renommer", p_nom: valeur },
      succes: "Entreprise renommée.",
    });
  }

  function demanderSalaire(emp) {
    if (!entreprise || enCours) return;
    const salaire = Number(salaires[emp.employe_id]);
    if (!Number.isInteger(salaire) || salaire < 100 || salaire > 500) {
      setErreur(true);
      setMessage("Le salaire doit être compris entre 100 et 500 Obus.");
      return;
    }
    if (salaire === emp.salaire) {
      setErreur(true);
      setMessage("Ce salaire est déjà celui de l'employé.");
      return;
    }
    setMessage("");
    setConfirmation({
      titre: "CONFIRMER LE NOUVEAU SALAIRE",
      description: "Modifier le salaire de " + emp.pseudo + " chez « " +
        entreprise.nom + " » de " + emp.salaire + " à " + salaire + " Obus par live ?",
      rpc: "admin_modifier_entreprise",
      parametres: {
        p_entreprise_id: entreprise.id, p_action: "salaire",
        p_employe_id: emp.employe_id, p_salaire: salaire,
      },
      succes: "Salaire modifié pour les prochains bilans de live.",
    });
  }

  function demanderLicenciement(emp) {
    if (!entreprise || enCours) return;
    setMessage("");
    setConfirmation({
      titre: "CONFIRMER LE LICENCIEMENT",
      description: "Virer " + emp.pseudo + " de « " + entreprise.nom +
        " » ? Son contrat prendra fin et il sera averti.",
      rpc: "admin_modifier_entreprise",
      parametres: {
        p_entreprise_id: entreprise.id, p_action: "licencier",
        p_employe_id: emp.employe_id,
      },
      succes: "Employé viré de l'entreprise.",
    });
  }

  function demanderSuppression() {
    if (!entreprise || enCours) return;
    setMessage("");
    setConfirmation({
      titre: "SUPPRIMER DÉFINITIVEMENT L'ENTREPRISE",
      description: "Attention : supprimer « " + entreprise.nom +
        " » virera automatiquement tous ses employés. Les 1 000 Obus dépensés " +
        "pour sa création ne seront pas remboursés. Les anciens contrats, " +
        "candidatures et paiements seront conservés dans l'archive interne. " +
        "Le patron pourra ensuite racheter une entreprise avec une nouvelle rentabilité.",
      rpc: "supprimer_entreprise",
      parametres: { p_entreprise_id: entreprise.id },
      succes: "Entreprise supprimée. Ses employés ont été virés.",
      suppression: true,
    });
  }

  async function confirmerAction() {
    if (!confirmation || enCours) return;
    const action = confirmation;
    setConfirmation(null);
    setEnCours(true);
    setErreur(false);
    setMessage("");

    try {
      const { error } = await supabase.rpc(action.rpc, action.parametres);
      if (error) throw error;

      if (action.suppression) {
        setEntrepriseId("");
        setNom("");
        setSalaires({});
      } else if (action.parametres.p_action === "renommer") {
        setNom(action.parametres.p_nom);
      } else if (action.parametres.p_action === "salaire") {
        setSalaires((ancien) => ({
          ...ancien,
          [action.parametres.p_employe_id]: String(action.parametres.p_salaire),
        }));
      }

      await chargerEntreprises();
      setErreur(false);
      setMessage("✅ " + action.succes);
    } catch (e) {
      setErreur(true);
      setMessage("❌ " + e.message);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: "20px", marginBottom: "20px" }}>
      <p className="label">GESTION DES ENTREPRISES</p>
      <button
        type="button"
        aria-expanded={ouvert}
        onClick={() => setOuvert((ancien) => !ancien)}
        style={{
          width: "100%", background: "#222", border: "1px solid #e5bd68",
          borderRadius: "12px", color: "#e5bd68", padding: "15px",
        }}
      >
        {ouvert ? "− Masquer la gestion des entreprises" : "+ Gérer les entreprises"}
      </button>

      {ouvert && (
        <div style={{ marginTop: "20px" }}>
          <label style={{ display: "block", textAlign: "left" }}>
            <span className="label">RECHERCHER UNE ENTREPRISE</span>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom de l'entreprise ou pseudo du patron..."
              disabled={enCours || chargement}
              style={{ ...styleChamp, marginTop: "12px", padding: "14px" }}
            />
          </label>

          <div
            aria-label="Liste des entreprises, défilement à la molette"
            style={{
              marginTop: "20px", maxHeight: "242px",
              overflowY: "auto", overscrollBehavior: "contain", paddingRight: "6px",
            }}
          >
            {!chargement && entreprisesFiltrees.length === 0 && (
              <p>{entreprises.length === 0 ? "Aucune entreprise." : "Aucune entreprise trouvée."}</p>
            )}
            {entreprisesFiltrees.map((e) => (
              <button
                key={e.id}
                type="button"
                disabled={enCours || chargement}
                aria-label={"Gérer l'entreprise " + e.nom}
                onClick={() => selectionnerEntreprise(e.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: "10px", width: "100%", margin: "0 0 10px", padding: "16px 18px",
                  border: entrepriseId === e.id ? "2px solid #e5bd68" : "1px solid #444",
                  borderRadius: "11px", background: "#191919", color: "#e5bd68",
                  textAlign: "left", fontSize: "18px", cursor: "pointer",
                }}
              >
                <span style={{ overflowWrap: "anywhere" }}>
                  <strong>{e.nom}</strong>
                  <span style={{ display: "block", color: "#aaa", fontSize: "13px" }}>
                    {e.patron_pseudo}
                  </span>
                </span>
                <span aria-hidden="true" style={{ fontSize: "23px" }}>›</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={chargerEntreprises}
            disabled={enCours || chargement}
            style={{ marginTop: "12px" }}
          >
            {chargement ? "Actualisation..." : "Actualiser la liste"}
          </button>

          {message && (
            <p role="status" style={{
              marginTop: "14px", overflowWrap: "anywhere",
              color: erreur ? "#ff9999" : "#b8e9b8",
            }}>
              {message}
            </p>
          )}

          {entreprise && (
            <div style={{ marginTop: "22px", textAlign: "left" }}>
              <h2 style={{ overflowWrap: "anywhere" }}>🏢 {entreprise.nom}</h2>
              <p><strong>Patron :</strong> {entreprise.patron_pseudo}</p>
              <p><strong>Catégorie :</strong> {entreprise.categorie}</p>
              <p><strong>Rentabilité de base :</strong> +{entreprise.bonus_base_live} Obus / live</p>

              <hr style={{ border: 0, borderTop: "1px solid #444", margin: "24px 0" }} />

              <h3>✏️ CHANGER LE NOM</h3>
              <label style={{ display: "block" }}>
                <span className="label">NOUVEAU NOM</span>
                <input
                  type="text"
                  minLength={3}
                  maxLength={30}
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  disabled={enCours}
                  style={{ ...styleChamp, marginTop: "8px" }}
                />
              </label>
              <button type="button" onClick={demanderRenommage} disabled={enCours}
                style={boutonStyle}>
                ENREGISTRER LE NOUVEAU NOM
              </button>

              <hr style={{ border: 0, borderTop: "1px solid #444", margin: "24px 0" }} />

              <h3>👥 EMPLOYÉS ACTIFS ({entreprise.employes.length})</h3>
              {entreprise.employes.length === 0 ? (
                <p>Aucun employé actuellement.</p>
              ) : (
                entreprise.employes.map((emp) => (
                  <div key={emp.id} style={{
                    padding: "16px", marginTop: "12px", background: "#111",
                    border: "1px solid #444", borderRadius: "12px",
                  }}>
                    <h4 style={{ marginTop: 0, overflowWrap: "anywhere" }}>{emp.pseudo}</h4>
                    <label style={{ display: "block" }}>
                      <span className="label">SALAIRE EN OBUS / LIVE</span>
                      <input
                        type="number" min="100" max="500" step="1"
                        value={salaires[emp.employe_id] ?? String(emp.salaire)}
                        onChange={(e) => setSalaires((ancien) => ({
                          ...ancien, [emp.employe_id]: e.target.value,
                        }))}
                        disabled={enCours}
                        style={{ ...styleChamp, marginTop: "8px" }}
                      />
                    </label>
                    <button type="button" onClick={() => demanderSalaire(emp)}
                      disabled={enCours} style={boutonStyle}>
                      MODIFIER LE SALAIRE
                    </button>
                    <button type="button" onClick={() => demanderLicenciement(emp)}
                      disabled={enCours} style={rougeStyle}>
                      VIRER CET EMPLOYÉ
                    </button>
                  </div>
                ))
              )}

              <hr style={{ border: 0, borderTop: "1px solid #444", margin: "24px 0" }} />

              <button type="button" onClick={demanderSuppression}
                disabled={enCours} style={rougeStyle}>
                🗑️ SUPPRIMER L'ENTREPRISE
              </button>
            </div>
          )}
        </div>
      )}

      {confirmation && (
        <div role="presentation" style={{
          position: "fixed", inset: 0, zIndex: 100000,
          display: "flex", justifyContent: "center", alignItems: "center",
          padding: "16px", background: "rgba(0,0,0,0.86)",
        }}>
          <div role="dialog" aria-modal="true" aria-label={confirmation.titre}
            style={{
              width: "100%", maxWidth: "480px", maxHeight: "90dvh",
              overflowY: "auto", boxSizing: "border-box", padding: "24px",
              background: "#171717", borderRadius: "18px",
              border: confirmation.suppression ? "3px solid #b91c1c" : "3px solid #e5bd68",
            }}>
            <h2 style={{ overflowWrap: "anywhere" }}>
              {confirmation.suppression ? "⚠️ " : "💣 "}{confirmation.titre}
            </h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.65, overflowWrap: "anywhere" }}>
              {confirmation.description}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button type="button" onClick={() => setConfirmation(null)}
                disabled={enCours} style={{ background: "#333", color: "white" }}>
                ANNULER
              </button>
              <button type="button" onClick={confirmerAction} disabled={enCours}
                style={{
                  background: confirmation.suppression ? "#b91c1c" : "#e5bd68",
                  color: confirmation.suppression ? "white" : "#111",
                }}>
                {confirmation.suppression ? "SUPPRIMER" : "CONFIRMER"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
