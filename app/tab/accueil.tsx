import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

type Seller = {
  id: string;
  name: string;
  distance: string;
  rating: number;
  reviews: number;
  status: "open" | "closed";
  specialty: string;
  price: string;
  avatar: string;
};

const DATA: Seller[] = [
  {
    id: "1",
    name: "Mama Adisa",
    distance: "500m",
    rating: 4.5,
    reviews: 128,
    status: "open",
    specialty: "Plats variés",
    price: "à partir de 500 FCFA",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "2",
    name: "Tantie Fatou",
    distance: "1.2km",
    rating: 4.3,
    reviews: 65,
    status: "closed",
    specialty: "Ayimolou Classique",
    price: "700 FCFA",
    avatar: "https://i.pravatar.cc/150?img=32",
  },
];

export default function AccueilScreen() {
  const [search, setSearch] = useState("");

  const renderItem = ({ item }: { item: Seller }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />

      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.name}>
            {item.name} - {item.distance}
          </Text>

          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {item.rating} ({item.reviews} avis)
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.status === "open" ? "#2ecc71" : "#e74c3c" },
            ]}
          />
          <Text
            style={{
              color: item.status === "open" ? "#2ecc71" : "#e74c3c",
            }}
          >
            {item.status === "open" ? "Ouvert" : "Fermé"}
          </Text>
        </View>

        <Text style={styles.specialty}>
          {item.specialty} {item.price}
        </Text>

        <View style={styles.avatars}>
          {[1, 2, 3, 4].map((i) => (
            <Image
              key={i}
              source={{ uri: "https://i.pravatar.cc/40?img=" + i }}
              style={styles.smallAvatar}
            />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} className="p-12">
      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#777" />
        <TextInput
          placeholder="Rechercher une revendeuse..."
          style={styles.input}
          className="w-full bg-white rounded-full px-6 py-1"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity style={styles.activeFilter}>
          <Text style={styles.activeText}>Ouvertes Maintenant</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filter}>
          <Text style={styles.filterText}>Toutes Revendeuses</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFD400",
    paddingHorizontal: 16,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
  },

  input: {
    marginLeft: 8,
    fontSize: 16,
    flex: 1,
    borderRadius: 60,
  },

  filters: {
    flexDirection: "row",
    marginVertical: 12,
    gap: 10,
  },

  activeFilter: {
    backgroundColor: "#ffe263ff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },

  activeText: {
    fontWeight: "600",
  },

  filter: {
    backgroundColor: "#111",
    width: width / 2 - 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },

  filterText: {
    color: "#fff",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    elevation: 2,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: {
    fontWeight: "700",
    fontSize: 14,
  },

  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ratingText: {
    fontSize: 12,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  specialty: {
    marginTop: 6,
    fontSize: 13,
    color: "#555",
  },

  avatars: {
    flexDirection: "row",
    marginTop: 8,
  },

  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: -8,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
