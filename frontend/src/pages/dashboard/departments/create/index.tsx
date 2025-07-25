import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import {
	Container,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	Paper,
	TextField,
	Button,
	InputLabel,
	Select,
	MenuItem,
	FormControl,
	Grid,
} from "@mui/material";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router"; // Importa useRouter de Next.js
import dayjs from "dayjs"; // Asegúrate de tener instalada esta dependencia
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DashboardMenu from "../../../dashboard";
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";
import API from "../../../../api/axiosConfig";

// Habilita los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const CrearDepartamento = () => {
	const h1Style = {
		color: "black",
	};

	const router = useRouter(); // Usamos useRouter para manejar la navegación

	const [nombre, setNombre] = useState("");
	const [telefono, setTelefono] = useState("");
	const [estado, setEstado] = useState("");
	const [interno, setInterno] = useState("");
	const [mailDepartamento, setMailDepartamento] = useState("");
	const [mailJefeDepartamento, setMailJefeDepartamento] = useState("");
	const [modalVisible, setModalVisible] = useState(false);
	const [modalMessage, setModalMessage] = useState("");
	const [modalTitle, setModalTitle] = useState("");
	const [fn, setFn] = useState(() => () => {});

	const capitalizeFirstLetter = (string: string) => {
		return string.charAt(0).toUpperCase() + string.slice(1);
	};

	const handleOpenModal = (
		title: string,
		message: string,
		onConfirm: () => void
	) => {
		setModalTitle(title); // Establecer el título del modal
		setModalMessage(message);
		setModalVisible(true);
		setFn(() => onConfirm);
	};

	const handleCloseModal = () => {
		setModalVisible(false);
		setModalMessage("");
	};

	const handleConfirmModal = () => {
		router.push("/dashboard/departments/"); // Redirige después de cerrar el modal
	};

	const validarEmail = (email: string) => {
		if (!email) return true; // Los emails son opcionales
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const crearNuevoDepartamento = async () => {
		// Validar emails antes de enviar
		if (mailDepartamento && !validarEmail(mailDepartamento)) {
			handleOpenModal(
				"Error",
				"El Email del Departamento no tiene un formato válido.",
				() => {}
			);
			return;
		}

		if (mailJefeDepartamento && !validarEmail(mailJefeDepartamento)) {
			handleOpenModal(
				"Error",
				"El Email del Jefe del Departamento no tiene un formato válido.",
				() => {}
			);
			return;
		}

		let nuevoDepartamento = {
			nombre: nombre,
			telefono: telefono,
			estado: Number(estado), // Asegúrate de convertir a número
			interno: interno,
			mail_departamento: mailDepartamento || null,
			mail_jefe_departamento: mailJefeDepartamento || null,
		};

		try {
			console.log("Datos enviados:", nuevoDepartamento);
			const response = await API.post(
				"/facet/departamento/",
				nuevoDepartamento
			);
			handleOpenModal(
				"Éxito",
				"Se creó el departamento con éxito.",
				handleConfirmModal
			);
		} catch (error) {
			console.error("Error completo:", error);
			console.error("Error response:", error.response?.data);
			console.error("Error status:", error.response?.status);

			let errorMessage = "NO se pudo realizar la acción.";
			if (error.response?.data) {
				if (typeof error.response.data === "string") {
					errorMessage = error.response.data;
				} else if (error.response.data.detail) {
					errorMessage = error.response.data.detail;
				} else if (error.response.data.message) {
					errorMessage = error.response.data.message;
				} else {
					// Formatear errores de validación del backend
					const errors = [];
					for (const field in error.response.data) {
						const fieldErrors = error.response.data[field];
						if (Array.isArray(fieldErrors)) {
							fieldErrors.forEach((err) => {
								let fieldName = field;
								if (field === "mail_departamento")
									fieldName = "Email del Departamento";
								else if (field === "mail_jefe_departamento")
									fieldName = "Email del Jefe";
								else if (field === "nombre") fieldName = "Nombre";
								else if (field === "telefono") fieldName = "Teléfono";

								errors.push(`${fieldName}: ${err}`);
							});
						}
					}
					errorMessage =
						errors.length > 0
							? errors.join("\n")
							: JSON.stringify(error.response.data);
				}
			}

			handleOpenModal("Error", errorMessage, () => {});
		}
	};

	return (
		<DashboardMenu>
			<Container maxWidth="lg">
				<Paper elevation={3} className="bg-white shadow-lg rounded-lg">
					{/* Título separado */}
					<div className="p-4 border-b border-gray-200">
						<Typography variant="h5" className="text-gray-800 font-semibold">
							Crear Departamento
						</Typography>
					</div>

					{/* Contenido del formulario */}
					<div className="p-4">
						<Grid container spacing={2}>
							{/* Sección: Información del Departamento */}
							<Grid item xs={12}>
								<Typography
									variant="h6"
									className="text-gray-700 font-semibold mb-3"
								>
									Información del Departamento
								</Typography>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									label="Nombre"
									value={nombre}
									onChange={(e) =>
										setNombre(capitalizeFirstLetter(e.target.value))
									}
									fullWidth
									variant="outlined"
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3b82f6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
											"&.MuiFormLabel-filled": {
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
									}}
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									label="Teléfono"
									value={telefono}
									onChange={(e) => setTelefono(e.target.value)}
									fullWidth
									variant="outlined"
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3b82f6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
											"&.MuiFormLabel-filled": {
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
									}}
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									label="Interno"
									value={interno}
									onChange={(e) => setInterno(e.target.value)}
									fullWidth
									variant="outlined"
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3b82f6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
											"&.MuiFormLabel-filled": {
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
									}}
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									select
									label="Estado"
									value={estado}
									onChange={(e) => setEstado(e.target.value)}
									fullWidth
									variant="outlined"
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3b82f6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
											"&.MuiFormLabel-filled": {
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
										"& .MuiSelect-icon": {
											color: "#6b7280",
											transition: "color 0.2s ease",
										},
										"&:hover .MuiSelect-icon": {
											color: "#3b82f6",
										},
									}}
								>
									<MenuItem value={1}>Activo</MenuItem>
									<MenuItem value={0}>Inactivo</MenuItem>
								</TextField>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									label="Mail del Departamento"
									type="email"
									value={mailDepartamento}
									onChange={(e) => setMailDepartamento(e.target.value)}
									fullWidth
									variant="outlined"
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3b82f6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
											"&.MuiFormLabel-filled": {
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
									}}
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									label="Mail del Jefe del Departamento"
									type="email"
									value={mailJefeDepartamento}
									onChange={(e) => setMailJefeDepartamento(e.target.value)}
									fullWidth
									variant="outlined"
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3b82f6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3b82f6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
											"&.MuiFormLabel-filled": {
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
									}}
								/>
							</Grid>

							{/* Botón de acción centrado */}
							<Grid item xs={12}>
								<div className="flex justify-center mt-6">
									<button
										onClick={crearNuevoDepartamento}
										className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium"
									>
										Crear Departamento
									</button>
								</div>
							</Grid>
						</Grid>
					</div>

					<BasicModal
						open={modalVisible}
						onClose={handleCloseModal}
						title={modalTitle}
						content={modalMessage}
						onConfirm={fn}
					/>
				</Paper>
			</Container>
		</DashboardMenu>
	);
};

export default withAuth(CrearDepartamento);
