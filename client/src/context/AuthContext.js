import React, { createContext, useContext, useState } from 'react';

const ROLES = {
  admin: 'Руководство',
  manager: 'Менеджер',
  dispatcher: 'Диспетчер',
  operator: 'Оператор РБУ',
  weigher: 'Весовщик',
  metal_clerk: 'Кладовщик металла',
  zbi_master: 'Мастер ЖБ',
  lab: 'Лаборант',
  accountant: 'Бухгалтер',
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 'u1',
    name: 'Администратор',
    role: 'admin',
    roleLabel: ROLES.admin,
  });

  const hasRole = (...roles) => roles.includes(user.role);
  const isAdmin = user.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, setUser, hasRole, isAdmin, ROLES }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
