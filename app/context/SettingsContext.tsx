import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useEffect, useState } from "react";
import { Language } from "../../services/i18n";

type SettingsContextType = {
  isClient: boolean;
  setIsClient: (v: boolean) => void;
  isLivreur: boolean;
  setIsLivreur: (v: boolean) => void;
  isVendeur: boolean;
  setIsVendeur: (v: boolean) => void;
  language: Language;
  setLanguage: (v: Language) => void;
};

export const SettingsContext = createContext<SettingsContextType>({
  isClient: true,
  setIsClient: () => {},
  isLivreur: false,
  setIsLivreur: () => {},
  isVendeur: false,
  setIsVendeur: () => {},
  language: "fr",
  setLanguage: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isClient, setIsClient] = useState(true);
  const [isLivreur, setIsLivreur] = useState(false);
  const [isVendeur, setIsVendeur] = useState(false);
  const [language, setLanguageState] = useState<Language>("fr");
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger la langue depuis AsyncStorage au démarrage
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("appLanguage");
        if (savedLanguage && ["fr", "en", "ewe"].includes(savedLanguage)) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.error("Error loading language preference:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadLanguage();
  }, []);

  // Sauvegarder la langue quand elle change
  const setLanguage = async (newLanguage: Language) => {
    try {
      setLanguageState(newLanguage);
      await AsyncStorage.setItem("appLanguage", newLanguage);
    } catch (error) {
      console.error("Error saving language preference:", error);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{
        isClient,
        setIsClient,
        isLivreur,
        setIsLivreur,
        isVendeur,
        setIsVendeur,
        language,
        setLanguage,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
