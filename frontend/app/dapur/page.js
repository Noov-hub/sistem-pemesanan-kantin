// frontend/app/dapur/page.js
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
  
  // State untuk Batch Selection
  const [selectedIds, setSelectedIds] = useState([]);

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
      // Pastikan endpoint backend sudah sort by confirmed_at ASC
      const res = await api.get("/orders/kitchen");
      setOrders(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Gagal ambil data dapur:", error);
    }
  };

  useEffect(() => {
    socket.connect();
    // Smart Refresh: Hanya fetch ulang saat ada event relevan
    socket.on("new_kitchen_order", () => fetchKitchenOrders()); // Triggered by Kasir
    socket.on("status_updated", () => fetchKitchenOrders());
    socket.on("order_deleted", () => fetchKitchenOrders());
    
    return () => {
        socket.off("new_kitchen_order");
        socket.off("status_updated");
        socket.off("order_deleted");
    };
  }, []);

  // --- LOGIC BATCH SELECT ---
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
        setSelectedIds([...selectedIds, id]);
    }
  };

  // --- LOGIC ACTIONS ---
  
  // 1. Batch Cook (Masak Banyak)
  const handleBatchCook = async () => {
    if(selectedIds.length === 0) return;
    try {
        setLoading(true);
        // Panggil Endpoint Batch yang sudah kita bahas sebelumnya
        await api.put("/orders/batch-cook", { ids: selectedIds });
        setSelectedIds([]); // Reset checkbox
        fetchKitchenOrders();
    } catch (error) {
        alert("Gagal batch update");
    } finally {
        setLoading(false);
    }
  };

  // 2. Single Action (Undo / Selesai)
  const handleAction = async (id, actionType) => {
    let endpoint = "";
    
    if (actionType === "undo") endpoint = `/orders/${id}/undo-cooking`; // Endpoint Undo
    else if (actionType === "ready") endpoint = `/orders/${id}/ready`;   // Endpoint Ready

    try {
        setLoading(true);
        await api.put(endpoint); // Backend handle logic sisanya
        fetchKitchenOrders();
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

  const queueList = orders.filter(o => o.status === 'confirmed');
  const cookingList = orders.filter(o => o.status === 'cooking');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center shadow-lg border-b border-gray-700 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-yellow-500 tracking-wider">👨‍🍳 DAPUR MONITOR</h1>
          <p className="text-xs text-gray-400">Koki: {username}</p>
        </div>
        <div className="flex gap-4">
             {/* Indikator Seleksi */}
            {selectedIds.length > 0 && (
                <button 
                    onClick={handleBatchCook}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-full animate-pulse transition"
                >
                    🔥 MASAK ({selectedIds.length}) ITEM
                </button>
            )}
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold text-sm">
            KELUAR
            </button>
        </div>
      </nav>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
        
        {/* KOLOM KIRI: ANTRIAN (Kuning) */}
        <div className="bg-gray-800 rounded-2xl p-4 border-2 border-yellow-600 flex flex-col h-full overflow-hidden">
          <h2 className="text-xl font-bold text-yellow-400 mb-4 flex justify-between items-center shrink-0">
            🔔 ANTRIAN ({queueList.length})
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-2">
            {queueList.length === 0 ? (
                <div className="text-center text-gray-600 italic mt-10">Belum ada pesanan masuk</div>
            ) : (
                queueList.map((order) => (
                <div 
                    key={order.id} 
                    onClick={() => toggleSelect(order.id)} // Klik kartu untuk centang
                    className={`p-4 rounded-xl shadow-lg border-l-8 cursor-pointer transition-all ${
                        selectedIds.includes(order.id) 
                        ? "bg-yellow-100 border-yellow-500 scale-[1.02] ring-2 ring-yellow-400" 
                        : "bg-white border-gray-300 hover:bg-gray-100"
                    }`}
                >
                    <div className="flex justify-between items-start text-black">
                        <div className="flex items-center gap-3">
                            {/* Checkbox Visual */}
                            <div className={`w-6 h-6 rounded border flex items-center justify-center ${
                                selectedIds.includes(order.id) ? "bg-yellow-500 border-yellow-600" : "border-gray-400"
                            }`}>
                                {selectedIds.includes(order.id) && "✓"}
                            </div>
                            <h3 className="text-xl font-black">{order.customer_name}</h3>
                        </div>
                        <span className="text-xs font-mono text-gray-500">#{order.id}</span>
                    </div>
                    <p className="text-black text-lg font-medium mt-2 whitespace-pre-line pl-9">
                        {order.order_notes}
                    </p>
                </div>
                ))
            )}
          </div>
        </div>

        {/* KOLOM KANAN: SEDANG DIMASAK (Biru) */}
        <div className="bg-gray-800 rounded-2xl p-4 border-2 border-blue-500 flex flex-col h-full overflow-hidden">
          <h2 className="text-xl font-bold text-blue-400 mb-4 shrink-0">
            🍳 SEDANG DIMASAK ({cookingList.length})
          </h2>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-2">
            {cookingList.map((order) => (
            <div key={order.id} className="bg-gray-700 text-white p-5 rounded-xl shadow-lg border-l-8 border-blue-500 relative">
                <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-bold">{order.customer_name}</h3>
                    <div className="text-xs bg-blue-900 px-2 py-1 rounded text-blue-200 animate-pulse">COOKING</div>
                </div>
                <p className="text-lg font-medium mt-2 whitespace-pre-line border-t border-gray-600 pt-2 my-3 text-gray-200">
                    {order.order_notes}
                </p>
                
                <div className="flex gap-3">
                    {/* TOMBOL UNDO */}
                    <button 
                        onClick={() => handleAction(order.id, 'undo')}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg text-sm transition"
                        title="Kembalikan ke antrian"
                    >
                        ↩️ UNDO
                    </button>

                    {/* TOMBOL SELESAI */}
                    <button 
                        onClick={() => handleAction(order.id, 'ready')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-lg text-xl shadow-md transition active:scale-95"
                    >
                        ✅ SELESAI
                    </button>
                </div>
            </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}