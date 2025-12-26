import "./globals.css";
import { Text, View, Pressable, ImageBackground } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import React from "react";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-primary">
      <ImageBackground
        source={require("../assets/images/round_icon_sh.png")}
        className="w-full h-72 justify-center items-center"
        resizeMode="contain"
      />
      <Text className="text-2xl text-black m-4"></Text>

      <Link href={"/login"} asChild>
        <Pressable className="items-center p-3 w-32 rounded-full shadow-md bg-tertiary mb-2">
          <Text className="text-xl text-secondary">Go !</Text>
        </Pressable>
      </Link>
    </View>
  );
}
