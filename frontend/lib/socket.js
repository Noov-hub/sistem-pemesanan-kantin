"use client";

import { io } from "socket.io-client";

// Inisialisasi koneksi ke Backend Express
export const socket = io("http://localhost:5000", {
  autoConnect: false, // Kita akan connect manual saat komponen dimuat
});