import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useBackendApi } from "../services/api";
import * as Location from "expo-location";

const SPECIALTIES = ["Ayimolou", "Atchèkè", "Waktchi", "Fufu", "Kom", "Salade"];

export default function VendorRegistrationScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { updateVendorProfile, updateUserRole } = useBackendApi();

  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const toggleSpecialty = (specialty: string) => {
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(prev => prev.filter(s => s !== specialty));
    } else {
      setSelectedSpecialties(prev => [...prev, specialty]);
    }
  };

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "L'accès à la localisation est nécessaire pour placer votre boutique sur la carte.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      Alert.alert("Localisation capturée", "Votre boutique sera placée à votre position actuelle.");
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Erreur", "Impossible de récupérer votre position.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!shopName || !description || selectedSpecialties.length === 0 || !location) {
      Alert.alert("Incomplet", "Veuillez remplir tous les champs et capturer votre localisation.");
      return;
    }

    try {
      setLoading(true);
      if (!user) return;

      const profileData = {
        shopName,
        description,
        specialty: selectedSpecialties,
        coordinates: location,
        isOpen: true,
        rating: 5, // Score initial
      };

      // 1. Mettre à jour le profil vendeur
      const profileSuccess = await updateVendorProfile(user.id, profileData);
      
      // 2. Changer le rôle pour 'vendeur'
      const roleSuccess = await updateUserRole(user.id, 'vendeur');

      if (profileSuccess && roleSuccess) {
        Alert.alert("Félicitations !", "Votre boutique est maintenant créée. Bienvenue vendeuse !");
        router.replace("/tab/vendor_dashboard");
      } else {
        Alert.alert("Erreur", "Un problème est survenu lors de l'enregistrement.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert("Erreur", "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Devenir Vendeuse</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Complétez votre profil pour commencer à vendre vos délicieux plats.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom de la Boutique</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Chez Maman African"
            value={shopName}
            onChangeText={setShopName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez vos spécialités et votre passion..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vos Spécialités</Text>
          <View style={styles.chipContainer}>
            {SPECIALTIES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, selectedSpecialties.includes(s) && styles.chipActive]}
                onPress={() => toggleSpecialty(s)}
              >
                <Text style={[styles.chipText, selectedSpecialties.includes(s) && styles.chipTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Emplacement de la Boutique</Text>
          <TouchableOpacity 
            style={[styles.locationBtn, location && styles.locationBtnActive]} 
            onPress={handleGetLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name={location ? "location" : "location-outline"} size={20} color="#000" />
                <Text style={styles.locationBtnText}>
                  {location ? "Localisation capturée ✅" : "Capturer ma position actuelle"}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.hint}>Placez-vous à l'emplacement de votre stand pour une précision maximale.</Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitBtnText}>Créer ma boutique</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: 20 },
  subtitle: { fontSize: 16, color: '#636e72', marginBottom: 25 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#2d3436', marginBottom: 8 },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee'
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f2f6',
    borderWidth: 1,
    borderColor: '#dfe4ea'
  },
  chipActive: {
    backgroundColor: '#FFC700',
    borderColor: '#FFC700'
  },
  chipText: { fontSize: 14, color: '#2f3542' },
  chipTextActive: { fontWeight: '700' },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC700',
    borderRadius: 12,
    padding: 15,
    gap: 10
  },
  locationBtnActive: { backgroundColor: '#55efc4' },
  locationBtnText: { fontWeight: '700', fontSize: 16 },
  hint: { fontSize: 12, color: '#b2bec3', marginTop: 8, fontStyle: 'italic' },
  submitBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: "#FFC700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 18, fontWeight: '800' }
});
