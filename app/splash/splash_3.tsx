import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import React from "react";

export default function Splash3() {
  return (
    <View className="flex-1 bg-yellow-400 justify-center items-center px-6">
      <View style={styles.lottieContainer}>
        <LottieView
          source={require("../../assets/animed/delived.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      <Text className="text-3xl font-bold mt-10 text-black">Livraison</Text>
      <Text className="text-center text-black mt-3 opacity-80">
        Suivez votre livreur sur la carte jusqu'à votre porte !
      </Text>

      <Pressable
        onPress={() => router.replace("/home_map")} // Remplacez par votre route Map
        className="mt-12 px-14 py-4 bg-black rounded-full shadow-xl"
      >
        <Text className="text-white font-bold text-lg text-center">C'est parti !</Text>
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
  },
  lottie: {
    width: "100%",
    height: "90%",
  },
});