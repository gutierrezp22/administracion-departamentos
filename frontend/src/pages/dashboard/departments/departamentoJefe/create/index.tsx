import { useEffect, useState, useCallback } from "react";
import "./styles.css";
import API from "@/api/axiosConfig";
import { formatFechaParaBackend } from "@/utils/dateHelpers";
import {
	Paper,
	Typography,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import DashboardMenu from "@/pages/dashboard";
import withAuth from "../../../../../components/withAut";
import {
	FormContainer,
	FormSection,
	FormField,
	FormDatePicker,
	FormActions,
	FormButton,
	SelectorButton,
} from "@/components/Form";
import { CompactFilterSelect } from "@/components/Filters";
import {
	MagnifyingGlassIcon,
	XMarkIcon,
	FunnelIcon,
} from "@heroicons/react/24/outline";

dayjs.extend(utc);
dayjs.extend(timezone);

// Función helper para normalizar URLs - fuera del componente para evitar recreaciones
const normalizeUrl = (url: string) => {
	// Si la URL es absoluta (comienza con http/https), extraer solo la parte de la ruta
	if (url.startsWith("http")) {
		const urlObj = new URL(url);
		let normalizedUrl = urlObj.pathname + urlObj.search;
		// Remover /api/ si está presente en la URL normalizada
		normalizedUrl = normalizedUrl.replace(/^\/api/, "");
		return normalizedUrl;
	}
	// Si es relativa, asegurar que comience con / y remover /api/ si está presente
	const normalizedUrl = url.replace(/^\/+/, "/").replace(/^\/api/, "");
	return normalizedUrl;
};

const CrearDepartamentoJefe = () => {
	const router = useRouter();

	interface Resolucion {
		id: number;
		nexpediente: string;
		nresolucion: string;
		tipo: string;
		fecha: string;
		observaciones: string;
	}

	interface Jefe {
		id: number;
		persona: Persona;
		observaciones: string;
		estado: 0 | 1;
	}

	interface Persona {
		id: number;
		nombre: string;
		apellido: string;
		telefono: string;
		dni: string;
		estado: 0 | 1;
		email: string;
		interno: string;
		legajo: string;
	}

	interface Departamento {
		id: number;
		nombre: string;
	}

	const [fechaInicio, setFechaInicio] = useState<dayjs.Dayjs | null>(null);
	const [fechaFin, setFechaFin] = useState<dayjs.Dayjs | null>(null);
	const [resolucion, setResolucion] = useState<Resolucion | null>(null);
	const [jefe, setJefe] = useState<Jefe | null>(null);
	const [departamento, setDepartamento] = useState<Departamento | null>(null);

	const [filtroResolucion, setFiltroResolucion] = useState("");
	const [filtroJefe, setFiltroJefe] = useState("");

	const [openJefe, setOpenJefe] = useState(false);
	const [openDepartamento, setOpenDepartamento] = useState(false);

	const [observaciones, setObservaciones] = useState("");
	const [estado, setEstado] = useState("");

	const [modalVisible, setModalVisible] = useState(false);
	const [modalMessage, setModalMessage] = useState("");
	const [modalTitle, setModalTitle] = useState("");
	const [fn, setFn] = useState(() => () => {});

	const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
	const [filtroNroExpediente, setFiltroNroExpediente] = useState("");
	const [filtroNroResolucion, setFiltroNroResolucion] = useState("");
	const [filtroTipo, setFiltroTipo] = useState("");
	const [filtroFechaDesde, setFiltroFechaDesde] = useState<dayjs.Dayjs | null>(null);
	const [filtroFechaHasta, setFiltroFechaHasta] = useState<dayjs.Dayjs | null>(null);
	const [filtroFechaExacta, setFiltroFechaExacta] = useState<dayjs.Dayjs | null>(null);
	const [nextUrl, setNextUrl] = useState<string | null>(null);
	const [prevUrl, setPrevUrl] = useState<string | null>(null);
	const [currentUrl, setCurrentUrl] = useState<string>(`/facet/resolucion/`);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [pageSize, setPageSize] = useState<number>(10);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [openResolucion, setOpenResolucion] = useState(false);
	const [selectedResolucion, setSelectedResolucion] =
		useState<Resolucion | null>(null);
	const [loadingResoluciones, setLoadingResoluciones] = useState(false);

	const [jefes, setJefes] = useState<Jefe[]>([]);
	const [filtroNombre, setFiltroNombre] = useState("");
	const [filtroDni, setFiltroDni] = useState("");

	const [nextUrlJefes, setNextUrlJefes] = useState<string | null>(null);
	const [prevUrlJefes, setPrevUrlJefes] = useState<string | null>(null);
	const [currentUrlJefes, setCurrentUrlJefes] = useState<string>(
		`/facet/jefe/list_jefes_persona/`
	);
	const [totalItemsJefes, setTotalItemsJefes] = useState<number>(0);
	const [currentPageJefes, setCurrentPageJefes] = useState<number>(1);
	const pageSizeJefes = 10;

	const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
	const [filtroDepartamento, setFiltroDepartamento] = useState("");

	const [nextUrlDepartamentos, setNextUrlDepartamentos] = useState<
		string | null
	>(null);
	const [prevUrlDepartamentos, setPrevUrlDepartamentos] = useState<
		string | null
	>(null);
	const [currentUrlDepartamentos, setCurrentUrlDepartamentos] =
		useState<string>(`/facet/departamento/`);
	const [totalItemsDepartamentos, setTotalItemsDepartamentos] =
		useState<number>(0);
	const [currentPageDepartamentos, setCurrentPageDepartamentos] =
		useState<number>(1);
	const pageSizeDepartamentos = 10;

	const handleOpenModal = (
		title: string,
		message: string,
		onConfirm: () => void
	) => {
		setModalTitle(title);
		setModalMessage(message);
		setModalVisible(true);
		setFn(() => onConfirm);
	};

	const handleCloseModal = () => {
		setModalVisible(false);
		setModalMessage("");
	};

	const handleConfirmModal = () => {
		router.push("/dashboard/departments/departamentoJefe/");
	};

	const fetchResoluciones = useCallback(
		async (url: string) => {
			setLoadingResoluciones(true);
			try {
				console.log("Fetching resoluciones from URL:", url);
				const response = await API.get(url);
				setResoluciones(response.data.results);
				setNextUrl(
					response.data.next ? normalizeUrl(response.data.next) : null
				);
				setPrevUrl(
					response.data.previous ? normalizeUrl(response.data.previous) : null
				);
				setTotalItems(response.data.count);

				// Calcular la página actual usando offset
				const fullUrl = url.startsWith("http")
					? url
					: `${window.location.origin}${url}`;
				const offset = new URL(fullUrl).searchParams.get("offset") || "0";
				setCurrentPage(Math.floor(Number(offset) / pageSize) + 1);
			} catch (error) {
				console.error("Error al cargar las resoluciones:", error);
				setResoluciones([]);
				setNextUrl(null);
				setPrevUrl(null);
				setTotalItems(0);
			} finally {
				setLoadingResoluciones(false);
			}
		},
		[pageSize]
	);

	const fetchJefes = useCallback(
		async (url: string) => {
			try {
				console.log("Fetching jefes from URL:", url);
				const response = await API.get(url);
				setJefes(response.data.results);
				setNextUrlJefes(
					response.data.next ? normalizeUrl(response.data.next) : null
				);
				setPrevUrlJefes(
					response.data.previous ? normalizeUrl(response.data.previous) : null
				);
				setTotalItemsJefes(response.data.count);

				// Calcular la página actual usando offset
				const fullUrl = url.startsWith("http")
					? url
					: `${window.location.origin}${url}`;
				const offset = new URL(fullUrl).searchParams.get("offset") || "0";
				setCurrentPageJefes(Math.floor(Number(offset) / pageSizeJefes) + 1);
			} catch (error) {
				console.error("Error al cargar los jefes:", error);
				setJefes([]);
				setNextUrlJefes(null);
				setPrevUrlJefes(null);
				setTotalItemsJefes(0);
			}
		},
		[pageSizeJefes]
	);

	const fetchDepartamentos = useCallback(
		async (url: string) => {
			try {
				console.log("Fetching departamentos from URL:", url);
				const response = await API.get(url);
				setDepartamentos(response.data.results);
				setNextUrlDepartamentos(
					response.data.next ? normalizeUrl(response.data.next) : null
				);
				setPrevUrlDepartamentos(
					response.data.previous ? normalizeUrl(response.data.previous) : null
				);
				setTotalItemsDepartamentos(response.data.count);

				// Calcular la página actual usando offset
				const fullUrl = url.startsWith("http")
					? url
					: `${window.location.origin}${url}`;
				const offset = new URL(fullUrl).searchParams.get("offset") || "0";
				setCurrentPageDepartamentos(
					Math.floor(Number(offset) / pageSizeDepartamentos) + 1
				);
			} catch (error) {
				console.error("Error al cargar los departamentos:", error);
				setDepartamentos([]);
				setNextUrlDepartamentos(null);
				setPrevUrlDepartamentos(null);
				setTotalItemsDepartamentos(0);
			}
		},
		[pageSizeDepartamentos]
	);

	useEffect(() => {
		if (openResolucion) fetchResoluciones(currentUrl);
	}, [openResolucion, currentUrl, fetchResoluciones]);

	useEffect(() => {
		if (openJefe) fetchJefes(currentUrlJefes);
	}, [openJefe, currentUrlJefes, fetchJefes]);

	useEffect(() => {
		if (openDepartamento) fetchDepartamentos(currentUrlDepartamentos);
	}, [openDepartamento, currentUrlDepartamentos, fetchDepartamentos]);

	const filtrarResoluciones = async () => {
		// Si solo se especifica uno de los filtros de número, buscar en ambos campos
		if (
			(filtroNroExpediente && !filtroNroResolucion) ||
			(!filtroNroExpediente && filtroNroResolucion)
		) {
			const busqueda = filtroNroExpediente || filtroNroResolucion;

			try {
				// Primero buscar por número de expediente
				let url = `/facet/resolucion/?nexpediente__icontains=${encodeURIComponent(
					busqueda
				)}`;
				let response = await API.get(url);

				// Si no encuentra resultados, buscar por número de resolución
				if (response.data.results.length === 0) {
					url = `/facet/resolucion/?nresolucion__icontains=${encodeURIComponent(
						busqueda
					)}`;
					response = await API.get(url);
				}

				// Aplicar filtros adicionales si existen
				if (filtroTipo || filtroFechaDesde || filtroFechaHasta || filtroFechaExacta) {
					const params = new URLSearchParams();
					if (response.data.results.length > 0) {
						// Si encontramos resultados, aplicar filtros adicionales
						if (filtroTipo) params.append("tipo", filtroTipo);
						if (filtroFechaExacta) {
							params.append("fecha", formatFechaParaBackend(filtroFechaExacta) || "");
						} else {
							if (filtroFechaDesde)
								params.append(
									"fecha__gte",
									formatFechaParaBackend(filtroFechaDesde) || ""
								);
							if (filtroFechaHasta)
								params.append(
									"fecha__lte",
									formatFechaParaBackend(filtroFechaHasta) || ""
								);
						}

						// Combinar con el filtro que funcionó
						if (url.includes("nexpediente__icontains")) {
							params.append("nexpediente__icontains", busqueda);
						} else {
							params.append("nresolucion__icontains", busqueda);
						}

						url = `/facet/resolucion/?${params.toString()}`;
						response = await API.get(url);
					}
				}

				setResoluciones(response.data.results);
				setNextUrl(
					response.data.next ? normalizeUrl(response.data.next) : null
				);
				setPrevUrl(
					response.data.previous ? normalizeUrl(response.data.previous) : null
				);
				setTotalItems(response.data.count);
				return;
			} catch (error) {
				console.error("Error filtering resoluciones:", error);
			}
		}

		// Filtrado tradicional cuando se usan ambos campos o ninguno
		let url = `/facet/resolucion/?`;
		const params = new URLSearchParams();

		if (filtroNroExpediente)
			params.append("nexpediente__icontains", filtroNroExpediente);
		if (filtroNroResolucion)
			params.append("nresolucion__icontains", filtroNroResolucion);
	if (filtroTipo) params.append("tipo", filtroTipo);
	if (filtroFechaExacta) {
		params.append("fecha", formatFechaParaBackend(filtroFechaExacta) || "");
	} else {
		if (filtroFechaDesde)
			params.append("fecha__gte", formatFechaParaBackend(filtroFechaDesde) || "");
		if (filtroFechaHasta)
			params.append("fecha__lte", formatFechaParaBackend(filtroFechaHasta) || "");
	}

		url += params.toString();
		setCurrentUrl(normalizeUrl(url));
	};

	const filtrarJefes = () => {
		let url = `/facet/jefe/list_jefes_persona/?`;
		const params = new URLSearchParams();

		if (filtroNombre) params.append("persona__nombre__icontains", filtroNombre);
		if (filtroDni) params.append("persona__dni__icontains", filtroDni);

		url += params.toString();
		console.log("Filtro URL generada:", url);
		setCurrentPageJefes(1); // Reiniciar a página 1
		setCurrentUrlJefes(normalizeUrl(url));
	};

	const filtrarDepartamentos = () => {
		let url = `/facet/departamento/?`;
		const params = new URLSearchParams();

		if (filtroDepartamento)
			params.append("nombre__icontains", filtroDepartamento);

		url += params.toString();
		setCurrentUrlDepartamentos(normalizeUrl(url));
	};

	const crearNuevoJefeDepartamento = async () => {
		// Validación de campos requeridos
		const camposFaltantes = [];

		if (!selectedResolucion) {
			camposFaltantes.push("Resolución");
		}
		if (!jefe) {
			camposFaltantes.push("Jefe");
		}
		if (!departamento) {
			camposFaltantes.push("Departamento");
		}
		if (!fechaInicio) {
			camposFaltantes.push("Fecha de Inicio");
		}
		if (!fechaFin) {
			camposFaltantes.push("Fecha de Fin");
		}
		if (!estado) {
			camposFaltantes.push("Estado");
		}

		// Si faltan campos, mostrar error
		if (camposFaltantes.length > 0) {
			const mensaje = `Faltan los siguientes campos obligatorios:\n\n${camposFaltantes.join(
				"\n"
			)}`;
			handleOpenModal("Error", mensaje, () => {});
			return;
		}

		// Validación de fechas
		const fechaInicioDate = fechaInicio?.toDate();
		const fechaFinDate = fechaFin?.toDate();

		if (fechaInicioDate && fechaFinDate && fechaInicioDate >= fechaFinDate) {
			handleOpenModal(
				"Error",
				"La fecha de inicio debe ser anterior a la fecha de fin.",
				() => {}
			);
			return;
		}

		// Validación de fechas futuras (solo para fecha de fin)
		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);

		if (fechaFinDate && fechaFinDate < hoy) {
			handleOpenModal(
				"Error",
				"La fecha de fin no puede ser anterior a hoy.",
				() => {}
			);
			return;
		}

		const nuevoJefeDepartamento = {
			departamento: departamento?.id,
			jefe: jefe?.id,
			resolucion: selectedResolucion?.id,
			fecha_de_inicio: formatFechaParaBackend(fechaInicio),
			fecha_de_fin: formatFechaParaBackend(fechaFin),
			observaciones: observaciones,
			estado: estado === "1" ? 1 : 0,
		};

		try {
			await API.post(`/facet/jefe-departamento/`, nuevoJefeDepartamento);
			handleOpenModal(
				"Éxito",
				"Se creó el jefe de departamento con éxito",
				handleConfirmModal
			);
		} catch (error: any) {
			console.error(error);

			// Manejo específico de errores del backend
			let mensajeError = "No se pudo realizar la acción.";

			if (error.response?.data) {
				const errorData = error.response.data;

				if (errorData.detail) {
					mensajeError = errorData.detail;
				} else if (typeof errorData === "object") {
					// Si hay errores específicos por campo
					const erroresCampos = Object.entries(errorData)
						.map(
							([campo, errores]) =>
								`${campo}: ${
									Array.isArray(errores) ? errores.join(", ") : errores
								}`
						)
						.join("\n");
					mensajeError = `Errores de validación:\n\n${erroresCampos}`;
				}
			}

			handleOpenModal("Error", mensajeError, () => {});
		}
	};

	return (
		<DashboardMenu>
			<FormContainer title="Agregar Jefe Departamento">
				<FormSection title="Selecciones Requeridas">
					<SelectorButton required
						label="Seleccionar Resolución"
						onClick={() => setOpenResolucion(true)}
						selectedLabel="Nro Resolución"
						selectedValue={
							selectedResolucion
								? `${selectedResolucion.nresolucion} (Exp. ${selectedResolucion.nexpediente})`
								: undefined
						}
					/>
					<SelectorButton required
						label="Seleccionar Jefe"
						onClick={() => setOpenJefe(true)}
						selectedLabel="Jefe"
						selectedValue={
							jefe ? `${jefe.persona.nombre} ${jefe.persona.apellido}` : undefined
						}
					/>
					<SelectorButton required
						label="Seleccionar Departamento"
						onClick={() => setOpenDepartamento(true)}
						selectedLabel="Departamento"
						selectedValue={departamento?.nombre}
					/>
				</FormSection>

				<FormSection title="Información Adicional">
					<FormField
						label="Observaciones"
						value={observaciones}
						onChange={(e) => setObservaciones(e.target.value)}
						multiline
						rows={2}
					/>
					<FormField
						label="Estado"
						value={estado}
						onChange={(e) => setEstado(e.target.value)}
						options={[
							{ value: "1", label: "Activo" },
							{ value: "0", label: "Inactivo" },
						]}
					/>
				</FormSection>

				<FormSection title="Período de Gestión">
					<FormDatePicker
						label="Fecha de Inicio"
						value={fechaInicio}
						onChange={setFechaInicio}
					/>
					<FormDatePicker
						label="Fecha de Fin"
						value={fechaFin}
						onChange={setFechaFin}
					/>
				</FormSection>

				<FormActions>
					<FormButton variant="success" onClick={crearNuevoJefeDepartamento}>
						Crear Jefe Departamento
					</FormButton>
				</FormActions>

				{/* Dialog para Seleccionar Resolución */}
				<Dialog
					open={openResolucion}
					onClose={() => setOpenResolucion(false)}
					maxWidth="lg"
					fullWidth
					PaperProps={{
						style: {
							borderRadius: "12px",
							boxShadow:
								"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
						},
					}}
				>
					<DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
						Seleccionar Resolución
					</DialogTitle>
				<DialogContent className="p-4">
					{/* Filtros Compactos - Resolución */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 mb-5 mt-2">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<div className="p-1.5 bg-blue-100 rounded-lg">
									<FunnelIcon className="h-4 w-4 text-blue-600" />
								</div>
								<span className="text-sm font-bold text-gray-800">Filtros de Búsqueda</span>
							</div>
							<button
							onClick={() => {
								setFiltroNroExpediente("");
								setFiltroNroResolucion("");
								setFiltroTipo("");
								setFiltroFechaDesde(null);
								setFiltroFechaHasta(null);
								setFiltroFechaExacta(null);
								setCurrentUrl("/facet/resolucion/");
							}}
								className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-red-50"
							>
								<XMarkIcon className="h-3.5 w-3.5" />
								<span>Limpiar</span>
							</button>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
							<div className="relative">
								<input
									type="text"
									value={filtroNroExpediente}
									onChange={(e) => setFiltroNroExpediente(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && filtrarResoluciones()}
									placeholder="Nro Expediente"
									className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
										focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
										hover:border-blue-400 hover:bg-white
										transition-all duration-200
										text-sm text-gray-700 placeholder-gray-400
										shadow-sm pr-9"
								/>
								<MagnifyingGlassIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							</div>
							<div className="relative">
								<input
									type="text"
									value={filtroNroResolucion}
									onChange={(e) => setFiltroNroResolucion(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && filtrarResoluciones()}
									placeholder="Nro Resolución"
									className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
										focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
										hover:border-blue-400 hover:bg-white
										transition-all duration-200
										text-sm text-gray-700 placeholder-gray-400
										shadow-sm pr-9"
								/>
								<MagnifyingGlassIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							</div>
							<CompactFilterSelect
								label=""
								value={filtroTipo}
								onChange={setFiltroTipo}
								options={[
									{ value: "Rector", label: "Rector" },
									{ value: "Decano", label: "Decano" },
									{ value: "Consejo_Superior", label: "Consejo Superior" },
									{ value: "Consejo_Directivo", label: "Consejo Directivo" },
								]}
								placeholder="Todos los tipos"
							/>
						<div className="relative">
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DatePicker
									label="Fecha Exacta"
									value={filtroFechaExacta}
									onChange={(date) => setFiltroFechaExacta(date)}
									format="DD/MM/YYYY"
									slotProps={{
										textField: {
											fullWidth: true,
											variant: "outlined",
											size: "small",
											className: "bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
										},
									}}
								/>
							</LocalizationProvider>
						</div>
						<div className="relative">
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DatePicker
									label="Fecha Desde"
									value={filtroFechaDesde}
									onChange={(date) => setFiltroFechaDesde(date)}
									format="DD/MM/YYYY"
									slotProps={{
										textField: {
											fullWidth: true,
											variant: "outlined",
											size: "small",
											className: "bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
										},
									}}
								/>
							</LocalizationProvider>
						</div>
						<div className="relative">
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DatePicker
									label="Fecha Hasta"
									value={filtroFechaHasta}
									onChange={(date) => setFiltroFechaHasta(date)}
									format="DD/MM/YYYY"
									slotProps={{
										textField: {
											fullWidth: true,
											variant: "outlined",
											size: "small",
											className: "bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
										},
									}}
								/>
							</LocalizationProvider>
						</div>
					</div>

						<div className="flex justify-end pt-2 border-t border-gray-100">
							<button
								onClick={filtrarResoluciones}
								className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 
									hover:from-blue-600 hover:to-blue-700 
									text-white px-4 py-2 rounded-lg shadow-md shadow-blue-500/20
									transition-all duration-200 text-sm font-semibold
									hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
							>
								<MagnifyingGlassIcon className="h-4 w-4" />
								<span>Buscar</span>
							</button>
						</div>
					</div>

				{loadingResoluciones ? (
						<div className="flex flex-col justify-center items-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
							<Typography className="mt-4 text-gray-600 font-medium">
								Cargando resoluciones...
							</Typography>
						</div>
					) : (
						<>
							<TableContainer
								component={Paper}
								className="shadow-lg rounded-lg overflow-hidden"
								style={{ maxHeight: "400px", overflow: "auto" }}
							>
								<Table size="small">
									<TableHead className="bg-blue-100 sticky top-0 z-10">
										<TableRow>
											<TableCell className="text-blue-800 font-bold py-2 uppercase text-xs tracking-wider">
												Nro Expediente
											</TableCell>
											<TableCell className="text-blue-800 font-bold py-2 uppercase text-xs tracking-wider">
												Nro Resolución
											</TableCell>
											<TableCell className="text-blue-800 font-bold py-2 uppercase text-xs tracking-wider">
												Tipo
											</TableCell>
											<TableCell className="text-blue-800 font-bold py-2 uppercase text-xs tracking-wider">
												Fecha
											</TableCell>
											<TableCell className="text-white font-semibold py-2 text-center">
												Acción
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{resoluciones.length > 0 ? (
											resoluciones.map((resolucion) => (
												<TableRow
													key={resolucion.id}
													className="hover:bg-blue-50 transition-colors duration-200"
												>
													<TableCell className="font-medium py-2">
														{resolucion.nexpediente}
													</TableCell>
													<TableCell className="font-medium py-2">
														{resolucion.nresolucion}
													</TableCell>
													<TableCell className="font-medium py-2">
														{resolucion.tipo}
													</TableCell>
													<TableCell className="font-medium py-2">
														{resolucion.fecha}
													</TableCell>
													<TableCell className="py-2 text-center">
														<button
															onClick={() => {
																setSelectedResolucion(resolucion);
																setOpenResolucion(false);
															}}
															className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm"
														>
															Seleccionar
														</button>
													</TableCell>
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell colSpan={5} className="text-center py-8">
													<div className="flex flex-col items-center justify-center">
														<div className="bg-gray-100 rounded-full p-4 mb-3">
															<svg
																className="w-8 h-8 text-gray-400"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
																/>
															</svg>
														</div>
														<p className="text-gray-500 font-medium">
															No se encontraron resoluciones
														</p>
														<p className="text-gray-400 text-sm mt-1">
															Intenta con otros filtros
														</p>
													</div>
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</TableContainer>

							<div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
								<div className="flex items-center gap-2">
									<button
										onClick={() => prevUrl && setCurrentUrl(normalizeUrl(prevUrl))}
										disabled={!prevUrl || loadingResoluciones}
										className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
											!prevUrl
												? "bg-gray-300 text-gray-500 cursor-not-allowed"
												: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
										}`}
									>
										← Anterior
									</button>
								</div>

								<div className="flex items-center gap-3">
									<Typography className="font-medium text-gray-600 text-sm">
										Página
									</Typography>
									<div className="flex items-center gap-2">
										<input
											type="number"
											min={1}
											max={Math.ceil(totalItems / pageSize)}
											value={currentPage}
											onChange={(e) => {
												const page = parseInt(e.target.value);
												if (
													page >= 1 &&
													page <= Math.ceil(totalItems / pageSize)
												) {
													const offset = (page - 1) * pageSize;
													const baseUrl = currentUrl.split("?")[0];
													const params = new URLSearchParams(
														currentUrl.split("?")[1] || ""
													);
													params.set("offset", offset.toString());
													params.set("limit", pageSize.toString());
													setCurrentUrl(`${baseUrl}?${params.toString()}`);
												}
											}}
											className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											disabled={loadingResoluciones}
										/>
										<Typography className="font-medium text-gray-600 text-sm">
											de {Math.ceil(totalItems / pageSize)}
										</Typography>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<button
										onClick={() => nextUrl && setCurrentUrl(normalizeUrl(nextUrl))}
										disabled={!nextUrl || loadingResoluciones}
										className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
											!nextUrl
												? "bg-gray-300 text-gray-500 cursor-not-allowed"
												: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
										}`}
									>
										Siguiente →
									</button>
								</div>
							</div>

							<div className="flex justify-center mt-2">
								<Typography className="text-gray-500 text-xs">
									Mostrando {resoluciones.length} de {totalItems} resoluciones
								</Typography>
							</div>
						</>
					)}
				</DialogContent>
				<DialogActions className="p-4 bg-gray-50">
					<div className="flex justify-between items-center w-full">
						{selectedResolucion && (
							<div className="text-left">
								<Typography className="text-sm text-gray-600">
									<span className="font-semibold text-blue-600">Seleccionada:</span>{" "}
									Res. N° {selectedResolucion.nresolucion} - Exp. {selectedResolucion.nexpediente}
								</Typography>
							</div>
						)}
						<div className="flex gap-2">
							<button
								onClick={() => setOpenResolucion(false)}
								className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 font-medium bg-white shadow-sm"
							>
								Cerrar
							</button>
							{selectedResolucion && (
								<button
									onClick={() => setOpenResolucion(false)}
									className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-200 font-medium shadow-md"
								>
									Confirmar Selección
								</button>
							)}
						</div>
					</div>
				</DialogActions>
				</Dialog>

				{/* Dialog para Seleccionar Jefe */}
				<Dialog
					open={openJefe}
					onClose={() => setOpenJefe(false)}
					maxWidth="lg"
					fullWidth
					PaperProps={{
						style: {
							borderRadius: "12px",
							boxShadow:
								"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
						},
					}}
				>
					<DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
						Seleccionar Jefe
					</DialogTitle>
			<DialogContent className="p-4">
					{/* Filtros Compactos - Jefe */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 mb-5 mt-2">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<div className="p-1.5 bg-blue-100 rounded-lg">
									<FunnelIcon className="h-4 w-4 text-blue-600" />
								</div>
								<span className="text-sm font-bold text-gray-800">Filtros de Búsqueda</span>
							</div>
							<button
								onClick={() => {
									setFiltroNombre("");
									setFiltroDni("");
									setCurrentUrlJefes("/facet/jefe/list_jefes_persona/");
								}}
								className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-red-50"
							>
								<XMarkIcon className="h-3.5 w-3.5" />
								<span>Limpiar</span>
							</button>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
							<div className="relative">
								<input
									type="text"
									value={filtroNombre}
									onChange={(e) => setFiltroNombre(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && filtrarJefes()}
									placeholder="Nombre"
									className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
										focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
										hover:border-blue-400 hover:bg-white
										transition-all duration-200
										text-sm text-gray-700 placeholder-gray-400
										shadow-sm pr-9"
								/>
								<MagnifyingGlassIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							</div>
							<div className="relative">
								<input
									type="text"
									value={filtroDni}
									onChange={(e) => setFiltroDni(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && filtrarJefes()}
									placeholder="DNI"
									className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
										focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
										hover:border-blue-400 hover:bg-white
										transition-all duration-200
										text-sm text-gray-700 placeholder-gray-400
										shadow-sm pr-9"
								/>
								<MagnifyingGlassIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							</div>
						</div>

						<div className="flex justify-end pt-2 border-t border-gray-100">
							<button
								onClick={filtrarJefes}
								className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 
									hover:from-blue-600 hover:to-blue-700 
									text-white px-4 py-2 rounded-lg shadow-md shadow-blue-500/20
									transition-all duration-200 text-sm font-semibold
									hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
							>
								<MagnifyingGlassIcon className="h-4 w-4" />
								<span>Buscar</span>
							</button>
						</div>
					</div>

					<TableContainer
							component={Paper}
							className="shadow-lg rounded-lg overflow-hidden"
							style={{ maxHeight: "400px", overflow: "auto" }}
						>
							<Table size="small">
								<TableHead className="bg-blue-100 sticky top-0 z-10">
									<TableRow>
										<TableCell className="text-blue-800 font-bold py-2 uppercase text-xs tracking-wider">
											Nombre
										</TableCell>
										<TableCell className="text-blue-800 font-bold py-2 uppercase text-xs tracking-wider">
											DNI
										</TableCell>
										<TableCell className="text-blue-800 font-bold py-2 uppercase text-xs tracking-wider">
											Seleccionar
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{jefes.map((jefe) => (
										<TableRow
											key={jefe.id}
											className="hover:bg-blue-50 transition-colors duration-200"
										>
											<TableCell className="font-medium py-2">
												{`${jefe.persona.nombre} ${jefe.persona.apellido}`}
											</TableCell>
											<TableCell className="font-medium py-2">
												{jefe.persona.dni}
											</TableCell>
											<TableCell className="py-2">
												<button
													onClick={() => {
														setJefe(jefe);
														setOpenJefe(false);
													}}
													className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm"
												>
													Seleccionar
												</button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>

						<div className="flex justify-between items-center mt-4">
							<button
								onClick={() =>
									prevUrlJefes && setCurrentUrlJefes(normalizeUrl(prevUrlJefes))
								}
								disabled={!prevUrlJefes}
								className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
									!prevUrlJefes
										? "bg-gray-300 text-gray-500 cursor-not-allowed"
										: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
								}`}
							>
								Anterior
							</button>
							<Typography className="font-medium text-gray-700 text-sm">
								Página {currentPageJefes} de{" "}
								{Math.ceil(totalItemsJefes / pageSizeJefes)}
							</Typography>
							<button
								onClick={() =>
									nextUrlJefes && setCurrentUrlJefes(normalizeUrl(nextUrlJefes))
								}
								disabled={!nextUrlJefes}
								className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
									!nextUrlJefes
										? "bg-gray-300 text-gray-500 cursor-not-allowed"
										: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
								}`}
							>
								Siguiente
							</button>
						</div>
					</DialogContent>
					<DialogActions className="p-4">
						<button
							onClick={() => setOpenJefe(false)}
							className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 font-medium"
						>
							Cerrar
						</button>
					</DialogActions>
				</Dialog>

				{/* Dialog para Seleccionar Departamento */}
				<Dialog
					open={openDepartamento}
					onClose={() => setOpenDepartamento(false)}
					maxWidth="lg"
					fullWidth
					PaperProps={{
						style: {
							borderRadius: "12px",
							boxShadow:
								"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
						},
					}}
				>
					<DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
						Seleccionar Departamento
					</DialogTitle>
			<DialogContent className="p-4">
					{/* Filtros Compactos - Departamento */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 mb-5 mt-2">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<div className="p-1.5 bg-blue-100 rounded-lg">
									<FunnelIcon className="h-4 w-4 text-blue-600" />
								</div>
								<span className="text-sm font-bold text-gray-800">Filtros de Búsqueda</span>
							</div>
							<button
								onClick={() => {
									setFiltroDepartamento("");
									setCurrentUrlDepartamentos("/facet/departamento/");
								}}
								className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-red-50"
							>
								<XMarkIcon className="h-3.5 w-3.5" />
								<span>Limpiar</span>
							</button>
						</div>

						<div className="grid grid-cols-1 gap-3 mb-3">
							<div className="relative">
								<input
									type="text"
									value={filtroDepartamento}
									onChange={(e) => setFiltroDepartamento(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && filtrarDepartamentos()}
									placeholder="Nombre del Departamento"
									className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
										focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
										hover:border-blue-400 hover:bg-white
										transition-all duration-200
										text-sm text-gray-700 placeholder-gray-400
										shadow-sm pr-9"
								/>
								<MagnifyingGlassIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							</div>
						</div>

						<div className="flex justify-end pt-2 border-t border-gray-100">
							<button
								onClick={filtrarDepartamentos}
								className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 
									hover:from-blue-600 hover:to-blue-700 
									text-white px-4 py-2 rounded-lg shadow-md shadow-blue-500/20
									transition-all duration-200 text-sm font-semibold
									hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
							>
								<MagnifyingGlassIcon className="h-4 w-4" />
								<span>Buscar</span>
							</button>
						</div>
					</div>

					<TableContainer
							component={Paper}
							className="shadow-lg rounded-lg overflow-hidden"
							style={{ maxHeight: "400px", overflow: "auto" }}
						>
							<Table size="small">
								<TableHead className="bg-blue-100 sticky top-0 z-10">
									<TableRow>
										<TableCell className="text-blue-800 font-bold py-2 uppercase text-xs tracking-wider">
											Nombre
										</TableCell>
										<TableCell className="text-blue-800 font-bold py-2 uppercase text-xs tracking-wider">
											Seleccionar
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{departamentos.map((departamento) => (
										<TableRow
											key={departamento.id}
											className="hover:bg-blue-50 transition-colors duration-200"
										>
											<TableCell className="font-medium py-2">
												{departamento.nombre}
											</TableCell>
											<TableCell className="py-2">
												<button
													onClick={() => {
														setDepartamento(departamento);
														setOpenDepartamento(false);
													}}
													className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm"
												>
													Seleccionar
												</button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>

						<div className="flex justify-between items-center mt-4">
							<button
								onClick={() =>
									prevUrlDepartamentos &&
									setCurrentUrlDepartamentos(normalizeUrl(prevUrlDepartamentos))
								}
								disabled={!prevUrlDepartamentos}
								className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
									!prevUrlDepartamentos
										? "bg-gray-300 text-gray-500 cursor-not-allowed"
										: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
								}`}
							>
								Anterior
							</button>
							<Typography className="font-medium text-gray-700 text-sm">
								Página {currentPageDepartamentos} de{" "}
								{Math.ceil(totalItemsDepartamentos / pageSizeDepartamentos)}
							</Typography>
							<button
								onClick={() =>
									nextUrlDepartamentos &&
									setCurrentUrlDepartamentos(normalizeUrl(nextUrlDepartamentos))
								}
								disabled={!nextUrlDepartamentos}
								className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
									!nextUrlDepartamentos
										? "bg-gray-300 text-gray-500 cursor-not-allowed"
										: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
								}`}
							>
								Siguiente
							</button>
						</div>
					</DialogContent>
					<DialogActions className="p-4">
						<button
							onClick={() => setOpenDepartamento(false)}
							className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 font-medium"
						>
							Cerrar
						</button>
					</DialogActions>
				</Dialog>

				<BasicModal
					open={modalVisible}
					onClose={handleCloseModal}
					title={modalTitle}
					content={modalMessage}
					onConfirm={fn}
				/>
			</FormContainer>
		</DashboardMenu>
	);
};

export default withAuth(CrearDepartamentoJefe);
