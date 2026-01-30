import { createContext, useState } from 'react';

export const AppContext = createContext({
  lastUpdated: null,
  setLastUpdated: () => {},
});

export function AppContextProvider({ children }) {
  const [lastUpdated, setLastUpdated] = useState(null);
  return (
    <AppContext.Provider value={{ lastUpdated, setLastUpdated }}>
      {children}
    </AppContext.Provider>
  );
}
