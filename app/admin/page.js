"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const grades = [
  "Civil",
  "Soldat",
  "Adgent",
  "Adgent Lijo",
  "Colonel",
  "Colonel en Chef",
  "Vice Amiral",
  "Amiral",
  "Général",
  "Sergent",
  "Sergent Chef",
  "Officier général",
  "Engueulé",
  "Prisonnier",
  "Esclave",
  "Exécuté",
];

export default function AdminPage() {
  const [chargement, setChargement] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [joueurs, setJoueurs] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [message, setMessage] = useState("");
  const [montants, setMontants] = useState({});
  const [nombresLives, setNombresLives] = useState({});

  useEffect(() => {
    verifierAdmin();
  }, []);

  async function verifierAdmin() {
    setChargement(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAdmin(false);
      setChargement(false);
      return;
    }

    const { data, error } = await supabase.rpc("est_admin");

    if (error || !data) {
      setAdmin(false);
      setChargement(false);
      return;
    }

    setAdmin(true);
    await chargerJoueurs();
    setChargement(false);
  }

  async function chargerJoueurs() {
    const { data, error } = await supabase
      .from("joueurs")
      .select(
        "id,pseudo,grade,lives_depuis_soldat,obus,punition,officier_general"
      )
      .order("pseudo");

    if (error) {
      setMessage("Erreur : " + error.message);
      return;
    }

    setJoueurs(data || []);
  }

  async function changerGrade(joueurId, nouveauGrade) {
    setMessage("Modification du grade...");

    const { error } = await supabase.rpc("admin_definir_grade", {
      p_joueur_id: joueurId,
      p_grade: nouveauGrade,
    });

    if (error) {
      setMessage("Erreur : " + error.message);
      return;
    }

    setMessage(`Grade modifié : ${nouveauGrade}`);
    await chargerJoueurs();
  }

  async function modifierObus(joueurId, montant) {
    const valeur = Number(montant);

    if (!Number.isInteger(valeur) || valeur === 0) {
      setMessage("Entre un montant d'Obus valide.");
      return;
    }

    setMessage("Modification des Obus...");

    const { error } = await supabase.rpc("admin_modifier_obus", {
      p_joueur_id: joueurId,
      p_montant: valeur,
      p_description: "Modification depuis le panneau admin",
    });

    if (error) {
      setMessage("Erreur : " + error.message);
      return;
    }

    setMontants((ancien) => ({
      ...ancien,
      [joueurId]: "",
    }));

    setMessage(
      valeur > 0
        ? `+${valeur} Obus ajoutés.`
        : `${Math.abs(valeur)} Obus retirés.`
    );

    await chargerJoueurs();
  }

  async function modifierLives(joueurId, nombre) {
    const valeur = Number(nombre);

    if (!Number.isInteger(valeur) || valeur < 0) {
      setMessage("Entre un nombre de lives valide.");
      return;
    }

    setMessage("Modification du nombre de lives...");

    const { error } = await supabase.rpc("admin_definir_lives", {
      p_joueur_id: joueurId,
      p_nombre_lives: valeur,
    });

    if (error) {
      setMessage("Erreur : " + error.message);
      return;
    }

    setNombresLives((ancien) => ({
      ...ancien,
      [joueurId]: "",
    }));

    setMessage(`Nombre de lives défini à ${valeur}.`);
    await chargerJoueurs();
  }

  async function deconnexion() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const joueursFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    if (!terme) return joueurs;

    return joueurs.filter((joueur) =>
      joueur.pseudo.toLowerCase().includes(terme)
    );
  }, [joueurs, recherche]);

  function gradeAffiche(joueur) {
    if (joueur.punition) return joueur.punition;
    if (joueur.officier_general) return "Officier général";
    return joueur.grade;
  }

  if (chargement) {
    return (
      <main className="container">
        <div className="logo">🛡️</div>

        <h1>ADMINISTRATION</h1>

        <div className="card">
          <p>Chargement...</p>
        </div>
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="container">
        <div className="logo">⛔</div>

        <h1>ACCÈS REFUSÉ</h1>

        <div className="card">
          <p>
            Ce compte n&apos;est pas autorisé à accéder à
            l&apos;administration.
          </p>

          <button onClick={() => (window.location.href = "/")}>
            Retour au site
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="logo">🛡️</div>

      <h1>ADMINISTRATION</h1>

      <p className="subtitle">
        Gestion de La Tribu des Obus
      </p>

      <div className="card">
        <p className="label">RECHERCHER UN JOUEUR</p>

        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Pseudo du joueur..."
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #444",
            background: "#111",
            color: "white",
            marginTop: "12px",
          }}
        />

        {message && (
          <p style={{ marginTop: "16px" }}>
            {message}
          </p>
        )}
      </div>

      <div style={{ marginTop: "30px" }}>
        {joueursFiltres.length === 0 && (
          <div className="card">
            <p>Aucun joueur trouvé.</p>
          </div>
        )}

        {joueursFiltres.map((joueur) => (
          <div
            className="card"
            key={joueur.id}
            style={{ marginBottom: "20px" }}
          >
            <p className="label">JOUEUR</p>

            <h2>{joueur.pseudo}</h2>

            <p>
              🎖️ Grade affiché :{" "}
              <strong>{gradeAffiche(joueur)}</strong>
            </p>

            {joueur.punition && (
              <p>
                ⚠️ Grade réel :{" "}
                <strong>
                  {joueur.officier_general
                    ? "Officier général"
                    : joueur.grade}
                </strong>
              </p>
            )}

            <p>
              📺 Lives depuis Soldat :{" "}
              <strong>{joueur.lives_depuis_soldat}</strong>
            </p>

            <p>
              💰 Sac : <strong>{joueur.obus} Obus</strong>
            </p>

            <hr />

            <p className="label">CHANGER LE GRADE</p>

            <select
              defaultValue=""
              onChange={(e) => {
                const nouveauGrade = e.target.value;

                if (nouveauGrade) {
                  changerGrade(joueur.id, nouveauGrade);
                  e.target.value = "";
                }
              }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                background: "#111",
                color: "white",
                border: "1px solid #444",
              }}
            >
              <option value="" disabled>
                Choisir un grade...
              </option>

              {grades.map((grade) => (
                <option value={grade} key={grade}>
                  {grade}
                </option>
              ))}
            </select>

            <hr />

            <p className="label">MODIFIER LES OBUS</p>

            <input
              type="number"
              value={montants[joueur.id] || ""}
              onChange={(e) =>
                setMontants((ancien) => ({
                  ...ancien,
                  [joueur.id]: e.target.value,
                }))
              }
              placeholder="+500 ou -200"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid #444",
                background: "#111",
                color: "white",
                marginBottom: "10px",
              }}
            />

            <button
              onClick={() =>
                modifierObus(
                  joueur.id,
                  montants[joueur.id]
                )
              }
            >
              Valider les Obus
            </button>

            <hr />

            <p className="label">
              MODIFIER LE NOMBRE DE LIVES
            </p>

            <input
              type="number"
              min="0"
              value={nombresLives[joueur.id] || ""}
              onChange={(e) =>
                setNombresLives((ancien) => ({
                  ...ancien,
                  [joueur.id]: e.target.value,
                }))
              }
              placeholder={`Actuellement : ${joueur.lives_depuis_soldat}`}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid #444",
                background: "#111",
                color: "white",
                marginBottom: "10px",
              }}
            />

            <button
              onClick={() =>
                modifierLives(
                  joueur.id,
                  nombresLives[joueur.id]
                )
              }
            >
              Modifier les lives
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => (window.location.href = "/")}
        style={{ marginBottom: "12px" }}
      >
        Retour au site
      </button>

      <button onClick={deconnexion}>
        Se déconnecter
      </button>
    </main>
  );
}
