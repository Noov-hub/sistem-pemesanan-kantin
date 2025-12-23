"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function AdminDashboard() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState("");
    
    // State Form Create User
    const [newUser, setNewUser] = useState({ username: "", password: "", role: "cashier" });
    const [loading, setLoading] = useState(false);

    // 1. Cek Login & Ambil Data
    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "admin") {
            router.push("/login");
        } else {
            setUsername(localStorage.getItem("username"));
            fetchUsers();
        }
    }, [router]);

    // 2. Fungsi Ambil User dari Backend
    const fetchUsers = async () => {
        try {
            // Panggil API Backend yang sudah kita perbaiki tadi
            const res = await api.get("/admin/users");
            setUsers(res.data.data);
        } catch (error) {
            console.error("Gagal ambil user:", error);
        }
    };

    // 3. Fungsi Tambah User Baru
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/admin/create", newUser);
            alert("✅ User berhasil dibuat!");
            setNewUser({ username: "", password: "", role: "cashier" }); // Reset form
            fetchUsers(); // Refresh tabel
        } catch (error) {
            alert(error.response?.data?.message || "Gagal membuat user");
        } finally {
            setLoading(false);
        }
    };

    // 4. Fungsi Delete User
    const handleDeleteUser = async (e) => {
        if(!confirm("Apakah Anda yakin ingin menghapus user ini?")) return;
        setLoading(true);
        try{
            await api.post(`/admin/delete/${id}`);
            alert("User berhasil dihapus!");
            fetchUsers();
        }catch(error){
            console.error(error);
            alert(error.response?.data?.message || "Gagal menghapus user");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* NAVBAR ADMIN */}
            <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-lg">
                <div>
                    <h1 className="text-xl font-bold text-blue-400">ADMIN PANEL 🛡️</h1>
                    <p className="text-xs text-gray-400">Halo, {username}</p>
                </div>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold transition">
                    LOGOUT
                </button>
            </nav>

            <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* SECTION 1: FORM CREATE USER */}
                <div className="bg-white p-6 rounded-xl shadow-md h-fit">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">➕ Buat User Baru</h2>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Username</label>
                            <input 
                                type="text" 
                                required
                                className="w-full p-2 border rounded mt-1 bg-gray-50 text-black"
                                value={newUser.username}
                                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Password</label>
                            <input 
                                type="text" 
                                required
                                className="w-full p-2 border rounded mt-1 bg-gray-50 text-black"
                                value={newUser.password}
                                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Role (Jabatan)</label>
                            <select 
                                className="w-full p-2 border rounded mt-1 bg-gray-50 text-black"
                                value={newUser.role}
                                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                            >
                                <option value="cashier">Kasir (Cashier)</option>
                                <option value="kitchen">Dapur (Kitchen)</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition"
                        >
                            {loading ? "Menyimpan..." : "SIMPAN USER"}
                        </button>
                    </form>
                </div>

                {/* SECTION 2: LIST USER */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-bold text-gray-800">👥 Daftar Staff</h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                            Total: {users.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                                    <th className="p-3 border-b">ID</th>
                                    <th className="p-3 border-b">Username</th>
                                    <th className="p-3 border-b">Role</th>
                                    <th className="p-3 border-b">Dibuat Pada</th>
                                    <th className="p-3 border-b">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-sm">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50 border-b last:border-0">
                                        <td className="p-3 font-mono text-gray-400">#{u.id}</td>
                                        <td className="p-3 font-bold">{u.username}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                                                u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'kitchen' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-500">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 text-gray-500">
                                            <button>
                                                Update
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center text-gray-400">Belum ada user lain.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}