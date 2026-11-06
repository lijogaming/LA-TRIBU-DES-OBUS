// Classification centralisée pour les trois enveloppes et l'historique admin.
// Les deux types financiers existants sont routés par destinataire.
export function rubriqueNotification(type) {
  const valeur = String(type || "").toLowerCase();

  if (valeur === "bilan_entreprise" || valeur.startsWith("patron_entreprise_")) {
    return "entreprises";
  }

  if (valeur === "salaire_entreprise" || valeur.startsWith("metier_entreprise_")) {
    return "metiers";
  }

  // Les notifications générales (profil, virements, etc.) restent sur l'accueil.
  return "profil";
}
