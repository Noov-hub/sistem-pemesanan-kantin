"use client";

import { useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OrderPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !notes) return alert("Mohon isi Nama dan Pesanan!");

    setLoading(true);
    try {
      const res = await api.post("/orders", { customer_name: name, order_notes: notes });
      localStorage.setItem("current_order", JSON.stringify(res.data.data)); // Pastikan backend return data order lengkap
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("Gagal mengirim pesanan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Header Back */}
      <div className="p-4 border-b">
        <Link href="/" className="text-blue-600 font-medium flex items-center gap-1">
          ← Kembali ke Monitor
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mau pesan apa?</h1>
        <p className="text-gray-500 mb-8">Isi pesananmu di bawah ini.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nama Pemesan</label>
            <input
              type="text"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-lg text-black"
              placeholder="Contoh: Ibnu"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Catatan Pesanan</label>
            <textarea
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none h-40 text-lg text-black"
              placeholder="Contoh:&#10;1x Nasi Goreng (Pedas)&#10;1x Es Teh"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl text-white font-bold text-xl shadow-lg transition-transform ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            }`}
          >
            {loading ? "Mengirim..." : "KIRIM PESANAN ➤"}
          </button>
        </form>
      </div>
    </div>
  );
}