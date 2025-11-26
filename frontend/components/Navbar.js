"use client";
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md w-full fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-bold text-xl text-blue-600 tracking-wider">
              Kantin FPMIPA 🍜
            </Link>
          </div>

          {/* Burger Button (Kanan Atas) */}
          <div className="flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-blue-600 focus:outline-none p-2 rounded-md transition"
            >
              {/* Ikon Garis 3 (Hamburger) */}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Dropdown (Muncul saat diklik) */}
      {isOpen && (
        <div className="absolute right-0 top-16 w-48 bg-white shadow-xl rounded-bl-lg border-t border-gray-100 py-2">
           <Link 
              href="/login" 
              className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
           >
              🔐 Login Staff
          </Link>
          {/* Bisa tambah menu 'Tentang' atau 'Bantuan' disini */}
        </div>
      )}
    </nav>
  );
}