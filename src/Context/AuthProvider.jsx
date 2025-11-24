import { createContext, useContext, useEffect, useState } from "react";
import { useDispatch } from 'react-redux';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({});
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = () => {
      try {
        setLoading(true);
        
        // Safe parsing for SuperAdminInfo
        const superAdminInfo = localStorage.getItem("SuperAdminInfo");
        let userData = {};
        
        if (superAdminInfo) {
          try {
            const parsed = JSON.parse(superAdminInfo);
            userData = parsed.user || {};
            console.log("✅ Successfully loaded user data:", userData);
          } catch (parseError) {
            console.error("❌ Corrupted SuperAdminInfo data, clearing...", parseError);
            localStorage.removeItem("SuperAdminInfo");
            localStorage.removeItem("permissions");
            userData = {};
          }
        }

        // Safe parsing for permissions
        const permissionsData = localStorage.getItem("permissions");
        let permissionsList = [];
        
        if (permissionsData) {
          try {
            permissionsList = JSON.parse(permissionsData);
            if (!Array.isArray(permissionsList)) {
              permissionsList = [];
            }
            console.log("✅ Successfully loaded permissions:", permissionsList.length);
          } catch (parseError) {
            console.error("❌ Corrupted permissions data, clearing...", parseError);
            localStorage.removeItem("permissions");
            permissionsList = [];
          }
        }

        setUser(userData);
        setPermissions(permissionsList);
        
      } catch (error) {
        console.error("❌ Error loading auth data:", error);
        // Clear all potentially corrupted data
        localStorage.removeItem("SuperAdminInfo");
        localStorage.removeItem("permissions");
        setUser({});
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  // Clear corrupted data function
  const clearCorruptedData = () => {
    console.log("🔄 Clearing all corrupted auth data...");
    localStorage.removeItem("SuperAdminInfo");
    localStorage.removeItem("permissions");
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser({});
    setPermissions([]);
  };

  // Login function to safely set data

const login = (userData, permissionsData) => {
  try {

  dispatch(templateApi.util.resetApiState());
    dispatch(modelApi.util.resetApiState()); // Add your model API


    // Make sure userData contains the token
    if (!userData || !userData.token) {
      throw new Error('User data must include token');
    }

    const authData = {
      user: userData, // This should include userData.token
      timestamp: new Date().toISOString()
    };

    localStorage.setItem("SuperAdminInfo", JSON.stringify(authData));
    localStorage.setItem("permissions", JSON.stringify(permissionsData));
    
    setUser(userData);
    setPermissions(permissionsData);
    
    console.log("✅ Login data stored successfully. Token:", userData.token.substring(0, 20) + "...");
    return true;
  } catch (error) {
    console.error("❌ Error storing login data:", error);
    clearCorruptedData();
    return false;
  }
};

  // Logout function
  const logout = () => {
    clearCorruptedData();
    console.log("✅ Logout completed");
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return user && Object.keys(user).length > 0;
  };

  // Permission check function
  const hasPermission = (permission) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.some(p => p?.name === permission);
  };

  // Debug function to check storage status
  const debugStorage = () => {
    console.log("🔍 Storage Debug Info:");
    console.log("- SuperAdminInfo:", localStorage.getItem("SuperAdminInfo"));
    console.log("- permissions:", localStorage.getItem("permissions"));
    console.log("- Current user:", user);
    console.log("- Current permissions:", permissions);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      permissions, 
      hasPermission,
      login,
      logout,
      isAuthenticated,
      loading,
      clearCorruptedData,
      debugStorage
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};