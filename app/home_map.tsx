import React, { useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { TabView, SceneMap } from "react-native-tab-view";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import Accueil from "./tab/accueil";
import Profil from "./tab/profil";
import Maps from "./tab/map";
import Param from "./tab/param";

const initialLayout = { width: Dimensions.get("window").width };

export default function HomeMap() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "accueil", title: "Home", icon: "home-outline" as const },
    { key: "profil", title: "Profile", icon: "person-outline" as const },
    { key: "map", title: "Map", icon: "map-outline" as const },
    { key: "param", title: "Settings", icon: "settings-outline" as const },
  ]);

  const renderScene = SceneMap({
    accueil: Accueil,
    profil: Profil,
    map: Maps,
    param: Param,
  });

  return (
    <>
      {/* ----- CONTENU SWIPE ----- */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        swipeEnabled={true}
        renderTabBar={() => null}
      />

      {/* ----- NAVBAR BOTTOM CUSTOM ----- */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "white" }}>
        <View
          style={{
            height: 65,
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            borderTopWidth: 1,
            borderColor: "#e0e0e0",
          }}
        >
          {routes.map((route, i) => (
            <TouchableOpacity
              key={route.key}
              onPress={() => setIndex(i)}
              style={{ alignItems: "center" }}
            >
              <Ionicons
                name={route.icon}
                size={26}
                color={index === i ? "#FFC700" : "#8E8E8E"}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: index === i ? "#FFC700" : "#8E8E8E",
                  marginTop: 2,
                }}
              >
                {route.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </>
  );
}
