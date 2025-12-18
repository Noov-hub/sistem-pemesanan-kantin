"use client";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { socket } from "@/lib/socket";

export default function DapurDashboard() {
  const [orders, setOrders] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchOrders = async () => {
    const res = await api.get("/orders/kitchen");
    setOrders(res.data.data);
  };

  useEffect(() => {
    fetchOrders();
    socket.connect();
    socket.on("new_kitchen_order", fetchOrders);
    socket.on("status_updated", fetchOrders);
    return () => { socket.off("new_kitchen_order"); socket.off("status_updated"); };
  }, []);

  const handleBatchCook = async () => {
    await api.put("/orders/batch-cook", { ids: selectedIds });
    setSelectedIds([]);
  };

  const handleUndo = async (id) => { await api.put(`/orders/${id}/undo-cooking`); };
  const handleReady = async (id) => { await api.put(`/orders/${id}/ready`); };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <nav className="p-4 bg-gray-800 flex justify-between">
        <h1 className="text-xl font-bold text-yellow-500">DAPUR 👨‍🍳</h1>
        {selectedIds.length > 0 && <button onClick={handleBatchCook} className="bg-yellow-500 text-black px-6 py-2 rounded-full font-bold animate-pulse">🔥 MASAK {selectedIds.length}</button>}
      </nav>
      <div className="grid grid-cols-2 gap-6 p-6 flex-1">
        <div className="border-2 border-yellow-600 p-4 rounded-xl">
          <h2 className="mb-4 font-bold text-yellow-400">ANTRIAN</h2>
          {orders.filter(o => o.status === 'confirmed').map(o => (
            <div key={o.id} onClick={() => setSelectedIds(prev => prev.includes(o.id) ? prev.filter(i => i!==o.id) : [...prev, o.id])} className={`p-4 mb-3 rounded-lg cursor-pointer text-black ${selectedIds.includes(o.id) ? "bg-yellow-200" : "bg-white"}`}>
              <h3 className="font-bold">{o.customer_name}</h3>
              <p>{o.order_notes}</p>
            </div>
          ))}
        </div>
        <div className="border-2 border-blue-500 p-4 rounded-xl">
          <h2 className="mb-4 font-bold text-blue-400">MEMASAK</h2>
          {orders.filter(o => o.status === 'cooking').map(o => (
            <div key={o.id} className="bg-gray-700 p-4 mb-3 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-bold">{o.customer_name}</h3>
              <p className="my-2">{o.order_notes}</p>
              <div className="flex gap-2">
                <button onClick={() => handleUndo(o.id)} className="bg-gray-500 px-3 py-1 rounded">↩️ Undo</button>
                <button onClick={() => handleReady(o.id)} className="flex-1 bg-green-600 py-1 rounded font-bold">✅ Selesai</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}