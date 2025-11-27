"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { socket } from "@/lib/socket";

export default function AdminDashboard() {
    const router = useRouter();
    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if(!token || role !== "admin"){
            router.push("/login");
        }else{
            setUsername(localStorage.getItem("username"));
        }
    }, [router]);
    
}

// TODO: bikin overview section

// todo: bikin user creation form
// todo: bikin user list table
// todo: bikin order history management