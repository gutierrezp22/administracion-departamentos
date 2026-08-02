import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import API from "@/api/axiosConfig";
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { exportToExcel } from "@/utils/exportToExcel";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import DashboardMenu from "../../..";
import withAuth from "../../../../../components/withAut";
import { API_BASE_URL } from "../../../../../utils/config";
import {
	FilterContainer,
	FilterInput,
	EstadoFilter,
} from "../../../../../components/Filters";
import ResponsiveTable from "../../../../../components/ResponsiveTable";
import ActionMenu from "../../../../../components/ActionMenu";
import LoadingOverlay from "@/components/LoadingOverlay";
import Pagination from "@/components/Pagination";
import DetailModal, { StatusBadge } from "@/components/DetailModal";
import { normalizeUrl } from "@/utils/urlHelpers";

const ListaNoDocentes = () => {
	interface NoDocente {
		id: number;
		persona: number;
		persona_detalle: {
			id: number;
			nombre: string;
			apellido: string;
			dni: string;
			legajo: string;
			telefono: string;
			email: string;
		};
		estado: string;
	}

	const [noDocentes, setNoDocentes] = useState<NoDocente[]>([]);
	const [filtroNombre, setFiltroNombre] = useState("");
	const [filtroApellido, setFiltroApellido] = useState("");
	const [filtroDni, setFiltroDni] = useState("");
	const [filtroLegajo, setFiltroLegajo] = useState("");
	const [filtroEstado, setFiltroEstado] = useState<string>("1");
	const [nextUrl, setNextUrl] = useState<string | null>(null);
	const [prevUrl, setPrevUrl] = useState<string | null>(null);
	const [currentUrl, setCurrentUrl] = useState<string>(
		`/facet/nodocente/?estado=1`
	);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [pageSize, setPageSize] = useState<number>(10);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [viewNoDocente, setViewNoDocente] = useState<NoDocente | null>(null);
	const [modalViewVisible, setModalViewVisible] = useState(false);

	const router = useRouter();

	useEffect(() => {
		fetchData(currentUrl);
	}, [currentUrl]);

	const fetchData = async (url: string) => {
		try {
			setIsLoading(true);
			const response = await API.get(url);
			setNoDocentes(response.data.results);
			setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
			setPrevUrl(
				response.data.previous ? normalizeUrl(response.data.previous) : null
			);
			setTotalItems(response.data.count);
			// Pequeño delay para asegurar que los estilos se cargan
			setTimeout(() => setIsLoading(false), 500);
		} catch (error) {
			setIsLoading(false);
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "Error al obtener los datos.",
			});
		}
	};

	const filtrarNoDocentes = () => {
		let url = `/facet/nodocente/?`;
		const params = new URLSearchParams();
		if (filtroNombre) params.append("persona__nombre__icontains", filtroNombre);
		if (filtroApellido)
			params.append("persona__apellido__icontains", filtroApellido);
		if (filtroDni) params.append("persona__dni__icontains", filtroDni);
		if (filtroLegajo) params.append("persona__legajo__icontains", filtroLegajo);
		if (filtroEstado === "todos") {
			params.append("show_all", "true");
		} else if (filtroEstado && filtroEstado !== "todos") {
			params.append("estado", filtroEstado.toString());
		}
		url += params.toString();
		setCurrentPage(1);
		setCurrentUrl(url);
	};

	const limpiarFiltros = () => {
		setFiltroNombre("");
		setFiltroApellido("");
		setFiltroDni("");
		setFiltroLegajo("");
		setFiltroEstado("1");
		setCurrentPage(1);
		setCurrentUrl(`/facet/nodocente/?estado=1`);
	};

	const descargarExcel = async () => {
		try {
			let allNoDocentes: NoDocente[] = [];
			let url = `/facet/nodocente/?`;
			const params = new URLSearchParams();

			if (filtroNombre !== "")
				params.append("persona__nombre__icontains", filtroNombre);
			if (filtroApellido !== "")
				params.append("persona__apellido__icontains", filtroApellido);
			if (filtroDni !== "") params.append("persona__dni__icontains", filtroDni);
			if (filtroLegajo !== "")
				params.append("persona__legajo__icontains", filtroLegajo);
			if (filtroEstado === "todos") {
				params.append("show_all", "true");
			} else if (filtroEstado !== "" && filtroEstado !== "todos") {
				params.append("estado", filtroEstado.toString());
			}
			url += params.toString();

			while (url) {
				const response = await API.get(url);
				const { results, next } = response.data;
				allNoDocentes = [...allNoDocentes, ...results];
				url = next ? normalizeUrl(next) : "";
			}

			await exportToExcel({
        fileName: "no_docentes.xlsx",
        sheetName: "NoDocentes",
        rows: allNoDocentes.map((noDocente) => ({
					Nombre: noDocente.persona_detalle?.nombre || "N/A",
					Apellido: noDocente.persona_detalle?.apellido || "N/A",
					DNI: noDocente.persona_detalle?.dni || "N/A",
					Legajo: noDocente.persona_detalle?.legajo || "N/A",
					Teléfono: noDocente.persona_detalle?.telefono || "N/A",
					Email: noDocente.persona_detalle?.email || "N/A",
					Estado: noDocente.estado === "1" ? "Activo" : "Inactivo",
				})),
      });
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: "Error al descargar",
				text: "Se produjo un error al exportar los datos.",
			});
		}
	};

	const verNoDocente = async (id: number) => {
		try {
			const response = await API.get(`/facet/nodocente/${id}/`);
			setViewNoDocente(response.data);
			setModalViewVisible(true);
		} catch (error) {
			Swal.fire(
				"Error!",
				"No se pudo obtener los datos del no docente.",
				"error"
			);
		}
	};

	const eliminarNoDocente = async (id: number) => {
		try {
			const result = await Swal.fire({
				title: "¿Estás seguro?",
				text: "Esta acción no se puede deshacer",
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#d33",
				cancelButtonColor: "#3085d6",
				confirmButtonText: "Sí, eliminar",
				cancelButtonText: "Cancelar",
			});

			if (result.isConfirmed) {
				await API.delete(`/facet/nodocente/${id}/`);
				Swal.fire("Eliminado!", "El no docente ha sido eliminado.", "success");
				fetchData(currentUrl);
			}
		} catch (error) {
			Swal.fire("Error!", "No se pudo eliminar el no docente.", "error");
		}
	};

	const totalPages = Math.ceil(totalItems / pageSize);

	return (
		<DashboardMenu>
			<div className="p-6">
			<div className="bg-white rounded-lg shadow-lg">
				<div className="p-6 border-b border-gray-200">
					<h1 className="text-2xl font-bold text-gray-800">No Docentes</h1>
				</div>

				<div className="p-6">
					<div className="flex gap-4 mb-6">
						<button
							onClick={() =>
								router.push("/dashboard/persons/noDocentes/create")
							}
							className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-semibold text-sm"
						>
							<AddIcon /> Agregar No Docente
						</button>
						<button
							onClick={descargarExcel}
							className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 font-semibold text-sm"
						>
							<FileDownloadIcon /> Descargar Excel
						</button>
					</div>

					<FilterContainer onApply={filtrarNoDocentes} onClear={limpiarFiltros}>
						<FilterInput
							label="Nombre"
							value={filtroNombre}
							onChange={setFiltroNombre}
							placeholder="Buscar por nombre"
						/>
						<FilterInput
							label="Apellido"
							value={filtroApellido}
							onChange={setFiltroApellido}
							placeholder="Buscar por apellido"
						/>
						<FilterInput
							label="DNI"
							value={filtroDni}
							onChange={setFiltroDni}
							placeholder="Buscar por DNI"
						/>
						<FilterInput
							label="Legajo"
							value={filtroLegajo}
							onChange={setFiltroLegajo}
							placeholder="Buscar por legajo"
						/>
						<EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
					</FilterContainer>

					<div className="relative">

					  {isLoading && <LoadingOverlay variant="overlay" message="Cargando..." />}

					  <ResponsiveTable dense>
						<TableHead>
							<TableRow>
								<TableCell>Nombre</TableCell>
								<TableCell>Apellido</TableCell>
								<TableCell>DNI</TableCell>
								<TableCell>Legajo</TableCell>
								<TableCell>Teléfono</TableCell>
								<TableCell>Email</TableCell>
								<TableCell>Estado</TableCell>
								<TableCell>Acciones</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{noDocentes.map((noDocente) => (
								<TableRow key={noDocente.id} className="hover:bg-gray-50">
									<TableCell>
										{noDocente.persona_detalle?.nombre || "N/A"}
									</TableCell>
									<TableCell>
										{noDocente.persona_detalle?.apellido || "N/A"}
									</TableCell>
									<TableCell>
										{noDocente.persona_detalle?.dni || "N/A"}
									</TableCell>
									<TableCell>
										{noDocente.persona_detalle?.legajo || "N/A"}
									</TableCell>
									<TableCell>
										{noDocente.persona_detalle?.telefono || "N/A"}
									</TableCell>
									<TableCell>
										{noDocente.persona_detalle?.email || "N/A"}
									</TableCell>
									<TableCell>
										<StatusBadge estado={String(noDocente.estado)} />
									</TableCell>
										<TableCell>
											<ActionMenu
												items={[
													{
														items: [
															{
																label: "Ver detalles",
																icon: <VisibilityIcon fontSize="small" />,
																onClick: () => verNoDocente(noDocente.id),
															},
															{
																label: "Editar",
																icon: <EditIcon fontSize="small" />,
																onClick: () =>
																	router.push(
																		`/dashboard/persons/noDocentes/edit/${noDocente.id}`
																	),
															},
														],
													},
													{
														items: [
															{
																label: "Eliminar",
																icon: <DeleteIcon fontSize="small" />,
																onClick: () => eliminarNoDocente(noDocente.id),
																danger: true,
															},
														],
													},
												]}
											/>
										</TableCell>
								</TableRow>
							))}
						</TableBody>
					</ResponsiveTable>
            </div>

					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPrevious={() => {
							if (prevUrl) {
								setCurrentUrl(prevUrl);
								setCurrentPage(currentPage - 1);
							}
						}}
						onNext={() => {
							if (nextUrl) {
								setCurrentUrl(nextUrl);
								setCurrentPage(currentPage + 1);
							}
						}}
						hasPrevious={!!prevUrl}
						hasNext={!!nextUrl}
					/>
				</div>
			</div>
			</div>

			{/* Modal de vista de no docente */}
			{viewNoDocente && (
				<DetailModal
					open={modalViewVisible}
					onClose={() => setModalViewVisible(false)}
					onEdit={() => {
						setModalViewVisible(false);
						router.push(`/dashboard/persons/noDocentes/edit/${viewNoDocente.id}`);
					}}
					title="Detalles del No Docente"
					sections={[
						{
							title: "Información Personal",
							fields: [
								{ label: "DNI", value: viewNoDocente.persona_detalle?.dni },
								{ label: "Legajo", value: viewNoDocente.persona_detalle?.legajo },
								{ label: "Nombres", value: viewNoDocente.persona_detalle?.nombre },
								{ label: "Apellido", value: viewNoDocente.persona_detalle?.apellido },
							],
						},
						{
							title: "Información de Contacto",
							fields: [
								{ label: "Teléfono", value: viewNoDocente.persona_detalle?.telefono },
								{ label: "Email", value: viewNoDocente.persona_detalle?.email },
								{ label: "Estado", value: <StatusBadge estado={String(viewNoDocente.estado)} /> },
							],
						},
					]}
				/>
			)}
		</DashboardMenu>
	);
};

export default withAuth(ListaNoDocentes);


