import { useStore } from '../store';
import { GranularPermissions } from '../types';
import { DEFAULT_GRANULAR_PERMISSIONS } from '../components/GranularAccessControlManager';

export function useGranularPermissions() {
  const { currentUser } = useStore();

  const getActivePermissions = (): GranularPermissions => {
    // 1. Check if specific employee override exists in localStorage
    if (currentUser?.id) {
      try {
        const savedOverrides = localStorage.getItem('minedh_employee_permissions_overrides');
        if (savedOverrides) {
          const parsed = JSON.parse(savedOverrides);
          if (parsed[currentUser.id]) {
            return parsed[currentUser.id];
          }
        }
      } catch (e) {
        console.error('Error reading employee permissions overrides', e);
      }
    }

    // 2. Check if user object has granular permissions in state
    if (currentUser?.permissions?.granular) {
      return currentUser.permissions.granular;
    }

    // 3. Check role-wide defaults
    try {
      const savedRoleDefaults = localStorage.getItem('minedh_role_permissions_defaults');
      if (savedRoleDefaults) {
        return JSON.parse(savedRoleDefaults);
      }
    } catch (e) {
      console.error('Error reading role permissions defaults', e);
    }

    // 4. Default fallback
    return DEFAULT_GRANULAR_PERMISSIONS;
  };

  const perms = getActivePermissions();

  // Helper methods to check permissions
  const canSecretariat = (action: keyof NonNullable<GranularPermissions['secretariat']>): boolean => {
    // Admin and Director always have full permissions
    if (currentUser?.role === 'admin' || currentUser?.role === 'director' || currentUser?.role === 'national') {
      return true;
    }
    return perms.secretariat?.[action] ?? true;
  };

  const canPedagogia = (action: keyof NonNullable<GranularPermissions['pedagogia']>): boolean => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'director' || currentUser?.role === 'national') {
      return true;
    }
    return perms.pedagogia?.[action] ?? true;
  };

  const canTeacher = (action: keyof NonNullable<GranularPermissions['teacher']>): boolean => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'director' || currentUser?.role === 'national') {
      return true;
    }
    return perms.teacher?.[action] ?? true;
  };

  return {
    permissions: perms,
    canSecretariat,
    canPedagogia,
    canTeacher,
  };
}
