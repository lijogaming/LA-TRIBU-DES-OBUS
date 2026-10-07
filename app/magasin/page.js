"use client";

export default function MagasinPage() {
  return (
    <main className="container">
      <div className="logo">
        🛒
      </div>

      <h1>
        MAGASIN
      </h1>

      <p className="subtitle">
        Dépense tes Obus
      </p>

      <div className="card">
        <p className="label">
          BOUTIQUE DE LA TRIBU
        </p>

        <div
          style={{
            textAlign:
              "center",
            padding:
              "30px 10px",
          }}
        >
          <div
            style={{
              fontSize:
                "60px",
            }}
          >
            🛒
          </div>

          <h2>
            Magasin bientôt disponible
          </h2>

          <p>
            Aucun article n&apos;est
            encore disponible.
          </p>

          <p>
            Garde précieusement tes
            Obus pour les futurs
            objets et récompenses.
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          window.location.href =
            "/";
        }}
        style={{
          marginTop:
            "20px",
        }}
      >
        ← Retour au profil
      </button>
    </main>
  );
}
