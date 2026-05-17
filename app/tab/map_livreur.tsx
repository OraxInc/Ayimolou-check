import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

type Driver = {
  id: string;
  name: string;
  phone?: string;
  status: "available" | "busy" | "offline";
  avatar?: string;
  coords: { latitude: number; longitude: number };
  etaMin?: number;
};

// Sample drivers — replace with real data later
const sampleDrivers: Driver[] = [
  {
    id: "drv-1",
    name: "Jean",
    phone: "+229 90 00 00 01",
    status: "available",
    avatar: undefined,
    coords: { latitude: 6.371, longitude: 2.391 },
    etaMin: 6,
  },
  {
    id: "drv-2",
    name: "Aminou",
    phone: "+229 90 00 00 02",
    status: "busy",
    avatar: undefined,
    coords: { latitude: 6.372, longitude: 2.392 },
    etaMin: 12,
  },
  {
    id: "drv-3",
    name: "Fatou",
    phone: "+229 90 00 00 03",
    status: "available",
    avatar: undefined,
    coords: { latitude: 6.37, longitude: 2.39 },
    etaMin: 4,
  },
];

export default function MapLivreur() {
  const [drivers, setDrivers] = useState<Driver[]>(sampleDrivers);
  const [selected, setSelected] = useState<Driver | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    // Optionally: fetch live drivers from API here
  }, []);

  const renderDriver = ({ item }: { item: Driver }) => (
    <Pressable
      style={styles.driverRow}
      onPress={() => {
        setSelected(item);
        mapRef.current?.animateToRegion(
          {
            latitude: item.coords.latitude,
            longitude: item.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500,
        );
      }}
    >
      <View style={styles.avatarWrap}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlain}>
            <Feather name="user" size={14} color="#333" />
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.driverName}>{item.name}</Text>
        <Text style={styles.driverSub}>
          {item.etaMin} min — {item.status}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => setSelected(item)}>
          <Feather name="phone" size={16} color="#FFF" />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Écran Livreurs</Text>
        <Text style={styles.subtitle}>
          Suivez et assignez un livreur rapidement
        </Text>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={(r) => {
            mapRef.current = r;
          }}
          style={styles.map}
          initialRegion={{
            latitude: sampleDrivers[0].coords.latitude,
            longitude: sampleDrivers[0].coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {drivers.map((d) => (
            <Marker
              key={d.id}
              coordinate={d.coords}
              title={d.name}
              pinColor={
                d.status === "available"
                  ? "#34C759"
                  : d.status === "busy"
                    ? "#FFA500"
                    : "#888"
              }
            />
          ))}
        </MapView>
      </View>

      <View style={styles.listWrap}>
        <Text style={styles.sectionTitle}>Livreurs proches</Text>
        <FlatList
          data={drivers}
          keyExtractor={(i) => i.id}
          renderItem={renderDriver}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalName}>{selected?.name}</Text>
            <Text style={styles.modalInfo}>Statut: {selected?.status}</Text>
            <Text style={styles.modalInfo}>
              ETA: {selected?.etaMin} minutes
            </Text>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#34C759" }]}
                onPress={() => {
                  // placeholder: assign action
                  setSelected(null);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Assigner
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#ddd" }]}
                onPress={() => setSelected(null)}
              >
                <Text style={{ color: "#333", fontWeight: "600" }}>Fermer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffc400" },
  header: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 12, color: "#666", marginTop: 4 },
  mapWrap: { flex: 1, borderTopWidth: 1, borderColor: "#eee" },
  map: { width: "100%", height: 340 },
  listWrap: { padding: 12, maxHeight: height * 0.36 },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  avatarWrap: { marginRight: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlain: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffc400",
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: { fontWeight: "700", fontSize: 14 },
  driverSub: { fontSize: 12, color: "#666", marginTop: 4 },
  actions: { marginLeft: 8 },
  actionBtn: {
    backgroundColor: "#921818",
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.24)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalName: { fontWeight: "700", fontSize: 18 },
  modalInfo: { color: "#444", marginTop: 6 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
});
