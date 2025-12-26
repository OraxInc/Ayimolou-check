import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import SplashDots from "../SplashDots";
import React from "react";

export default function Splash1() {
  return (
    <View className="flex-1 bg-yellow-400 justify-center items-center px-6">
      <View style={styles.lottieContainer}>
        <LottieView
          source={require("../../assets/animed/Location.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      <Text className="text-3xl font-bold mt-10 text-black">Localiser</Text>
      <Text className="text-center text-black mt-3 opacity-80">
        Trouvez facilement les restaurants autour de vous en temps réel.
      </Text>

      <SplashDots index={0} />

      <Pressable
        onPress={() => router.push("/splash/splash_2")}
        className="mt-12 px-12 py-4 bg-black rounded-full shadow-lg"
      >
        <Text className="text-white font-bold text-lg">Suivant</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  lottieContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "white",
    borderWidth: 8,
    borderColor: "#fde047",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
});