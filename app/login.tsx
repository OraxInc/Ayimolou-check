import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useContext } from "react";
import { ImageBackground, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBackendApi } from "../services/api";
import { useTranslation } from "../services/i18n";
import { SettingsContext } from "./context/SettingsContext";
import "./globals.css";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { syncUserWithBackend } = useBackendApi();
  const router = useRouter();
  const { language } = useContext(SettingsContext);
  const { t } = useTranslation(language);

  const onSignInWithGoogle = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/home_map"),
      });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });

        // Synchroniser avec le backend après avoir activé la session
        await syncUserWithBackend();

        router.replace("/home_map");
      }
    } catch (err) {
      console.error("OAuth error", err);
    }
  }, [startOAuthFlow, router, syncUserWithBackend]);

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-primary">
      <View className="items-center bg-primary pt-6 pb-5 mt-28 mb-28">
        <View className="flex-row items-center w-full">
          <ImageBackground
            className="w-full h-72"
            source={require("../assets/images/ayimolou_1.png")}
          />
        </View>

        <View className="w-full px-10 gap-y-4">
          <Pressable
            className="flex-row items-center justify-center p-4 w-full bg-black rounded-full mt-2"
            onPress={onSignInWithGoogle}
          >
            <Text className="text-xl text-white font-bold text-center">
              {t("continueWithGoogle")}
            </Text>
          </Pressable>
        </View>

        <Text className="text-center items-center text-0xl p-5 text-whiteless">
          {t("termsAndPrivacy")}
        </Text>
      </View>
    </SafeAreaView>
  );
}
