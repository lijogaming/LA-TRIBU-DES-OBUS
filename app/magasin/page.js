"use client";

export default function MagasinPage() {
  return (
    <main className="container">
    <button
  onClick={() => {
    window.location.href = "/";
  }}
  title="Retour"
  style={{
    width: "45px",
    height: "45px",
    padding: "0",
    fontSize: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "15px",
  }}
>
  ←
</button>
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
    </main>
  );
}
