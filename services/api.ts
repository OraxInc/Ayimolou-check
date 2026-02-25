import { useAuth, useUser } from "@clerk/clerk-expo";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

export const useBackendApi = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
 
  const syncUserWithBackend = async () => {
    if (!user) return;

    try {
      const token = await getToken();
      
      const response = await fetch(`${API_URL}/users/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          displayName: user.fullName || user.username || "",
          photoURL: user.imageUrl || "",
          role: "client", // Par défaut client
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Backend sync failed:", response.status, errorData);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error syncing user with backend:", error);
      return null;
    }
  };

  const getVendors = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/users/vendors`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error("Error fetching vendors:", error);
      return [];
    }
  };

  const getUserProfile = async (uid: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/users/${uid}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const getCategories = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/categories`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  };

  const getProducts = async (filters: { vendorId?: string; categoryId?: string } = {}) => {
    try {
      const token = await getToken();
      const query = new URLSearchParams(filters as any).toString();
      const response = await fetch(`${API_URL}/products?${query}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  const createOrder = async (orderData: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error("Error creating order:", error);
      return null;
    }
  };

  const getMyOrders = async (clientId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/orders/my-orders?clientId=${clientId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error("Error fetching my orders:", error);
      return [];
    }
  };
  const getVendorOrders = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/orders/vendor-orders`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error("Error fetching vendor orders:", error);
      return [];
    }
  };

  const getDriverOrders = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/orders/driver-orders`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error("Error fetching driver orders:", error);
      return [];
    }
  };

  const verifyPayment = async (orderId: string, phoneNumber: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/orders/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, phoneNumber }),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error("Error verifying payment:", error);
      return null;
    }
  };

  const getReviews = async (targetId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/reviews/${targetId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  };

  const createReview = async (reviewData: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reviewData),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error("Error creating review:", error);
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error updating order status:", error);
      return false;
    }
  };

  const updateVendorProfileFront = async (uid: string, profileData: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/users/${uid}/vendor-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      return response.ok;
    } catch (error) {
      console.error("Error updating vendor profile:", error);
      return false;
    }
  };

  const updateProductFront = async (productId: string, productData: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
      return response.ok;
    } catch (error) {
      console.error("Error updating product:", error);
      return false;
    }
  };

  const createProductFront = async (productData: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error("Error creating product:", error);
      return null;
    }
  };

  const deleteProductFront = async (productId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  };

  const updateUserRole = async (uid: string, role: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/users/${uid}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error updating user role:", error);
      return false;
    }
  };

  const getAvailableDeliveries = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/orders/available-deliveries`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error("Error fetching available deliveries:", error);
      return [];
    }
  };

  const assignDelivery = async (orderId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/orders/${orderId}/assign`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.status === 409) {
        return { success: false, conflict: true };
      }
      
      return { success: response.ok, conflict: false };
    } catch (error) {
      console.error("Error assigning delivery:", error);
      return { success: false, conflict: false };
    }
  };

  const completeDelivery = async (orderId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/orders/${orderId}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (error) {
      console.error("Error completing delivery:", error);
      return false;
    }
  };

  const updateDriverLocation = async (uid: string, latitude: number, longitude: number) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/users/${uid}/driver-location`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error updating driver location:", error);
      return false;
    }
  };

  const updateDriverAvailability = async (uid: string, isAvailable: boolean) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/users/${uid}/driver-availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error updating driver availability:", error);
      return false;
    }
  };

  const getDriverLocation = async (driverId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/drivers/${driverId}/location`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error("Error fetching driver location:", error);
      return null;
    }
  };

  return {
    syncUserWithBackend,
    getVendors,
    getUserProfile,
    getCategories,
    getProducts,
    createOrder,
    getMyOrders,
    getVendorOrders,
    getDriverOrders,
    verifyPayment,
    getReviews,
    createReview,
    updateOrderStatus,
    updateVendorProfile: updateVendorProfileFront,
    updateProduct: updateProductFront,
    createProduct: createProductFront,
    deleteProduct: deleteProductFront,
    updateUserRole,
    getAvailableDeliveries,
    assignDelivery,
    completeDelivery,
    updateDriverLocation,
    updateDriverAvailability,
    getDriverLocation,
  };
};
