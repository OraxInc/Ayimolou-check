import { WifiOff } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

type OfflineScreenProps = {
  onRetry: () => void;
};

/** Écran affiché tant qu'aucune connexion Internet utilisable n'est disponible. */
export default function OfflineScreen({ onRetry }: OfflineScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-primary px-8">
      <View className="mb-8 h-28 w-28 items-center justify-center rounded-full bg-secondary">
        <WifiOff size={54} color="#111002" strokeWidth={2.2} />
      </View>

      <Text className="text-center text-3xl font-bold text-black">
        Pas de connexion
      </Text>
      <Text className="mt-4 text-center text-base leading-6 text-black opacity-75">
        Vérifiez votre Wi-Fi ou vos données mobiles, puis réessayez.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Réessayer la connexion Internet"
        className="mt-10 rounded-full bg-black px-10 py-4"
        onPress={onRetry}
      >
        <Text className="text-base font-bold text-white">Réessayer</Text>
      </Pressable>
    </View>
  );
}
