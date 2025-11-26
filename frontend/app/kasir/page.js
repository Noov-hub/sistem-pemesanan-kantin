"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { socket } from "@/lib/socket";

export default function KasirDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("new");
  const [username, setUsername] = useState("");
  
  // State untuk Mode Edit (Menyimpan ID pesanan yang sedang diedit)
  const [editingId, setEditingId] = useState(null); 
  const [tempStatus, setTempStatus] = useState(""); 

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
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // SOCKET.IO SETUP
  useEffect(() => {
    fetchOrders();
    socket.connect();

    const playSound = () => {
        const audio = new Audio('/notif.mp3');
        audio.play().catch(() => {});
    };

    socket.on("new_order", () => {
        playSound();
        if (activeTab === 'new' || activeTab === 'active') fetchOrders();
    });

    socket.on("status_updated", ({ status }) => {
        if (status === 'ready') playSound();
        fetchOrders();
    });

    socket.on("order_deleted", () => fetchOrders());

    return () => {
        socket.off("new_order");
        socket.off("status_updated");
        socket.off("order_deleted");
    };
  }, [fetchOrders, activeTab]);

  // Fungsi Update Status (Standard & Force Edit)
  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/orders/${id}`, { status: newStatus });
      setEditingId(null); // Tutup mode edit jika sukses
    } catch (error) {
      alert("Gagal update status");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // List Status untuk Dropdown
  const statusOptions = [
    { value: 'new', label: 'Baru (Belum Bayar)' },
    { value: 'confirmed', label: 'Confirmed (Antrian Dapur)' },
    { value: 'cooking', label: 'Cooking (Sedang Dimasak)' },
    { value: 'ready', label: 'Ready (Siap Diambil)' },
    { value: 'completed', label: 'Completed (Selesai)' },
    { value: 'cancelled', label: 'Cancelled (Batal)' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div>
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            Kasir Dashboard 👮‍♂️ 
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
                { id: "new", label: "🔔 Baru Masuk" },
                { id: "active", label: "📋 Semua Aktif" },
                { id: "kitchen", label: "👨‍🍳 Monitor Dapur" },
                { id: "history", label: "📜 Riwayat" }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                        activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-blue-300 scale-105"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {/* LIST PESANAN */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">Sinkronisasi data...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <p className="text-gray-400">Tidak ada pesanan.</p>
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
                {/* --- LOGIKA TAMPILAN: EDIT MODE vs NORMAL MODE --- */}
                {editingId === order.id ? (
                    // TAMPILAN EDIT (DROPDOWN)
                    <div className="animate-fade-in">
                        <h3 className="font-bold text-gray-800 mb-2">Ubah Status Manual:</h3>
                        <select 
                            className="w-full p-2 border rounded mb-3 text-black"
                            value={tempStatus}
                            onChange={(e) => setTempStatus(e.target.value)}
                        >
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setEditingId(null)}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded text-xs font-bold"
                            >
                                BATAL
                            </button>
                            <button 
                                onClick={() => updateStatus(order.id, tempStatus)}
                                className="flex-1 bg-blue-600 text-white py-2 rounded text-xs font-bold"
                            >
                                SIMPAN
                            </button>
                        </div>
                    </div>
                ) : (
                    // TAMPILAN NORMAL (KARTU BIASA)
                    <>
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{order.customer_name}</h3>
                            
                            {/* TOMBOL EDIT (PENSIL) */}
                            <button 
                                onClick={() => {
                                    setEditingId(order.id);
                                    setTempStatus(order.status);
                                }}
                                className="text-gray-400 hover:text-blue-600"
                                title="Edit Status Manual"
                            >
                                ✏️
                            </button>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-700 whitespace-pre-line min-h-[60px]">
                            {order.order_notes}
                        </div>

                        {/* STATUS LABEL */}
                        <div className="mb-4">
                             <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                                order.status === 'ready' ? 'bg-green-100 text-green-700' : 
                                order.status === 'new' ? 'bg-gray-100 text-gray-600' :
                                'bg-yellow-50 text-yellow-700'
                            }`}>
                                {order.status}
                            </span>
                        </div>

                        {/* TOMBOL AKSI CEPAT */}
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => { if(confirm("Hapus pesanan?")) updateStatus(order.id, 'cancelled'); }}
                                className="bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-100"
                            >
                                🗑️ BATAL
                            </button>

                            {/* Tombol Kanan Berubah Sesuai Status */}
                            {order.status === 'new' && (
                                <button onClick={() => updateStatus(order.id, 'confirmed')} className="bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md">
                                    💰 TERIMA
                                </button>
                            )}
                            {order.status === 'ready' && (
                                <button onClick={() => updateStatus(order.id, 'completed')} className="bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 shadow-md animate-bounce-slow">
                                    ✅ AMBIL
                                </button>
                            )}
                            {['confirmed', 'cooking'].includes(order.status) && (
                                <button disabled className="bg-gray-100 text-gray-400 py-2 rounded-lg text-xs font-bold cursor-not-allowed">
                                    ⏳ DAPUR
                                </button>
                            )}
                             {['completed', 'cancelled'].includes(order.status) && (
                                <button disabled className="bg-gray-100 text-gray-400 py-2 rounded-lg text-xs font-bold">
                                    ARSIP
                                </button>
                            )}
                        </div>
                    </>
                )}
                
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