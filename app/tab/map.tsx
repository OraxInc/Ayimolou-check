import markers from "@/assets/markers";
import LottieView from "lottie-react-native";
import React, { useRef, useState, useEffect } from "react";
import Toast from "react-native-toast-message";

import {
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const HomeScreen = () => {
  const mapRef = useRef<MapView>(null);
  const [selectedCard, setSelectedCard] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [userRegion, setUserRegion] = useState<any>(null);

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

      mapRef.current?.animateToRegion(region, 2000);
    })();
  }, []);

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
        mapPadding={{ top: 0, right: 0, bottom: 300, left: 0 }}
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
        <Pressable
          onPress={() => setExpanded(!expanded)}
          className="items-center h-8 w-8 rounded-full shadow-md bg-primary m-2"
        >
          <ImageBackground
            className="w-8 h-8 justify-center items-center"
            style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
            source={require("../../assets/images/sarrow.png")}
          />
        </Pressable>
        {expanded && (
          <FlatList
            numColumns={2}
            className="w-full"
            style={{
              height: height * 0.527, // un peu moins de la moitié
            }}
            columnWrapperStyle={{ gap: 10 }}
            data={markers}
            keyExtractor={(item) => item.name}
            renderItem={({ item: marker }) => (
              <Pressable
                onPress={() => {
                  setSelectedCard(marker.name);
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
        )}
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
    backgroundColor: "#ffd000ff",
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
    height: height / 6.5,
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
