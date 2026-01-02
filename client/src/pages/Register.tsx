import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const requesterTypes = [
  { value: "imam", label: "إمام المسجد" },
  { value: "muezzin", label: "مؤذن المسجد" },
  { value: "board_member", label: "عضو مجلس إدارة" },
  { value: "committee_member", label: "عضو لجنة" },
  { value: "volunteer", label: "متطوع" },
  { value: "other", label: "أخرى" },
];

const cities = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
  "الخبر", "الطائف", "بريدة", "تبوك", "حائل", "أبها", "نجران",
  "جازان", "الباحة", "الجوف", "عرعر", "ينبع", "القطيف", "الأحساء",
];

export default function Register() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nationalId: "",
    city: "",
    requesterType: "",
    password: "",
    confirmPassword: "",
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ في التسجيل");
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
      nationalId: formData.nationalId || undefined,
      city: formData.city || undefined,
      requesterType: formData.requesterType || undefined,
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">تم التسجيل بنجاح!</h2>
            <p className="text-muted-foreground mb-6">
              تم إنشاء حسابك بنجاح. يرجى انتظار اعتماد حسابك من قبل الإدارة.
              سيتم إشعارك عبر البريد الإلكتروني عند تفعيل حسابك.
            </p>
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full gradient-primary text-white">
                  الذهاب لتسجيل الدخول
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  العودة للصفحة الرئيسية
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* الجانب الأيسر - النموذج */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          {/* الشعار */}
          <Link href="/" className="flex items-center gap-3 mb-8">
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
              <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
              <CardDescription>
                سجل كطالب خدمة للاستفادة من خدمات البوابة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* الاسم الكامل */}
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    placeholder="أدخل اسمك الكامل"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>

                {/* البريد الإلكتروني */}
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                    className="text-left"
                    dir="ltr"
                  />
                </div>

                {/* رقم الجوال ورقم الهوية */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الجوال</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="05xxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">رقم الهوية</Label>
                    <Input
                      id="nationalId"
                      placeholder="رقم الهوية الوطنية"
                      value={formData.nationalId}
                      onChange={(e) => handleChange("nationalId", e.target.value)}
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* المدينة وصفة طالب الخدمة */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Select value={formData.city} onValueChange={(value) => handleChange("city", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requesterType">صفة طالب الخدمة</Label>
                    <Select value={formData.requesterType} onValueChange={(value) => handleChange("requesterType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الصفة" />
                      </SelectTrigger>
                      <SelectContent>
                        {requesterTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* كلمة المرور */}
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="8 أحرف على الأقل"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      required
                      minLength={8}
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

                {/* تأكيد كلمة المرور */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="أعد إدخال كلمة المرور"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      required
                      className="pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    "إنشاء الحساب"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  لديك حساب بالفعل؟{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    تسجيل الدخول
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            بإنشاء حساب، أنت توافق على{" "}
            <a href="#" className="text-primary hover:underline">شروط الاستخدام</a>
            {" "}و{" "}
            <a href="#" className="text-primary hover:underline">سياسة الخصوصية</a>
          </p>
        </div>
      </div>

      {/* الجانب الأيمن - الصورة */}
      <div className="hidden lg:flex flex-1 gradient-hero islamic-pattern items-center justify-center p-12">
        <div className="max-w-lg text-white text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-8">
            <Building2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            انضم إلى بوابة تمام
          </h2>
          <p className="text-lg opacity-90 mb-8">
            سجل الآن واستفد من خدمات البوابة لمسجدك
          </p>
          
          <div className="space-y-4 text-right">
            {[
              "تسجيل المساجد وإدارتها",
              "تقديم طلبات الخدمة بسهولة",
              "متابعة حالة الطلبات",
              "التواصل مع فريق الدعم",
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
