import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OrderConfirmationModal from "../../components/OrderConfirmationModal";
import VerifiedBadge from "../../components/VerifiedBadge";
import { useBackendApi } from "../../services/api";
import { useTranslation } from "../../services/i18n";
import { SettingsContext } from "../context/SettingsContext";

const { width, height } = Dimensions.get("window");

type Seller = {
  id: string;
  name: string;
  distance: string;
  rating: number;
  reviews: number;
  status: "open" | "closed";
  specialty: string[];
  price: string;
  avatar: string;
  description?: string;
  phoneNumber?: string;
  imageUrl?: string;
  isVerified?: boolean;
};

const ACTIVE_ORDER_KEY = "activeOrderId";
const ACTIVE_ORDER_STATUS_KEY = "activeOrderStatus";
const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED"];

export default function AccueilScreen() {
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const { language } = useContext(SettingsContext);
  const { t } = useTranslation(language);
  const [search, setSearch] = useState("");
  const [vendors, setVendors] = useState<Seller[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Seller | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [clientLocation, setClientLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderStatus, setActiveOrderStatus] = useState<string>("");
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const { getVendors, getCategories, getProducts, createOrder, getMyOrders } =
    useBackendApi();

  // Charger la commande active depuis AsyncStorage 
  const loadActiveOrder = async () => {
    try {
      const savedOrderId = await AsyncStorage.getItem(ACTIVE_ORDER_KEY);
      const savedStatus = await AsyncStorage.getItem(ACTIVE_ORDER_STATUS_KEY);
      if (
        savedOrderId &&
        savedStatus &&
        !TERMINAL_STATUSES.includes(savedStatus)
      ) {
        setActiveOrderId(savedOrderId);
        setActiveOrderStatus(savedStatus);
        // Animate banner in
        Animated.spring(bannerAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      } else if (
        savedOrderId &&
        savedStatus &&
        TERMINAL_STATUSES.includes(savedStatus)
      ) {
        // Commande terminï¿½e, nettoyer
        await AsyncStorage.multiRemove([
          ACTIVE_ORDER_KEY,
          ACTIVE_ORDER_STATUS_KEY,
        ]);
      }
    } catch (e) {
      console.error("Error loading active order:", e);
    }
  };

  // Polling pour mettre Ã  jour le statut de la commande active 
  useFocusEffect(
    React.useCallback(() => {
      loadActiveOrder();
    }, []),
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vendorsData, categoriesData] = await Promise.all([
          getVendors(),
          getCategories(),
        ]);

        const mappedVendors: Seller[] = vendorsData.map((v: any) => ({
          id: v.uid,
          name: v.vendorProfile?.shopName || v.displayName || "Revendeuse",
          distance: "Proche",
          rating: v.vendorProfile?.rating || 0,
          reviews: 24,
          status: v.vendorProfile?.isOpen ? "open" : "closed",
          specialty: v.vendorProfile?.specialty || ["Ayimolou"],
          price: "Ã  partir de 500 FCFA",
          avatar: v.photoURL || "https://i.pravatar.cc/150?u=" + v.uid,
          description:
            v.vendorProfile?.description || "Pas de description disponible.",
          phoneNumber: v.phoneNumber,
          imageUrl: v.vendorProfile?.imageUrl,
          isVerified: v.isVerified === true,
        }));
        setVendors(mappedVendors);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Get location for delivery address
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setClientLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
          const products = await getProducts({ vendorId: selectedVendor.id });
          setVendorProducts(products);
        } catch (error) {
          console.error("Error fetching vendor products:", error);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchProducts();
    } else {
      setVendorProducts([]);
    }
  }, [selectedVendor?.id]);

  const renderItem = ({ item }: { item: Seller }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedVendor(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />

      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { flexShrink: 1 }]} numberOfLines={1}>
              {item.name} - {item.distance}
            </Text>
            <VerifiedBadge verified={item.isVerified} />
          </View>
        </View>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: item.status === "open" ? "#2ecc71" : "#e74c3c",
              },
            ]}
          />

          <Text
            style={{
              color: item.status === "open" ? "#2ecc71" : "#e74c3c",
            }}
          >
            {item.status === "open" ? t("open") : t("closed")}
          </Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>

        <Text style={styles.specialty} numberOfLines={1}>
          {item.specialty.join(", ")} | {item.price}
        </Text>

        <View style={styles.avatars}>
          {[1, 2, 3].map((i) => (
            <Image
              key={i}
              source={{ uri: "https://i.pravatar.cc/40?img=" + (10 + i) }}
              style={styles.smallAvatar}
            />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: t("askingConfirmation"),
      ACCEPTED: t("orderAccepted"),
      PREPARING: t("preparing"),
      READY: t("readyForDelivery"),
      DELIVERING: t("delivering"),
    };
    return labels[status] || `📦 ${status}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Banniere Commande Active */}
      {activeOrderId && (
        <Animated.View
          style={[
            styles.activeBanner,
            {
              transform: [
                {
                  translateY: bannerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-80, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.activeBannerContent}
            onPress={() =>
              router.push({
                pathname: "/tab/suivi_commande",
                params: { orderId: activeOrderId },
              })
            }
          >
            <View style={styles.bannerPulse}>
              <View style={styles.bannerDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>{t("activeOrder")}</Text>
              <Text style={styles.bannerStatus}>
                {getStatusLabel(activeOrderStatus)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>
        </Animated.View>
      )}
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          <TouchableOpacity
            style={!activeCategory ? styles.activeFilter : styles.filter}
            onPress={() => setActiveCategory(null)}
          >
            <Text
              style={!activeCategory ? styles.activeText : styles.filterText}
            >
              Toutes
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={
                activeCategory === cat.id ? styles.activeFilter : styles.filter
              }
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text
                style={
                  activeCategory === cat.id
                    ? styles.activeText
                    : styles.filterText
                }
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={vendors.filter(
            (v) =>
              (!activeCategory ||
                v.specialty.includes(activeCategory) ||
                (v as any).categoryId === activeCategory) &&
              v.name.toLowerCase().includes(search.toLowerCase()),
          )}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 5 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Text style={{ color: "#555" }}>Aucune revendeuse trouvÃ©e</Text>
            </View>
          }
        />
      )}

      {/* Vendor Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedVendor}
        onRequestClose={() => setSelectedVendor(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedVendor(null)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedVendor && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={{
                    uri: selectedVendor.imageUrl || selectedVendor.avatar,
                  }}
                  style={styles.modalImage}
                />

                <View style={styles.modalInfoContainer}>
                  <View style={styles.modalNameRow}>
                    <Text style={styles.modalShopName}>{selectedVendor.name}</Text>
                    <VerifiedBadge verified={selectedVendor.isVerified} size={20} />
                  </View>

                  <View style={styles.modalSubHeader}>
                    <View style={styles.rating}>
                      <Ionicons name="star" size={18} color="#FFD700" />
                      <Text style={styles.modalRatingText}>
                        {selectedVendor.rating} ({selectedVendor.reviews} avis)
                      </Text>
                    </View>
                    <Text style={styles.modalDistance}>
                      {selectedVendor.distance}
                    </Text>
                  </View>

                  <View style={styles.specialtyContainer}>
                    {selectedVendor.specialty.map(
                      (tag: string, idx: number) => (
                        <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ),
                    )}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Menu</Text>
                    {loadingProducts ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : vendorProducts.length > 0 ? (
                      <View style={styles.productsGrid}>
                        {vendorProducts.map((product) => (
                          <TouchableOpacity
                            key={product.id}
                            style={[
                              styles.productCard,
                              selectedItems[product.id]
                                ? styles.productCardSelected
                                : null,
                            ]}
                            onPress={() => {
                              setSelectedItems((prev) => ({
                                ...prev,
                                [product.id]: prev[product.id] ? 0 : 1,
                              }));
                            }}
                          >
                            <Image
                              source={
                                product.imageUrl
                                  ? { uri: product.imageUrl }
                                  : {
                                      uri: "https://loremflickr.com/200/200/food",
                                    }
                              }
                              style={styles.productImage}
                            />
                            <Text style={styles.productName}>
                              {product.name}
                            </Text>
                            <Text style={styles.productPrice}>
                              {product.price} F
                            </Text>
                            {selectedItems[product.id] > 0 && (
                              <View style={styles.checkBadge}>
                                <Ionicons
                                  name="checkmark-circle"
                                  size={20}
                                  color="#00b894"
                                />
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.sectionContent}>
                        Aucun produit disponible pour le moment.
                      </Text>
                    )}
                  </View>

                  {Object.values(selectedItems).some((qty) => qty > 0) && (
                    <TouchableOpacity
                      style={styles.orderButton}
                      onPress={() => setShowConfirmModal(true)}
                    >
                      <Text style={styles.orderButtonText}>
                        Commander (
                        {
                          Object.values(selectedItems).filter((qty) => qty > 0)
                            .length
                        }{" "}
                        articles)
                      </Text>
                    </TouchableOpacity>
                  )}

                  <OrderConfirmationModal
                    visible={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={async (formattedAddress, paymentMethod) => {
                      if (!clerkUser || !selectedVendor) return;

                      const items = vendorProducts
                        .filter((p) => selectedItems[p.id] > 0)
                        .map((p) => ({
                          productId: p.id,
                          name: p.name,
                          price: p.price,
                          quantity: selectedItems[p.id],
                        }));

                      const total = items.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0,
                      );

                      try {
                        setIsOrdering(true);
                        const result = await createOrder({
                          clientId: clerkUser.id,
                          vendorId: selectedVendor.id,
                          items,
                          totalPrice: total,
                          deliveryAddress: {
                            address: formattedAddress,
                            coordinates: clientLocation || undefined,
                          },
                          paymentMethod, // Added this field
                        });

                        if (result && result.id) {
                          // Sauvegarder la commande active
                          await AsyncStorage.setItem(
                            ACTIVE_ORDER_KEY,
                            result.id,
                          );
                          await AsyncStorage.setItem(
                            ACTIVE_ORDER_STATUS_KEY,
                            "PENDING",
                          );
                          setActiveOrderId(result.id);
                          setActiveOrderStatus("PENDING");
                          Animated.spring(bannerAnim, {
                            toValue: 1,
                            useNativeDriver: true,
                          }).start();

                          setSelectedItems({});
                          setSelectedVendor(null);
                          setShowConfirmModal(false);
                          // Redirection vers l'Ã©cran de suivi
                          router.push({
                            pathname: "/tab/suivi_commande",
                            params: { orderId: result.id },
                          });
                        }
                      } catch (error) {
                        Alert.alert(
                          "Erreur",
                          "Impossible de passer la commande.",
                        );
                      } finally {
                        setIsOrdering(false);
                      }
                    }}
                    items={vendorProducts
                      .filter((p) => selectedItems[p.id] > 0)
                      .map((p) => ({
                        name: p.name,
                        price: p.price,
                        quantity: selectedItems[p.id],
                      }))}
                    totalPrice={vendorProducts
                      .filter((p) => selectedItems[p.id] > 0)
                      .reduce(
                        (sum, p) => sum + p.price * selectedItems[p.id],
                        0,
                      )}
                    initialLocation={clientLocation}
                    loading={isOrdering}
                  />

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Horaires</Text>
                    <Text style={styles.sectionContent}>
                      {selectedVendor.status === "open"
                        ? "🟢 Ouvert actuellement"
                        : "🔴 Fermé actuellement"}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.contactButton}>
                    <Ionicons name="call" size={20} color="#000" />
                    <Text style={styles.contactButtonText}>
                      Contacter la revendeuse
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffcc00ff",
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
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

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    fontWeight: "700",
    fontSize: 14,
  },

  rating: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
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
    margin: 4,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    marginBottom: 17,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: height * 0.85,
    paddingTop: 8,
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 100,
  },
  closeButton: {
    position: "absolute",
    right: 18,
    top: 5,
    backgroundColor: "#f5f5f5",
    padding: 2,
    borderRadius: 20,
  },
  modalImage: {
    marginTop: 10,
    width: "100%",
    height: 250,
  },
  modalInfoContainer: {
    padding: 24,
  },
  modalNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  modalShopName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000",
    marginBottom: 0,
  },
  modalSubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalRatingText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  modalDistance: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  specialtyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: "#ffcc00ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#000",
  },
  sectionContent: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productCard: {
    width: (width - 64) / 2, // Adjusted for padding
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "transparent",
  },
  productCardSelected: {
    borderColor: "#00b894",
    backgroundColor: "#ebfffa",
  },
  checkBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  orderButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  productImage: {
    width: "100%",
    height: 110,
    marginBottom: 6,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  productPrice: {
    fontSize: 12,
    color: "#a90808",
    fontWeight: "700",
  },
  contactButton: {
    backgroundColor: "#ffcc00ff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  activeBanner: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  activeBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FFC700",
  },
  bannerPulse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff7e0",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFC700",
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2d3436",
  },
  bannerStatus: {
    fontSize: 12,
    color: "#636e72",
    marginTop: 2,
  },
});
