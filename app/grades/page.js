
"use client";

const grades = [
  {
    nom: "Civil",
    condition: "Grade de départ",
    deblocage: "Accès à son profil de membre.",
  },
  {
    nom: "Soldat",
    condition: "Abonne-toi à la chaîne + like le live en cours",
    deblocage:
      "Possibilité de gagner 100 Obus par live en envoyant un message dans le chat d'un des lives de Lijo. Accès aux virements d'Obus entre joueurs éligibles.",
  },
  {
    nom: "Adgent",
    condition: "3 lives depuis Soldat",
    deblocage:
      "Possibilité de devenir employé d'une entreprise.",
  },
  {
    nom: "Adgent Lijo",
    condition: "7 lives depuis Soldat",
    deblocage: "Récompenses à définir.",
  },
  {
    nom: "Colonel",
    condition: "10 lives depuis Soldat",
    deblocage:
      "Possibilité de créer une entreprise pour 1 000 Obus.",
  },
  {
    nom: "Colonel en Chef",
    condition: "15 lives depuis Soldat",
    deblocage: "Récompenses à définir.",
  },
  {
    nom: "Vice Amiral",
    condition: "20 lives depuis Soldat",
    deblocage: "Récompenses à définir.",
  },
  {
    nom: "Amiral",
    condition: "30 lives depuis Soldat",
    deblocage: "Récompenses à définir.",
  },
  {
    nom: "Général",
    condition: "40 lives depuis Soldat",
    deblocage: "Récompenses à définir.",
  },
  {
    nom: "Sergent",
    condition: "50 lives depuis Soldat",
    deblocage: "Récompenses à définir.",
  },
  {
    nom: "Sergent Chef",
    condition: "70 lives depuis Soldat",
    deblocage: "Grade maximum atteint.",
  },
  {
    nom: "Officier général",
    condition: "Attribution manuelle",
    deblocage:
      "Grade spécial attribué manuellement. Aucun avantage supplémentaire défini pour le moment.",
  },
];

export default function GradesPage() {
  return (
    <main className="container grades-page">
      <div className="logo">
        🎖️
      </div>

      <h1>GRADES</h1>

      <p className="subtitle">
        Voici les grades déblocables en venant mettre un message dans un des lives de Lijo.
      </p>
      <div
        className="card"
        style={{
          position: "relative",
          paddingTop: "70px",
          marginTop: "30px",
          marginBottom: "25px",
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
            right: "15px",
            width: "42px",
            height: "42px",
            padding: "0",
            fontSize: "28px",
            fontWeight: "900",
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
        <h2>
          Retour au profil
        </h2>

        <p>
          Revenir à l&apos;accueil de La Tribu des Obus.
        </p>
      </div>
      <div className="grades-liste">
        <div className="grades-entete">
          <strong>GRADES</strong>
          <strong>RÉCOMPENSES</strong>
        </div>

        {grades.map((grade) => (
          <div
            className="card grades-ligne"
            key={grade.nom}
          >
            <div className="grades-identite">
              <h2>{grade.nom}</h2>
              <span>{grade.condition}</span>
            </div>

            <p className="grades-deblocage">
              {grade.deblocage}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
