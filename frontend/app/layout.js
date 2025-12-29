import { Inter } from "next/font/google";
import "./globals.css";

// Setup Font Global
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "JICA Cafeteria System",
  description: "Sistem Pemesanan Kantin Real-time",
};

export default function RootLayout({ children }) {
  return (
    // Set lang="id" untuk aksesibilitas screen reader Indonesia
    <html lang="id">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {/* Disini kita tidak menaruh Navbar secara global 
          karena halaman Login dan Monitor antrian punya layout beda.
          Navbar akan dipanggil per-halaman atau via template.
        */}
        {children}
      </body>
    </html>
  );
}