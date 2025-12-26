import { Stack } from "expo-router";
import "./globals.css"
import React from "react";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="home_map" />
    </Stack>
  );
}
