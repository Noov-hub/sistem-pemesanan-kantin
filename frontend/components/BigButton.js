// components/BigButton.js
export default function BigButton({ label, onClick, color = "blue", icon }) {
  // Mapping warna agar kontras tetap tinggi
  const colors = {
    blue: "bg-blue-700 hover:bg-blue-800 text-white", // Biru tua lebih kontras
    green: "bg-green-700 hover:bg-green-800 text-white",
    red: "bg-red-700 hover:bg-red-800 text-white",
    yellow: "bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black", // Hitam di atas kuning
  };

  return (
    <button
      onClick={onClick}
      // min-h-[60px] -> Menjamin target sentuh besar (NF-U5)
      // text-xl font-bold -> Mudah dibaca (NF-U3)
      className={`${colors[color]} w-full min-h-[60px] rounded-xl px-6 py-4 
                  flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform`}
    >
      {icon && <span className="text-3xl">{icon}</span>}
      <span className="text-xl font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}