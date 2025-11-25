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

const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "الاسم يجب ان يكون اكبر من 3 احرف")
    .required("اسم المستخدم مطلوب"),
  password: Yup.string()
    .min(8, "كلمة المرور يجب ان تكون اكبر من 8 احرف")
    .required("كلمة المرور مطلوبة"),
});

export function Login({ className, ...props }) {
  const [triggerLogin, { isLoading }] = useLoginMutation(); // distinct name
  const navigate = useNavigate();
  const { loginUser } = useAuth(); // context login function

  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: { username: "", password: "" },
    validationSchema: LoginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        const res = await triggerLogin(values).unwrap();

        // Update context before navigating
        const success = loginUser(res);
        if (!success) {
          showToast("error", "فشل تسجيل الدخول");
          setSubmitting(false);
          return;
        }

        showToast("success", "تم تسجيل الدخول بنجاح ");
        navigate("/dashboard/administration-page/");
      } catch (error) {
        showToast("error", error?.data?.message || "حدث خطأ غير متوقع");
      }
      setSubmitting(false);
    },
  });

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
          <CardTitle className="text-2xl text-center text-white">Login</CardTitle>
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
                className="w-full bg-white text-black cursor-pointer"
              >
                {formik.isSubmitting || isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                تسجيل الدخول
              </Button>

              <Link
                to="#"
                onClick={() => showToast("error", "يرجى التواصل مع المدير")}
                className="ml-auto text-center text-white inline-block text-sm underline-offset-4 hover:underline"
              >
                هل نسيت كلمة المرور ؟{" "}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
