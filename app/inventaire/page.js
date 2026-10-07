"use client";

export default function InventairePage() {
  return (
    <main className="container">
      <div className="logo">
        🎒
      </div>

      <h1>
        INVENTAIRE
      </h1>

      <p className="subtitle">
        Tes objets et récompenses
      </p>

      <div className="card">
        <p className="label">
          TON INVENTAIRE
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
            🎒
          </div>

          <h2>
            Inventaire vide
          </h2>

          <p>
            Tu ne possèdes encore
            aucun objet.
          </p>

          <p>
            Les futurs achats et
            récompenses apparaîtront
            ici.
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
