
import Link from "next/link";

const grades = [
  {
    nom: "Civil",
    condition: "Grade de départ",
    deblocage: "Accès à son profil de membre.",
  },
  {
    nom: "Soldat",
    condition: "Abonne toi à la chaîne + like le live en cours",
    deblocage:
      "Possibilité de gagner 100 Obus par live en participant au chat. Accès aux virements d'Obus entre joueurs éligibles.",
  },
  {
    nom: "Adgent",
    condition: "3 lives depuis Soldat",
    deblocage:
      "Possibilité de devenir employé d'une entreprise (fonctionnalité à venir).",
  },
  {
    nom: "Adgent Lijo",
    condition: "7 lives depuis Soldat",
    deblocage: "Déblocage supplémentaire à définir.",
  },
  {
    nom: "Colonel",
    condition: "10 lives depuis Soldat",
    deblocage:
      "Possibilité de créer une entreprise pour 1 000 Obus (fonctionnalité à venir).",
  },
  {
    nom: "Colonel en Chef",
    condition: "15 lives depuis Soldat",
    deblocage: "Déblocage supplémentaire à définir.",
  },
  {
    nom: "Vice Amiral",
    condition: "20 lives depuis Soldat",
    deblocage: "Déblocage supplémentaire à définir.",
  },
  {
    nom: "Amiral",
    condition: "30 lives depuis Soldat",
    deblocage: "Déblocage supplémentaire à définir.",
  },
  {
    nom: "Général",
    condition: "40 lives depuis Soldat",
    deblocage: "Déblocage supplémentaire à définir.",
  },
  {
    nom: "Sergent",
    condition: "50 lives depuis Soldat",
    deblocage: "Déblocage supplémentaire à définir.",
  },
  {
    nom: "Sergent Chef",
    condition: "70 lives depuis Soldat",
    deblocage: "Grade automatique maximum atteint.",
  },
  {
    nom: "Officier général",
    condition: "Attribution spéciale",
    deblocage:
      "Grade spécial attribué manuellement. Aucun avantage supplémentaire défini pour le moment.",
  },
];

export default function GradesPage() {
  return (
    <main className="container grades-page">
      <Link href="/" className="grades-retour">
        ← Retour au profil
      </Link>

      <div className="logo">
        🎖️
      </div>

      <h1>GRADES</h1>

      <p className="subtitle">
        Découvre les grades de La Tribu des Obus
        et les avantages débloqués à chaque étape.
      </p>

      <div className="grades-liste">
        <div className="grades-entete">
          <strong>GRADE</strong>
          <strong>DÉBLOCAGES</strong>
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
