import { createContext, useContext, useState } from 'react';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user] = useState({ id: 'local', email: 'admin@postcare.com', full_name: 'Admin' });
  return (
    <AuthContext.Provider value={{ user, isLoading: false, isLoadingAuth: false, isLoadingPublicSettings: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
