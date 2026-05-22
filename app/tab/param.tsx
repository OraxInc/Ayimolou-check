import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBackendApi } from "../../services/api";
import { Language, useTranslation } from "../../services/i18n";
import { SettingsContext } from "../context/SettingsContext";

export default function ParamScreen() {
  const {
    isClient,
    setIsClient,
    isLivreur,
    setIsLivreur,
    isVendeur,
    setIsVendeur,
    language,
    setLanguage,
  } = useContext(SettingsContext);

  const { t } = useTranslation(language);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { updateUserRole, getUserProfile } = useBackendApi();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error(t("logoutError"), error);
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setShowLanguageModal(false);
  };

  const getLanguageDisplayName = (lang: Language): string => {
    switch (lang) {
      case "fr":
        return t("french");
      case "en":
        return t("english");
      case "ewe":
        return t("ewe");
      default:
        return t("french");
    }
  };

  const handleClientChange = async (value: boolean) => {
    if (value) {
      const success = await updateUserRole(user?.id!, "client");
      if (success) {
        setIsClient(true);
        setIsLivreur(false);
        setIsVendeur(false);
      }
    }
  };

  const handleLivreurChange = async (value: boolean) => {
    if (value) {
      const success = await updateUserRole(user?.id!, "livreur");
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

        const success = await updateUserRole(user?.id!, "vendeur");
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

  return (
    <SafeAreaView className="flex-1 bg-primary pt-12">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4">{t("parameters")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Compte Section */}
        <View className="mt-6 px-4 mb-2">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {t("userMode")}
          </Text>
        </View>

        <View className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
          <SwitchItem
            icon="person-outline"
            label={t("client")}
            value={isClient}
            onValueChange={handleClientChange}
          />
          <SwitchItem
            icon="car-outline"
            label={t("delivery")}
            value={isLivreur}
            onValueChange={handleLivreurChange}
          />
          <SwitchItem
            icon="storefront-outline"
            label={t("vendor")}
            value={isVendeur}
            onValueChange={handleVendeurChange}
          />
        </View>

        {/* Assistance Section */}
        <View className="mt-8 px-4 mb-2">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {t("assistanceAndLegal")}
          </Text>
        </View>

        <View className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
          <SettingItem
            icon="alert-circle-outline"
            label={t("reportProblem")}
            onPress={() => {}}
          />
          <SettingItem
            icon="help-circle-outline"
            label={t("helpCenter")}
            onPress={() => {}}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            label={t("privacyAndSecurity")}
            onPress={() => {}}
          />
          <SettingItem
            icon="language-outline"
            label={t("language")}
            value={getLanguageDisplayName(language)}
            onPress={() => setShowLanguageModal(true)}
          />
        </View>

        {/* Action Section */}
        <View className="mt-8 px-4 mb-2">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {t("actions")}
          </Text>
        </View>

        <View className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 mb-10">
          <SettingItem
            icon="log-out-outline"
            label={t("logout")}
            onPress={handleLogout}
            textColor="text-red-500"
          />
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        onRequestClose={() => setShowLanguageModal(false)}
        transparent
        animationType="slide"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-xl font-bold ml-4">{t("language")}</Text>
          </View>

          <View className="flex-1">
            {(["fr", "en", "ewe"] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                className="flex-row items-center justify-between py-4 px-4 border-b border-gray-100"
                onPress={() => handleLanguageChange(lang)}
              >
                <Text className="text-base font-medium text-black">
                  {getLanguageDisplayName(lang)}
                </Text>
                {language === lang && (
                  <Ionicons name="checkmark" size={24} color="#ffd000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

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
