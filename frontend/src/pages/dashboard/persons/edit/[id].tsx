import { useEffect, useState } from "react";

import {
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import API from "@/api/axiosConfig";

const EditarPersona: React.FC = () => {
  const router = useRouter();
  const { id: idPersona } = router.query;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

  interface Persona {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string;
    dni: string;
    estado: 0 | 1;
    email: string;
    interno: number | null; // ⚡ Interno ahora es un número entero o null
    legajo: string;
    titulo: number | null;
  }

  interface Titulo {
    id: number;
    nombre: string;
  }

  const [persona, setPersona] = useState<Persona | null>(null);
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [legajo, setLegajo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [interno, setInterno] = useState<number | "">(""); // ⚡ Asegurar tipo seguro
  const [estado, setEstado] = useState("1");
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [tituloId, setTituloId] = useState<number | "">("");

  useEffect(() => {
    const fetchTitulos = async () => {
      try {
        const response = await API.get(`/facet/tipo-titulo/`);
        setTitulos(response.data.results);
      } catch (error) {
        console.error("Error al obtener títulos:", error);
      }
    };

    fetchTitulos();
  }, []);

  useEffect(() => {
    if (idPersona) {
      const fetchData = async () => {
        try {
          const response = await API.get(
            `/facet/persona/${idPersona}/`
          );
          const personaData = response.data;
          setPersona(personaData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      fetchData();
    }
  }, [idPersona]);

  useEffect(() => {
    if (persona) {
      setDni(persona.dni ?? "");
      setNombre(persona.nombre ?? "");
      setApellido(persona.apellido ?? "");
      setLegajo(persona.legajo ?? "");
      setTelefono(persona.telefono ?? "");
      setEmail(persona.email ?? "");
      setInterno(persona.interno ?? ""); // ⚡ Asegurar tipo seguro
      setEstado(String(persona.estado ?? "1"));
      setTituloId(persona.titulo ?? "");
    }
  }, [persona]);

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    router.push("/dashboard/persons/");
  };

  const edicionPersona = async () => {
    const personaEditada = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim() || null,
      dni: dni.trim(),
      estado: estado, // CharField, no Number
      email: email.trim() || null,
      interno: interno !== "" ? Number(interno) : null,
      legajo: legajo.trim() || null,
      titulo: tituloId || null,
    };

    try {
      await API.put(`/facet/persona/${idPersona}/`, personaEditada);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud PUT:", error);
      handleOpenModal("Error", "No se pudo realizar la acción.");
    }
  };

  const eliminarPersona = async () => {
    try {
      await API.delete(`/facet/persona/${idPersona}/`);
      handleOpenModal("Persona Eliminada", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud DELETE:", error);
      handleOpenModal("Error", "No se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Editar Persona
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nombres"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Título"
                value={tituloId}
                onChange={(e) => setTituloId(Number(e.target.value))}
                fullWidth
                variant="outlined">
                <MenuItem value="">Sin título</MenuItem>
                {titulos.map((titulo) => (
                  <MenuItem key={titulo.id} value={titulo.id}>
                    {titulo.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                fullWidth
                variant="outlined">
                <MenuItem value="1">Activo</MenuItem>
                <MenuItem value="0">Inactivo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Interno"
                type="number" // ✅ Asegurar que solo acepte números
                value={interno}
                onChange={(e) =>
                  setInterno(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                } // ✅ Conversión segura
                fullWidth
                variant="outlined"
              />
            </Grid>

            {/* ✅ Botones de acción */}
            <Grid item xs={12} marginBottom={2}>
              <button
                onClick={edicionPersona}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Editar
              </button>
              <button
                onClick={() => setConfirmarEliminacion(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200 ml-2">
                Eliminar
              </button>
            </Grid>
          </Grid>
          {/* Modales */}
          {modalVisible && (
            <div
              className="fixed inset-0 flex items-center justify-center z-[10000]"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}>
              <div className="fixed inset-0 bg-black opacity-50"></div>
              <div className="bg-white rounded-lg shadow-xl p-6 w-96 z-[10001] relative">
                <h3 className="text-xl font-bold text-center mb-2 text-gray-900">
                  {modalTitle}
                </h3>
                <hr className="my-3 border-gray-200" />
                <p className="text-gray-800 text-lg text-center mb-6 font-medium">
                  {modalMessage}
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={handleCloseModal}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium">
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
          {confirmarEliminacion && (
            <div
              className="fixed inset-0 flex items-center justify-center z-[10000]"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}>
              <div
                className="fixed inset-0 bg-black opacity-50"
                onClick={() => setConfirmarEliminacion(false)}></div>
              <div className="bg-white rounded-lg shadow-xl p-6 w-96 z-[10001] relative">
                <h3 className="text-xl font-bold text-center mb-2 text-gray-900">
                  Confirmar Eliminación
                </h3>
                <hr className="my-3 border-gray-200" />
                <p className="text-gray-800 text-lg text-center mb-6 font-medium">
                  ¿Estás seguro?
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setConfirmarEliminacion(false);
                      eliminarPersona();
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md font-medium">
                    Eliminar
                  </button>
                  <button
                    onClick={() => setConfirmarEliminacion(false)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(EditarPersona);
