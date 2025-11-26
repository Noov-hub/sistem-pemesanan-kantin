"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function KasirDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active"); // Default tab: "Aktif"
  const [username, setUsername] = useState("");

  // 1. Cek Login & Ambil Data User
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("username");

    if (!token || role !== "cashier") {
      alert("Akses Ditolak! Harap login sebagai Kasir.");
      router.push("/login");
    } else {
      setUsername(user);
      fetchOrders(); // Ambil data awal
    }
  }, [router]); // Jalan sekali saat halaman dimuat

  // 2. Fungsi Ambil Data (Sesuai Tab)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let endpoint = "/orders/active"; // Default

      // Mapping Tab ke Endpoint Backend
      if (activeTab === "new") endpoint = "/orders/new";
      else if (activeTab === "active") endpoint = "/orders/active";
      else if (activeTab === "kitchen") endpoint = "/orders/kitchen";
      else if (activeTab === "history") endpoint = "/orders/history";

      const res = await api.get(endpoint);
      setOrders(res.data.data);
    } catch (error) {
      console.error("Gagal ambil data:", error);
      if (error.response?.status === 401) router.push("/login"); // Token expired
    } finally {
      setLoading(false);
    }
  };

  // Panggil ulang data saat Tab berubah
  useEffect(() => {
    fetchOrders();
    // (Nanti: Pasang Socket.io disini untuk auto-update)
  }, [activeTab]);
  useEffect(() => {
    // Auto refresh sementara (sebelum Socket.io)
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);
  // 3. Fungsi Aksi Kasir (Proses / Selesai / Batal)
  const updateStatus = async (id, newStatus) => {
    if(!confirm(`Ubah status menjadi ${newStatus}?`)) return;

    try {
      await api.put(`/orders/${id}`, { status: newStatus });
      fetchOrders(); // Refresh data manual
    } catch (error) {
      alert("Gagal update status");
    }
  };

  // Fungsi Logout
  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* NAVBAR KASIR */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div>
          <h1 className="text-xl font-bold text-blue-600">Kasir Dashboard 👮‍♂️</h1>
          <p className="text-xs text-gray-400">Halo, {username}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium">
          Logout ➜
        </button>
      </nav>

      {/* KONTEN UTAMA */}
      <div className="max-w-5xl mx-auto p-6">
        
        {/* TABS MENU */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {[
                { id: "new", label: "Baru Masuk (New)", color: "bg-blue-100 text-blue-800" },
                { id: "active", label: "Semua Aktif", color: "bg-gray-200 text-gray-700" },
                { id: "kitchen", label: "Monitor Dapur", color: "bg-yellow-100 text-yellow-800" },
                { id: "history", label: "Riwayat", color: "bg-green-100 text-green-800" }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                        activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-lg scale-105"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {/* LIST PESANAN */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">Memuat data...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <p className="text-gray-400">Tidak ada pesanan di tab ini.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className={`bg-white p-5 rounded-xl shadow-sm border-l-4 relative ${
                    order.status === 'new' ? 'border-gray-400' :
                    order.status === 'confirmed' ? 'border-yellow-400' :
                    order.status === 'cooking' ? 'border-orange-500' :
                    order.status === 'ready' ? 'border-green-500' : 'border-black'
                }`}
              >
                {/* Header Kartu */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{order.customer_name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        order.status === 'ready' ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-gray-100 text-gray-500'
                    }`}>
                        {order.status}
                    </span>
                </div>
                
                {/* Isi Pesanan */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-700 whitespace-pre-line min-h-[80px]">
                    {order.order_notes}
                </div>

                {/* Tombol Aksi (Tergantung Status) */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Logika Tombol Kiri (Batal/Mundur) */}
                    <button 
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-100"
                    >
                        BATAL
                    </button>

                    {/* Logika Tombol Kanan (Maju) */}
                    {order.status === 'new' && (
                        <button 
                            onClick={() => updateStatus(order.id, 'confirmed')}
                            className="bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md"
                        >
                            TERIMA (BAYAR)
                        </button>
                    )}
                    {order.status === 'ready' && (
                        <button 
                            onClick={() => updateStatus(order.id, 'completed')}
                            className="bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 shadow-md animate-bounce-slow"
                        >
                            SELESAI
                        </button>
                    )}
                    {['confirmed', 'cooking'].includes(order.status) && (
                        <button disabled className="bg-gray-100 text-gray-400 py-2 rounded-lg text-xs font-bold cursor-not-allowed">
                            ...DAPUR...
                        </button>
                    )}
                </div>

                <div className="text-[10px] text-gray-300 mt-3 text-right">
                    #{order.id} • {new Date(order.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}