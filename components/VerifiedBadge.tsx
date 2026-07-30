import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

type VerifiedBadgeProps = {
  verified?: boolean;
  size?: number;
};

/** Badge affiché uniquement pour les profils certifiés par le serveur. */
export default function VerifiedBadge({
  verified,
  size = 16,
}: VerifiedBadgeProps) {
  if (!verified) return null;

  return (
    <View style={{ marginLeft: 5 }}>
      <Ionicons name="checkmark-circle" size={size} color="#1D9BF0" />
    </View>
  );
}
