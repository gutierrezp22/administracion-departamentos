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
          '& .MuiTableCell-root': {
            whiteSpace: 'nowrap',
            minWidth: '120px',
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backgroundColor: '#3b82f6',
            color: '#fff',
            fontWeight: 600,
          },
        }}
      >
        <Table stickyHeader>
          {children}
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ResponsiveTable;