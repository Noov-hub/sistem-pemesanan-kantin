"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function DapurDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  // 1. Cek Login (Proteksi)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    // Hanya boleh masuk jika role = kitchen
    if (!token || role !== "kitchen") {
      alert("Area Terbatas! Khusus Staff Dapur.");
      router.push("/login");
    } else {
      setUsername(localStorage.getItem("username"));
      fetchKitchenOrders();
    }
  }, [router]);

  // 2. Ambil Data (Polling tiap 5 detik)
  const fetchKitchenOrders = async () => {
    try {
      // Endpoint khusus dapur (hanya confirmed & cooking)
      const res = await api.get("/orders/kitchen");
      setOrders(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Gagal ambil data dapur:", error);
    }
  };

  useEffect(() => {
    // Auto refresh sementara (sebelum Socket.io)
    const interval = setInterval(fetchKitchenOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // 3. Aksi Koki
  const handleAction = async (id, currentStatus) => {
    let newStatus = "";
    
    // Logika Tombol
    if (currentStatus === "confirmed") {
        newStatus = "cooking"; // Masuk -> Masak
    } else if (currentStatus === "cooking") {
        newStatus = "ready";   // Masak -> Selesai
    }

    try {
      setLoading(true); // UI Feedback
      await api.put(`/orders/${id}`, { status: newStatus });
      await fetchKitchenOrders(); // Refresh data langsung
    } catch (error) {
      alert("Gagal update status");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Logout
  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // Filter Data untuk Tampilan 2 Kolom
  const queueList = orders.filter(o => o.status === 'confirmed');
  const cookingList = orders.filter(o => o.status === 'cooking');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      
      {/* NAVBAR DAPUR */}
      <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center shadow-lg border-b border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-yellow-500 tracking-wider">👨‍🍳 DAPUR MONITOR</h1>
          <p className="text-xs text-gray-400">Koki: {username}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold text-sm transition">
          KELUAR
        </button>
      </nav>

      {/* KONTEN UTAMA (2 KOLOM) */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-80px)]">
        
        {/* KOLOM KIRI: ANTRIAN MASUK (Kuning) */}
        <div className="bg-gray-800 rounded-2xl p-4 border-2 border-yellow-600 flex flex-col">
          <h2 className="text-xl font-bold text-yellow-400 mb-4 flex justify-between items-center">
            🔔 ANTRIAN BARU 
            <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm">{queueList.length}</span>
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {queueList.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-600 italic">Belum ada pesanan masuk</div>
            ) : (
                queueList.map((order) => (
                <div key={order.id} className="bg-white text-black p-5 rounded-xl shadow-lg border-l-8 border-yellow-500">
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-black">{order.customer_name}</h3>
                        <span className="text-xs font-mono text-gray-500">#{order.id}</span>
                    </div>
                    <p className="text-lg font-medium mt-2 whitespace-pre-line border-t border-gray-200 pt-2 my-3">
                        {order.order_notes}
                    </p>
                    <button 
                        onClick={() => handleAction(order.id, 'confirmed')}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black py-4 rounded-lg text-xl shadow-md transition-transform active:scale-95"
                    >
                        🔥 MULAI MASAK
                    </button>
                </div>
                ))
            )}
          </div>
        </div>

        {/* KOLOM KANAN: SEDANG DIMASAK (Hijau/Biru) */}
        <div className="bg-gray-800 rounded-2xl p-4 border-2 border-blue-500 flex flex-col">
          <h2 className="text-xl font-bold text-blue-400 mb-4 flex justify-between items-center">
            🍳 SEDANG DIMASAK
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">{cookingList.length}</span>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {cookingList.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-600 italic">Tidak ada yang dimasak</div>
            ) : (
                cookingList.map((order) => (
                <div key={order.id} className="bg-gray-700 text-white p-5 rounded-xl shadow-lg border-l-8 border-blue-500">
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-bold">{order.customer_name}</h3>
                        <div className="text-xs bg-blue-900 px-2 py-1 rounded text-blue-200">COOKING</div>
                    </div>
                    <p className="text-lg font-medium mt-2 whitespace-pre-line border-t border-gray-600 pt-2 my-3 text-gray-200">
                        {order.order_notes}
                    </p>
                    <button 
                        onClick={() => handleAction(order.id, 'cooking')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-lg text-xl shadow-md transition-transform active:scale-95"
                    >
                        ✅ SELESAI SAJI
                    </button>
                </div>
                ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}