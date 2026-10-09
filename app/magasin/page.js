"use client";

export default function MagasinPage() {

  return (

    <main className="container">


      {/* ================================================= */}
      {/* TITRE */}
      {/* ================================================= */}

      <div className="logo">
        🛒
      </div>

      <h1>
        MAGASIN
      </h1>

      <p className="subtitle">
        Choisis ton magasin
      </p>


      {/* ================================================= */}
      {/* RETOUR */}
      {/* ================================================= */}

      <div
        className="card"
        style={{
          position: "relative",
          paddingTop: "70px",
        }}
      >

        <button
          onClick={() => {
            window.location.href =
              "/";
          }}
          title="Retour"
          style={{
            position: "absolute",
            top: "15px",
            left: "15px",
            width: "42px",
            height: "42px",
            margin: "0",
            padding: "0",
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


        <p className="label">
          BOUTIQUES DE LA TRIBU
        </p>

        <h2>
          Choisis une boutique
        </h2>

        <p>
          Chaque magasin possède ses propres objets.
        </p>

      </div>


      {/* ================================================= */}
      {/* LISTE DES MAGASINS */}
      {/* 3 CASES PAR LIGNE */}
      {/* ================================================= */}

      <div className="magasins-grid">


        {/* ================================================= */}
        {/* ARMURERIE */}
        {/* ================================================= */}

        <button
          type="button"
          className="magasin-card"
          onClick={() => {
            window.location.href =
              "/magasin/armurerie";
          }}
        >

          <div className="magasin-card-icon">
            💥
          </div>

          <h2>
            Armurerie
          </h2>

          <p>
            Armes et objets offensifs
          </p>

        </button>


        {/* ================================================= */}
        {/* FUTUR MAGASIN */}
        {/* ================================================= */}

        <button
          type="button"
          className="magasin-card magasin-card-ferme"
          disabled
        >

          <div className="magasin-card-icon">
            🔒
          </div>

          <h2>
            Prochainement
          </h2>

          <p>
            Futur magasin
          </p>

        </button>


        {/* ================================================= */}
        {/* FUTUR MAGASIN */}
        {/* ================================================= */}

        <button
          type="button"
          className="magasin-card magasin-card-ferme"
          disabled
        >

          <div className="magasin-card-icon">
            🔒
          </div>

          <h2>
            Prochainement
          </h2>

          <p>
            Futur magasin
          </p>

        </button>

      </div>

    </main>
  );
}
