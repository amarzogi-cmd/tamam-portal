import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الدخول بنجاح");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "فشل تسجيل الدخول");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    loginMutation.mutate({
      email,
      password,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white/95">
        {/* الشعار */}
        <div className="text-center mb-8">
          <img 
            src="/logo.svg" 
            alt="شعار بوابة تمام" 
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            دخول الموظفين
          </h1>
          <p className="text-gray-600">
            تسجيل دخول للموظفين والمسؤولين
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* البريد الإلكتروني */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@tamam.sa"
              required
              className="text-right"
            />
          </div>

          {/* كلمة المرور */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              كلمة المرور
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="text-right pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* زر تسجيل الدخول */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>

        {/* رابط العودة */}
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-700 text-sm">
            ← العودة إلى الصفحة الرئيسية
          </a>
        </div>
      </Card>
    </div>
  );
}
