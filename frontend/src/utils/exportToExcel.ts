import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export type ExcelRow = Record<string, string | number | boolean | null | undefined>;

interface ExportToExcelOptions {
  fileName: string;
  sheetName: string;
  rows: readonly object[];
}

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function exportToExcel({
  fileName,
  sheetName,
  rows,
}: ExportToExcelOptions) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Unión de claves de TODAS las filas: si una fila tiene columnas extra,
  // no se pierden por derivar los encabezados solo de la primera
  const headerSet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key));
  });
  const headers = Array.from(headerSet);

  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 2, 20),
  }));

  rows.forEach((row) => {
    worksheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const excelBlob = new Blob([buffer as ArrayBuffer], { type: EXCEL_MIME_TYPE });

  saveAs(excelBlob, fileName);
}
