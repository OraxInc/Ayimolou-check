import { Ionicons } from "@expo/vector-icons";
import React, { useContext } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SettingsContext } from "../context/SettingsContext";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useBackendApi } from "../../services/api";

export default function ParamScreen() {
  const {
    isClient,
    setIsClient,
    isLivreur,
    setIsLivreur,
    isVendeur,
    setIsVendeur,
  } = useContext(SettingsContext);

  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { updateUserRole, getUserProfile } = useBackendApi();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
    }
  };

  const handleClientChange = async (value: boolean) => {
    if (value) {
      const success = await updateUserRole(user?.id!, 'client');
      if (success) {
        setIsClient(true);
        setIsLivreur(false);
        setIsVendeur(false);
      }
    }
  };

  const handleLivreurChange = async (value: boolean) => {
    if (value) {
      const success = await updateUserRole(user?.id!, 'livreur');
      if (success) {
        setIsLivreur(true);
        setIsClient(false);
        setIsVendeur(false);
      }
    } else {
      handleClientChange(true);
    }
  };

  const handleVendeurChange = async (value: boolean) => {
    if (value) {
      // 1. Vérifier si le profil vendeur existe
      try {
        const profile = await getUserProfile(user?.id!);
        if (!profile?.vendorProfile || !profile.vendorProfile.shopName) {
          // Rediriger vers l'onboarding
          router.push("/vendor_registration");
          return;
        }

        const success = await updateUserRole(user?.id!, 'vendeur');
        if (success) {
          setIsVendeur(true);
          setIsClient(false);
          setIsLivreur(false);
        }
      } catch (error) {
        console.error("Error checking vendor profile:", error);
      }
    } else {
      handleClientChange(true);
    }
  };

  const SettingItem = ({
    icon,
    label,
    value,
    onPress,
    textColor = "text-black",
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    textColor?: string;
  }) => (
    <TouchableOpacity
      className="flex-row items-center justify-between py-4 px-4 border-b border-gray-100 bg-white"
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-x-3">
        <View className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
          <Ionicons name={icon} size={20} color="#555" />
        </View>
        <Text className={`text-base font-medium ${textColor}`}>{label}</Text>
      </View>
      <View className="flex-row items-center gap-x-2">
        {value && <Text className="text-gray-400 text-sm">{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={18} color="#ccc" />}
      </View>
    </TouchableOpacity>
  );

  const SwitchItem = ({
    icon,
    label,
    value,
    onValueChange,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
  }) => (
    <View className="flex-row items-center justify-between py-4 px-4 border-b border-gray-100 bg-white">
      <View className="flex-row items-center gap-x-3">
        <View className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
          <Ionicons name={icon} size={20} color="#555" />
        </View>
        <Text className="text-base font-medium text-black">{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: "#e5ddb9ff", false: "#f4f4f5" }}
        thumbColor={value ? "#ffd000ff" : "#ffffff"}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary pt-12">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4">Paramètres</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Compte Section */}
        <View className="mt-6 px-4 mb-2">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Mode Utilisateur
          </Text>
        </View>
        
        <View className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
          <SwitchItem
            icon="person-outline"
            label="Client"
            value={isClient}
            onValueChange={handleClientChange}
          />
          <SwitchItem
            icon="car-outline"
            label="Livreur"
            value={isLivreur}
            onValueChange={handleLivreurChange}
          />
          <SwitchItem
            icon="storefront-outline"
            label="Vendeur"
            value={isVendeur}
            onValueChange={handleVendeurChange}
          />
        </View>

        {/* Assistance Section */}
        <View className="mt-8 px-4 mb-2">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Assistance et Légal
          </Text>
        </View>

        <View className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
          <SettingItem icon="alert-circle-outline" label="Signaler un problème" onPress={() => {}} />
          <SettingItem icon="help-circle-outline" label="Centre d'aide" onPress={() => {}} />
          <SettingItem icon="shield-checkmark-outline" label="Confidentialité et sécurité" onPress={() => {}} />
          <SettingItem
            icon="language-outline"
            label="Langue"
            value="Français"
            onPress={() => {}}
          />
        </View>

        {/* Action Section */}
        <View className="mt-8 px-4 mb-2">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Actions
          </Text>
        </View>
        
        <View className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 mb-10">
          <SettingItem 
            icon="log-out-outline" 
            label="Déconnexion" 
            onPress={handleLogout}
            textColor="text-red-500"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

