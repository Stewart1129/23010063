import "./styles.css";

export const metadata = {
  title: "Dairy Flat Air",
  description: "Online booking system for Dairy Flat Air"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
