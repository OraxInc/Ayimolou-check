import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useContext } from "react";
import { ImageBackground, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useBackendApi } from "../services/api";
import { useTranslation } from "../services/i18n";
import { SettingsContext } from "./context/SettingsContext";

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
        redirectUrl: Linking.createURL("/home_map", { scheme: "ayimolou-check" }),
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
            className="w-full rounded-full bg-black p-4 pr-6 pl-0"
            onPress={onSignInWithGoogle}
          >
            <View className="flex-row items-center justify-center w-full gap-x-5">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path d="M21.6 12.23c0-.81-.07-1.58-.2-2.32H12v4.39h5.39a4.61 4.61 0 0 1-2 3.03v2.5h3.24c1.9-1.75 2.99-4.33 2.99-7.6Z" fill="#4285F4" />
                  <Path d="M12 22c2.7 0 4.96-.89 6.61-2.42l-3.24-2.5c-.89.6-2.03.95-3.37.95-2.59 0-4.79-1.75-5.58-4.1H3.07v2.57A10 10 0 0 0 12 22Z" fill="#34A853" />
                  <Path d="M6.42 13.93A6.01 6.01 0 0 1 6.42 10.07V7.5H3.07a10 10 0 0 0 0 12.86l3.35-2.57Z" fill="#FBBC05" />
                  <Path d="M12 6.03c1.46 0 2.78.5 3.82 1.48l2.86-2.86A9.96 9.96 0 0 0 12 2a10 10 0 0 0-8.93 5.5l3.35 2.57C7.21 7.78 9.41 6.03 12 6.03Z" fill="#EA4335" />
                </Svg>
              </View>
              <Text className="text-xl text-white font-bold text-center leading-5">
                {t("continueWithGoogle")}
              </Text>
            </View>
          </Pressable>

          <Pressable className="w-full rounded-full bg-white bg-black p-4 pr-6 pl-0">
            <View className="flex-row items-center justify-center w-full gap-x-5">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
                <AntDesign name="apple" size={25} color="black" />
              </View>
              <Text className="text-xl text-black font-bold text-center leading-5">
                Continuer avec Apple
              </Text>
            </View>
          </Pressable>
        </View>

        <Text className="text-center items-center text-0xl p-5 text-whiteless mt-5 mb-5">
          {t("termsAndPrivacy")}
        </Text>
      </View>
    </SafeAreaView>
  );
}
