// Login.jsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useLoginMutation } from "../../RtkQuery/Slice/Auth/AuthApi";
import { Loader2, Eye, EyeOff, ShieldCheck, User, Lock, Bell, BellOff } from "lucide-react";
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
      if (!('Notification' in window)) {
        console.log("This browser does not support notifications");
        return null;
      }

      const isFcmSupported = await isSupported();
      if (!isFcmSupported) {
        console.log("Firebase Messaging is not supported");
        return null;
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
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
    const newToken = await getFCMToken();
    
    if (oldToken && newToken && oldToken !== newToken) {
      console.log("⚠️ Token changed! Old vs New");
      showToast("info", "تم تحديث رمز الإشعارات");
    }
  };

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
        const currentFcmToken = fcmToken || localStorage.getItem('fcm_token');
        
        const loginData = {
          ...values,
          fcm_token: currentFcmToken || null,
          device_type: 'web'
        };

        const res = await triggerLogin(loginData).unwrap();

        const success = loginUser(res);
        if (!success) {
          showToast("error", "فشل تسجيل الدخول");
          setSubmitting(false);
          return;
        }

        showToast("success", "تم تسجيل الدخول بنجاح");
        
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

  const sendFcmTokenToBackend = async (token, userId) => {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
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
    <div className={cn("w-full min-h-screen flex flex-col lg:flex-row bg-white", className)} {...props}>
      
      {/* القسم الأيمن: الصورة (في التطبيقات التي تستخدم اتجاه RTL) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-end justify-start p-12 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
          alt="Admin Dashboard Analytics"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
        <div className="absolute inset-0 bg-blue-900/10 mix-blend-color" />
        
        <div className="relative z-10 max-w-lg text-right w-full ml-auto">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-xl mb-6 border border-white/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H4a2 2 0 00-2 2v6a2 2 0 002 2h3a2 2 0 002-2zm0 0V9a2 2 0 012-2h3a2 2 0 012 2v10m-6 0a2 2 0 002 2h3a2 2 0 002-2m0 0V5a2 2 0 012-2h3a2 2 0 012 2v14a2 2 0 01-2 2h-3a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            التحكم الشامل والمراقبة
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            مرحباً بك في لوحة تحكم المسؤولين المركزية. يمكنك من هنا إدارة البيانات، مراقبة الإحصائيات، ومتابعة جميع تفاصيل سير العمل بأمان وسرعة.
          </p>
        </div>
      </div>

      {/* القسم الأيسر: نموذج تسجيل الدخول */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 xl:p-24 bg-slate-50 relative z-10">
        <div className="w-full max-w-[420px] space-y-10">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-900 rounded-2xl shadow-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              بوابة الإدارة
            </h1>
            <p className="text-sm text-slate-500 font-medium bg-slate-200/50 inline-block px-4 py-1.5 rounded-full">
              الشركة السورية للاعلان - وصول المسؤولين
            </p>
          </div>

          {/* Form */}
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="space-y-5">
              
              {/* Username Input */}
              <div className="space-y-2">
                <Label className="text-right block text-slate-700 font-semibold" htmlFor="username">
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    // أضفنا text-slate-900 ولون للـ placeholder هنا
                    className="pr-10 h-12 bg-white text-slate-900 placeholder:text-slate-400 border-slate-200 focus:border-slate-900 focus:ring-slate-900 transition-colors"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Link
                    to="#"
                    onClick={() => showToast("error", "يرجى التواصل مع مدير النظام")}
                    className="text-xs text-slate-500 hover:text-slate-900 hover:underline transition-colors"
                  >
                    هل نسيت كلمة المرور؟
                  </Link>
                  <Label className="text-right block text-slate-700 font-semibold" htmlFor="password">
                    كلمة المرور
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    // أضفنا text-slate-900 ولون للـ placeholder هنا
                    className="pr-10 pl-10 h-12 bg-white text-slate-900 placeholder:text-slate-400 border-slate-200 focus:border-slate-900 focus:ring-slate-900 transition-colors"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 hover:text-slate-700 transition-colors"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Status */}
            <div className="flex items-center justify-center rounded-lg bg-slate-100 p-3 border border-slate-200">
              {fcmToken ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <Bell className="w-4 h-4" />
                  <span className="text-xs font-semibold">نظام إشعارات المسؤولين مفعل</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <BellOff className="w-4 h-4" />
                  <span className="text-xs font-semibold">يرجى تفعيل الإشعارات للحصول على التنبيهات</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={formik.isSubmitting || isLoading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-md transition-all active:scale-[0.98]"
            >
              {(formik.isSubmitting || isLoading) ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول للنظام"
              )}
            </Button>
          </form>
        </div>
      </div>

      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid #334155',
          },
        }}
      />
    </div>
  );
}