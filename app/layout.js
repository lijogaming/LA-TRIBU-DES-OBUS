import "./globals.css";

export const metadata = {
  title: "La Tribu des Obus",
  description:
    "Grades, Obus et communauté de La Tribu des Obus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>

        {/* ================================================= */}
        {/* CONTENU DU SITE */}
        {/* ================================================= */}

        {children}


        {/* ================================================= */}
        {/* PIED DE PAGE LÉGAL */}
        {/* ================================================= */}

        <footer className="site-footer">

          <p>
            © 2026 La Tribu des Obus
          </p>

          <div className="site-footer-links">

            <a href="/mentions-legales">
              Mentions légales
            </a>

            <span>
              ·
            </span>

            <a href="/confidentialite">
              Confidentialité
            </a>

            <span>
              ·
            </span>

            <a href="/cgu">
              CGU
            </a>

          </div>

        </footer>

      </body>
    </html>
  );
}
