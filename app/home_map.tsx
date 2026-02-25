import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SceneMap, TabView } from "react-native-tab-view";
import { SettingsContext } from "./context/SettingsContext";

import Accueil from "./tab/accueil";
import Maps from "./tab/map";
import DriverDashboard from "./tab/driver_dashboard";
import VendorDashboard from "./tab/vendor_dashboard";
import Param from "./tab/param";
import Profil from "./tab/profil";

const initialLayout = { width: Dimensions.get("window").width };

export default function HomeMap() {
  const [index, setIndex] = useState(0);
  const { isLivreur, isVendeur } = useContext(SettingsContext);

  const routes = useMemo(() => {
    const base: Array<{ key: string; title: string; icon: any }> = [
      { key: "accueil", title: "Home", icon: "home-outline" as const },
      { key: "profil", title: "Profile", icon: "person-outline" as const },
      { key: "map", title: "Map", icon: "map-outline" as const },
    ];
    if (isLivreur) {
      base.push({
        key: "livreur",
        title: "Livreur",
        icon: "bicycle-outline" as const,
      });
    }
    if (isVendeur) {
      base.push({
        key: "vendeur",
        title: "Vendeuse",
        icon: "storefront-outline" as const,
      });
    }
    base.push({
      key: "param",
      title: "Settings",
      icon: "settings-outline" as const,
    });
    return base;
  }, [isLivreur, isVendeur]);

  const renderScene = useMemo(() => {
    const scenes: { [k: string]: React.ComponentType<any> } = {
      accueil: Accueil,
      profil: Profil,
      map: Maps,
      param: Param,
    };
    if (isLivreur) scenes["livreur"] = DriverDashboard;
    if (isVendeur) scenes["vendeur"] = VendorDashboard;
    return SceneMap(scenes as any);
  }, [isLivreur, isVendeur]);

  useEffect(() => {
    // Si l'onglet courant n'existe plus (par ex. on a désactivé "livreur"), revenir à 0
    if (index >= routes.length) {
      setIndex(0);
    }
  }, [index, routes.length]);

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
