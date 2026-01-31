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
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ children, className = "" }) => {
  return (
    <Box className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <TableContainer 
        component={Paper} 
        elevation={0}
        sx={{
          maxHeight: '70vh',
          overflow: 'auto',
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
            minWidth: '120px',
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
            fontVariantNumeric: 'tabular-nums',
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backgroundColor: '#3b82f6',
            color: '#fff',
            fontWeight: 600,
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
            fontSize: '0.875rem',
            letterSpacing: '0.025em',
            textTransform: 'uppercase',
            lineHeight: 1.5,
          },
          '& .MuiTableBody-root .MuiTableCell-root': {
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
            fontWeight: 400,
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            letterSpacing: '0.01em',
          },
          '& .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root': {
            fontWeight: 500,
          },
        }}
      >
        <Table stickyHeader className="modern-table">
          {children}
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ResponsiveTable;