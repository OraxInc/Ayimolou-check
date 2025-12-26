import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

// assets/avatars.ts
export const avatars = [
  require("../../assets/images/profil_1.jpeg"),
  require("../../assets/images/profil_2.png"),
  require("../../assets/images/profil_3.png"),
  require("../../assets/images/profil_4.png"),
  require("../../assets/images/profil_5.png"),
  require("../../assets/images/profil_6.png"),
  require("../../assets/images/profil_7.png"),
  require("../../assets/images/profil_8.png"),
];

export default function Profile() {
  return (
    <ScrollView className="flex-10 pt-12 bg-primary">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between m-6">
        <Pressable>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Pressable>
          <Ionicons name="settings-outline" size={24} color="black" />
        </Pressable>
      </View>

      {/* Profile */}
      <View className="flex-row items-center m-6">
        <View className="w-32 h-32 rounded-full bg-white items-center justify-center mb-3 ml-4">
          <Image
            source={require("../../assets/images/profil_1.jpeg")}
            className="w-28 h-28 rounded-full"
          />
        </View>
        <View className="ml-6">
          <Text className="text-2xl font-bold">Amelia N.</Text>
          <Text className="text-sm text-gray-700">Client Premium</Text>
        </View>
      </View>
      <View className="flex-1 bg-white">
        {/* Mes commandes */}
        <View className="bg-black rounded-3xl p-5 m-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-semibold text-base p-4">
              Mes Commandes
            </Text>
            <Pressable className="bg-primary px-4 py-1 rounded-full">
              <Text className="font-semibold text-black">Voir tout</Text>
            </Pressable>
          </View>

          <View className="bg-gray h-[1px] bg-gray-300 my-4" />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={18} color="white" />
              <Text className="text-white ml-2">En cours</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-done-outline" size={18} color="white" />
              <Text className="text-white ml-2">12</Text>
            </View>
          </View>
        </View>

        {/* Paiement */}
        <View className="bg-primary rounded-3xl p-4 mb-4 ml-4 mr-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-semibold text-xl">Paiement</Text>
            <Pressable className="bg-black px-4 py-1 rounded-full">
              <Text className="text-white font-semibold">Voir tout</Text>
            </Pressable>
          </View>

          <View className="flex-row gap-4 bg-primary p-2">
            <View className="bg-white rounded-xl p-3 w-24 items-center">
              <Text className="font-semibold">Moov</Text>
              <Text className="text-xs text-gray-500">Money</Text>
            </View>
            <View className="bg-white rounded-xl p-3 w-24 items-center">
              <Text className="font-semibold">MTN</Text>
              <Text className="text-xs text-gray-500">MoMo</Text>
            </View>
          </View>
        </View>

        {/* Mes revendeuses */}
        <View className="bg-black rounded-3xl p-4 ml-4 mr-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-semibold text-base text-white">
              Mes Revendeuses
            </Text>
            <View className="flex-row items-center bg-primary px-3 py-1 rounded-full">
              <Ionicons name="location-outline" size={14} color="black" />
              <Text className="text-black-400 text-xs ml-1">En route</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row gap-3">
              {avatars.slice(0, 4).map((img, index) => (
                <Image
                  key={index}
                  source={img}
                  className="w-12 h-12 rounded-full"
                />
              ))}
            </View>
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color="white" />
              <Text className="ml-1 text-sm text-white">15 min</Text>
            </View>
          </View>
        </View>

        {/* Suivi livraison */}
        <View className="bg-black rounded-2xl p-8 mr-4 ml-4 mb-6">
          <Text className="text-white font-semibold">Suivi de Livraison</Text>
          <Text className="text-yellow-400 mt-1">Commande #12 : En route</Text>
        </View>
      </View>
    </ScrollView>
  );
}
