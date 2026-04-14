import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type ExcelRow = Record<string, string | number | boolean | null | undefined>;

interface ExportToExcelOptions {
  fileName: string;
  sheetName: string;
  rows: ExcelRow[];
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

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 2, 20),
  }));

  rows.forEach((row) => {
    worksheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const excelBuffer = buffer instanceof ArrayBuffer ? buffer : buffer.buffer;
  const excelBlob = new Blob([excelBuffer], { type: EXCEL_MIME_TYPE });

  saveAs(excelBlob, fileName);
}
