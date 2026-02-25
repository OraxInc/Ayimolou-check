 import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface OrderConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (address: string, paymentMethod: 'CASH' | 'MOBILE_MONEY') => void;
  items: any[];
  totalPrice: number;
  initialLocation?: { latitude: number; longitude: number } | null;
  loading?: boolean;
}

export default function OrderConfirmationModal({ 
  visible, 
  onClose, 
  onConfirm, 
  items, 
  totalPrice,
  initialLocation,
  loading = false
}: OrderConfirmationModalProps) {
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOBILE_MONEY'>('CASH');
  const [fetchingAddress, setFetchingAddress] = useState(false);

  useEffect(() => {
    if (visible && initialLocation) {
      reverseGeocode(initialLocation.latitude, initialLocation.longitude);
    }
  }, [visible, initialLocation]);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      setFetchingAddress(true);
      const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (result) {
        const addr = `${result.name || ''} ${result.street || ''}, ${result.district || result.city || ''}`.trim();
        setAddress(addr);
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    } finally {
      setFetchingAddress(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Confirmer la commande</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Récapitulatif</Text>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name} x{item.quantity}</Text>
                <Text style={styles.itemPrice}>{item.price * item.quantity} F</Text>
              </View>
            ))}
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total à payer</Text>
              <Text style={styles.totalValue}>{totalPrice} FCFA</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Adresse de livraison</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Rue 123, Porte 4, Quartier..."
                value={address}
                onChangeText={setAddress}
                multiline
              />
              {fetchingAddress && (
                <ActivityIndicator size="small" color="#FFC700" style={styles.loader} />
              )}
            </View>
            <Text style={styles.hint}>Précisez votre porte ou un point de repère pour le livreur.</Text>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Mode de paiement</Text>
            <View style={styles.paymentContainer}>
              <TouchableOpacity 
                style={[styles.paymentOption, paymentMethod === 'CASH' && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod('CASH')}
              >
                <Ionicons name="cash-outline" size={24} color={paymentMethod === 'CASH' ? '#000' : '#666'} />
                <Text style={[styles.paymentText, paymentMethod === 'CASH' && styles.paymentTextActive]}>Espèces</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.paymentOption, paymentMethod === 'MOBILE_MONEY' && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod('MOBILE_MONEY')}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={paymentMethod === 'MOBILE_MONEY' ? '#000' : '#666'} />
                <Text style={[styles.paymentText, paymentMethod === 'MOBILE_MONEY' && styles.paymentTextActive]}>Mobile Money</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.confirmButton, (!address.trim() || loading) && styles.disabledButton]}
              onPress={() => onConfirm(address, paymentMethod)}
              disabled={!address.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.confirmText}>Passer la commande</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#d63031',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    minHeight: 40,
  },
  loader: {
    marginLeft: 10,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: '#FFC700',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  paymentContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
  },
  paymentOptionActive: {
    backgroundColor: '#FFC700',
    borderColor: '#FFC700',
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  paymentTextActive: {
    color: '#000',
  },
});
