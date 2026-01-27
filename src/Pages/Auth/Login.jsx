// Login.jsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useLoginMutation } from "../../RtkQuery/Slice/Auth/AuthApi";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { showToast } from "../../utils/Notifictions/showToast";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../Context/AuthProvider";
import { messaging } from "@/firebase";
import { getToken, isSupported } from "firebase/messaging";

const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "الاسم يجب ان يكون اكبر من 3 احرف")
    .required("اسم المستخدم مطلوب"),
  password: Yup.string()
    .min(8, "كلمة المرور يجب ان تكون اكبر من 8 احرف")
    .required("كلمة المرور مطلوبة"),
});

// Use local images from public folder
const BACKGROUND_IMAGES = [
  "/images/alshaheya.png",
  "/images/hashmi.png", 
  "/images/jessy.png"
];

export function Login({ className, ...props }) {
  const [triggerLogin, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload images
  useEffect(() => {
    const loadImages = async () => {
      const promises = BACKGROUND_IMAGES.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      try {
        await Promise.all(promises);
        setImagesLoaded(true);
      } catch (error) {
        console.error("Error loading background images:", error);
        setImagesLoaded(true); // Still continue even if images fail to load
      }
    };

    loadImages();
  }, []);

  // Image slider effect
  useEffect(() => {
    if (!imagesLoaded) return;

    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => 
        prevIndex === BACKGROUND_IMAGES.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [imagesLoaded]);

  // Function to get FCM token
  const getFCMToken = async () => {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.log("This browser does not support notifications");
        return null;
      }

      // Check if Firebase Messaging is supported
      const isFcmSupported = await isSupported();
      if (!isFcmSupported) {
        console.log("Firebase Messaging is not supported");
        return null;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: "BAEh5pDcl7muc7kcU-wQnfZQTM9EoYNTD9BLnlq5fYVKBMkxgpiy6pvH7TbHafvprRLOkRSRzP_NSKtkEtxLyWY"
        });
        
        if (token) {
          console.log("FCM Token retrieved:", token.substring(0, 20) + "...");
          setFcmToken(token);
          localStorage.setItem('fcm_token', token);
          return token;
        }
      } else {
        console.log("Notification permission not granted:", permission);
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
    }
    return null;
  };

  // Function to check if token changed
  const checkTokenChanges = async () => {
    const oldToken = localStorage.getItem('fcm_token');
    console.log("Old token in localStorage:", oldToken?.substring(0, 20) + "...");
    
    // Get new token
    const newToken = await getFCMToken();
    
    console.log("New token from Firebase:", newToken?.substring(0, 20) + "...");
    
    if (oldToken && newToken && oldToken !== newToken) {
      console.log("⚠️ Token changed! Old vs New");
      showToast("info", "تم تحديث رمز الإشعارات");
      // You could send the new token to backend here if needed
    }
  };

  // Get FCM token on component mount
  useEffect(() => {
    getFCMToken();
    checkTokenChanges();
  }, []);

  const formik = useFormik({
    initialValues: { username: "", password: "" },
    validationSchema: LoginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        // Get current FCM token (or from localStorage)
        const currentFcmToken = fcmToken || localStorage.getItem('fcm_token');
        
        // Prepare login data with FCM token
        const loginData = {
          ...values,
          fcm_token: currentFcmToken || null,
          device_type: 'web'
        };


        const res = await triggerLogin(loginData).unwrap();

        // Update context before navigating
        const success = loginUser(res);
        if (!success) {
          showToast("error", "فشل تسجيل الدخول");
          setSubmitting(false);
          return;
        }

        showToast("success", "تم تسجيل الدخول بنجاح");
        
        // Send FCM token to backend separately if needed
        if (loginData.fcm_token && res.user?.id) {
          sendFcmTokenToBackend(loginData.fcm_token, res.user.id);
        }
        
        navigate("/dashboard/administration-page/");
      } catch (error) {
        console.error("Login error:", error);
        showToast("error", error?.data?.message || "حدث خطأ غير متوقع");
      }
      setSubmitting(false);
    },
  });

  // Function to send FCM token to backend
  const sendFcmTokenToBackend = async (token, userId) => {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        console.log("No auth token available");
        return;
      }

      const response = await fetch("/api/save-fcm-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          fcm_token: token,
          user_id: userId
        })
      });

      if (response.ok) {
        console.log("FCM token sent to backend successfully");
      } else {
        console.log("Backend endpoint not ready for FCM token, status:", response.status);
      }
    } catch (error) {
      console.error("Error sending FCM token to backend:", error);
    }
  };

  useEffect(() => {
    if (formik.errors.username && formik.touched.username) {
      showToast("error", formik.errors.username);
    }
    if (formik.errors.password && formik.touched.password) {
      showToast("error", formik.errors.password);
    }
  }, [formik.errors, formik.touched]);

  return (
    <div
      className={cn(
        "flex w-full min-h-screen justify-center flex-col items-center gap-6 relative overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0">
        {BACKGROUND_IMAGES.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentBgIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#1a1a1a',
            }}
          />
        ))}
        
        {/* Enhanced gradient overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.35_0.05_265.755/0.7)] via-transparent to-[oklch(0.18_0.04_265.755/0.7)]" />
      </div>

      {/* Enhanced Login Card with Premium Blur Effects */}
      <Card className="w-full max-w-md bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02] shadow-2xl backdrop-blur-[20px] border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] z-10 relative overflow-hidden">
        {/* Glassmorphism effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        {/* Subtle noise texture for frosted glass effect */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-2xl text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center backdrop-blur-sm border border-white/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                </svg>
              </div>
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">تسجيل الدخول</span>
            </div>
            <div className="text-sm font-normal text-gray-300 mt-2 backdrop-blur-sm bg-white/5 rounded-lg px-4 py-2 inline-block">
              الشركة السورية للاعلان
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={formik.handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label className="text-right block text-white" htmlFor="username">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <span className="text-gray-200">اسم المستخدم</span>
                  </div>
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-50 transition duration-300"></div>
                  <Input
                    id="username"
                    className="relative text-white bg-white/[0.1] border-white/30 focus:bg-white/[0.15] focus:border-blue-400/50 transition-all duration-300 placeholder:text-gray-400 backdrop-blur-sm"
                    type="text"
                    name="username"
                    placeholder="أدخل اسم المستخدم"
                    required
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-right block w-full text-white" htmlFor="password">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                    <span className="text-gray-200">كلمة المرور</span>
                  </div>
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-50 transition duration-300"></div>
                  <div className="relative">
                    <Input
                      id="password"
                      value={formik.values.password}
                      name="password"
                      placeholder="أدخل كلمة المرور"
                      type={showPassword ? "text" : "password"}
                      required
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="pl-10 pr-10 text-white bg-white/[0.1] border-white/30 focus:bg-white/[0.15] focus:border-blue-400/50 transition-all duration-300 placeholder:text-gray-400 backdrop-blur-sm"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative group mt-2">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-500 animate-pulse"></div>
                <Button
                  type="submit"
                  disabled={formik.isSubmitting || isLoading}
                  className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white cursor-pointer hover:from-blue-700 hover:to-purple-700 shadow-xl transition-all duration-300 backdrop-blur-sm border border-white/20"
                >
                  {(formik.isSubmitting || isLoading) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                      </svg>
                      تسجيل الدخول
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-center p-3 bg-gradient-to-r from-white/[0.05] to-white/[0.02] rounded-lg backdrop-blur-sm border border-white/10">
                {fcmToken ? (
                  <div className="flex items-center justify-center gap-2 text-green-300">
                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <span className="text-sm">✓ الإشعارات المرورية مفعلة</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-yellow-300">
                    <div className="w-4 h-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                    </div>
                    <span className="text-sm">⚠️ يرجى تفعيل الإشعارات للحصول على تنبيهات المرور</span>
                  </div>
                )}
              </div>

              <Link
                to="#"
                onClick={() => showToast("error", "يرجى التواصل مع المدير")}
                className="ml-auto text-center text-gray-300 inline-block text-sm underline-offset-4 hover:underline hover:text-blue-300 transition-all duration-200 flex items-center justify-center gap-1 group"
              >
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                  </svg>
                </div>
                <span>هل نسيت كلمة المرور ؟</span>
              </Link>
            </div>
          </form>
        </CardContent>
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-br-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-purple-500/10 to-transparent rounded-tl-full pointer-events-none"></div>
      </Card>
      
      {/* Floating decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl animate-pulse pointer-events-none" style={{animationDelay: '1s'}}></div>
      
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}