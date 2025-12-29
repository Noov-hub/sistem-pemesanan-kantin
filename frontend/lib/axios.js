import axios from 'axios';

const api = axios.create({
    // baseURL: 'http://localhost:5000/api',
    baseURL: 'https://reality-consolidated-dairy-basic.trycloudflare.com/api', // ubah dengan url backend dari trycloudflare, JANGAN LUPA UBAH SETIAP RESTART TRYCLOUDFLARE
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- INTERCEPTOR (Middleware Frontend) ---
// Setiap kali Axios mau kirim request, fungsi ini jalan duluan
api.interceptors.request.use(
    (config) => {
        // Ambil token dari penyimpanan browser
        const token = localStorage.getItem('token');
        
        // Jika ada token, tempelkan ke Header Authorization
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;