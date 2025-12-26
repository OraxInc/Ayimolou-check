import { View, Text, Pressable, StyleSheet, Image, ImageBackground } from 'react-native';
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import SplashDots from "../SplashDots";
import React from "react";

export default function Splash2() {
  return (
    <View className="flex-1 bg-yellow-400 justify-center items-center px-6">
      <View style={styles.lottieContainer}>
        <Image
        source={require("../../assets/images/plat.jpg")}
        className="justify-center w-full h-72 rounded-full"
        />
      </View>

      <Text className="text-3xl font-bold mt-10 text-black">Commander</Text>
      <Text className="text-center text-black mt-3 opacity-80">
        Parcourez les menus et commandez vos plats préférés d'un simple geste.
      </Text>

      <SplashDots index={1} />

      <View className="flex-row gap-4 mt-12">
        <Pressable
          onPress={() => router.back()}
          className="px-8 py-4 bg-white/20 rounded-full border border-black/10"
        >
          <Text className="text-black font-semibold">Retour</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/splash/splash_3")}
          className="px-10 py-4 bg-black rounded-full shadow-lg"
        >
          <Text className="text-white font-bold">Suivant</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lottieContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#facc15",
    borderWidth: 8,
    borderColor: "#fde047",
    overflow: "hidden",
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
});