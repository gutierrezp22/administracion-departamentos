"use client"; // This is a client component
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { FiLock, FiMail } from "react-icons/fi"; // Using Feather icons from react-icons
import "../../app/globals.css"; // Importamos los estilos globales de Tailwind
import API from "@/api/axiosConfig";

export default function LoginPage() {
	const router = useRouter();
	const [rememberMe, setRememberMe] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	// Usar useRef para acceder a los valores más recientes en los efectos
	const rememberMeRef = useRef(rememberMe);
	rememberMeRef.current = rememberMe;

	// Comprobar si hay información guardada para "recordar" al usuario
	useEffect(() => {
		const savedEmail = localStorage.getItem("rememberedEmail");

		if (savedEmail) {
			// Establecer el estado de email directamente
			setEmail(savedEmail);
			setRememberMe(true);
		}
	}, []);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsLoading(true);

		try {
			const response = await API.post(`/login/token/`, {
				email,
				password,
			});

			// Guardar tokens en sessionStorage para que se eliminen al cerrar el navegador
			sessionStorage.setItem("access_token", response.data.access);
			sessionStorage.setItem("refresh_token", response.data.refresh);

			// Si el usuario marcó "Recuérdame", guardar el email en localStorage
			if (rememberMe) {
				localStorage.setItem("rememberedEmail", email);
			} else {
				// Si no está marcado, eliminar cualquier email guardado previamente
				localStorage.removeItem("rememberedEmail");
			}

			router.push("/dashboard/home"); // Redirige al Dashboard después de iniciar sesión
		} catch (error) {
			console.error("Error de autenticación:", error);
			Swal.fire({
				icon: "error",
				title: "Error de autenticación",
				text: "Correo electrónico o contraseña incorrectos.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
			{/* Elementos decorativos sutiles */}
			<div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
				<div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500 opacity-5"></div>
				<div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-600 opacity-5"></div>
				<div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-400 opacity-5"></div>
			</div>

			<div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm relative z-10 border border-gray-100">
				<div className="text-center">
					<div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-blue-50 mb-6">
						<FiLock className="h-7 w-7 text-blue-600" />
					</div>
					<h2 className="text-3xl font-extrabold text-gray-900">
						Inicio de Sesión
					</h2>
					<p className="mt-2 text-sm text-gray-500">
						Acceda a su cuenta para gestionar los departamentos FACET
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="rounded-md space-y-5">
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Correo Electrónico
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FiMail
										className="h-5 w-5 text-gray-400"
										aria-hidden="true"
									/>
								</div>
								<input
									id="email"
									name="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									autoComplete="email"
									required
									className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
									placeholder="nombre@ejemplo.com"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Contraseña
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FiLock
										className="h-5 w-5 text-gray-400"
										aria-hidden="true"
									/>
								</div>
								<input
									id="password"
									name="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									autoComplete="current-password"
									required
									className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
									placeholder="••••••••"
								/>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<input
								id="remember-me"
								name="remember-me"
								type="checkbox"
								checked={rememberMe}
								onChange={(e) => setRememberMe(e.target.checked)}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
							/>
							<label
								htmlFor="remember-me"
								className="ml-2 block text-sm text-gray-700 cursor-pointer"
							>
								Recuérdame
							</label>
						</div>

						<div className="text-sm">
							<Link
								href="/login/forgot-password"
								className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
							>
								¿Olvidó su contraseña?
							</Link>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={isLoading}
							className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out shadow-sm"
						>
							{isLoading ? (
								<svg
									className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							) : (
								"Iniciar Sesión"
							)}
						</button>
					</div>
				</form>

				<div className="text-center mt-4">
					<p className="text-xs text-gray-500">
						&copy; {new Date().getFullYear()} FACET - UNT. Todos los derechos
						reservados.
					</p>
				</div>
			</div>
		</div>
	);
}
