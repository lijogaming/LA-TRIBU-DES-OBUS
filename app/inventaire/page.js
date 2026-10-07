"use client";

export default function InventairePage() {
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
    </main>
  );
}
