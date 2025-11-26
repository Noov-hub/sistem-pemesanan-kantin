"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios"; // Pastikan axios.js Anda sudah benar
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { socket } from "@/lib/socket";

export default function MonitorPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fungsi ambil data antrian publik
  const fetchQueue = async () => {
    try {
      const res = await api.get("/orders/queue");
      setQueue(res.data.data);
    } catch (error) {
      console.error("Gagal ambil antrian", error);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    // 1. Ambil data awal saat halaman dibuka
    fetchQueue();

    // 2. Nyalakan Socket.io
    socket.connect();

    // 3. Pasang "Telinga" (Listener)
    // Saat ada pesanan baru masuk...
    socket.on("new_order", (newOrder) => {
        // Tambahkan ke antrian (Logic optimis)
        setQueue((prev) => [...prev, newOrder]);
    });

    // Saat ada status berubah (misal: new -> confirmed, atau cooking -> ready)
    socket.on("status_updated", ({ id, status }) => {
        setQueue((prev) => 
            prev.map((item) => item.id === id ? { ...item, status } : item)
        );
    });

    // Saat pesanan dihapus/selesai (completed)
    // (Opsional: Jika completed dianggap hilang dari monitor)
    socket.on("order_deleted", ({ id }) => {
        setQueue((prev) => prev.filter((item) => item.id !== id));
    });

    // 4. Bersihkan saat pindah halaman (Cleanup)
    return () => {
        socket.off("new_order");
        socket.off("status_updated");
        socket.off("order_deleted");
        socket.disconnect();
    };
  }, []);
  // Filter Data
  const newOrders = queue.filter((q) => q.status === "new");
  const cookingOrders = queue.filter((q) => ["confirmed", "cooking"].includes(q.status));
  const readyOrders = queue.filter((q) => q.status === "ready");

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Navbar />

      <div className="pt-24 px-4 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Status Pesanan</h1>
          <p className="text-gray-500 mt-2">Pantau status makananmu secara real-time</p>
        </div>

        {/* Grid 3 Kolom */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. SIAP DIAMBIL (HIJAU) */}
          <div className="bg-green-50 rounded-2xl p-5 shadow-sm border border-green-100">
            <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                SIAP DIAMBIL
            </h2>
            {readyOrders.length === 0 ? (
               <p className="text-green-800/40 italic text-sm text-center py-4">Kosong</p>
            ) : (
                <div className="space-y-3">
                {readyOrders.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow border-l-8 border-green-500 animate-bounce-slow">
                        <div className="text-2xl font-black text-gray-800">{item.customer_name}</div>
                        <div className="text-xs text-green-600 font-bold uppercase mt-1 tracking-wider">Silakan ke Kasir</div>
                    </div>
                ))}
                </div>
            )}
          </div>

          {/* 2. SEDANG DIMASAK (KUNING) */}
          <div className="bg-yellow-50 rounded-2xl p-5 shadow-sm border border-yellow-100">
            <h2 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
              SEDANG DIMASAK
            </h2>
            <div className="space-y-2">
              {cookingOrders.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-400">
                  <div className="font-bold text-lg text-gray-700">{item.customer_name}</div>
                  <div className="text-xs text-gray-400">Mohon menunggu sebentar...</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. BELUM DIBAYAR (ABU) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-600 mb-4 flex items-center gap-2">
              NEW ORDER
            </h2>
            <div className="space-y-2">
              {newOrders.map((item) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                  <div className="font-medium text-gray-600">{item.customer_name}</div>
                  <div className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">Bayar</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Tombol Melayang (FAB) */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-xs px-4">
        <Link href="/pesan">
            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 rounded-full shadow-2xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ring-4 ring-white">
                <span className="text-xl">📝</span>
                <span>BUAT PESANAN BARU</span>
            </button>
        </Link>
      </div>

    </div>
  );
}