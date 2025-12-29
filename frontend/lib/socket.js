"use client";

import { io } from "socket.io-client";

// Inisialisasi koneksi ke Backend Express
// export const socket = io("http://localhost:5000", {
export const socket = io("https://reality-consolidated-dairy-basic.trycloudflare.com", { // ubah dengan url backend dari trycloudflare, JANGAN LUPA UBAH SETIAP RESTART TRYCLOUDFLARE
  autoConnect: false, // Kita akan connect manual saat komponen dimuat
});