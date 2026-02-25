import { View, Text, Image, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useBackendApi } from "../../services/api";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import { User } from "../../types/user";
import ReviewModal from "../../components/ReviewModal";

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
  const { user: clerkUser } = useUser();
  const { getUserProfile, getMyOrders, createReview } = useBackendApi();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const previousOrdersRef = useRef<any[]>([]);

  const fetchProfileData = useCallback(async (showLoading = false) => {
    if (clerkUser?.id) {
      if (showLoading) setLoading(true);
      try {
        const [profile, ordersData] = await Promise.all([
          getUserProfile(clerkUser.id),
          getMyOrders(clerkUser.id)
        ]);
        
        // Check for status changes to show Toast
        ordersData.forEach((newOrder: any) => {
          const oldOrder = previousOrdersRef.current.find(o => o.id === newOrder.id);
          if (oldOrder && oldOrder.status !== newOrder.status) {
            Toast.show({
              type: 'info',
              text1: `Commande #${newOrder.id.slice(-4)}`,
              text2: `Nouveau statut : ${newOrder.status}`,
              position: 'top',
              visibilityTime: 4000,
            });
          }
        });

        setDbUser(profile);
        setOrders(ordersData);
        previousOrdersRef.current = ordersData;
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        if (showLoading) setLoading(false);
      }
    }
  }, [clerkUser?.id]);

  // Initial fetch
  useEffect(() => {
    fetchProfileData(true);
  }, [fetchProfileData]);

  // Polling when screen is focused
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        fetchProfileData(false);
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }, [fetchProfileData])
  );

  if (loading) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const displayName = dbUser?.displayName || clerkUser?.fullName || "Utilisateur";
  const userRole = dbUser?.role ? dbUser.role.charAt(0).toUpperCase() + dbUser.role.slice(1) : "Client";
  const photoURL = dbUser?.photoURL || clerkUser?.imageUrl;

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
            source={photoURL ? { uri: photoURL } : require("../../assets/images/profil_1.jpeg")}
            className="w-28 h-28 rounded-full"
          />
        </View>
        <View className="ml-6">
          <Text className="text-2xl font-bold">{displayName}</Text>
          <Text className="text-sm text-gray-700">{userRole} Premium</Text>
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

          {orders.length > 0 ? (
            orders.slice(0, 3).map((order) => (
              <View key={order.id} className="flex-row items-center justify-between mb-4 px-2">
                <View>
                  <Text className="text-white font-medium">Commande #{order.id.slice(-4)}</Text>
                  <Text className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text style={{ 
                    color: order.status === 'COMPLETED' ? '#4CAF50' : 
                          order.status === 'CANCELLED' ? '#F44336' : '#FFC107',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {order.status}
                  </Text>
                  {order.status === 'COMPLETED' && (
                    <Pressable 
                      onPress={() => {
                        setSelectedOrderForReview(order);
                        setShowReviewModal(true);
                      }}
                      className="bg-primary px-2 py-1 rounded-md"
                    >
                      <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Noter</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-400 text-center py-4">Aucune commande pour le moment</Text>
          )}

          <View className="bg-gray h-[1px] bg-gray-300 my-4" />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={18} color="white" />
              <Text className="text-white ml-2">Total</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-done-outline" size={18} color="white" />
              <Text className="text-white ml-2">{orders.length}</Text>
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

      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        targetName="la revendeuse"
        loading={submittingReview}
        onSubmit={async (rating, comment) => {
          if (!selectedOrderForReview || !clerkUser) return;
          
          try {
            setSubmittingReview(true);
            await createReview({
              userId: clerkUser.id,
              userName: displayName,
              targetId: selectedOrderForReview.vendorId, // On note le vendeur
              targetType: 'vendor',
              rating,
              comment
            });
            
            Toast.show({
              type: 'success',
              text1: 'Merci !',
              text2: 'Votre avis a été enregistré.',
            });
            
            setShowReviewModal(false);
          } catch (error) {
            Alert.alert("Erreur", "Impossible d'envoyer l'avis.");
          } finally {
            setSubmittingReview(false);
          }
        }}
      />
    </ScrollView>
  );
}
