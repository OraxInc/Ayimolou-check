import { Link } from "expo-router";
import { ImageBackground, Pressable, SafeAreaView, Text, View } from "react-native";
import "./globals.css";
import React from "react";

export default function recapsms() {
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-primary">
      <View className="items-center bg-primary pt-6 pb-5 mt-28 mb-28">
        <View className="flex-row items-center w-full">
          <ImageBackground className="w-full h-72"
          source={require("../assets/images/ayimolou_1.png")}
          />
        </View>
        <Link href={"/splash/splash_1"} asChild>
          <Pressable className="items-center p-3 w-64 bg-black rounded-full m-5">
            <Text className="items-center text-xl text-white">Se connecter !</Text>
          </Pressable>
        </Link>
        <Text className="text-center items-center text-0xl p-5 text-whiteless">
          Vous recevrez automatiquement un message contenant le code de
          verification qui vous permettrats de valider votre inscription.
        </Text>
      </View>
    </SafeAreaView>
  );
}
