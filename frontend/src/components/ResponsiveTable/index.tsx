import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from "@mui/material";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  /** Versión compacta: padding y fuente más chicos para más densidad de info */
  dense?: boolean;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ children, className = "", dense = false }) => {
  const headerPadding = dense ? '6px 10px' : undefined;
  const bodyPadding = dense ? '6px 10px' : undefined;
  const headerFontSize = dense ? '0.75rem' : '0.875rem';
  const bodyFontSize = dense ? '0.8125rem' : '0.9375rem';
  const bodyLineHeight = dense ? 1.35 : 1.6;
  const minWidth = dense ? '70px' : '120px';

  return (
    <Box
      className={`rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden bg-gradient-to-br from-white to-gray-50/50 ${className}`}
    >
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          maxHeight: '70vh',
          overflow: 'auto',
          backgroundColor: 'transparent',
          fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#a8a8a8',
            },
          },
          '& .MuiTable-root': {
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
          },
          '& .MuiTableCell-root': {
            whiteSpace: 'nowrap',
            minWidth: minWidth,
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
            fontVariantNumeric: 'tabular-nums',
            borderBottom: '1px solid #f3f4f6',
            ...(dense && { padding: bodyPadding }),
          },
          // Header: bg azul claro, texto azul oscuro (mismo tono que el chip de Filtros)
          // fontSize/lineHeight llevan !important para ganarle a las reglas
          // globales de globals.css y que el modo dense realmente aplique
          '& .MuiTableHead-root .MuiTableCell-root': {
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backgroundColor: '#dbeafe', // blue-100
            color: '#1e40af',           // blue-800
            fontWeight: 700,
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
            fontSize: `${headerFontSize} !important`,
            letterSpacing: '0.04em !important',
            textTransform: 'uppercase',
            lineHeight: '1.5 !important',
            borderBottom: '1px solid #bfdbfe', // blue-200
            ...(dense && { padding: headerPadding }),
          },
          '& .MuiTableBody-root .MuiTableCell-root': {
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
            fontWeight: 400,
            color: '#1f2937',
            fontSize: `${bodyFontSize} !important`,
            lineHeight: `${bodyLineHeight} !important`,
            letterSpacing: '0.01em',
            backgroundColor: '#ffffff',
          },
          // Sin cambio de fontWeight en hover: evita reflow/jitter del contenido
          '& .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root': {
            backgroundColor: '#f9fafb', // gray-50
          },
          '& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root': {
            borderBottom: 'none',
          },
        }}
      >
        <Table stickyHeader className="modern-table" size={dense ? 'small' : 'medium'}>
          {children}
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ResponsiveTable;