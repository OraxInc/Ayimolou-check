import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { Stack, useRouter, useSegments } from "expo-router";
import "./globals.css"
import React, { useEffect, useContext } from "react";
import { SettingsProvider, SettingsContext } from "./context/SettingsContext";
import { tokenCache } from "../utils/tokenCache";
import { useBackendApi } from "../services/api";
import Toast from 'react-native-toast-message';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { syncUserWithBackend } = useBackendApi();
  const { setIsLivreur, setIsVendeur, setIsClient } = useContext(SettingsContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inSplashGroup = segments[0] === "splash";
    const isIndex = !segments[0];
    const isLogin = segments[0] === "login";

    if (isSignedIn && segments[0] !== "login") {
      const performSync = async () => {
        const userData = await syncUserWithBackend();
        if (userData) {
          setIsLivreur(userData.role === 'livreur');
          setIsVendeur(userData.role === 'vendeur');
          setIsClient(userData.role === 'client');
        }
      };
      
      performSync();
      
      if (inSplashGroup || isIndex || isLogin) {
        router.replace("/home_map");
      }
    } else if (!isSignedIn) {
      // Si l'utilisateur n'est pas connecté et qu'il n'est pas sur une page publique autorisé, rediriger vers login
      if (!inSplashGroup && !isIndex && !isLogin) {
        router.replace("/login");
      }
    }
  }, [isSignedIn, isLoaded, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="home_map" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <SettingsProvider>
          <InitialLayout />
          <Toast />
        </SettingsProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}