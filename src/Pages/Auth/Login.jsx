import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router";
import { useEffect, useState, useCallback } from "react";
import { useLoginMutation } from "../../RtkQuery/Slice/Auth/AuthApi";
import { Loader2, Eye, EyeOff, ShieldCheck, User, Lock, Bell, BellOff, AlertCircle } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { showToast } from "../../utils/Notifictions/showToast";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../Context/AuthProvider";
import { messaging } from "@/firebase";
import { getToken, isSupported } from "firebase/messaging";

// VAPID Key constant
const VAPID_KEY = "BAEh5pDcl7muc7kcU-wQnfZQTM9EoYNTD9BLnlq5fYVKBMkxgpiy6pvH7TbHafvprRLOkRSRzP_NSKtkEtxLyWY";

const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .required("اسم المستخدم مطلوب"),
  password: Yup.string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .required("كلمة المرور مطلوبة"),
});

export function Login({ className, ...props }) {
  const [triggerLogin, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);

  // Synchronize FCM Token safely without redundant triggers
  const initFCMToken = useCallback(async () => {
    try {
      if (!('Notification' in window)) {
        console.log("هذا المتصفح لا يدعم الإشعارات");
        return null;
      }

      const isFcmSupported = await isSupported();
      if (!isFcmSupported) {
        console.log("Firebase Messaging غير مدعوم في هذا المتصفح");
        return null;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          const oldToken = localStorage.getItem('fcm_token');
          if (oldToken && oldToken !== token) {
            showToast("info", "تم تحديث رمز الإشعارات الخاص بك");
          }
          setFcmToken(token);
          localStorage.setItem('fcm_token', token);
          return token;
        }
      }
    } catch (error) {
      console.error("خطأ أثناء جلب رمز FCM:", error);
    }
    return null;
  }, []);

  useEffect(() => {
    initFCMToken();
  }, [initFCMToken]);

  const sendFcmTokenToBackend = async (token, userId) => {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) return;

      await fetch("/api/save-fcm-token", {
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
    } catch (error) {
      console.error("خطأ في إرسال FCM token للخادم:", error);
    }
  };

  const formik = useFormik({
    initialValues: { username: "", password: "" },
    validationSchema: LoginSchema,
    onSubmit: async (values, { setSubmitting }) => {
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
          showToast("error", "فشل تسجيل الدخول، يرجى المحاولة لاحقاً");
          return;
        }

        showToast("success", "تم تسجيل الدخول بنجاح");
        
        if (loginData.fcm_token && res.user?.id) {
          sendFcmTokenToBackend(loginData.fcm_token, res.user.id);
        }
        
        navigate("/dashboard/administration-page/");
      } catch (error) {
        console.error("Login error:", error);
        showToast("error", error?.data?.message || "حدث خطأ غير متوقع أثناء تسجيل الدخول");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className={cn("w-full min-h-screen flex flex-col lg:flex-row bg-slate-50 dir-rtl", className)} dir="rtl" {...props}>
      
      {/* Right Side: Data Analytics Image Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 items-end justify-start p-12 overflow-hidden">
        <img
src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"          alt="لوحة التحكم الإدارية والتحليلات"
          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity scale-105 transition-transform duration-1000 hover:scale-100"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-blue-950/20 mix-blend-overlay" />
        
        <div className="relative z-10 max-w-lg text-right w-full">
          <div className="inline-flex items-center justify-center p-3.5 bg-white/10 backdrop-blur-md rounded-2xl mb-6 border border-white/15 shadow-2xl">
            <ShieldCheck className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            التحكم الشامل والمراقبة الذكية
          </h2>
          <p className="text-base text-slate-300 leading-relaxed font-normal">
            مرحباً بك في بوابة الإدارة المركزية للشركة السورية للإعلان. قم بإدارة عملياتك، متابعة التحليلات المباشرة، وحماية بياناتك في بيئة آمنة ومتكاملة.
          </p>
        </div>
      </div>

      {/* Left Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 xl:p-20 bg-white relative z-10">
        <div className="w-full max-w-[420px] space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 bg-slate-900 rounded-2xl shadow-lg flex items-center justify-center border border-slate-800">
              <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.75} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              تسجيل الدخول
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium bg-slate-100 inline-block px-3.5 py-1.5 rounded-full border border-slate-200">
              الشركة السورية للإعلان — وصول المسؤولين
            </p>
          </div>

          {/* Form */}
          <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-4">
              
              {/* Username Input */}
              <div className="space-y-1.5">
                <Label className="text-right block text-slate-700 font-medium text-sm" htmlFor="username">
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    className={cn(
                      "pr-10 h-11 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-slate-900 transition-all dir-rtl",
                      formik.touched.username && formik.errors.username && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {formik.touched.username && formik.errors.username && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formik.errors.username}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-right block text-slate-700 font-medium text-sm" htmlFor="password">
                    كلمة المرور
                  </Label>
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      showToast("info", "يرجى التواصل مع مدير النظام لإعادة ضبط كلمة المرور");
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900 hover:underline transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    className={cn(
                      "pr-10 pl-10 h-11 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-slate-900 transition-all dir-rtl",
                      formik.touched.password && formik.errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 hover:text-slate-700 transition-colors"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formik.errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Notification Status */}
            <div className="flex items-center justify-center rounded-xl bg-slate-50 p-3 border border-slate-200/80">
              {fcmToken ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <Bell className="w-4 h-4" />
                  <span className="text-xs font-semibold">نظام الإشعارات مفعل بنجاح</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <BellOff className="w-4 h-4" />
                  <span className="text-xs font-semibold">يرجى السماح بالإشعارات للحصول على التنبيهات</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={formik.isSubmitting || isLoading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm hover:shadow transition-all active:scale-[0.99] rounded-lg"
            >
              {(formik.isSubmitting || isLoading) ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </span>
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
            borderRadius: '0.5rem',
            direction: 'rtl'
          },
        }}
      />
    </div>
  );
}