"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import ResetPasswordCard from "@/components/auth/ResetPasswordCard";

/**
 * Entrada por query string: /login/reset-password/?uid=...&token=...
 * Es el formato que genera el backend en los emails y funciona en un
 * hosting estático (output: "export") sin rewrites del servidor.
 */
export default function ResetPasswordQueryPage() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const uidParam = typeof router.query.uid === "string" ? router.query.uid : "";
    const tokenParam =
      typeof router.query.token === "string" ? router.query.token : "";

    if (uidParam && tokenParam) {
      setUid(uidParam);
      setToken(tokenParam);
    } else {
      Swal.fire({
        icon: "error",
        title: "Enlace inválido",
        text: "El enlace de recuperación no es válido o ha expirado.",
        confirmButtonColor: "#3b82f6",
      }).then(() => {
        router.push("/login");
      });
    }
  }, [router.isReady, router.query.uid, router.query.token, router]);

  // Mostrar loading mientras se procesan los parámetros
  if (!uid || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <ResetPasswordCard uid={uid} token={token} />;
}
