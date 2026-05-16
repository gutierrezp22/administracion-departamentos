import React, { useState } from "react";
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export interface ActionMenuItem {
  /** Texto visible */
  label: string;
  /** Icono opcional (componente MUI o svg) */
  icon?: React.ReactNode;
  /** Acción a ejecutar */
  onClick: () => void;
  /** Deshabilitar la opción */
  disabled?: boolean;
  /** Si es destructiva (rojo) */
  danger?: boolean;
  /** Tooltip / texto explicativo cuando está disabled */
  helperText?: string;
}

export interface ActionMenuSection {
  /** Grupo de items separados por divider */
  items: ActionMenuItem[];
}

interface ActionMenuProps {
  /**
   * Items planos o secciones (separadas por divider). Acepta los dos formatos:
   *   items: [a, b, c]
   *   items: [[a, b], [c]] → con divider entre grupos
   */
  items: ActionMenuItem[] | ActionMenuSection[];
  /** Texto del botón / aria-label */
  label?: string;
}

const isSection = (x: ActionMenuItem | ActionMenuSection): x is ActionMenuSection =>
  (x as ActionMenuSection).items !== undefined;

const ActionMenu: React.FC<ActionMenuProps> = ({ items, label = "Acciones" }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClose = () => setAnchorEl(null);

  // Normalizar a secciones
  const sections: ActionMenuSection[] = items.length > 0 && isSection(items[0] as ActionMenuSection | ActionMenuItem)
    ? (items as ActionMenuSection[])
    : [{ items: items as ActionMenuItem[] }];

  const totalEnabled = sections.reduce(
    (acc, s) => acc + s.items.filter((i) => !i.disabled).length,
    0
  );

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
        disabled={totalEnabled === 0}
        className="p-1.5 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={label}>
        <MoreVertIcon sx={{ fontSize: 18 }} />
      </button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 180,
              borderRadius: "0.75rem",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.08)",
              border: "1px solid rgba(229, 231, 235, 0.8)",
              padding: "4px",
              "& .MuiMenuItem-root": {
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                paddingTop: "6px",
                paddingBottom: "6px",
                paddingLeft: "10px",
                paddingRight: "12px",
                gap: "8px",
                "&:hover": {
                  backgroundColor: "#f3f4f6",
                },
              },
              "& .MuiListItemIcon-root": {
                minWidth: "24px",
                color: "#4b5563",
              },
              "& .MuiListItemText-primary": {
                fontSize: "0.875rem",
                fontWeight: 500,
              },
            },
          },
        }}
      >
        {sections.map((section, sIdx) => [
          sIdx > 0 ? <Divider key={`d-${sIdx}`} sx={{ my: 0.5 }} /> : null,
          ...section.items.map((item, iIdx) => (
            <MenuItem
              key={`${sIdx}-${iIdx}`}
              disabled={item.disabled}
              onClick={() => {
                handleClose();
                item.onClick();
              }}
              sx={
                item.danger
                  ? {
                      color: "#dc2626",
                      "& .MuiListItemIcon-root": { color: "#dc2626" },
                      "&:hover": {
                        backgroundColor: "#fef2f2",
                      },
                    }
                  : undefined
              }>
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText
                primary={item.label}
                secondary={item.disabled && item.helperText ? item.helperText : undefined}
                secondaryTypographyProps={{
                  sx: { fontSize: "0.6875rem", fontStyle: "italic" },
                }}
              />
            </MenuItem>
          )),
        ])}
      </Menu>
    </>
  );
};

export default ActionMenu;
