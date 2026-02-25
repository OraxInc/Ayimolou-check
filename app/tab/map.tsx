import React, { useEffect, useRef, useState } from "react";
import pack_food from "@/assets/food_pack";
import { Feather, FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";
import LottieView from "lottie-react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useBackendApi } from "../../services/api";
import { User } from "../../types/user";
import OrderConfirmationModal from "../../components/OrderConfirmationModal";

import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");
const API_KEY = "714aaa82e8bf4eb5947edbaeb6aa19e6";

const HomeScreen = () => {
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { getVendors, getProducts, createOrder } = useBackendApi();
  const [vendors, setVendors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedPacks, setSelectedPacks] = useState<Record<string, number>>(
    {},
  );
  const [selectedCard, setSelectedCard] = useState("");
  const [expanded, setExpanded] = useState(true); // Etendu par défaut
  const [userRegion, setUserRegion] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [showFoodAlert, setShowFoodAlert] = useState(false);
  const [packByVendor, setPackByVendor] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const resumeCommander = async () => {
    const selected = packByVendor.filter((p) => p.selected);
    if (selected.length === 0) {
      Alert.alert("Aucun pack sélectionné");
      return;
    }

    if (!clerkUser) {
      Alert.alert("Erreur", "Vous devez être connecté pour commander.");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleFinalConfirm = async (formattedAddress: string, paymentMethod: 'CASH' | 'MOBILE_MONEY') => {
    const selected = packByVendor.filter((p) => p.selected);
    const currentVendor = vendors.find((v) => v.displayName === selectedCard);
    if (!currentVendor || !clerkUser) return;

    const items = selected.map((p) => ({
      productId: p.id,
      name: p.name_pack,
      price: p.prix,
      quantity: 1,
    }));

    const total = selected.reduce((sum, p) => sum + p.prix, 0);

    const orderData = {
      clientId: clerkUser.id,
      vendorId: currentVendor.uid,
      items,
      totalPrice: total,
      deliveryAddress: {
        address: formattedAddress,
        coordinates: clientLocation ? {
          latitude: clientLocation.latitude,
          longitude: clientLocation.longitude
        } : undefined
      },
      paymentMethod,
    };

    try {
      setIsOrdering(true);
      const result = await createOrder(orderData);
      if (result && result.id) {
        setShowFoodAlert(false);
        setShowConfirmModal(false);
        // Réinitialiser la sélection
        setPackByVendor(prev => prev.map(p => ({ ...p, selected: false })));
        
        // Redirection vers le suivi
        router.push({
          pathname: "/tab/suivi_commande",
          params: { orderId: result.id }
        });
      } else {
        Alert.alert("Erreur", "Impossible de créer la commande.");
      }
    } catch (error) {
      console.error("Order creation error:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la commande.");
    } finally {
      setIsOrdering(false);
    }
  };
  const togglePack = (id: string) => {
    setPackByVendor((prev) =>
      prev.map((pack) =>
        pack.id === id ? { ...pack, selected: !pack.selected } : pack,
      ),
    );
  };
  const [clientLocation, setClientLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [destination, setDestination] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const loadVendors = async () => {
      setLoading(true);
      const data = await getVendors();
      setVendors(data);
      if (data.length > 0 && data[0].vendorProfile) {
        setDestination(data[0].vendorProfile.coordinates);
      }
      setLoading(false);
    };
    loadVendors();
  }, []);

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
    // capture destination to preserve type-narrowing inside the async function
    const dest = destination;
    if (!clientLocation || !dest) return; // on attend clientLocation ET destination

    const fetchRoute = async () => {
      try {
        const origin = `${clientLocation.latitude},${clientLocation.longitude}`;
        const destinationStr = `${dest.latitude},${dest.longitude}`;

        const res = await fetch(
          `https://api.geoapify.com/v1/routing?waypoints=${origin}|${destinationStr}&mode=drive&apiKey=${API_KEY}`,
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
              !isNaN(coord.latitude) && !isNaN(coord.longitude),
          );
        setRouteCoords(coords);
      } catch (err) {
        console.error("Erreur fetch Geoapify :", err);
      }
    };

    fetchRoute();
  }, [clientLocation, destination]);

  if (loading) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // marker currently selected (for menu status)
  const currentVendor = vendors.find((v) => v.displayName === selectedCard);

  return (
    <SafeAreaView
      className="flex-1 bg-primary"
      style={{ flex: 1 }}
      edges={["top", "left", "right"]}
    >
      {/* Alert customiser du menu */}
      <Modal
        visible={showFoodAlert}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFoodAlert(false)}
      >
        {/* CONTENEUR PLEIN ÉCRAN */}
        <View style={styles.fullscreen}>
          {/* FOND CLIQUABLE */}
          <Pressable
            style={styles.overlay} // fond semi-transparent sombre
            onPress={() => {
              // fermer le modal sans réinitialiser les sélections (conserver l'état)
              setShowFoodAlert(false);
            }}
          />

          {/* CONTENU MODAL */}
          <View style={styles.modalBox}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              {currentVendor && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View className="w-50 h-50 mb-2 rounded-full bg-red-300 justify-center items-center flex-row">
                    <Image
                      source={currentVendor.photoURL ? { uri: currentVendor.photoURL } : require("../../assets/images/profil_2.png")}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 30,
                        borderColor: "#b62804",
                        borderWidth: 4,
                      }}
                    />

                    <View
                      style={[
                        styles.modalStatusDot,
                        {
                          backgroundColor: currentVendor.vendorProfile?.isOpen
                            ? "#34ab51"
                            : "#D94343",
                        },
                      ]}
                    />
                  </View>

                  <View
                    style={{ marginLeft: 2, flex: 1, flexDirection: "column" }}
                  >
                    <Text style={styles.title}> {selectedCard} </Text>
                    <Text
                      style={[
                        styles.modalStatusText,
                        {
                          color: currentVendor.vendorProfile?.isOpen ? "#34ab51" : "#D94343",
                        },
                      ]}
                    >
                      {currentVendor.vendorProfile?.isOpen ? "Ouvert" : "Fermé"}
                    </Text>
                  </View>

                  <View style={styles.callbutton}>
                    <Pressable
                      onPress={() => {
                        if (currentVendor && currentVendor.phoneNumber) {
                          Linking.openURL(`tel:${currentVendor.phoneNumber}`);
                        }
                      }}
                    >
                      <FontAwesome
                        name="phone"
                        size={32}
                        color="black"
                        style={styles.callImage}
                      />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            <FlatList // liste des packs de plats
              data={packByVendor}
              numColumns={2}
              keyExtractor={(item) => String(item.id)}
              columnWrapperStyle={{ gap: 10 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              nestedScrollEnabled
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    // Mise à jour via l'état local
                    togglePack(item.id);
                  }}
                  style={item.selected ? styles.cardfoodSelect : styles.card}
                >
                  <Image source={{ uri: item.image }} style={styles.image} />

                  <Text style={styles.packName}>{item.name_pack}</Text>

                  <Text style={styles.qte}>Quantité : {item.quantité}</Text>

                  <Text style={styles.price}>{item.prix} FCFA</Text>
                </Pressable>
              )}
            />
            <Pressable // bouton de commande rouge
              onPress={() => {
                resumeCommander();
              }}
              className="mt-4 bg-red rounded-full py-4 px-4 items-center"
            >
              <Text className="text-white font-bold">Commander !</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        region={userRegion}
        mapPadding={{ top: 0, right: 0, bottom: 360, left: 0 }}
      >
        {vendors.map((vendor) => vendor.vendorProfile && (
          <Marker
            key={`${vendor.uid}-${selectedCard}`} // <-- clé dynamique ici
            title={vendor.displayName}
            coordinate={vendor.vendorProfile.coordinates}
            image={
              vendor.displayName === selectedCard
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
        {expanded && (
          <FlatList
            numColumns={2}
            className="w-full"
            style={{
              height: height * 0.49, //hauteur conteneur des cardes vendeur un peu moins de la moitié
            }}
            columnWrapperStyle={{ gap: 10 }}
            data={vendors.filter(v => v.role === 'vendeur' && v.vendorProfile)}
            keyExtractor={(item) => item.uid}
            renderItem={({ item: vendor }) => (
              <Pressable // card vendeur pour afficher le menu
                onPress={() => {
                  if (vendor.displayName === selectedCard) {
                    // ✅ Deuxième clic sur la même card -> ouvrir menu avec produits réels
                    const fetchVendorProducts = async () => {
                      setLoadingProducts(true);
                      try {
                        const products = await getProducts({ vendorId: vendor.uid });
                        setPackByVendor(products.map((p: any) => ({
                          ...p,
                          selected: false,
                          image: p.imageUrl || "https://loremflickr.com/200/200/food",
                          name_pack: p.name,
                          prix: p.price,
                          quantité: 1
                        })));
                        setShowFoodAlert(true);
                      } catch (error) {
                        console.error("Error fetching map vendor products:", error);
                      } finally {
                        setLoadingProducts(false);
                      }
                    };
                    fetchVendorProducts();
                    return;
                  }

                  setSelectedCard(vendor.displayName);
                  if (vendor.vendorProfile) {
                    setDestination(vendor.vendorProfile.coordinates);
                    mapRef.current?.animateToRegion({
                      ...vendor.vendorProfile.coordinates,
                      latitudeDelta: 0.008,
                      longitudeDelta: 0.008,
                    }, 1000);
                  }
                }}
                style={
                  vendor.displayName === selectedCard
                    ? styles.activeMarkerButton
                    : styles.markerButton
                }
              >
                <Image
                  source={vendor.vendorProfile?.imageUrl ? { uri: vendor.vendorProfile.imageUrl } : { uri: "https://loremflickr.com/320/240/restaurant" }}
                  style={styles.markerImage}
                />

                <View style={styles.markerInfo}>
                  <View className="mr-4 ml-4 mb-2 mt-2">
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Feather
                        name="user-check"
                        size={18}
                        color={
                          vendor.displayName === selectedCard ? "#FFF200" : "#333"
                        }
                        style={{ marginRight: 8 }}
                      />

                      <Text
                        style={
                          vendor.displayName === selectedCard
                            ? styles.activeMarkerName
                            : styles.markerName
                        }
                      >
                        {vendor.displayName}
                      </Text>
                    </View>

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
                            name={index < (vendor.vendorProfile?.rating || 0) ? "star" : "star-o"}
                            size={14}
                            color={
                              vendor.displayName === selectedCard
                                ? "#FFF200"
                                : "#000000"
                            }
                            style={{
                              opacity: vendor.displayName === selectedCard ? 1 : 0.7,
                            }}
                          />
                        ))}
                      </View>

                      {/* Note à droite */}
                      <Text
                        style={
                          vendor.displayName === selectedCard
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
                        {(vendor.vendorProfile?.rating || 0).toFixed(1)}
                      </Text>
                    </View>

                    <Text
                      numberOfLines={2}
                      style={
                        vendor.displayName === selectedCard
                          ? styles.activeMarkerDescription
                          : styles.markerDescription
                      }
                    >
                      {vendor.vendorProfile?.description}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>
      <OrderConfirmationModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleFinalConfirm}
        items={packByVendor
          .filter(p => p.selected)
          .map(p => ({ 
            name: p.name_pack, 
            price: p.prix, 
            quantity: 1 
          }))
        }
        totalPrice={packByVendor
          .filter(p => p.selected)
          .reduce((sum, p) => sum + p.prix, 0)
        }
        initialLocation={clientLocation}
        loading={isOrdering}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFC700",
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
    backgroundColor: "#FFC700",
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
  fullscreen: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.16)",
    top: 10,
    bottom: 18,
    left: 0,
    right: 0,
  },

  modalBox: {
    alignSelf: "center",
    marginTop: 60,
    width: "85%",
    height: "72%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
  },

  title: {
    fontSize: 13,
    color: "black",
  },

  // helper styles for status in modal header
  modalStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 35,
    left: 35,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },

  callImage: {
    width: 32,
    height: 32,
    marginBottom: 15,
  },

  callbutton: {},

  modalStatusText: {
    fontSize: 11,
    marginBottom: 2,
    marginLeft: 2,
    fontWeight: "600",
  },

  card: {
    width: "48%",
    backgroundColor: "#e2e2e2",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },

  cardfoodSelect: {
    width: "48%",
    backgroundColor: "#f1d88f",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },

  image: {
    width: 100,
    height: 80,
    borderRadius: 8,
    marginBottom: 6,
  },

  packName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  qte: {
    fontSize: 13,
    color: "#555",
    marginVertical: 2,
  },

  price: {
    fontWeight: "bold",
    color: "#a90808",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 12,
  },
  vendorLeftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  vendorName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    color: "#555",
    fontWeight: "500",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  tiktokButton: {
    flex: 1,
    alignItems: "flex-end",
    padding: 8,
  },
});
export default HomeScreen;
