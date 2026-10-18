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
      // ⚠️ FIXED (وُجد أثناء ربط صلاحيات الورشات): كان هذا يستدعي templateApi/
      // modelApi بلا استيرادهما إطلاقًا في هذا الملف - ReferenceError في كل
      // تسجيل دخول، يُبتلَع بصمت بواسطة catch أدناه فيسجّل تحذيرًا فقط دون
      // أي أثر فعلي فعليًا - لم يكن يُفرِّغ أي ذاكرة تخزين مؤقت (cache) قط.
      // أُزيل بدل تركه كسطر ميت يوحي بعمل لا يحدث. إن احتجتم لاحقًا تفريغ
      // كل ذاكرة RTK Query المؤقتة عند تسجيل دخول مستخدم مختلف على نفس
      // الجهاز (مهم تحديدًا لأجهزة عمال الورشة المشتركة)، استوردوا كل
      // reducerPath من store.jsx وأضيفوا استدعاءات resetApiState() هنا.

      // Normalize token and user
      const token = authResponse?.token || authResponse?.user?.token;
      const userObj = authResponse?.user
        ? { ...authResponse.user, token }
        : { ...authResponse, token };

      if (!token) {
        console.warn("loginUser: token not found in response, proceeding with state set");
      }

      // ⚠️ FIXED: كان يُقرأ فقط roles[0].permissions (صلاحيات الدور)، فتُتجاهَل
      // تمامًا أي صلاحية مباشرة مُسنَدة للموظف نفسه (عبر checkboxes "الصلاحيات"
      // عند إنشائه/تعديله - انظر EmployeePermissionsPicker/UserService::syncPermissions).
      // النتيجة: تحديد صلاحيات ضيقة لموظف كان بلا أي أثر ظاهري في الواجهة
      // (تظهر كل التابات المسموحة لدوره فقط، بصرف النظر عمّا اخُتير له تحديدًا)
      // - راجع أيضًا AuthService::login() الذي عُدِّل ليُحمِّل 'permissions:name'
      // (الصلاحيات المباشرة) لا roles.permissions فقط.
      //
      // الصلاحيات الفعلية لأي مستخدم في Spatie = اتحاد (union) صلاحيات دوره
      // + صلاحياته المباشرة، فيجب دمج المصدرين هنا لا الاكتفاء بأحدهما.
      const rolePermissions = authResponse?.user?.roles?.[0]?.permissions || [];
      const directPermissions = authResponse?.user?.permissions || [];
      const seenPermissionNames = new Set();
      const permissionsArr = [...rolePermissions, ...directPermissions, ...(authResponse?.permissions || [])].filter(
        (p) => {
          const name = p?.name;
          if (!name || seenPermissionNames.has(name)) return false;
          seenPermissionNames.add(name);
          return true;
        }
      );

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

  const hasPermission = (permission) => {
    if (!Array.isArray(permissions)) return false;
    // بعض عناصر القائمة الجانبية (مثال: "الورشات") يجب أن تظهر لأكثر من
    // دور بصلاحيات مختلفة (مسؤول عبر view-orders، أو عامل ورشة عبر
    // view-workshop-orders) - بلا كسر كل الاستدعاءات الحالية بمعامل نصي
    // واحد، يقبل الآن أيضًا مصفوفة (يكفي تحقق واحد منها).
    if (Array.isArray(permission)) {
      return permission.some((perm) => permissions.some((p) => p?.name === perm));
    }
    return permissions.some((p) => p?.name === permission);
  };

  // "تعديل يدوي للحسابات من شجرة الحسابات (من السوبر ادمن فقط)" - طلب
  // صريح يحتاج تحققًا بالدور نفسه لا بصلاحية edit-financials العادية
  // (يملكها أيضًا accountant - راجع RolePermissionSeeder على الباك-إند).
  // user.roles يصل فعليًا مع استجابة تسجيل الدخول (راجع loginUser أعلاه).
  const hasRole = (roleName) => {
    if (!user?.roles || !Array.isArray(user.roles)) return false;
    return user.roles.some((r) => (typeof r === "string" ? r === roleName : r?.name === roleName));
  };

  const isSuperAdmin = () => hasRole("super admin");

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
        hasRole,
        isSuperAdmin,
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
