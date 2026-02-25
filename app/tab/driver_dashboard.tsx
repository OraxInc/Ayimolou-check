import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Switch, Image, RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useBackendApi } from "../../services/api";
import { useFocusEffect } from "expo-router";
import * as Location from 'expo-location';
import Toast from "react-native-toast-message";

type Tab = 'available' | 'active' | 'history';

export default function DriverDashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const {
    getAvailableDeliveries, assignDelivery, completeDelivery,
    getUserProfile, updateDriverLocation, updateDriverAvailability,
    getDriverOrders
  } = useBackendApi();

  // GPS Throttling refs
  const lastUpdateRef = useRef<number>(0);
  const lastCoordsRef = useRef<{latitude: number, longitude: number} | null>(null);

  const fetchData = useCallback(async (showLoading = false) => {
    if (!user) return;
    try {
      if (showLoading) setLoading(true);
      
      const profile = await getUserProfile(user.id);
      setDbUser(profile);
      const userIsAvailable = profile?.driverProfile?.isAvailable || false;
      setIsAvailable(userIsAvailable);

      // 1. Fetch available orders only if driver is available
      let available: any[] = [];
      if (userIsAvailable) {
        available = await getAvailableDeliveries();
      }
      setAvailableOrders(available);

      // 2. Fetch all my orders as driver
      const myOrders = await getDriverOrders(); 
      
      const deliveringOrder = myOrders.find((o: any) => o.status === 'DELIVERING');
      setActiveOrder(deliveringOrder || null);

      const completed = myOrders.filter((o: any) => o.status === 'COMPLETED');
      setHistoryOrders(completed);
      
      const earnings = completed.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
      setTotalEarnings(earnings);
      
      // If we have an active order, switch to active tab automatically
      if (deliveringOrder && activeTab === 'available') {
        setActiveTab('active');
      }

    } catch (error) {
      console.error("Error fetching driver data:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => { fetchData(true); }, [fetchData]);

  useFocusEffect(useCallback(() => {
    const interval = setInterval(() => fetchData(false), 10000);
    return () => clearInterval(interval);
  }, [fetchData]));

  // ─── GPS Tracking ──────────────────────────────────────────────
  useEffect(() => {
    let subscription: any;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        async (location) => {
          if (!activeOrder || !user) return;

          const { latitude, longitude } = location.coords;
          const now = Date.now();

          // Client-side throttling (5s)
          if (now - lastUpdateRef.current < 5000) return;

          await updateDriverLocation(user.id, latitude, longitude);
          lastUpdateRef.current = now;
          lastCoordsRef.current = { latitude, longitude };
        }
      );
    };

    if (activeOrder) startWatching();
    return () => subscription?.remove();
  }, [activeOrder, user?.id]);

  // ─── Actions ───────────────────────────────────────────────────
  const toggleAvailability = async () => {
    if (!user || isUpdatingAvailability) return;
    setIsUpdatingAvailability(true);
    try {
      const newStatus = !isAvailable;
      const success = await updateDriverAvailability(user.id, newStatus);
      if (success) {
        setIsAvailable(newStatus);
        fetchData(false);
      }
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    const result = await assignDelivery(orderId);
    if (result.success) {
      Toast.show({ type: 'success', text1: 'Livraison acceptée !', position: 'top' });
      fetchData(true);
    } else if (result.conflict) {
      Alert.alert("Désolé", "Cette commande a déjà été prise par un autre livreur.");
      fetchData(false);
    } else {
      Alert.alert("Erreur", "Impossible d'accepter la commande.");
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    Alert.alert(
      "Confirmer la livraison",
      "Confirmez-vous avoir remis la commande au client ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui, Livrée",
          onPress: async () => {
            const success = await completeDelivery(orderId);
            if (success) {
              Toast.show({ type: 'success', text1: 'Bravo ! Livraison terminée.', position: 'top' });
              setActiveOrder(null);
              setActiveTab('available');
              fetchData(true);
            }
          }
        }
      ]
    );
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      READY: 'Prête', DELIVERING: 'En cours', COMPLETED: 'Livrét'
    };
    return labels[status] || status;
  };

  // ─── Rendering ─────────────────────────────────────────────────
  const renderAvailable = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => fetchData(true)} />}
    >
      {!isAvailable && (
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={24} color="#e17055" />
          <Text style={styles.warningText}>Vous devez être "En ligne" pour voir les commandes disponibles.</Text>
        </View>
      )}

      {availableOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bicycle-outline" size={64} color="#ddd" />
          <Text style={styles.emptyText}>Aucune commande disponible</Text>
          <Text style={styles.emptySubText}>Les nouvelles commandes s'afficheront ici.</Text>
        </View>
      ) : availableOrders.map(order => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>Commande #{order.id.slice(-6)}</Text>
            <Text style={styles.priceText}>{order.totalPrice} FCFA</Text>
          </View>
          
          <View style={styles.addressBox}>
            <Ionicons name="location" size={16} color="#d63031" />
            <Text style={styles.addressText} numberOfLines={2}>{order.deliveryAddress.address}</Text>
          </View>

          <View style={styles.itemsBox}>
             <Text style={styles.itemsCount}>{order.items.length} article(s)</Text>
          </View>

          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptOrder(order.id)}>
            <Text style={styles.acceptBtnText}>Accepter la livraison</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => fetchData(true)} />}
    >
      <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Gains totaux</Text>
          <Text style={styles.earningsValue}>{totalEarnings.toLocaleString()} FCFA</Text>
          <View style={styles.earningsStats}>
              <View style={styles.statBox}>
                  <Text style={styles.statValue}>{historyOrders.length}</Text>
                  <Text style={styles.statLabel}>Livraisons</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {historyOrders.length > 0 ? Math.round(totalEarnings / historyOrders.length).toLocaleString() : 0}
                  </Text>
                  <Text style={styles.statLabel}>Moy / course</Text>
              </View>
          </View>
      </View>

      <Text style={[styles.sectionTitle, { marginHorizontal: 20, marginBottom: 12 }]}>Dernières courses</Text>
      
      {historyOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color="#ddd" />
          <Text style={styles.emptyText}>Aucun historique pour le moment</Text>
        </View>
      ) : historyOrders.map(order => (
        <View key={order.id} style={styles.historyRow}>
            <View style={styles.historyInfo}>
                <Text style={styles.historyId}>#{order.id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.historyDate}>
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('fr-FR') : 'Date inconnue'}
                </Text>
            </View>
            <Text style={styles.historyPrice}>+{order.totalPrice} F</Text>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderActive = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => fetchData(true)} />}
    >
      {!activeOrder ? (
         <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color="#ddd" />
            <Text style={styles.emptyText}>Aucune livraison active</Text>
            <TouchableOpacity onPress={() => setActiveTab('available')}>
               <Text style={styles.linkText}>Chercher une commande</Text>
            </TouchableOpacity>
         </View>
      ) : (
        <View style={styles.activeCard}>
           <View style={styles.activeHeader}>
              <View>
                 <Text style={styles.activeTitle}>Livraison en cours</Text>
                 <Text style={styles.activeSub}>#{activeOrder.id.slice(-6)}</Text>
              </View>
              <View style={styles.activeBadge}>
                 <Text style={styles.activeBadgeText}>DELIVERING</Text>
              </View>
           </View>

           <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>📍 ADRESSE DE LIVRAISON</Text>
              <Text style={styles.addressBig}>{activeOrder.deliveryAddress.address}</Text>
           </View>

           <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>🛍️ CONTENU</Text>
              {activeOrder.items.map((it: any, idx: number) => (
                <Text key={idx} style={styles.itemRow}>· {it.name} × {it.quantity}</Text>
              ))}
           </View>

           <View style={styles.gpsIndicator}>
              <View style={[styles.pulseCircle, { backgroundColor: '#55efc4' }]} />
              <Text style={styles.gpsText}>GPS Actif - Le client voit votre position</Text>
           </View>

           <TouchableOpacity style={styles.completeBtn} onPress={() => handleCompleteOrder(activeOrder.id)}>
              <Text style={styles.completeBtnText}>Livraison terminée</Text>
           </TouchableOpacity>
        </View>
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Livreur</Text>
          <Text style={styles.subtitle}>{user?.fullName}</Text>
        </View>
        <View style={styles.availabilityRow}>
          <Text style={[styles.availabilityLabel, { color: isAvailable ? '#00b894' : '#636e72' }]}>
             {isAvailable ? 'En ligne' : 'Hors ligne'}
          </Text>
          <Switch
            value={isAvailable}
            onValueChange={toggleAvailability}
            trackColor={{ true: '#55efc4', false: '#dfe6e9' }}
            thumbColor={isAvailable ? '#00b894' : '#b2bec3'}
            disabled={isUpdatingAvailability}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'available' && styles.tabItemActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabLabel, activeTab === 'available' && styles.tabLabelActive]}>Disponible</Text>
          {availableOrders.length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{availableOrders.length}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'active' && styles.tabItemActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabLabel, activeTab === 'active' && styles.tabLabelActive]}>Ma Livraison</Text>
          {activeOrder && <View style={styles.dot} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>Historique</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#FFC700" style={{ marginTop: 60 }} />
        ) : (
          activeTab === 'available' ? renderAvailable() : 
          activeTab === 'active' ? renderActive() : 
          renderHistory()
        )}
      </View>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  title: { fontSize: 24, fontWeight: '800', color: '#2d3436' },
  subtitle: { fontSize: 13, color: '#636e72', marginTop: 2 },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availabilityLabel: { fontSize: 13, fontWeight: '700' },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabItem: { flex: 1, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabItemActive: { borderBottomWidth: 3, borderBottomColor: '#FFC700' },
  tabLabel: { fontSize: 15, fontWeight: '700', color: '#b2bec3' },
  tabLabelActive: { color: '#2d3436' },
  badge: { backgroundColor: '#d63031', paddingHorizontal: 6, borderRadius: 10, height: 18, justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFC700' },

  warningBox: { flexDirection: 'row', backgroundColor: '#fff', margin: 16, padding: 12, borderRadius: 12, alignItems: 'center', gap: 10, borderLeftWidth: 4, borderLeftColor: '#e17055' },
  warningText: { flex: 1, fontSize: 13, color: '#2d3436', fontWeight: '600' },

  orderCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: '700' },
  priceText: { fontSize: 16, fontWeight: '800', color: '#d63031' },
  addressBox: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  addressText: { flex: 1, fontSize: 14, color: '#636e72', lineHeight: 20 },
  itemsBox: { marginBottom: 16 },
  itemsCount: { fontSize: 13, color: '#b2bec3', fontStyle: 'italic' },
  acceptBtn: { backgroundColor: '#FFC700', padding: 14, borderRadius: 12, alignItems: 'center' },
  acceptBtnText: { fontWeight: '800', fontSize: 15 },

  activeCard: { backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  activeTitle: { fontSize: 18, fontWeight: '800', color: '#2d3436' },
  activeSub: { fontSize: 14, color: '#b2bec3', marginTop: 2 },
  activeBadge: { backgroundColor: '#55efc4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeBadgeText: { fontSize: 11, fontWeight: '800', color: '#00b894' },
  infoSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#b2bec3', marginBottom: 8, letterSpacing: 1 },
  addressBig: { fontSize: 16, fontWeight: '700', color: '#2d3436', lineHeight: 24 },
  itemRow: { fontSize: 14, color: '#636e72', marginBottom: 4 },
  gpsIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f2f6', padding: 10, borderRadius: 10, marginBottom: 20 },
  pulseCircle: { width: 8, height: 8, borderRadius: 4 },
  gpsText: { fontSize: 12, fontWeight: '600', color: '#636e72' },
  completeBtn: { backgroundColor: '#00b894', padding: 18, borderRadius: 15, alignItems: 'center' },
  completeBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },

  emptyState: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#b2bec3' },
  emptySubText: { fontSize: 13, color: '#dfe6e9' },
  linkText: { color: '#FFC700', fontWeight: '700', textDecorationLine: 'underline' },

  earningsCard: { backgroundColor: '#2d3436', margin: 20, borderRadius: 20, padding: 24, alignItems: 'center' },
  earningsLabel: { color: '#b2bec3', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  earningsValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 20 },
  earningsStats: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#4b5557', paddingTop: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#b2bec3', fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#4b5557' },

  historyRow: { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginHorizontal: 20, marginBottom: 12, borderRadius: 12 },
  historyInfo: { gap: 4 },
  historyId: { fontSize: 15, fontWeight: '700', color: '#2d3436' },
  historyDate: { fontSize: 12, color: '#b2bec3' },
  historyPrice: { fontSize: 16, fontWeight: '800', color: '#00b894' },
});
