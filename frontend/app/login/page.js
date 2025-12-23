"use client";

// --- IMPORTS ---
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios"; // Menggunakan konfigurasi Axios yang sudah ada
import Link from "next/link";

export default function LoginPage() {
  // --- STATE & HOOKS ---
  const router = useRouter();
  
  // State untuk menyimpan data inputan user (Username & Password)
  const [form, setForm] = useState({ username: "", password: "" });
  
  // State untuk menangani Error dan Loading (agar tombol tidak bisa diklik 2x)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- FUNGSI LOGIN (LOGIKA UTAMA) ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Mencegah reload halaman saat form disubmit
    setError("");       // Reset pesan error lama
    setLoading(true);   // Aktifkan status loading

    try {

      // 1. Kirim data (username & password) ke Backend
      const res = await api.post("/users/login", form);
      const { token, role, username } = res.data;

      // 2. Simpan "Kunci" (Token) di LocalStorage Browser agar sesi tersimpan
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("username", username);

      // 3. Redirect (Pindah Halaman) sesuai Role (Jabatan)
      if (role === "cashier") {
        router.push("/kasir");
      } else if (role === "kitchen") {
        router.push("/dapur");
      } else if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/"); // Default ke halaman monitor jika role tidak dikenal
      }
      // ============================================================

    } catch (err) {
      console.error(err);
      // Tampilkan pesan error dari backend atau pesan default
      setError(err.response?.data?.message || "Login Gagal. Cek username/password.");
    } finally {
      // Matikan status loading, baik sukses maupun gagal
      setLoading(false);
    }
  };

  // --- TAMPILAN (UI DARI FIGMA) ---
return (
  // Wrapper utama: bikin halaman full layar & center konten
  <main className="w-full h-full flex items-center justify-center px-4 text-white">

    {/* Container utama card login */}
    <div className="w-full max-w-[520px] text-center">

      {/* ================= LOGO & TITLE ================= */}
      <div className="mb-10">
        {/* Nama brand atas */}
        <h1 className="tracking-[0.45em] font-bold text-[26px]">
          J I C A
        </h1>

        {/* Subtitle brand */}
        <h2 className="tracking-[0.35em] font-bold text-[22px] mt-2">
          C A F E T E R I A
        </h2>

        {/* Garis pemisah bawah logo */}
        <div className="h-[4px] bg-white mt-3" />
      </div>

      {/* ================= JUDUL FORM ================= */}
      <h3 className="text-5xl font-bold mb-4">
        Login Staff
      </h3>

      {/* Deskripsi kecil */}
      <p className="text-gray-300 mb-8">
        Masuk untuk mengelola pesanan
      </p>

      {/* ================= ERROR MESSAGE ================= */}
      {/* Muncul hanya kalau error tidak kosong */}
      {error && (
        <p className="bg-red-500/70 py-2 rounded mb-4">
          {error}
        </p>
      )}

      {/* ================= FORM LOGIN ================= */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Input Username */}
        <input
          type="text"
          placeholder="Username"
          className="rounded-md px-4 py-3 text-black"
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
        />

        {/* Input Password */}
        <input
          type="password"
          placeholder="Password"
          className="rounded-md px-4 py-3 text-black"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        {/* Tombol Submit */}
        <button
          disabled={loading} // Disable kalau sedang request login
          className="bg-[#8F6633] py-4 rounded-xl text-2xl font-bold hover:bg-[#7a552b]"
        >
          {/* Teks berubah saat loading */}
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      {/* ================= LINK KEMBALI ================= */}
      <Link
        href="/"
        className="block mt-6 text-gray-300 hover:text-white"
      >
        ← Kembali ke monitor
      </Link>

    </div>
  </main>
);
}