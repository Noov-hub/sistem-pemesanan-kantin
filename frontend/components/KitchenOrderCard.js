// components/KitchenOrderCard.js
export default function KitchenOrderCard({ order, onStatusUpdate }) {
  // NF-U4: Gunakan Bahasa Indonesia yang jelas
  const statusLabel = {
    new: "BARU MASUK",
    cooking: "SEDANG DIMASAK",
    ready: "SIAP SAJI"
  };

  return (
    // NF-U2: Border tebal, background kontras
    <div className="bg-white border-4 border-black rounded-xl overflow-hidden shadow-xl mb-4">
      {/* Header: Nama & Meja - Font Sangat Besar */}
      <div className="bg-yellow-300 p-4 border-b-4 border-black flex justify-between items-center">
        <h3 className="text-3xl font-black text-black truncate w-2/3">
          {order.customer_name}
        </h3>
        <span className="text-2xl font-bold bg-black text-white px-3 py-1 rounded">
          #{order.id}
        </span>
      </div>

      {/* Body: Menu List */}
      <div className="p-4 bg-white">
        <ul className="space-y-3">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 border-b border-dashed border-gray-400 pb-2">
              {/* Jumlah item dibold dan dibesarkan */}
              <span className="font-black text-3xl text-red-700 min-w-[40px]">
                {item.qty}x
              </span>
              <span className="font-bold text-2xl text-black leading-tight">
                {item.menu_name}
                {/* Catatan khusus merah mencolok */}
                {item.note && (
                  <div className="text-red-600 text-lg italic mt-1 bg-red-50 p-1 border border-red-200">
                    ⚠️ {item.note}
                  </div>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer: Action Button */}
      <div className="p-4 bg-gray-100 border-t-4 border-black grid grid-cols-1 gap-3">
        {order.status === 'new' && (
           <BigButton 
             label="MULAI MASAK" 
             color="blue" 
             icon="🔥" 
             onClick={() => onStatusUpdate(order.id, 'cooking')} 
           />
        )}
        {order.status === 'cooking' && (
           <BigButton 
             label="SELESAI (PANGGIL)" 
             color="green" 
             icon="✅" 
             onClick={() => onStatusUpdate(order.id, 'ready')} 
           />
        )}
      </div>
    </div>
  );
}