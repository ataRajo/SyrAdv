// AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = () => {
      try {
        setLoading(true);

        // Load user
        const superAdminInfo = localStorage.getItem("SuperAdminInfo");
        let userData = null;
        if (superAdminInfo) {
          try {
            const parsed = JSON.parse(superAdminInfo);
            userData = parsed.user || null;
            console.log("✅ Loaded user data:", userData);
          } catch (parseError) {
            console.error("❌ Corrupted SuperAdminInfo:", parseError);
            localStorage.removeItem("SuperAdminInfo");
            localStorage.removeItem("permissions");
            userData = null;
          }
        }

        // Load permissions
        const permissionsData = localStorage.getItem("permissions");
        let permissionsList = [];
        if (permissionsData) {
          try {
            permissionsList = JSON.parse(permissionsData);
            if (!Array.isArray(permissionsList)) permissionsList = [];
            console.log("✅ Loaded permissions:", permissionsList.length);
          } catch (parseError) {
            console.error("❌ Corrupted permissions:", parseError);
            localStorage.removeItem("permissions");
            permissionsList = [];
          }
        }

        setUser(userData);
        setPermissions(permissionsList);
      } catch (error) {
        console.error("❌ Error loading auth data:", error);
        localStorage.removeItem("SuperAdminInfo");
        localStorage.removeItem("permissions");
        setUser(null);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const clearCorruptedData = () => {
    console.log("🔄 Clearing all corrupted auth data...");
    localStorage.removeItem("SuperAdminInfo");
    localStorage.removeItem("permissions");
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPermissions([]);
  };

  // Distinct name to avoid collision with RTK mutation
  const loginUser = (authResponse) => {
    try {
      // If you reset RTK Query caches, do it safely
      try {
        dispatch(templateApi.util.resetApiState?.());
        dispatch(modelApi.util.resetApiState?.());
      } catch (e) {
        console.warn("RTK reset skipped:", e);
      }

      // Normalize token and user
      const token = authResponse?.token || authResponse?.user?.token;
      const userObj = authResponse?.user
        ? { ...authResponse.user, token }
        : { ...authResponse, token };

      if (!token) {
        console.warn("loginUser: token not found in response, proceeding with state set");
      }

      const permissionsArr =
        authResponse?.user?.roles?.[0]?.permissions ||
        authResponse?.permissions ||
        [];

      // Persist and update reactive state
      localStorage.setItem(
        "SuperAdminInfo",
        JSON.stringify({ user: userObj, timestamp: new Date().toISOString() })
      );
      localStorage.setItem("permissions", JSON.stringify(permissionsArr));

      setUser(userObj);
      setPermissions(Array.isArray(permissionsArr) ? permissionsArr : []);

      console.log("✅ Login stored. Token:", token?.substring(0, 20));
      return true;
    } catch (error) {
      console.error("❌ Error storing login data:", error);
      clearCorruptedData();
      return false;
    }
  };

  const logout = () => {
    clearCorruptedData();
    console.log("✅ Logout completed");
  };

  const isAuthenticated = () => !!user;

  const hasPermission = (permission) =>
    Array.isArray(permissions) &&
    permissions.some((p) => p?.name === permission);

  const debugStorage = () => {
    console.log("🔍 Storage Debug Info:");
    console.log("- SuperAdminInfo:", localStorage.getItem("SuperAdminInfo"));
    console.log("- permissions:", localStorage.getItem("permissions"));
    console.log("- Current user:", user);
    console.log("- Current permissions:", permissions);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        hasPermission,
        loginUser, // expose distinct function name
        logout,
        isAuthenticated,
        loading,
        clearCorruptedData,
        debugStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
