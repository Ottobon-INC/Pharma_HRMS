import { useState, useEffect } from 'react';
import { Employee } from '../types';

export function useAuth(employees: Employee[]) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hrms_user_session');
    if (saved) {
      setCurrentUserId(saved);
    }
  }, []);

  const login = (id: string) => {
    setCurrentUserId(id);
    localStorage.setItem('hrms_user_session', id);
  };

  const logout = () => {
    setCurrentUserId(null);
    localStorage.removeItem('hrms_user_session');
  };

  const currentUser = currentUserId ? employees.find(e => e.id === currentUserId) : null;

  return {
    currentUser,
    currentUserId,
    login,
    logout,
    isAuthenticated: !!currentUser
  };
}
