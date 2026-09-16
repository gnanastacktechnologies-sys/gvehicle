import { useAuth } from '../context/AuthContext';

export const usePermission = (permission) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};
