import "./globals.css";

export const metadata = {
  title: "La Tribu des Obus",
  description: "Grades, Obus, entreprises et villes de la Tribu des Obus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
