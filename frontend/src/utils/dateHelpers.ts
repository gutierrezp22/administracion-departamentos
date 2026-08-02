import dayjs from "dayjs";

/**
 * Convierte una fecha de formato DD/MM/YYYY (con hora opcional) a objeto dayjs
 * @param fechaString - Fecha en formato DD/MM/YYYY o DD/MM/YYYY HH:mm:ss
 * @returns Objeto dayjs o null si la fecha es inválida
 */
export const parseFechaDDMMYYYY = (fechaString: string | null): dayjs.Dayjs | null => {
  if (!fechaString) return null;

  // Aceptar fechas con hora ("15/03/2024 10:30:00"): quedarnos con la parte de fecha
  const soloFecha = fechaString.trim().split(" ")[0];

  // Si ya viene en formato ISO (YYYY-MM-DD), parsear directo
  if (/^\d{4}-\d{2}-\d{2}/.test(soloFecha)) {
    const parsed = dayjs(soloFecha);
    return parsed.isValid() ? parsed : null;
  }

  const fechaParts = soloFecha.split('/');
  if (fechaParts.length === 3) {
    // Convertir DD/MM/YYYY a YYYY-MM-DD para dayjs
    const fechaFormateada = `${fechaParts[2]}-${fechaParts[1].padStart(2, '0')}-${fechaParts[0].padStart(2, '0')}`;
    const parsed = dayjs(fechaFormateada);
    return parsed.isValid() ? parsed : null;
  }

  return null;
};

/**
 * Convierte un objeto dayjs a formato DD/MM/YYYY
 * @param fecha - Objeto dayjs
 * @returns Fecha en formato DD/MM/YYYY o string vacío si es null o inválida
 */
export const formatFechaDDMMYYYY = (fecha: dayjs.Dayjs | null): string => {
  if (!fecha || !fecha.isValid()) return "";
  return fecha.format("DD/MM/YYYY");
};

/**
 * Convierte un objeto dayjs o string a formato YYYY-MM-DD para enviar al backend
 * @param fecha - Objeto dayjs, string en formato YYYY-MM-DD o DD/MM/YYYY, o null
 * @returns Fecha en formato YYYY-MM-DD o null si es null o inválida
 */
export const formatFechaParaBackend = (fecha: dayjs.Dayjs | string | null): string | null => {
  if (!fecha) return null;

  // Si ya es un string en formato YYYY-MM-DD (de un input date), devolverlo tal como está
  if (typeof fecha === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(fecha)) {
      return fecha;
    }
    // Soportar DD/MM/YYYY (Date.parse no lo entiende y la fecha se perdía en silencio)
    const parsedDDMM = parseFechaDDMMYYYY(fecha);
    if (parsedDDMM) {
      return parsedDDMM.format("YYYY-MM-DD");
    }
    const parsedDate = dayjs(fecha);
    return parsedDate.isValid() ? parsedDate.format("YYYY-MM-DD") : null;
  }

  // Si es un objeto dayjs
  return fecha.isValid() ? fecha.format("YYYY-MM-DD") : null;
};

/**
 * Valida si una fecha está en formato DD/MM/YYYY y es un día real del calendario
 * (rechaza 31/02, 31/04, etc.)
 * @param fechaString - Fecha a validar
 * @returns true si es válida, false en caso contrario
 */
export const isValidFechaDDMMYYYY = (fechaString: string): boolean => {
  const fechaParts = fechaString.split('/');
  if (fechaParts.length !== 3) return false;

  const dia = parseInt(fechaParts[0]);
  const mes = parseInt(fechaParts[1]);
  const anio = parseInt(fechaParts[2]);

  if (Number.isNaN(dia) || Number.isNaN(mes) || Number.isNaN(anio)) return false;
  if (anio < 1900 || anio > 2100) return false;

  // Validar contra el calendario real usando Date (mes es 0-indexado)
  const fecha = new Date(anio, mes - 1, dia);
  return (
    fecha.getFullYear() === anio &&
    fecha.getMonth() === mes - 1 &&
    fecha.getDate() === dia
  );
};
