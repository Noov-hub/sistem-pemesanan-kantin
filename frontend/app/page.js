"use client";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { socket } from "@/lib/socket";
import Navbar from "@/components/Navbar";

export default function MonitorPage() {
  const [queue, setQueue] = useState([]);
  const [myOrder, setMyOrder] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  const fetchQueue = async () => {
    const res = await api.get("/orders/queue");
    setQueue(res.data.data);
  };

  useEffect(() => {
    fetchQueue();
    socket.connect();
    socket.on("status_updated", fetchQueue);
    socket.on("new_order", fetchQueue);
    return () => { socket.off("status_updated"); socket.off("new_order"); };
  }, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("current_order"));
    if (stored) {
      const found = queue.find(q => q.id === stored.id);
      if (found) {
        setMyOrder(found);
        if (found.status === 'new') {
          const deadline = new Date(found.created_at).getTime() + (10 * 60 * 1000);
          const timer = setInterval(() => {
            const diff = deadline - new Date().getTime();
            if (diff < 0) { setTimeLeft("EXPIRED"); clearInterval(timer); }
            else { setTimeLeft(`${Math.floor(diff/60000)}m ${Math.floor((diff%60000)/1000)}s`); }
          }, 1000);
          return () => clearInterval(timer);
        }
      }
    }
  }, [queue]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {myOrder && (
        <div className="fixed top-20 right-4 w-72 bg-white border-2 border-blue-600 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="bg-blue-600 text-white p-2 font-bold text-center">PESANAN ANDA #{myOrder.id}</div>
          <div className="p-4 text-center">
            <p className="font-bold text-black">{myOrder.customer_name}</p>
            <p className="text-xs text-gray-500 uppercase mt-1">{myOrder.status}</p>
            {myOrder.status === 'new' && (
              <div className="mt-2 bg-red-100 p-2 rounded">
                <p className="text-[10px] text-red-600 font-bold">BATAL DALAM:</p>
                <p className="text-xl font-mono font-black text-red-700">{timeLeft}</p>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="pt-24 p-6 grid grid-cols-3 gap-6 max-w-7xl mx-auto">
        {['ready', 'cooking', 'new'].map(status => (
          <div key={status} className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-bold border-b mb-4 uppercase text-black">{status === 'new' ? 'Belum Bayar' : status}</h2>
            {queue.filter(q => q.status === status || (status==='cooking' && q.status==='confirmed')).map(o => (
              <div key={o.id} className="p-3 mb-2 bg-gray-50 rounded border-l-4 border-blue-500 text-black">
                <p className="font-bold">{o.customer_name}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}