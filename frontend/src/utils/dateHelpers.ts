import dayjs from "dayjs";

/**
 * Convierte una fecha de formato DD/MM/YYYY a objeto dayjs
 * @param fechaString - Fecha en formato DD/MM/YYYY
 * @returns Objeto dayjs o null si la fecha es inválida
 */
export const parseFechaDDMMYYYY = (fechaString: string | null): dayjs.Dayjs | null => {
  if (!fechaString) return null;
  
  const fechaParts = fechaString.split('/');
  if (fechaParts.length === 3) {
    // Convertir DD/MM/YYYY a YYYY-MM-DD para dayjs
    const fechaFormateada = `${fechaParts[2]}-${fechaParts[1].padStart(2, '0')}-${fechaParts[0].padStart(2, '0')}`;
    return dayjs(fechaFormateada);
  }
  
  return null;
};

/**
 * Convierte un objeto dayjs a formato DD/MM/YYYY
 * @param fecha - Objeto dayjs
 * @returns Fecha en formato DD/MM/YYYY o string vacío si es null
 */
export const formatFechaDDMMYYYY = (fecha: dayjs.Dayjs | null): string => {
  if (!fecha) return "";
  return fecha.format("DD/MM/YYYY");
};

/**
 * Convierte un objeto dayjs o string a formato YYYY-MM-DD para enviar al backend
 * @param fecha - Objeto dayjs, string en formato YYYY-MM-DD, o null
 * @returns Fecha en formato YYYY-MM-DD o null si es null
 */
export const formatFechaParaBackend = (fecha: dayjs.Dayjs | string | null): string | null => {
  if (!fecha) return null;
  
  // Si ya es un string en formato YYYY-MM-DD (de un input date), devolverlo tal como está
  if (typeof fecha === 'string') {
    // Validar que sea un formato válido YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(fecha)) {
      return fecha;
    }
    // Si no es válido, intentar parsearlo con dayjs
    const parsedDate = dayjs(fecha);
    return parsedDate.isValid() ? parsedDate.format("YYYY-MM-DD") : null;
  }
  
  // Si es un objeto dayjs
  return fecha.format("YYYY-MM-DD");
};

/**
 * Valida si una fecha está en formato DD/MM/YYYY
 * @param fechaString - Fecha a validar
 * @returns true si es válida, false en caso contrario
 */
export const isValidFechaDDMMYYYY = (fechaString: string): boolean => {
  const fechaParts = fechaString.split('/');
  if (fechaParts.length !== 3) return false;
  
  const dia = parseInt(fechaParts[0]);
  const mes = parseInt(fechaParts[1]);
  const anio = parseInt(fechaParts[2]);
  
  return dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && anio >= 1900 && anio <= 2100;
}; 