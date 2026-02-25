import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useBackendApi } from "../../services/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SuiviCommande() {
  const { user } = useUser();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const { getMyOrders, getUserProfile, verifyPayment, getDriverLocation } = useBackendApi();

  const fetchDriverLocation = useCallback(async (driverId: string) => {
    try {
      const location = await getDriverLocation(driverId);
      if (location) {
        setDriverLocation(location);
      }
    } catch (error) {
      console.error("Error fetching driver location:", error);
    }
  }, [getDriverLocation]);

  const fetchOrderDetails = useCallback(async () => {
    if (!user || !orderId) return;
    try {
      const orders = await getMyOrders(user.id);
      const currentOrder = orders.find((o: any) => o.id === orderId);
      if (currentOrder) {
        setOrder(currentOrder);
        
        // Sync status to AsyncStorage so the banner stays up to date
        await AsyncStorage.setItem('activeOrderStatus', currentOrder.status);
        
        // If terminal status, remove the active order from storage
        if (['COMPLETED', 'CANCELLED'].includes(currentOrder.status)) {
          await AsyncStorage.multiRemove(['activeOrderId', 'activeOrderStatus']);
        }

        // Fetch vendor info if not already fetched
        if (!vendor || vendor.id !== currentOrder.vendorId) {
          const vendorProfile = await getUserProfile(currentOrder.vendorId);
          if (vendorProfile) {
            setVendor(vendorProfile);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, orderId, vendor]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        fetchOrderDetails();
        if (order?.driverId && order?.status === 'DELIVERING') {
          fetchDriverLocation(order.driverId);
        }
      }, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }, [fetchOrderDetails])
  );

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'ACCEPTED': return 2;
      case 'PREPARING': return 3;
      case 'READY': return 4;
      case 'DELIVERING': return 5;
      case 'COMPLETED': return 6;
      default: return 1;
    }
  };

  const statusMessages: Record<string, string> = {
    'PENDING': "Attente de confirmation par la revendeuse...",
    'ACCEPTED': "Commande acceptée ! La préparation va commencer.",
    'PREPARING': "Votre délicieux repas est en cours de préparation...",
    'READY': "Votre commande est prête ! Un livreur va la récupérer.",
    'DELIVERING': "Le livreur est en route vers votre adresse.",
    'COMPLETED': "Commande livrée ! Bon appétit !",
    'CANCELLED': "Commande annulée."
  };

  const handleCall = () => {
    if (vendor?.phoneNumber) {
      Linking.openURL(`tel:${vendor.phoneNumber}`);
    } else {
      Alert.alert("info", "Numéro de téléphone non disponible.");
    }
  };

  const handlePayment = async () => {
    if (!orderId || isPaying) return;
    try {
      setIsPaying(true);
      // Pour la démo, on utilise le numéro de l'user s'il existe ou un numéro bidon
      const result = await verifyPayment(orderId, user?.primaryEmailAddress?.emailAddress || "00000000");
      if (result && result.status === 'PAID') {
        Alert.alert("Succès", "Paiement validé avec succès !");
        fetchOrderDetails();
      } else {
        Alert.alert("Erreur", "Le paiement a échoué.");
      }
    } catch (err) {
      Alert.alert("Erreur", "Une erreur est survenue lors du paiement.");
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFC700" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Suivi de commande</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.emptyText}>Commande introuvable.</Text>
      </SafeAreaView>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Suivi de commande</Text>
        <TouchableOpacity onPress={fetchOrderDetails}>
          <Ionicons name="refresh" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.orderIdCard}>
          <Text style={styles.orderLabel}>N° Commande</Text>
          <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusMessage}>{statusMessages[order.status]}</Text>
          
          <View style={styles.stepper}>
            {[1, 2, 3, 4, 5].map((step) => (
              <React.Fragment key={step}>
                <View style={[
                  styles.stepCircle, 
                  currentStep >= step ? styles.activeStep : styles.inactiveStep
                ]}>
                  {currentStep > step ? (
                    <Ionicons name="checkmark" size={16} color="white" />
                  ) : (
                    <Text style={[styles.stepNumber, currentStep === step && { color: 'white' }]}>{step}</Text>
                  )}
                </View>
                {step < 5 && (
                  <View style={[
                    styles.stepLine,
                    currentStep > step ? styles.activeLine : styles.inactiveLine
                  ]} />
                )}
              </React.Fragment>
            ))}
          </View>
          
          <View style={styles.stepperLabels}>
            <Text style={styles.stepLabel}>Reçue</Text>
            <Text style={styles.stepLabel}>Acceptée</Text>
            <Text style={styles.stepLabel}>Cuisine</Text>
            <Text style={styles.stepLabel}>Prête</Text>
            <Text style={styles.stepLabel}>Livraison</Text>
          </View>
        </View>

        {vendor?.vendorProfile?.coordinates && order.deliveryAddress?.coordinates && (
          <View style={styles.mapCard}>
            <Text style={styles.sectionTitle}>Localisation</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (vendor.vendorProfile.coordinates.latitude + order.deliveryAddress.coordinates.latitude) / 2,
                longitude: (vendor.vendorProfile.coordinates.longitude + order.deliveryAddress.coordinates.longitude) / 2,
                latitudeDelta: Math.abs(vendor.vendorProfile.coordinates.latitude - order.deliveryAddress.coordinates.latitude) * 2,
                longitudeDelta: Math.abs(vendor.vendorProfile.coordinates.longitude - order.deliveryAddress.coordinates.longitude) * 2,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker 
                coordinate={vendor.vendorProfile.coordinates}
                title="Vendeuse"
                description={vendor.displayName}
              >
                <View style={styles.markerContainer}>
                  <Ionicons name="storefront" size={20} color="white" />
                </View>
              </Marker>
              <Marker 
                coordinate={order.deliveryAddress.coordinates}
                title="Moi"
              >
                <View style={[styles.markerContainer, { backgroundColor: '#00cec9' }]}>
                  <Ionicons name="person" size={20} color="white" />
                </View>
              </Marker>

              {driverLocation && (
                <Marker 
                  coordinate={driverLocation}
                  title="Livreur"
                  description="Votre commande arrive !"
                >
                  <View style={[styles.markerContainer, { backgroundColor: '#FFC700' }]}>
                    <Ionicons name="bicycle" size={20} color="black" />
                  </View>
                </Marker>
              )}
            </MapView>
          </View>
        )}

        <View style={styles.detailsCard}>
          <View style={styles.cardHeaderWithAction}>
            <Text style={styles.sectionTitle}>Paiement</Text>
            <View style={[styles.paymentBadge, { backgroundColor: order.paymentStatus === 'PAID' ? '#55efc4' : '#fab1a0' }]}>
              <Text style={styles.paymentBadgeText}>
                {order.paymentStatus === 'PAID' ? 'PAYÉ' : 'NON PAYÉ'}
              </Text>
            </View>
          </View>
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>Mode: {order.paymentMethod === 'CASH' ? 'Espèces' : 'Mobile Money'}</Text>
            <Text style={styles.totalPriceSmall}>{order.totalPrice} F</Text>
          </View>
          {order.paymentMethod === 'MOBILE_MONEY' && order.paymentStatus === 'UNPAID' && (
            <TouchableOpacity 
              style={styles.payNowBtn} 
              onPress={handlePayment}
              disabled={isPaying}
            >
              {isPaying ? <ActivityIndicator color="#fff" /> : <Text style={styles.payNowBtnText}>Payer maintenant</Text>}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Détails des articles</Text>
          {order.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name} x{item.quantity}</Text>
              <Text style={styles.itemPrice}>{item.price * item.quantity} F</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>{order.totalPrice} FCFA</Text>
          </View>
        </View>

        <View style={styles.addressCard}>
          <Text style={styles.sectionTitle}>Adresse de livraison</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={20} color="#FFC700" />
            <Text style={styles.addressText}>{order.deliveryAddress?.address}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
          <Ionicons name="call" size={20} color="white" />
          <Text style={styles.contactBtnText}>Appeler la vendeuse</Text>
        </TouchableOpacity>

        {order.driverId && (
          <TouchableOpacity 
            style={[styles.contactBtn, { backgroundColor: '#0984e3', marginTop: -8 }]} 
            onPress={() => Alert.alert("Indisponible", "Fonctionnalité d'appel livreur bientôt disponible.")}
          >
            <Ionicons name="bicycle-outline" size={20} color="white" />
            <Text style={styles.contactBtnText}>Appeler le livreur</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: { fontSize: 18, fontWeight: "700" },
  content: { padding: 16 },
  orderIdCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  orderLabel: { color: '#666', fontSize: 14 },
  orderId: { fontWeight: '800', fontSize: 18 },
  statusCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center'
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#000'
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 10
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2
  },
  activeStep: {
    backgroundColor: '#FFC700',
    borderColor: '#FFC700'
  },
  inactiveStep: {
    backgroundColor: '#fff',
    borderColor: '#eee'
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ccc'
  },
  stepLine: {
    flex: 1,
    height: 3,
  },
  activeLine: {
    backgroundColor: '#FFC700'
  },
  inactiveLine: {
    backgroundColor: '#eee'
  },
  stepperLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10
  },
  stepLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    width: 50
  },
  detailsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333'
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  itemName: { color: '#555' },
  itemPrice: { fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontWeight: '700', fontSize: 16 },
  totalPrice: { fontWeight: '800', fontSize: 18, color: '#d63031' },
  addressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressText: { flex: 1, color: '#444' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#666' },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16
  },
  map: {
    width: '100%',
    height: 150,
  },
  markerContainer: {
    padding: 5,
    backgroundColor: '#FFC700',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white'
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000'
  },
  totalPriceSmall: {
    fontWeight: '800',
    fontSize: 16,
    color: '#d63031'
  },
  payNowBtn: {
    backgroundColor: '#FFC700',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  payNowBtnText: {
    fontWeight: '700',
    color: '#000'
  },
  contactBtn: {
    backgroundColor: '#00b894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  }
});
