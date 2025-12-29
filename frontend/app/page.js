"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { socket } from "@/lib/socket";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function MonitorPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myOrders, setMyOrders] = useState([]); // List ID pesanan user
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isMyOrderOpen, setIsMyOrderOpen] = useState(false); // Toggle visibility

  // 1. Cek LocalStorage Initial
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("my_orders") || "[]");
    setMyOrders(stored);

    // Timer Ticker
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Hitung sisa waktu
  const getTimeLeft = (createdAt) => {
    const createdTime = new Date(createdAt).getTime();
    const deadline = createdTime + (10 * 60 * 1000); // 10 menit
    const distance = deadline - currentTime;

    if (distance < 0) return "EXPIRED";
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Filter My Orders based on Queue
  // Hanya tampilkan jika ada di queue (artinya status masih active) DAN statusnya 'new'
  const activeMyOrders = myOrders.filter(localOrder => {
      const matchInQueue = queue.find(q => q.id === localOrder.id);
      return matchInQueue && (matchInQueue.status === 'new' || matchInQueue.status === 'confirmed' || matchInQueue.status === 'cooking' || matchInQueue.status === 'ready' || matchInQueue.status === 'completed');
  }).map(localOrder => {
      // Map ke data terbaru dari queue (untuk timer created_at yg akurat dari server)
      return queue.find(q => q.id === localOrder.id);
  });

  // Update local storage jika ada perubahan (opsional, tapi bagus buat sync)
  // Tapi requirement bilang: "jika sudah confirmed atau cancelled maka akan hilang dari card"
  // Jadi logic filter di atas sudah cukup untuk display.


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
    const playSound = () => {
        const audio = new Audio('/notif.mp3');
        audio.play().catch(() => {});
    };
    // 3. Pasang "Telinga" (Listener)
    // Saat ada pesanan baru masuk...
    socket.on("new_order", (newOrder) => {
        // Tambahkan ke antrian (Logic optimis)
        setQueue((prev) => [...prev, newOrder]);
    });

    // Saat ada status berubah (misal: new -> confirmed, atau cooking -> ready)
    socket.on("status_updated", ({ id, status }) => {
        // Cek apakah pesanan ini milik user (ada di localStorage)
        const myOrdersLocal = JSON.parse(localStorage.getItem("my_orders") || "[]");
        const isMyOrder = myOrdersLocal.some(order => order.id === id);

        if (status === 'ready' && isMyOrder) playSound();
        
        setQueue((prev) => 
            prev.map((item) => item.id === id ? { ...item, status } : item)
        );
    });
    // Saat ada status karena clean-up
    socket.on("status_updated_cleanup", ({ id, status }) => {
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
                        <div className="flex justify-between items-center">
                          <div className="text-2xl font-black text-gray-800">{item.customer_name}</div>
                          <span className="text-sm font mono text-gray-500">#{item.id}</span>
                        </div>
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
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-lg text-gray-700">{item.customer_name}</div>
                    <span className="text-sm font-mono text-gray-500">#{item.id}</span>
                  </div>
                  <div className="text-xs text-gray-400">Mohon menunggu sebentar...</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. BELUM DIBAYAR (ABU) */}
          {/* <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-600 mb-4 flex items-center gap-2">
              NEW ORDER
            </h2>
            <div className="space-y-2">
              {newOrders.map((item) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                  <div className="font-medium text-gray-600 flex gap-2 items-center">
                    <span>{item.customer_name}</span>
                    <span className="text-xs text-gray-400 font-mono">#{item.id}</span>
                  </div>
                    <div className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">Bayar</div>
                </div>
              ))}
            </div>
          </div> */}

        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-sm px-4 flex flex-col gap-4">
        
        {/* LIST PESANAN SAYA (Toggle) */}
        {isMyOrderOpen && activeMyOrders.length > 0 && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-slide-up mx-auto w-full mb-2">
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Pesanan Saya ({activeMyOrders.length})</h3>
                    <button onClick={() => setIsMyOrderOpen(false)} className="text-white opacity-80 hover:opacity-100">▼</button>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                    {activeMyOrders.map(order => {
                        const timeLeft = getTimeLeft(order.created_at);
                        const isExpired = timeLeft === "EXPIRED";
                        
                        return (
                            <div key={order.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 relative">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-gray-800">{order.customer_name}</div>
                                        <div className="text-xs text-gray-500 font-mono">#{order.id}</div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${isExpired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                        {isExpired ? "BATAL" : timeLeft}
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-600 border-t border-gray-200 pt-1">
                                    {order.order_notes}
                                </div>
                                {isExpired && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center text-red-600 font-black rotate-12">EXPIRED</div>}
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {/* BUTTON GROUP */}
        <div className="flex flex-col gap-2">
            {activeMyOrders.length > 0 && (
                <button 
                    onClick={() => setIsMyOrderOpen(!isMyOrderOpen)}
                    className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl shadow-lg border border-blue-100 flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                >
                    <span>🛍️</span>
                    <span>{isMyOrderOpen ? "Tutup Pesanan Saya" : `Lihat Pesanan Saya (${activeMyOrders.length})`}</span>
                </button>
            )}

            <Link href="/pesan" className="w-full">
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 rounded-xl shadow-2xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ring-4 ring-white">
                    <span className="text-xl">📝</span>
                    <span>BUAT PESANAN BARU</span>
                </button>
            </Link>
        </div>
      </div>

    </div>
  );
}