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
    <div
  className="card"
  style={{
    position: "relative",
    paddingTop: "70px",
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
      left: "15px",
      width: "42px",
      height: "42px",
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
