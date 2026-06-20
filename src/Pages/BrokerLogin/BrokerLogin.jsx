// src/Pages/Broker/BrokerLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router";
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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useBrokerAuthentication } from "../../Hooks/useBrokerAuthentication";

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("البريد الإلكتروني غير صالح")
    .required("البريد الإلكتروني مطلوب"),
  password: Yup.string()
    .min(6, "كلمة المرور يجب ان تكون اكبر من 6 احرف")
    .required("كلمة المرور مطلوبة"),
});

export function BrokerLogin({ className, ...props }) {
  const navigate = useNavigate();
  const { loginBroker, isLoading } = useBrokerAuthentication();
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: LoginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const result = await loginBroker(values);
      
      if (result.success) {
        navigate("/broker/welcome");
      }
      
      setSubmitting(false);
    },
  });

  return (
    <div
      className={cn(
        "flex w-full min-h-screen justify-center flex-col items-center gap-6 bg-gradient-to-br from-slate-900 to-slate-800",
        className
      )}
      {...props}
    >
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-white">
            تسجيل دخول الوسيط
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label className="text-right block text-white" htmlFor="email">
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="أدخل البريد الإلكتروني"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                  dir="ltr"
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="text-red-400 text-sm">{formik.errors.email}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-right block text-white" htmlFor="password">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="أدخل كلمة المرور"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 pl-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-red-400 text-sm">{formik.errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={formik.isSubmitting || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {(formik.isSubmitting || isLoading) ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}