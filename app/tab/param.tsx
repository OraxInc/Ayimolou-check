import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
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
    <SafeAreaView style={styles.container} className="bg-primary mt-12">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("parameters")}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.section}>{t("userMode").toUpperCase()}</Text>

        <SwitchItem
          icon="person-outline"
          label={t("client")}
          value={isClient}
          onValueChange={handleClientChange}
        />
        <SwitchItem
          icon="lock-closed-outline"
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

        <Text style={styles.section}>{t("assistanceAndLegal").toUpperCase()}</Text>

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

        <Text style={styles.section}>{t("actions").toUpperCase()}</Text>

        <SettingItem
          icon="log-out-outline"
          label={t("logout")}
          onPress={handleLogout}
          textColor="#d63031"
        />
      </ScrollView>

      <Modal
        visible={showLanguageModal}
        onRequestClose={() => setShowLanguageModal(false)}
        transparent
        animationType="slide"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("language")}</Text>
          </View>

          <View>
            {(["fr", "en", "ewe"] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={styles.item}
                onPress={() => handleLanguageChange(lang)}
                activeOpacity={0.7}
              >
                <Text style={styles.itemText}>{getLanguageDisplayName(lang)}</Text>
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
  textColor = "#000",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  textColor?: string;
}) => (
  <TouchableOpacity
    style={styles.item}
    activeOpacity={onPress ? 0.7 : 1}
    onPress={onPress}
  >
    <View style={styles.itemLeft}>
      <Ionicons name={icon} size={22} color="#555" />
      <Text style={[styles.itemText, { color: textColor }]}>{label}</Text> 
    </View>
    <View style={styles.itemRight}>
      {value && <Text style={styles.itemValue}>{value}</Text>}
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
  <View style={styles.switchItem}>
    <View style={styles.itemLeft}>
      <Ionicons name={icon} size={22} color="#555" />
      <Text style={styles.itemText}>{label}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: "#e5ddb9ff", false: "#f4f4f5" }}
      thumbColor={value ? "#ffd000ff" : "#f4f4f5"}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
    color: "#000",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  switchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  itemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemText: {
    flexShrink: 1,
    fontSize: 16,
    color: "#000",
  },
  itemValue: {
    fontSize: 14,
    color: "#888",
  },
});
