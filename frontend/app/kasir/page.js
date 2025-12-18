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
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [tempStatus, setTempStatus] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints = { new: "/orders/new", active: "/orders/active", kitchen: "/orders/kitchen", history: "/orders/history" };
      const res = await api.get(endpoints[activeTab]);
      setOrders(res.data.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
    socket.connect();
    socket.on("new_order", () => { if (activeTab === 'new') fetchOrders(); });
    socket.on("status_updated", () => fetchOrders());
    return () => { socket.off("new_order"); socket.off("status_updated"); };
  }, [fetchOrders, activeTab]);

  const confirmPayment = async (id) => {
    try { await api.put(`/orders/${id}/confirm`); } catch (error) { alert("Error"); }
  };

  const updateStatus = async (id, status) => {
    try { await api.put(`/orders/${id}`, { status }); setEditingId(null); } catch (error) { alert("Error"); }
  };

  const filteredOrders = orders.filter(o => o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || String(o.id).includes(searchQuery));

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-xl font-bold text-blue-600">Kasir 👮‍♂️</h1>
        <input type="text" placeholder="🔍 Cari Nama/ID..." className="px-4 py-2 border rounded-full w-64 text-black" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="text-red-500 font-bold">Logout</button>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          {['new', 'active', 'kitchen', 'history'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-xl font-bold ${activeTab === t ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}>{t.toUpperCase()}</button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
              {editingId === order.id ? (
                <div>
                  <select className="w-full p-2 border mb-2 text-black" value={tempStatus} onChange={e => setTempStatus(e.target.value)}>
                    {['new','confirmed','cooking','ready','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => updateStatus(order.id, tempStatus)} className="w-full bg-blue-600 text-white py-1 rounded">Simpan</button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <h3 className="font-bold">{order.customer_name}</h3>
                    <button onClick={() => { setEditingId(order.id); setTempStatus(order.status); }}>✏️</button>
                  </div>
                  <p className="text-sm my-2 text-gray-600">{order.order_notes}</p>
                  <div className="flex gap-2 mt-4">
                    {order.status === 'new' && <button onClick={() => confirmPayment(order.id)} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">💰 TERIMA</button>}
                    {order.status === 'ready' && <button onClick={() => updateStatus(order.id, 'completed')} className="flex-1 bg-green-600 text-white py-2 rounded font-bold">✅ SELESAI</button>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}