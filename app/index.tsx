import { Link } from "expo-router";
import React, { useContext } from "react";
import { ImageBackground, Pressable, Text, View } from "react-native";
import { useTranslation } from "../services/i18n";
import { SettingsContext } from "./context/SettingsContext";
import "./globals.css";

export default function Index() {
  const { language } = useContext(SettingsContext);
  const { t } = useTranslation(language);

  return (
    <View className="flex-1 justify-center items-center bg-primary">
      <ImageBackground
        source={require("../assets/images/round_icon_sh.png")}
        className="w-full h-72 justify-center items-center"
        resizeMode="contain"
      />
      <Text className="text-2xl text-black m-4"></Text>

      <Link href={"/splash/splash_1"} asChild>
        <Pressable className="items-center p-3 w-32 rounded-full shadow-md bg-tertiary mb-2">
          <Text className="text-xl text-secondary">{t("go")}</Text>
        </Pressable>
      </Link>
    </View>
  );
}
