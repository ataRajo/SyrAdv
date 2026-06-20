// src/Hooks/useBrokerAuthentication.jsx
import { useCallback } from "react";
import { useBrokerLoginMutation, useBrokerLogoutMutation } from "../RtkQuery/Slice/mediatorapis/MediatorApi";
import { showToast } from "../utils/Notifictions/showToast";

const BROKER_TOKEN_KEY = "broker_token";
const BROKER_USER_KEY = "broker_user";
const BROKER_ROLES_KEY = "broker_roles";

// Helper function to get friendly error messages
const getFriendlyErrorMessage = (error) => {
  console.log("Processing error:", error); // Debug log
  
  // Check for network errors
  if (!error) return "حدث خطأ غير معروف";
  
  // Network/Connection errors
  if (error.status === "FETCH_ERROR" || error.message?.includes("NetworkError") || error.message?.includes("Failed to fetch")) {
    return "⚠️ لا يمكن الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.";
  }
  
  if (error.status === 500) {
    return "⚠️ خطأ في الخادم. يرجى المحاولة لاحقاً.";
  }
  
  if (error.status === 404) {
    return "⚠️ خدمة تسجيل الدخول غير متاحة حالياً.";
  }
  
  if (error.status === 401) {
    return "❌ اسم المستخدم أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.";
  }
  
  if (error.status === 403) {
    return "❌ ليس لديك صلاحية الدخول كوسيط. يرجى التواصل مع المسؤول.";
  }
  
  if (error.status === 429) {
    return "⏳ محاولات تسجيل دخول كثيرة. يرجى المحاولة بعد دقيقة.";
  }
  
  // Handle 422 Validation Error (your case)
  if (error.status === 422) {
    // First try to get message from error.data.message
    if (error.data?.message) {
      return `❌ ${error.data.message}`;
    }
    
    // Then try to get from errors object
    if (error.data?.errors) {
      const errors = error.data.errors;
      // Get the first error message from any field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField && errors[firstErrorField]) {
        const errorMessage = errors[firstErrorField];
        if (Array.isArray(errorMessage) && errorMessage.length > 0) {
          return `❌ ${errorMessage[0]}`;
        }
        return `❌ ${errorMessage}`;
      }
    }
  }
  
  // Try to get message from error.data directly
  if (error.data) {
    // Check for message field directly
    if (error.data.message) {
      return `❌ ${error.data.message}`;
    }
    
    // Check for errors object
    if (error.data.errors) {
      const firstErrorKey = Object.keys(error.data.errors)[0];
      if (firstErrorKey && error.data.errors[firstErrorKey]) {
        const errorArray = error.data.errors[firstErrorKey];
        if (Array.isArray(errorArray) && errorArray.length > 0) {
          return `❌ ${errorArray[0]}`;
        }
        return `❌ ${error.data.errors[firstErrorKey]}`;
      }
    }
  }
  
  // Check if error has a data property with the message
  if (error.data && typeof error.data === 'string') {
    return `❌ ${error.data}`;
  }
  
  // Check error.message
  if (error.message) {
    // Don't show technical messages
    if (!error.message.includes("Request failed") && !error.message.includes("status code")) {
      return `❌ ${error.message}`;
    }
  }
  
  // Default fallback
  return "❌ فشل تسجيل الدخول. يرجى التحقق من بيانات الدخول والمحاولة مرة أخرى.";
};

export const useBrokerAuthentication = () => {
  const [triggerBrokerLogin, { isLoading: isLoginLoading }] = useBrokerLoginMutation();
  const [triggerBrokerLogout, { isLoading: isLogoutLoading }] = useBrokerLogoutMutation();

  const loginBroker = useCallback(async (credentials) => {
    try {
      const response = await triggerBrokerLogin(credentials).unwrap();
      
      const token = response.token;
      const user = response.user;

      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem(BROKER_TOKEN_KEY, token);
      localStorage.setItem(BROKER_USER_KEY, JSON.stringify(user));
      
      if (user.roles && user.roles.length > 0) {
        localStorage.setItem(BROKER_ROLES_KEY, JSON.stringify(user.roles));
      }

      showToast("success", "✅ تم تسجيل الدخول بنجاح");
      return { success: true, user };
    } catch (error) {
      console.error("Login error:", error);
      
      // Get friendly error message
      const friendlyMessage = getFriendlyErrorMessage(error);
      
      console.log("Showing toast with message:", friendlyMessage); // Debug log
      
      // Show toast with friendly message
      showToast("error", friendlyMessage);
      
      return { success: false, error: friendlyMessage };
    }
  }, [triggerBrokerLogin]);

  const logoutBroker = useCallback(async () => {
    try {
      await triggerBrokerLogout().unwrap();
      
      localStorage.removeItem(BROKER_TOKEN_KEY);
      localStorage.removeItem(BROKER_USER_KEY);
      localStorage.removeItem(BROKER_ROLES_KEY);
      
      showToast("info", "✅ تم تسجيل الخروج بنجاح");
      window.location.href = "/broker/login";
    } catch (error) {
      console.error("Logout API error:", error);
      localStorage.removeItem(BROKER_TOKEN_KEY);
      localStorage.removeItem(BROKER_USER_KEY);
      localStorage.removeItem(BROKER_ROLES_KEY);
      
      showToast("info", "✅ تم تسجيل الخروج");
      window.location.href = "/broker/login";
    }
  }, [triggerBrokerLogout]);

  const getBrokerToken = useCallback(() => {
    return localStorage.getItem(BROKER_TOKEN_KEY);
  }, []);

  const getBrokerUser = useCallback(() => {
    try {
      const user = localStorage.getItem(BROKER_USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Error parsing broker user:", error);
      return null;
    }
  }, []);

  const getBrokerRoles = useCallback(() => {
    try {
      const roles = localStorage.getItem(BROKER_ROLES_KEY);
      return roles ? JSON.parse(roles) : [];
    } catch {
      return [];
    }
  }, []);

  const isBrokerAuthenticated = useCallback(() => {
    return !!getBrokerToken();
  }, [getBrokerToken]);

  const hasPermission = useCallback((permissionName) => {
    const roles = getBrokerRoles();
    if (!roles.length) return false;
    
    return roles.some(role => 
      role.permissions?.some(permission => permission.name === permissionName)
    );
  }, [getBrokerRoles]);

  return {
    loginBroker,
    logoutBroker,
    getBrokerToken,
    getBrokerUser,
    getBrokerRoles,
    isBrokerAuthenticated,
    hasPermission,
    isLoading: isLoginLoading,
    isLoggingOut: isLogoutLoading,
  };
};