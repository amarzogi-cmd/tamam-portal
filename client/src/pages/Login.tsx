import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Eye, EyeOff, Loader2, User, Users } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"requester" | "employee">("requester");
  
  // بيانات المستفيد (تسجيل دخول بالجوال)
  const [phoneRequester, setPhoneRequester] = useState("");
  const [passwordRequester, setPasswordRequester] = useState("");
  
  // بيانات الموظف (تسجيل دخول بالبريد)
  const [emailEmployee, setEmailEmployee] = useState("");
  const [passwordEmployee, setPasswordEmployee] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("تم تسجيل الدخول بنجاح");
      // توجيه حسب الدور
      if (data.user.role === "service_requester") {
        setLocation("/requester/dashboard");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ في تسجيل الدخول");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === "requester") {
      // التحقق من صحة رقم الجوال
      if (!/^05[0-9]{8}$/.test(phoneRequester)) {
        toast.error("رقم الجوال يجب أن يكون بصيغة 05XXXXXXXX (10 أرقام)");
        return;
      }
      loginMutation.mutate({ 
        phone: phoneRequester, 
        password: passwordRequester 
      });
    } else {
      loginMutation.mutate({ 
        email: emailEmployee, 
        password: passwordEmployee 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      {/* النموذج في المنتصف */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* الشعار */}
          <Link href="/" className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">بوابة تمام</h1>
              <p className="text-sm text-muted-foreground">للعناية بالمساجد</p>
            </div>
          </Link>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
              <CardDescription>
                أدخل بياناتك للوصول إلى حسابك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "requester" | "employee")} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="requester" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    طالب خدمة
                  </TabsTrigger>
                  <TabsTrigger value="employee" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    موظف
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === "requester" ? (
                  <>
                    {/* تسجيل دخول المستفيد - بالجوال */}
                    <div className="space-y-2">
                      <Label htmlFor="phone-requester">رقم الجوال</Label>
                      <Input
                        id="phone-requester"
                        type="tel"
                        placeholder="05xxxxxxxx"
                        value={phoneRequester}
                        onChange={(e) => setPhoneRequester(e.target.value)}
                        required
                        pattern="05[0-9]{8}"
                        maxLength={10}
                        className="text-left"
                        dir="ltr"
                      />
                      {phoneRequester && !/^05[0-9]{8}$/.test(phoneRequester) && (
                        <p className="text-xs text-destructive">يجب أن يكون الرقم بصيغة 05XXXXXXXX (10 أرقام)</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password-requester">كلمة المرور</Label>
                        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                          نسيت كلمة المرور؟
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password-requester"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordRequester}
                          onChange={(e) => setPasswordRequester(e.target.value)}
                          required
                          className="pl-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* تسجيل دخول الموظف - بالبريد */}
                    <div className="space-y-2">
                      <Label htmlFor="email-employee">البريد الإلكتروني</Label>
                      <Input
                        id="email-employee"
                        type="email"
                        placeholder="example@email.com"
                        value={emailEmployee}
                        onChange={(e) => setEmailEmployee(e.target.value)}
                        required
                        className="text-left"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password-employee">كلمة المرور</Label>
                        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                          نسيت كلمة المرور؟
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password-employee"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordEmployee}
                          onChange={(e) => setPasswordEmployee(e.target.value)}
                          required
                          className="pl-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
              </form>

              {activeTab === "requester" && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    ليس لديك حساب؟{" "}
                    <Link href="/register" className="text-primary hover:underline font-medium">
                      إنشاء حساب جديد
                    </Link>
                  </p>
                </div>
              )}

              {activeTab === "employee" && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    للحصول على حساب موظف، يرجى التواصل مع مدير النظام
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            بتسجيل الدخول، أنت توافق على{" "}
            <a href="#" className="text-primary hover:underline">شروط الاستخدام</a>
            {" "}و{" "}
            <a href="#" className="text-primary hover:underline">سياسة الخصوصية</a>
          </p>
        </div>
      </div>
    </div>
  );
}
