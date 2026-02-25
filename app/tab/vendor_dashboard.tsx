import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, Switch, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useBackendApi } from "../../services/api";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";

type Tab = 'orders' | 'products' | 'settings';

const SPECIALTIES = ["Ayimolou", "Atchèkè", "Waktchi", "Fufu", "Kom", "Salade"];

const emptyForm = { name: '', description: '', price: '', categoryId: 'general', imageUrl: '' };

export default function VendorDashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);

  // Product form state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState(emptyForm);
  const [savingProduct, setSavingProduct] = useState(false);

  const {
    getVendorOrders, updateOrderStatus, getProducts,
    getUserProfile, updateVendorProfile, updateProduct,
    createProduct, deleteProduct
  } = useBackendApi();

  const previousOrdersCountRef = useRef<number>(0);

  const fetchData = useCallback(async (showLoading = false) => {
    if (!user) return;
    try {
      if (showLoading) setLoading(true);
      const [ordersData, productsData, profileData] = await Promise.all([
        getVendorOrders(),
        getProducts({ vendorId: user.id }),
        getUserProfile(user.id)
      ]);

      if (previousOrdersCountRef.current > 0 && ordersData.length > previousOrdersCountRef.current) {
        Toast.show({ type: 'success', text1: 'Nouvelle commande !', text2: 'Une commande vient d\'arriver.', position: 'top' });
      }

      setOrders(ordersData);
      setProducts(productsData);
      setDbUser(profileData);
      previousOrdersCountRef.current = ordersData.length;
    } catch (error) {
      console.error("Error fetching vendor data:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(true); }, [fetchData]);

  useFocusEffect(useCallback(() => {
    const interval = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(interval);
  }, [fetchData]));

  // ─── Shop Toggle ───────────────────────────────────────────────
  const toggleShopStatus = async () => {
    if (!dbUser || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = !dbUser.vendorProfile.isOpen;
      const success = await updateVendorProfile(user?.id!, { isOpen: newStatus });
      if (success) {
        setDbUser((prev: any) => ({ ...prev, vendorProfile: { ...prev.vendorProfile, isOpen: newStatus } }));
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ─── Product Toggle ────────────────────────────────────────────
  const toggleProductAvailability = async (productId: string, currentStatus: boolean) => {
    const success = await updateProduct(productId, { isAvailable: !currentStatus });
    if (success) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, isAvailable: !currentStatus } : p));
    }
  };

  // ─── Order Status ──────────────────────────────────────────────
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) fetchData();
    else Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
  };

  // ─── Product CRUD ──────────────────────────────────────────────
  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm(emptyForm);
    setShowProductModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      categoryId: product.categoryId || 'general',
      imageUrl: product.imageUrl || ''
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.description || !productForm.price) {
      Alert.alert("Incomplet", "Veuillez remplir le nom, la description et le prix.");
      return;
    }

    setSavingProduct(true);
    try {
      const data = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        categoryId: productForm.categoryId,
        imageUrl: productForm.imageUrl || undefined,
        vendorId: user?.id!,
        isAvailable: true,
      };

      let success = false;
      if (editingProduct) {
        success = await updateProduct(editingProduct.id, data);
      } else {
        const result = await createProduct(data);
        success = !!result;
      }

      if (success) {
        setShowProductModal(false);
        fetchData(false);
        Toast.show({ type: 'success', text1: editingProduct ? 'Produit modifié !' : 'Produit ajouté !', position: 'top' });
      } else {
        Alert.alert("Erreur", "L'opération a échoué.");
      }
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      "Supprimer le produit",
      `Voulez-vous vraiment supprimer "${productName}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const success = await deleteProduct(productId);
            if (success) {
              setProducts(prev => prev.filter(p => p.id !== productId));
              Toast.show({ type: 'success', text1: 'Produit supprimé', position: 'top' });
            }
          }
        }
      ]
    );
  };

  // ─── Helpers ───────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#fab1a0', ACCEPTED: '#ffeaa7',
      PREPARING: '#81ecec', READY: '#55efc4',
      COMPLETED: '#00b894', CANCELLED: '#dfe6e9'
    };
    return colors[status] || '#dfe6e9';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente', ACCEPTED: 'Acceptée',
      PREPARING: 'En préparation', READY: 'Prête',
      DELIVERING: 'En livraison', COMPLETED: 'Livrée', CANCELLED: 'Annulée'
    };
    return labels[status] || status;
  };

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const isOpen = dbUser?.vendorProfile?.isOpen;

  // ─── Rendering ─────────────────────────────────────────────────
  const renderOrders = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color="#ddd" />
          <Text style={styles.emptyText}>Aucune commande pour le moment</Text>
        </View>
      ) : orders.map(order => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>Commande #{order.id.slice(-6)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {order.items.map((it: any, idx: number) => (
              <Text key={idx} style={styles.itemText}>· {it.name} × {it.quantity}</Text>
            ))}
          </View>

          <View style={styles.orderFooter}>
            <Text style={styles.totalPrice}>{order.totalPrice} FCFA</Text>
            <View style={styles.actions}>
              {order.status === 'PENDING' && (
                <>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d63031' }]} onPress={() => handleStatusUpdate(order.id, 'CANCELLED')}>
                    <Text style={styles.btnText}>Refuser</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFC700' }]} onPress={() => handleStatusUpdate(order.id, 'ACCEPTED')}>
                    <Text style={styles.btnText}>Accepter</Text>
                  </TouchableOpacity>
                </>
              )}
              {order.status === 'ACCEPTED' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00b894', flex: 1 }]} onPress={() => handleStatusUpdate(order.id, 'PREPARING')}>
                  <Text style={styles.btnText}>👨‍🍳 Commencer préparation</Text>
                </TouchableOpacity>
              )}
              {order.status === 'PREPARING' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00cec9', flex: 1 }]} onPress={() => handleStatusUpdate(order.id, 'READY')}>
                  <Text style={styles.btnText}>✅ Prête à livrer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderProducts = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.addProductBtn} onPress={openAddModal}>
        <Ionicons name="add-circle" size={24} color="#000" />
        <Text style={styles.addProductText}>Ajouter un nouveau plat</Text>
      </TouchableOpacity>

      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="fast-food-outline" size={64} color="#ddd" />
          <Text style={styles.emptyText}>Aucun plat dans votre menu</Text>
          <Text style={styles.emptySubText}>Ajoutez vos spécialités ci-dessus</Text>
        </View>
      ) : products.map(product => (
        <View key={product.id} style={styles.productCard}>
          <View style={styles.productCardLeft}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, styles.productImagePlaceholder]}>
                <Ionicons name="fast-food-outline" size={28} color="#ccc" />
              </View>
            )}
          </View>
          <View style={styles.productCardInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
            <Text style={styles.productPrice}>{product.price} FCFA</Text>
          </View>
          <View style={styles.productCardActions}>
            <Switch
              value={product.isAvailable}
              onValueChange={() => toggleProductAvailability(product.id, product.isAvailable)}
              trackColor={{ true: '#55efc4', false: '#dfe6e9' }}
              thumbColor={product.isAvailable ? '#00b894' : '#b2bec3'}
            />
            <Text style={{ fontSize: 9, color: product.isAvailable ? '#00b894' : '#b2bec3', fontWeight: '700', marginTop: 2 }}>
              {product.isAvailable ? 'Dispo' : 'Caché'}
            </Text>
            <TouchableOpacity onPress={() => openEditModal(product)} style={{ marginTop: 8 }}>
              <Ionicons name="create-outline" size={22} color="#636e72" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteProduct(product.id, product.name)} style={{ marginTop: 6 }}>
              <Ionicons name="trash-outline" size={22} color="#d63031" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Statut boutique */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Statut de la Boutique</Text>
        <View style={styles.shopStatusRow}>
          <View>
            <Text style={styles.shopStatusLabel}>{isOpen ? '🟢 Ouverte' : '🔴 Fermée'}</Text>
            <Text style={styles.shopStatusSub}>
              {isOpen ? 'Les clients peuvent commander' : 'Les commandes sont désactivées'}
            </Text>
          </View>
          <Switch
            value={!!isOpen}
            onValueChange={toggleShopStatus}
            trackColor={{ true: '#55efc4', false: '#fab1a0' }}
            thumbColor={isOpen ? '#00b894' : '#d63031'}
            disabled={isUpdatingStatus}
          />
        </View>
      </View>

      {/* Infos boutique */}
      {dbUser?.vendorProfile && (
        <View style={styles.settingsCard}>
          <Text style={styles.settingsCardTitle}>Informations de la Boutique</Text>
          <View style={styles.infoRow}>
            <Ionicons name="storefront-outline" size={18} color="#636e72" />
            <Text style={styles.infoText}>{dbUser.vendorProfile.shopName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={18} color="#636e72" />
            <Text style={styles.infoText}>{dbUser.vendorProfile.description || 'Aucune description'}</Text>
          </View>
          {dbUser.vendorProfile.specialty?.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="restaurant-outline" size={18} color="#636e72" />
              <Text style={styles.infoText}>{dbUser.vendorProfile.specialty.join(', ')}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.editShopBtn}
            onPress={() => Alert.alert('Info', 'Retournez sur l\'inscription vendeur pour modifier vos infos.')}
          >
            <Ionicons name="create-outline" size={18} color="#000" />
            <Text style={styles.editShopBtnText}>Modifier les infos</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats rapides */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Statistiques</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Plats</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{orders.filter(o => o.status === 'COMPLETED').length}</Text>
            <Text style={styles.statLabel}>Livrées</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{orders.filter(o => o.status === 'PENDING').length}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ─── Product Modal ─────────────────────────────────────────────
  const renderProductModal = () => (
    <Modal visible={showProductModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowProductModal(false)}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{editingProduct ? 'Modifier le plat' : 'Nouveau plat'}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.inputLabel}>Nom du plat *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Ayimolou au poulet"
            value={productForm.name}
            onChangeText={v => setProductForm(p => ({ ...p, name: v }))}
          />

          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Décrivez ce plat..."
            multiline
            value={productForm.description}
            onChangeText={v => setProductForm(p => ({ ...p, description: v }))}
          />

          <Text style={styles.inputLabel}>Prix (FCFA) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 1500"
            keyboardType="numeric"
            value={productForm.price}
            onChangeText={v => setProductForm(p => ({ ...p, price: v }))}
          />

          <Text style={styles.inputLabel}>URL Image (optionnel)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            value={productForm.imageUrl}
            onChangeText={v => setProductForm(p => ({ ...p, imageUrl: v }))}
          />

          <TouchableOpacity
            style={[styles.saveBtn, savingProduct && { opacity: 0.6 }]}
            onPress={handleSaveProduct}
            disabled={savingProduct}
          >
            {savingProduct
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.saveBtnText}>{editingProduct ? 'Enregistrer les modifications' : 'Ajouter ce plat'}</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mon Tableau de Bord</Text>
          <View style={[styles.shopPill, { backgroundColor: isOpen ? '#55efc4' : '#fab1a0' }]}>
            <Text style={styles.shopPillText}>{isOpen ? '🟢 Boutique ouverte' : '🔴 Boutique fermée'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => fetchData(true)} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color="#000" />
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {([
          { key: 'orders', label: 'Commandes', icon: 'receipt-outline' },
          { key: 'products', label: 'Mes Plats', icon: 'fast-food-outline' },
          { key: 'settings', label: 'Boutique', icon: 'storefront-outline' },
        ] as { key: Tab, label: string, icon: any }[]).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon} size={20} color={activeTab === tab.key ? '#FFC700' : '#999'} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.key === 'orders' && pendingCount > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{pendingCount}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#FFC700" style={{ marginTop: 60 }} />
        ) : (
          <View style={{ flex: 1 }}>
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'settings' && renderSettings()}
          </View>
        )}
      </View>

      {renderProductModal()}
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  title: { fontSize: 20, fontWeight: '800', color: '#2d3436' },
  shopPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 4, alignSelf: 'flex-start' },
  shopPillText: { fontSize: 11, fontWeight: '700' },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f2f6', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -4, right: -4, backgroundColor: '#d63031',
    width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center'
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Tab bar
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: '#FFC700' },
  tabLabel: { fontSize: 11, color: '#999', fontWeight: '600' },
  tabLabelActive: { color: '#FFC700' },
  tabBadge: { position: 'absolute', top: 6, right: 14, backgroundColor: '#d63031', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // Orders
  orderCard: {
    backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 16,
    padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderId: { fontSize: 15, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  itemsList: { marginBottom: 12 },
  itemText: { fontSize: 14, color: '#636e72', marginBottom: 2 },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalPrice: { fontSize: 16, fontWeight: '800', color: '#d63031' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  btnText: { fontWeight: '700', fontSize: 13 },

  // Products
  addProductBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFC700',
    margin: 16, padding: 16, borderRadius: 16, gap: 10,
    shadowColor: "#FFC700", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4
  },
  addProductText: { fontWeight: '800', fontSize: 16 },
  productCard: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  productCardLeft: { marginRight: 12 },
  productImage: { width: 68, height: 68, borderRadius: 12 },
  productImagePlaceholder: { backgroundColor: '#f1f2f6', alignItems: 'center', justifyContent: 'center' },
  productCardInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: '#2d3436', marginBottom: 4 },
  productDescription: { fontSize: 12, color: '#636e72', marginBottom: 6, lineHeight: 16 },
  productPrice: { fontSize: 14, fontWeight: '800', color: '#e17055' },
  productCardActions: { alignItems: 'center', paddingLeft: 10 },

  // Settings
  settingsCard: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 16, padding: 20 },
  settingsCardTitle: { fontSize: 16, fontWeight: '800', color: '#2d3436', marginBottom: 16 },
  shopStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopStatusLabel: { fontSize: 18, fontWeight: '700' },
  shopStatusSub: { fontSize: 13, color: '#636e72', marginTop: 4 },
  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 12 },
  infoText: { flex: 1, fontSize: 14, color: '#2d3436', lineHeight: 20 },
  editShopBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8, backgroundColor: '#f1f2f6', padding: 12, borderRadius: 10 },
  editShopBtnText: { fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '800', color: '#2d3436' },
  statLabel: { fontSize: 12, color: '#636e72', marginTop: 4 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#b2bec3' },
  emptySubText: { fontSize: 13, color: '#dfe6e9' },

  // Modal
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#2d3436', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#eee' },
  saveBtn: { backgroundColor: '#FFC700', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 28 },
  saveBtnText: { fontSize: 17, fontWeight: '800' },
});
