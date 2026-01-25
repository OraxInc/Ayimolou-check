import markers from "@/assets/markers";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";

import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const API_KEY = "714aaa82e8bf4eb5947edbaeb6aa19e6";

const HomeScreen = () => {
  const mapRef = useRef<MapView>(null);
  const [selectedCard, setSelectedCard] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [userRegion, setUserRegion] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [clientLocation, setClientLocation] = useState<{ 
    latitude: number;
    longitude: number;
  } | null>(null);
  const [destination, setDestination] = useState<{
    latitude: number;
    longitude: number;
  } | null>(markers[0]?.coordinates || null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      const region = {
        latitude,
        longitude,
        latitudeDelta: 0.008, // ~500m
        longitudeDelta: 0.008, // ~500m
      };

      setUserRegion(region);
      setClientLocation({ latitude, longitude });

      mapRef.current?.animateToRegion(region, 2000);
    })();
  }, []);

  useEffect(() => {
    if (!clientLocation || !destination) return; // on attend clientLocation ET destination

    const fetchRoute = async () => {
      try {
        const origin = `${clientLocation.latitude},${clientLocation.longitude}`;
        const destinationStr = `${destination.latitude},${destination.longitude}`;

        const res = await fetch(
          `https://api.geoapify.com/v1/routing?waypoints=${origin}|${destinationStr}&mode=drive&apiKey=${API_KEY}`
        );

        const data = await res.json();

        if (!data.features || data.features.length === 0) {
          console.warn("Aucune feature Geoapify trouvée pour l'itinéraire");
          return;
        }

        // On récupère toutes les coordonnées, en supportant plusieurs segments
        const coords = data.features[0].geometry.coordinates[0] // <- premier tableau imbriqué
          .map(([lon, lat]: [number, number]) => ({
            latitude: Number(lat),
            longitude: Number(lon),
          }))
          .filter(
            (coord: { latitude: number; longitude: number }) =>
              !isNaN(coord.latitude) && !isNaN(coord.longitude)
          );

        console.log("Polyline coords:", coords);
        setRouteCoords(coords);
      } catch (err) {
        console.error("Erreur fetch Geoapify :", err);
      }
    };

    fetchRoute();
  }, [destination]);
  console.log("routeCoords", routeCoords);
  return (
    <SafeAreaView
      className="flex-1 bg-primary"
      style={{ flex: 1 }}
      edges={["top", "left", "right"]}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        region={userRegion}
        mapPadding={{ top: 0, right: 0, bottom: 360, left: 0 }}
      >
        {markers.map((marker) => (
          <Marker
            key={`${marker.name}-${selectedCard}`} // <-- clé dynamique ici
            title={marker.name}
            coordinate={marker.coordinates}
            image={
              marker.name === selectedCard
                ? require("../../assets/images/pin_r.png")
                : require("../../assets/images/pin.png")
            }
          />
        ))}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={6}
            strokeColor="blue"
            lineCap="round"
          />
        )}
      </MapView>
      <View style={styles.searchBarContainer} className="bg-gray">
        <TextInput
          placeholder="Recherchez par numéro stands"
          className="bg-white rounded-full px-4 py-2 text-center"
        />
      </View>

      <View style={styles.ondeContainer} pointerEvents="none">
        <LottieView
          source={require("../../assets/animed/onde.json")}
          autoPlay
          loop={false}
          speed={2}
          style={styles.onde}
        />
      </View>

      <View style={styles.markerListContainer}>
        <Pressable // bouton jaune d'expansion/repliage
          onPress={() => setExpanded(!expanded)}
          className="items-center h-8 w-8 rounded-full shadow-md bg-primary m-2"
        >
          <ImageBackground
            className="w-8 h-8 justify-center items-center"
            style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
            source={require("../../assets/images/sarrow.png")}
          />
        </Pressable>
          <FlatList
            numColumns={2}
            className="w-full"
            style={{
              height: height * 0.49, //hauteur conteneur des cardes vendeur un peu moins de la moitié
            }}
            columnWrapperStyle={{ gap: 10 }}
            data={markers}
            keyExtractor={(item) => item.name}
            renderItem={({ item: marker }) => (
              <Pressable
                onPress={() => {
                  if (marker.name === selectedCard) {
                    // ✅ Deuxième clic sur la même card
                    Alert.alert(
                      "Commande",
                      `Voulez-vous commander chez ${marker.name} ?`
                    );
                    return;
                  }

                  setSelectedCard(marker.name);
                  setDestination(marker.coordinates);
                  mapRef.current?.animateToRegion(marker.coordinates, 1000);
                }}
                style={
                  marker.name === selectedCard
                    ? styles.activeMarkerButton
                    : styles.markerButton
                }
              >
                <Image
                  source={{ uri: marker.image }}
                  style={styles.markerImage}
                />

                <View style={styles.markerInfo}>
                  <View className="mr-4 ml-4 mb-2 mt-2">
                    <Text
                      style={
                        marker.name === selectedCard
                          ? styles.activeMarkerName
                          : styles.markerName
                      }
                    >
                      {marker.name}
                    </Text>

                    {/* --- Étoiles + note --- */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      {/* Étoiles */}
                      <View style={{ flexDirection: "row" }}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <FontAwesome
                            key={index}
                            name={index < marker.etoile ? "star" : "star-o"}
                            size={14}
                            color={
                              marker.name === selectedCard
                                ? "#FFF200"
                                : "#c61e1e"
                            }
                            style={{
                              opacity: marker.name === selectedCard ? 1 : 0.7,
                            }}
                          />
                        ))}
                      </View>

                      {/* Note à droite */}
                      <Text
                        style={
                          marker.name === selectedCard
                            ? {
                                color: "#FFFFFF",
                                fontWeight: "500",
                                marginLeft: 6,
                              }
                            : {
                                color: "#000000",
                                fontWeight: "500",
                                marginLeft: 6,
                              }
                        }
                      >
                        {marker.etoile}.0
                      </Text>
                    </View>

                    <Text
                      style={
                        marker.name === selectedCard
                          ? styles.activeMarkerDescription
                          : styles.markerDescription
                      }
                    >
                      {marker.description}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
            showsHorizontalScrollIndicator={false}
          />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  map: {
    flex: 1,
  },
  markerListContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  activeMarkerButton: {
    backgroundColor: "#ad1616",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: width / 2 - 16,
    marginBottom: 10,
  },
  markerButton: {
    backgroundColor: "rgb(255, 255, 255)",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: width / 2 - 16,
    marginBottom: 10,
  },
  markerImage: {
    borderRadius: 10,
    width: "auto",
    height: height / 6.8,
  },
  markerInfo: {
    flex: 1,
  },
  markerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  markerDescription: {
    fontSize: 12,
    color: "#000",
  },

  activeMarkerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  activeMarkerDescription: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  ondeContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 450,
    height: 450,
    marginTop: -225,
    marginLeft: -225,
    justifyContent: "center",
    alignItems: "center",
  },
  onde: {
    width: "100%",
    height: "100%",
  },
  searchBarContainer: {
    position: "absolute",
    top: 42,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(245, 245, 245, 0.4)",
  },
});
export default HomeScreen;
