import React, { createContext, useState } from "react";

type SettingsContextType = {
  isClient: boolean;
  setIsClient: (v: boolean) => void;
  isLivreur: boolean;
  setIsLivreur: (v: boolean) => void;
  isVendeur: boolean;
  setIsVendeur: (v: boolean) => void;
};

export const SettingsContext = createContext<SettingsContextType>({
  isClient: true,
  setIsClient: () => {},
  isLivreur: false,
  setIsLivreur: () => {},
  isVendeur: false,
  setIsVendeur: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isClient, setIsClient] = useState(true);
  const [isLivreur, setIsLivreur] = useState(false);
  const [isVendeur, setIsVendeur] = useState(false);

  return (
    <SettingsContext.Provider
      value={{
        isClient,
        setIsClient,
        isLivreur,
        setIsLivreur,
        isVendeur,
        setIsVendeur,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext; 
