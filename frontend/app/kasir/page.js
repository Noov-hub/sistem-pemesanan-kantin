"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { socket } from "@/lib/socket"; // 1. Import Socket

export default function KasirDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("new"); // Default ke 'new' agar kasir fokus pesanan masuk
  const [username, setUsername] = useState("");

  // Cek Login
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "cashier") {
      router.push("/login");
    } else {
      setUsername(localStorage.getItem("username"));
    }
  }, [router]);

  // 2. Bungkus fetchOrders dengan useCallback
  // Agar fungsi ini stabil dan bisa dipanggil ulang oleh Socket
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = "/orders/active"; 

      if (activeTab === "new") endpoint = "/orders/new";
      else if (activeTab === "active") endpoint = "/orders/active";
      else if (activeTab === "kitchen") endpoint = "/orders/kitchen";
      else if (activeTab === "history") endpoint = "/orders/history";

      const res = await api.get(endpoint);
      setOrders(res.data.data);
    } catch (error) {
      console.error("Gagal ambil data:", error);
      if (error.response?.status === 401) router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [activeTab, router]); // Dependency: Akan berubah jika Tab berubah

  // 3. SOCKET.IO SETUP (Logic Real-time)
  useEffect(() => {
    // Panggil data pertama kali
    fetchOrders();

    // Connect Socket
    socket.connect();

    // Fungsi putar suara
    const playSound = () => {
        const audio = new Audio('/notif.mp3'); // Pastikan file ada di folder public
        audio.play().catch(e => console.log("Audio play failed (perlu interaksi user)"));
    };

    // A. Saat ada PESANAN BARU
    socket.on("new_order", () => {
        playSound(); // Bunyikan notifikasi!
        
        // Refresh data HANYA jika kasir sedang di tab "Baru" atau "Aktif"
        if (activeTab === 'new' || activeTab === 'active') {
            fetchOrders();
        }
    });

    // B. Saat STATUS BERUBAH (Misal: Dapur selesai masak)
    socket.on("status_updated", ({ status }) => {
        // Jika status jadi 'ready', bunyikan suara beda (opsional) atau sama
        if (status === 'ready') playSound();

        // Refresh data (karena item mungkin harus pindah/hilang dari tab ini)
        fetchOrders();
    });

    // C. Saat DIHAPUS
    socket.on("order_deleted", () => {
        fetchOrders();
    });

    // Cleanup saat pindah halaman/ganti tab
    return () => {
        socket.off("new_order");
        socket.off("status_updated");
        socket.off("order_deleted");
        // socket.disconnect(); // Jangan disconnect agar halaman lain tetap jalan
    };
  }, [fetchOrders, activeTab]); // Dijalankan ulang saat fetchOrders/activeTab berubah

  // Fungsi Update Status (Manual Kasir)
  const updateStatus = async (id, newStatus) => {
    // Optimistic UI Update (Opsional: Ubah tampilan dulu sebelum server jawab agar terasa cepat)
    // Tapi karena kita pakai socket refresh, biarkan loading standar saja agar aman.
    try {
      await api.put(`/orders/${id}`, { status: newStatus });
      // Tidak perlu fetchOrders manual disini, karena Backend akan emit 'status_updated'
      // dan Socket di atas akan menangkapnya lalu auto-refresh. Magic! ✨
    } catch (error) {
      alert("Gagal update status");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      
      {/* NAVBAR */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div>
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            Kasir Dashboard 👮‍♂️ 
            {/* Indikator Live */}
            <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </h1>
          <p className="text-xs text-gray-400">Halo, {username}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-500 font-bold border border-red-200 px-3 py-1 rounded hover:bg-red-50">
          Logout
        </button>
      </nav>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        
        {/* TABS */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {[
                { id: "new", label: "🔔 Baru Masuk", color: "bg-blue-100 text-blue-800" },
                { id: "active", label: "📋 Semua Aktif", color: "bg-gray-200 text-gray-700" },
                { id: "kitchen", label: "👨‍🍳 Monitor Dapur", color: "bg-yellow-100 text-yellow-800" },
                { id: "history", label: "📜 Riwayat", color: "bg-green-100 text-green-800" }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                        activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-blue-300 scale-105 ring-2 ring-blue-300 ring-offset-2"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {/* LIST PESANAN */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">Sedang sinkronisasi data...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <p className="text-gray-400 text-lg">Tidak ada pesanan di tab ini.</p>
            {activeTab === 'new' && <p className="text-sm text-gray-300">Menunggu pesanan mahasiswa...</p>}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className={`bg-white p-5 rounded-xl shadow-sm border-l-4 relative transition-all hover:shadow-md ${
                    order.status === 'new' ? 'border-gray-400' :
                    order.status === 'confirmed' ? 'border-yellow-400' :
                    order.status === 'cooking' ? 'border-orange-500' :
                    order.status === 'ready' ? 'border-green-500' : 'border-black'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{order.customer_name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        order.status === 'ready' ? 'bg-green-100 text-green-700 animate-pulse' : 
                        order.status === 'new' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-50 text-yellow-700'
                    }`}>
                        {order.status}
                    </span>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-700 whitespace-pre-line min-h-[60px]">
                    {order.order_notes}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {/* TOMBOL KIRI (BATAL/HAPUS) */}
                    <button 
                        onClick={() => {
                            if(confirm("Hapus pesanan ini?")) updateStatus(order.id, 'cancelled');
                        }}
                        className="bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-100"
                    >
                        BATAL
                    </button>

                    {/* TOMBOL KANAN (AKSI UTAMA) */}
                    {order.status === 'new' && (
                        <button 
                            onClick={() => updateStatus(order.id, 'confirmed')}
                            className="bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md flex items-center justify-center gap-1"
                        >
                            💰 TERIMA
                        </button>
                    )}
                    {order.status === 'ready' && (
                        <button 
                            onClick={() => updateStatus(order.id, 'completed')}
                            className="bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 shadow-md animate-bounce-slow"
                        >
                            ✅ AMBIL
                        </button>
                    )}
                    {['confirmed', 'cooking'].includes(order.status) && (
                        <button disabled className="bg-gray-100 text-gray-400 py-2 rounded-lg text-xs font-bold cursor-not-allowed">
                            ⏳ DAPUR
                        </button>
                    )}
                </div>

                <div className="text-[10px] text-gray-300 mt-3 text-right">
                    #{order.id} • {new Date(order.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}