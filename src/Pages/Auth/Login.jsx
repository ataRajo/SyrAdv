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

export function Login({ className, ...props }) {
  const [triggerLogin, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);

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

        console.log("Sending login data:", { 
          username: values.username, 
          hasFcmToken: !!loginData.fcm_token,
          tokenPreview: loginData.fcm_token?.substring(0, 20) + "..."
        });

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
        "flex w-full min-h-screen justify-center flex-col items-center gap-6",
        "bg-gradient-to-r from-[oklch(0.35_0.05_265.755)] via-[oklch(0.25_0.045_265.755)] to-[oklch(0.18_0.04_265.755)]",
        className
      )}
      {...props}
    >
      <Card className="w-full max-w-md bg-[oklch(0.208_0.042_265.755)] shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-white">تسجيل الدخول</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label className="text-right block text-white" htmlFor="username">
                  اسم المستخدم
                </Label>
                <Input
                  id="username"
                  className="text-white"
                  type="text"
                  name="username"
                  placeholder="اسم المستخدم"
                  required
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-right block w-full text-white" htmlFor="password">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    value={formik.values.password}
                    name="password"
                    placeholder="كلمة المرور"
                    type={showPassword ? "text" : "password"}
                    required
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="pl-10 text-white"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 pr-3 flex items-center text-gray-500"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={formik.isSubmitting || isLoading}
                className="w-full bg-white text-black cursor-pointer hover:bg-gray-100"
              >
                {(formik.isSubmitting || isLoading) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>

              <div className="text-xs text-gray-300 text-center">
                {fcmToken ? (
                  <span className="text-green-400">✓ الإشعارات مفعلة</span>
                ) : (
                  <span className="text-yellow-400">⚠️ يرجى تفعيل الإشعارات</span>
                )}
              </div>

              <Link
                to="#"
                onClick={() => showToast("error", "يرجى التواصل مع المدير")}
                className="ml-auto text-center text-white inline-block text-sm underline-offset-4 hover:underline"
              >
                هل نسيت كلمة المرور ؟
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}