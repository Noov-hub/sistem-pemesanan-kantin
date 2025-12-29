"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { socket } from "@/lib/socket";

export default function DapurDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "kitchen") {
      router.push("/login");
    } else {
      setUsername(localStorage.getItem("username"));
      fetchKitchenOrders();
    }
  }, [router]);

  const fetchKitchenOrders = async () => {
    try {
      const res = await api.get("/orders/kitchen");
      setOrders(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Gagal ambil data dapur:", error);
    }
  };

  useEffect(() => {
    socket.connect();
    const playSound = () => {
        const audio = new Audio('/notif.mp3');
        audio.play().catch(() => {});
    };
    socket.on("status_updated", ({ status }) => {
      if (status === 'confirmed') playSound();
      fetchKitchenOrders();
    });
    socket.on("order_deleted", () => fetchKitchenOrders());
    socket.on("new_order", () => fetchKitchenOrders()); // Jika ada yg baru masuk antrian
    
    return () => {
      socket.off("status_updated");
      socket.off("order_deleted");
      socket.off("new_order");
    };
  }, []);

  const handleAction = async (id, actionType) => {
    let newStatus = "";
    
    if (actionType === "start_cooking") {
        newStatus = "cooking"; // Antrian -> Masak
    } else if (actionType === "finish_cooking") {
        newStatus = "ready";   // Masak -> Selesai
    } else if (actionType === "undo_cooking") {
        newStatus = "confirmed"; // Masak -> Balikin ke Antrian (Undo)
    }

    try {
      setLoading(true); 
      await api.put(`/orders/${id}`, { status: newStatus });
      await fetchKitchenOrders();
    } catch (error) {
      alert("Gagal update status");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const filteredOrders = orders.filter(o => 
    o.order_notes.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const queueList = filteredOrders.filter(o => o.status === 'confirmed');
  const cookingList = filteredOrders.filter(o => o.status === 'cooking');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center shadow-lg border-b border-gray-700 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-yellow-500 tracking-wider">DAPUR MONITOR</h1>
          <p className="text-xs text-gray-400">Koki: {username}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold text-sm transition">
          KELUAR
        </button>
      </nav>

      {/* SEARCH BAR */}
      <div className="px-6 mt-4">
        <input
            type="text"
            placeholder="🔍 Cari menu... (contoh: Nasi Goreng)"
            className="w-full max-w-md px-4 py-3 rounded-full bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none placeholder-gray-500 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
        
        {/* KOLOM KIRI: ANTRIAN (Kuning) */}
        <div className="bg-gray-800 rounded-2xl p-4 border-2 border-yellow-600 flex flex-col h-full overflow-hidden">
          <h2 className="text-xl font-bold text-yellow-400 mb-4 flex justify-between items-center shrink-0">
            ANTRIAN BARU 
            <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm">{queueList.length}</span>
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-2">
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
                        onClick={() => handleAction(order.id, 'start_cooking')}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black py-4 rounded-lg text-xl shadow-md transition-transform active:scale-95"
                    >
                        MULAI MASAK
                    </button>
                </div>
                ))
            )}
          </div>
        </div>

        {/* KOLOM KANAN: SEDANG DIMASAK (Biru) */}
        <div className="bg-gray-800 rounded-2xl p-4 border-2 border-blue-500 flex flex-col h-full overflow-hidden">
          <h2 className="text-xl font-bold text-blue-400 mb-4 flex justify-between items-center shrink-0">
            SEDANG DIMASAK
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">{cookingList.length}</span>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-2">
            {cookingList.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-600 italic">Tidak ada yang dimasak</div>
            ) : (
                cookingList.map((order) => (
                <div key={order.id} className="bg-gray-700 text-white p-5 rounded-xl shadow-lg border-l-8 border-blue-500">
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-bold">{order.customer_name}</h3>
                        <div className="text-xs bg-blue-900 px-2 py-1 rounded text-blue-200 animate-pulse">COOKING</div>
                    </div>
                    <p className="text-lg font-medium mt-2 whitespace-pre-line border-t border-gray-600 pt-2 my-3 text-gray-200">
                        {order.order_notes}
                    </p>
                    
                    <div className="flex gap-3">
                        {/* TOMBOL UNDO (BATAL MASAK) */}
                        <button 
                            onClick={() => handleAction(order.id, 'undo_cooking')}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-4 px-4 rounded-lg text-sm transition-transform active:scale-95"
                            title="Kembalikan ke antrian"
                        >
                            BATAL
                        </button>

                        {/* TOMBOL SELESAI */}
                        <button 
                            onClick={() => handleAction(order.id, 'finish_cooking')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-lg text-xl shadow-md transition-transform active:scale-95"
                        >
                            SELESAI SAJI
                        </button>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}