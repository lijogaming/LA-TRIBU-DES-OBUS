export default function MentionsLegalesPage() {
  return (
    <main className="container legal-page">
      <div className="logo">
        ⚖️
      </div>

      <h1>
        MENTIONS LÉGALES
      </h1>

      <p className="subtitle">
        Informations légales relatives au site La Tribu des Obus
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


        {/* ================================================= */}
        {/* ÉDITEUR */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            1. Éditeur du site
          </h2>

          <p>
            Le site <strong>La Tribu des Obus</strong> est édité par :
          </p>

          <p>
            <strong>LIONNET Jordan EI</strong>
            <br />
            Entreprise individuelle – micro-entreprise
          </p>

          <p>
            10 rue de Vézelois
            <br />
            90400 Meroux-Moval
            <br />
            France
          </p>

          <p>
            SIREN : <strong>101 917 003</strong>
            <br />
            SIRET : <strong>101 917 003 00010</strong>
            <br />
            Immatriculation : Registre national des entreprises (RNE)
          </p>

          <p>
            E-mail :{" "}
            <a href="mailto:latribudesobus@gmail.com">
              latribudesobus@gmail.com
            </a>
          </p>

          <p>
            Téléphone :{" "}
            <a href="tel:+33766947084">
              07 66 94 70 84
            </a>
          </p>
        </section>


        {/* ================================================= */}
        {/* DIRECTEUR DE PUBLICATION */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            2. Directeur de la publication
          </h2>

          <p>
            Le directeur de la publication est :
            <br />
            <strong>Jordan LIONNET</strong>
          </p>
        </section>


        {/* ================================================= */}
        {/* HÉBERGEMENT */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            3. Hébergement
          </h2>

          <p>
            Le site est hébergé par :
          </p>

          <p>
            <strong>Vercel Inc.</strong>
            <br />
            440 N Barranca Avenue #4133
            <br />
            Covina, CA 91723
            <br />
            États-Unis
          </p>
        </section>


        {/* ================================================= */}
        {/* PROPRIÉTÉ INTELLECTUELLE */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            4. Propriété intellectuelle
          </h2>

          <p>
            Les éléments originaux du site La Tribu des Obus,
            notamment son nom, ses textes, son organisation,
            ses règles de jeu et ses éléments graphiques
            originaux, sont protégés par la législation
            applicable.
          </p>

          <p>
            Toute reproduction, représentation ou utilisation
            non autorisée de ces éléments est interdite,
            sauf autorisation préalable de l’éditeur ou
            exception prévue par la loi.
          </p>

          <p>
            Les marques, logos, services et contenus appartenant
            à des tiers, notamment Google et YouTube, restent
            la propriété de leurs titulaires respectifs.
          </p>
        </section>


        {/* ================================================= */}
        {/* CONTACT */}
        {/* ================================================= */}

        <section className="legal-section">
          <h2>
            5. Contact
          </h2>

          <p>
            Pour toute question concernant le site :
          </p>

          <p>
            <a href="mailto:latribudesobus@gmail.com">
              latribudesobus@gmail.com
            </a>
          </p>
        </section>

      </div>
    </main>
  );
}
