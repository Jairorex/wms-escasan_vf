/**
 * Colores de la marca ESCASAN para la aplicación móvil WMS
 * Verde (#00864F) - Color principal/sidebar
 * Naranja (#E85D2B) - Color de acento/hover
 * Azul (#2196F3) - Botones de confirmación
 * Rojo (#f44336) - Botones de cancelación
 */

export const Colors = {
  // Colores principales de ESCASAN
  escasan: {
    green: {
      light: '#e8f5e9',
      main: '#009245', // Verde corporativo ESCASAN
      dark: '#00702F',
      darker: '#004D1F',
    },
    orange: {
      light: '#fef3ee',
      main: '#f15a29', // Naranja corporativo ESCASAN
      dark: '#bc300d',
      darker: '#792312',
    },
  },

  // Colores para botones de acción
  confirm: {
    light: '#e3f2fd',
    main: '#2196F3',
    dark: '#1976d2',
  },
  cancel: {
    light: '#ffebee',
    main: '#f44336',
    dark: '#d32f2f',
  },

  // Colores de estado
  success: {
    light: '#e8f5e9',
    main: '#4caf50',
    dark: '#388e3c',
  },
  warning: {
    light: '#fff8e1',
    main: '#ffc107',
    dark: '#f57c00',
  },
  error: {
    light: '#ffebee',
    main: '#f44336',
    dark: '#c62828',
  },
  info: {
    light: '#e3f2fd',
    main: '#2196f3',
    dark: '#1976d2',
  },

  // Colores neutros
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
    dark: '#151718',
  },
  text: {
    primary: '#11181C',
    secondary: '#687076',
    disabled: '#9BA1A6',
    white: '#ffffff',
  },
  divider: '#E0E0E0',
  border: '#ddd',

  // Compatibilidad con primary (mapea a verde ESCASAN)
  primary: {
    light: '#e8f5e9',
    main: '#009245',
    dark: '#00702F',
  },
};

export default Colors;

