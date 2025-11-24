/**
 * Utilidades para verificación de roles
 */

export const hasRole = (userInfo, allowedRoles) => {
  if (!userInfo?.rol) return false;
  
  const userRol = typeof userInfo.rol === 'string' 
    ? userInfo.rol.toLowerCase() 
    : userInfo.rol?.nombre?.toLowerCase();
    
  if (!userRol) return false;
  
  return allowedRoles.some(role => userRol === role.toLowerCase());
};

export const isAdmin = (userInfo) => {
  return hasRole(userInfo, ['administrador', 'admin']);
};

export const isSupervisor = (userInfo) => {
  return hasRole(userInfo, ['supervisor']);
};

export const isOperario = (userInfo) => {
  return hasRole(userInfo, ['operario']);
};

export const canAccess = (userInfo, requiredRoles) => {
  return hasRole(userInfo, requiredRoles);
};

