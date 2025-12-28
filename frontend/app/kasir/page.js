"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { socket } from "@/lib/socket";
import Link from "next/link";
export default function KasirDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("new");
  const [username, setUsername] = useState("");
  
  // State untuk Mode Edit (Menyimpan ID pesanan yang sedang diedit)
  const [editingId, setEditingId] = useState(null); 
  const [tempStatus, setTempStatus] = useState(""); 
  const [tempName, setTempName] = useState("");   // State Nama Sementara
  const [tempNotes, setTempNotes] = useState(""); // State Catatan Sementara

  const [searchQuery, setSearchQuery] = useState(""); // State Pencarian

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

    // --- EVENT KHUSUS DARI CRON JOB ---
    socket.on("refresh_kasir", () => {
        console.log("♻️ Auto-cancel triggered refresh");
        fetchOrders();
    });
    
    return () => {
        socket.off("new_order");
        socket.off("status_updated");
        socket.off("order_deleted");
        socket.off("refresh_kasir");
    };
  }, [fetchOrders, activeTab]);

  // Fungsi KHUSUS Konfirmasi (Menembak Endpoint Confirm)
  const confirmOrder = async (id) => {
    try {
      // Menembak endpoint khusus agar confirmed_at terisi di DB
      await api.put(`/orders/${id}/confirm`); 
      setEditingId(null);
      // fetchOrders tidak perlu dipanggil manual karena ada socket listener status_updated
    } catch (error) {
      alert("Gagal konfirmasi pembayaran");
    }
  };
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
  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
        order.customer_name.toLowerCase().includes(query) ||
        String(order.id).includes(query)
    );
  });
  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div>
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            Kasir Dashboard
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
        <div className="flex-1 mx-8 max-w-md">
            <input 
                type="text"
                placeholder="🔍 Cari Nama / ID Pesanan..."
                className="w-full px-4 py-2 border rounded-full bg-gray-100 focus:bg-white focus:ring-2 ring-blue-500 outline-none text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>


      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* TABS */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {[
                { id: "new", label: "Baru Masuk" },
                { id: "active", label: "Semua Aktif" },
                { id: "kitchen", label: "Monitor Dapur" },
                { id: "history", label: "Riwayat" }
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
            {filteredOrders.map((order) => (
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
                    <div className="animate-fade-in bg-blue-50 -m-5 p-5 rounded-xl border border-blue-200">
                      <h3 className="font-bold text-blue-800 mb-3 text-sm">📝 Edit Data Pesanan</h3>

                      {/* 1. Input Nama */}
                      <div className="mb-2">
                          <label className="text-xs font-bold text-gray-500">Nama Pelanggan</label>
                          <input 
                              type="text"
                              className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 text-black"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                          />
                      </div>

                      {/* 2. Input Catatan */}
                      <div className="mb-2">
                          <label className="text-xs font-bold text-gray-500">Catatan / Menu</label>
                          <textarea 
                              rows="3"
                              className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 text-black"
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                          />
                      </div>

                      {/* 3. Dropdown Status */}
                      <div className="mb-4">
                          <label className="text-xs font-bold text-gray-500">Status Pesanan</label>
                          <select 
                              className="w-full p-2 border rounded text-sm font-bold text-black"
                              value={tempStatus}
                              onChange={(e) => setTempStatus(e.target.value)}
                          >
                              {statusOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                          </select>
                      </div>

                      {/* Tombol Simpan & Batal */}
                      <div className="flex gap-2 mt-2">
                          <button 
                              onClick={() => setEditingId(null)}
                              className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded text-xs font-bold hover:bg-gray-50"
                          >
                              BATAL
                          </button>
                          <button 
                              onClick={() => {
                                  // Panggil API update dengan data lengkap
                                  api.put(`/orders/${order.id}`, { 
                                      status: tempStatus,
                                      customer_name: tempName,
                                      order_notes: tempNotes
                                  }).then(() => {
                                      setEditingId(null);
                                      // fetchOrders akan otomatis jalan karena ada socket listener
                                  }).catch(() => alert("Gagal update data"));
                              }}
                              className="flex-1 bg-blue-600 text-white py-2 rounded text-xs font-bold hover:bg-blue-700 shadow-sm"
                          >
                              SIMPAN PERUBAHAN
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
                                    setTempName(order.customer_name); // Isi nama saat ini
                                    setTempNotes(order.order_notes);  // Isi notes saat ini
                                }}
                                className="text-gray-400 hover:text-blue-600 p-1"
                                title="Edit Pesanan"
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
                                BATAL
                            </button>

                            {/* Tombol Kanan Berubah Sesuai Status */}
                            {order.status === 'new' && (
                                <button onClick={() => confirmOrder(order.id)} // FIX: implementasi confirmOrder
                                className="bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md">
                                    TERIMA
                                </button>
                            )}
                            {order.status === 'ready' && (
                                <button onClick={() => updateStatus(order.id, 'completed')} className="bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 shadow-md animate-bounce-slow">
                                    AMBIL
                                </button>
                            )}
                            {['confirmed', 'cooking'].includes(order.status) && (
                                <button disabled className="bg-gray-100 text-gray-400 py-2 rounded-lg text-xs font-bold cursor-not-allowed">
                                    DAPUR
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
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-xs px-4">
        <Link href="/pesan">
            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 rounded-full shadow-2xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ring-4 ring-white">
                <span className="text-xl">📝</span>
                <span>BUAT PESANAN BARU</span>
            </button>
        </Link>
      </div>
      </div>
    </div>
  );
}