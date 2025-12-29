/** @type {import('next').NextConfig} */
const nextConfig = {
  // Matikan indikator dev di pojok kanan bawah agar tidak menutupi UI saat demo
  devIndicators: {
    buildActivity: false, 
  },
  // Optimasi Image jika nanti pakai gambar menu dari eksternal
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Hati-hati di production, ini untuk MVP saja
      },
    ],
  },
};

export default nextConfig;