export default function ConfidentialitePage() {
  return (
    <main className="container legal-page">
      <div className="logo">
        🔐
      </div>

      <h1>
        CONFIDENTIALITÉ
      </h1>

      <p className="subtitle">
        Politique de confidentialité de La Tribu des Obus
      </p>

      <div className="card legal-card">

        {/* ================================================= */}
        {/* RETOUR */}
        {/* ================================================= */}

        <a
          href="/"
          className="legal-back"
        >
          ← Retour
        </a>

        <p className="legal-update">
          Dernière mise à jour : octobre 2026
        </p>


        {/* ================================================= */}
        {/* RESPONSABLE */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            1. Responsable du traitement
          </h2>

          <p>
            Le responsable du traitement des données du site
            La Tribu des Obus est :
          </p>

          <p>
            <strong>LIONNET Jordan EI</strong>
            <br />
            10 rue de Vézelois
            <br />
            90400 Meroux-Moval
            <br />
            France
          </p>

          <p>
            E-mail :{" "}
            <a href="mailto:latribudesobus@gmail.com">
              latribudesobus@gmail.com
            </a>
          </p>
        </section>


        {/* ================================================= */}
        {/* DONNÉES */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            2. Données traitées
          </h2>

          <p>
            Dans le cadre du fonctionnement de La Tribu des Obus,
            le site peut traiter notamment :
          </p>

          <ul>
            <li>
              les informations nécessaires à l’authentification ;
            </li>

            <li>
              l’identifiant associé au compte utilisateur ;
            </li>

            <li>
              le pseudo du joueur ;
            </li>

            <li>
              l’identifiant de chaîne YouTube ;
            </li>

            <li>
              le grade du joueur ;
            </li>

            <li>
              le nombre de lives comptabilisés ;
            </li>

            <li>
              le nombre d’Obus ;
            </li>

            <li>
              les présences enregistrées lors des lives ;
            </li>

            <li>
              les transactions d’Obus ;
            </li>

            <li>
              les éventuelles sanctions liées au jeu ;
            </li>

            <li>
              les informations techniques strictement nécessaires
              au fonctionnement et à la sécurité du service.
            </li>
          </ul>
        </section>


        {/* ================================================= */}
        {/* FINALITÉS */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            3. Pourquoi ces données sont utilisées
          </h2>

          <p>
            Les données sont notamment utilisées pour permettre
            la connexion au site, associer un utilisateur à son
            profil, gérer les grades, les Obus, les présences,
            les classements et les fonctionnalités du jeu.
          </p>

          <p>
            Elles peuvent également être utilisées pour vérifier
            certaines conditions liées aux lives YouTube, assurer
            la sécurité du service, prévenir les abus et permettre
            l’administration et la modération du jeu.
          </p>
        </section>


        {/* ================================================= */}
        {/* YOUTUBE API */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            4. YouTube API Services
          </h2>

          <p>
            La Tribu des Obus utilise les services API de YouTube
            pour certaines fonctionnalités liées aux chaînes,
            aux abonnements, aux lives et aux interactions
            nécessaires au fonctionnement du jeu.
          </p>

          <p>
            Lors de la connexion, le site peut demander une
            autorisation d’accès en lecture aux informations
            YouTube nécessaires à ces fonctionnalités.
          </p>

          <p>
            L’utilisation des fonctionnalités YouTube est également
            soumise aux{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noreferrer"
            >
              Conditions d’utilisation de YouTube
            </a>.
          </p>

          <p>
            Google dispose également de sa propre{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
            >
              Politique de confidentialité
            </a>.
          </p>
        </section>


        {/* ================================================= */}
        {/* PRESTATAIRES */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            5. Prestataires techniques
          </h2>

          <p>
            Le fonctionnement du service repose notamment sur :
          </p>

          <ul>
            <li>
              Supabase pour l’authentification et la base de données ;
            </li>

            <li>
              Vercel pour l’hébergement du site ;
            </li>

            <li>
              Google pour l’authentification ;
            </li>

            <li>
              YouTube pour les fonctionnalités utilisant
              YouTube API Services.
            </li>
          </ul>

          <p>
            Certains prestataires peuvent traiter des données
            en dehors de l’Espace économique européen selon
            leurs propres mécanismes juridiques applicables.
          </p>
        </section>


        {/* ================================================= */}
        {/* CONSERVATION */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            6. Conservation
          </h2>

          <p>
            Les données liées au profil sont conservées pendant
            la durée nécessaire au fonctionnement du compte et
            de La Tribu des Obus.
          </p>

          <p>
            Lorsqu’elles ne sont plus nécessaires, elles peuvent
            être supprimées ou anonymisées, sous réserve des
            obligations légales ou de sécurité applicables.
          </p>
        </section>


        {/* ================================================= */}
        {/* DROITS */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            7. Vos droits
          </h2>

          <p>
            Conformément à la réglementation applicable, vous pouvez
            notamment demander l’accès à vos données, leur
            rectification, leur effacement, leur limitation ou
            exercer votre droit d’opposition lorsque celui-ci
            est applicable.
          </p>

          <p>
            Pour exercer vos droits :
          </p>

          <p>
            <a href="mailto:latribudesobus@gmail.com">
              latribudesobus@gmail.com
            </a>
          </p>

          <p>
            Vous pouvez également introduire une réclamation
            auprès de la CNIL.
          </p>
        </section>


        {/* ================================================= */}
        {/* RÉVOCATION GOOGLE */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            8. Retirer l’accès Google / YouTube
          </h2>

          <p>
            L’utilisateur peut retirer à tout moment l’autorisation
            accordée à La Tribu des Obus depuis les paramètres
            des connexions tierces de son compte Google.
          </p>

          <p>
            <a
              href="https://myaccount.google.com/connections"
              target="_blank"
              rel="noreferrer"
            >
              Gérer les connexions de mon compte Google
            </a>
          </p>

          <p>
            Le retrait de cette autorisation peut empêcher
            certaines fonctionnalités du site de fonctionner.
          </p>
        </section>


        {/* ================================================= */}
        {/* STOCKAGE TECHNIQUE */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            9. Cookies et stockage technique
          </h2>

          <p>
            Le site peut utiliser des mécanismes de stockage
            nécessaires à l’authentification, à la sécurité
            et au fonctionnement du service.
          </p>

          <p>
            Si des traceurs publicitaires ou des outils nécessitant
            un consentement sont ajoutés ultérieurement, cette
            politique sera mise à jour et un mécanisme de
            consentement sera ajouté lorsque cela est nécessaire.
          </p>
        </section>


        {/* ================================================= */}
        {/* MODIFICATIONS */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            10. Modification de cette politique
          </h2>

          <p>
            Cette politique peut être modifiée afin de tenir compte
            de l’évolution du site, du jeu, des services utilisés
            ou de la réglementation applicable.
          </p>
        </section>

      </div>
    </main>
  );
}
