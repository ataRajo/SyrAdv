import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router";
import { useEffect } from "react";
import { useLoginMutation } from "../../RtkQuery/Slice/Auth/AuthApi";
import { Loader2 } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { showToast } from "../../utils/Notifictions/showToast";
import { useFormik } from "formik";
import * as Yup from "yup";

const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "الاسم يجب ان يكون اكبر من 3 احرف")
    .required("اسم المستخدم مطلوب"),
  password: Yup.string()
    .min(8, "كلمة المرور يجب ان تكون اكبر من 8 احرف")
    .required("كلمة المرور مطلوبة"),
});

export function Login({ className, ...props }) {
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: LoginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        const res = await login(values).unwrap();
        localStorage.setItem("SuperAdminInfo", JSON.stringify(res));
        localStorage.setItem("permissions", JSON.stringify(res?.user?.roles[0]?.permissions));

        showToast("success", "تم تسجيل الدخول بنجاح ");
        navigate("/dashboard/administration-page/");
      } catch (error) {
        showToast("error", error.data?.message || "حدث خطأ غير متوقع");
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
        "flex w-full  min-h-screen justify-center flex-col items-center gap-6",
        className
      )}
      {...props}
    >
      <Card className="w-full  max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label className="text-right block" htmlFor="username">
                  اسم المستخدم
                </Label>
                <Input
                  id="username"
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
                <div className="flex items-center">
                  <Label className="text-right block w-full" htmlFor="password">
                    كلمة المرور
                  </Label>
                </div>

                <Input
                  id="password"
                  value={formik.values.password}
                  name="password"
                  placeholder="كلمة المرور"
                  type="password"
                  required
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
              <Button
                type="submit"
                disabled={formik.isSubmitting || isLoading}
                className="w-full"
              >
                {formik.isSubmitting || isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                تسجيل الدخول
              </Button>

              <Link
                to="#"
                onClick={showToast("error" , "يرجى التواصل مع المدير")}
                className="ml-auto text-center inline-block text-sm underline-offset-4 hover:underline"
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
