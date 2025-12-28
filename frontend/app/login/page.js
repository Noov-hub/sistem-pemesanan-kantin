"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Kirim data ke Backend
      const res = await api.post("/users/login", form);
      const { token, role, username } = res.data;

      // 2. Simpan "Kunci" (Token) di LocalStorage Browser
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("username", username);

      // 3. Redirect sesuai Role (Jabatan)
      if (role === "cashier") {
        router.push("/kasir");
      } else if (role === "kitchen") {
        router.push("/dapur");
      } else if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login Gagal. Cek username/password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Login Staff</h1>
          <p className="text-sm text-gray-500">Masuk untuk mengelola pesanan</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-100 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
            <input
              type="text"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition text-black"
              placeholder="Contoh: kasir"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition text-black"
              placeholder="••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all ${
              loading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            }`}
          >
            {loading ? "Memproses..." : "MASUK"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-blue-600 transition">
            ← Kembali ke Monitor
          </Link>
        </div>
      </div>
    </div>
  );
}