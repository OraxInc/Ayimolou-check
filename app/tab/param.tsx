import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ParamScreen() {
  const [isClient, setIsClient] = useState(true);
  const [isVendeur, setIsVendeur] = useState(false);

  const Item = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={22} color="#555" />
        <Text style={styles.itemText}>{label}</Text>
      </View>
      {value && <Text style={styles.itemValue}>{value}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} className="bg-primary mt-12">
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#000" />
        <Text style={styles.headerTitle}>Paramètres et confidentialité</Text>
      </View>

      {/* Compte */}
      <Text style={styles.section}>COMPTE</Text>

      <View style={styles.switchItem}>
        <View style={styles.itemLeft}>
          <Ionicons name="person-outline" size={22} color="#555" />
          <Text style={styles.itemText}>Client</Text>
        </View>
        <Switch value={isClient} onValueChange={setIsClient}  trackColor={{true: "#e5ddb9ff" }} thumbColor={isClient ? "#ffd000ff" : "#f4f4f5"}/>
      </View>

      <View style={styles.switchItem}>
        <View style={styles.itemLeft}>
          <Ionicons name="lock-closed-outline" size={22} color="#555" />
          <Text style={styles.itemText}>Vendeur</Text>
        </View>
        <Switch value={isVendeur} onValueChange={setIsVendeur} trackColor={{true: "#e5ddb9ff" }} thumbColor={isVendeur ? "#ffd000ff" : "#f4f4f5"}/>
      </View>

      {/* Assistance */}
      <Text style={styles.section}>ASSISTANCE</Text>

      <Item icon="alert-circle-outline" label="Signaler un problème" />
      <Item icon="help-circle-outline" label="Centre d'aide" />
      <Item icon="shield-checkmark-outline" label="Centre de sécurité" />
      <Item
        icon="language-outline"
        label="Langue de l'application"
        value="Français"
      />
      <Item icon="time-outline" label="Temps d'écran" />
      <Item icon="people-outline" label="Connexion Famille" />
      <Item icon="log-out-outline" label="Déconnexion" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },

  section: {
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  switchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  itemText: {
    fontSize: 16,
    color: "#000",
  },

  itemValue: {
    fontSize: 14,
    color: "#888",
  },
});
