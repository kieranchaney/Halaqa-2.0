import "./globals.css";

export const metadata = {
  title: "Halaqa",
  description: "Weekly halaqa lessons, reflection, group discussion, and private local journaling."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
