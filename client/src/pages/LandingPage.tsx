import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-teal-600 to-blue-600 flex flex-col items-center justify-center p-8">
      {/* الشعار */}
      <div className="mb-12 text-center">
        <img 
          src="/logo-white.png" 
          alt="شعار بوابة تمام" 
          className="h-24 mx-auto mb-6"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          بوابة تمام للعناية بالمساجد
        </h1>
        <p className="text-xl text-white/90">
          منصة متكاملة لإدارة خدمات المساجد من خلال برامج متخصصة تغطي جميع احتياجات بيوت الله
        </p>
      </div>

      {/* الأزرار الرئيسية */}
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* زر طلب خدمة */}
        <Link href="/register">
          <Card className="p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white/95 hover:bg-white border-0">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">طلب خدمة</h2>
              <p className="text-gray-600">
                سجل حساب جديد وقدم طلب خدمة لمسجدك من خلال البرامج المتاحة
              </p>
              <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white text-lg py-6">
                تسجيل حساب جديد
              </Button>
            </div>
          </Card>
        </Link>

        {/* زر دخول الموظفين */}
        <Link href="/admin/login">
          <Card className="p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white/95 hover:bg-white border-0">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">دخول الموظفين</h2>
              <p className="text-gray-600">
                تسجيل دخول للموظفين والمسؤولين لإدارة الطلبات والخدمات
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6">
                تسجيل الدخول
              </Button>
            </div>
          </Card>
        </Link>
      </div>

      {/* رابط تسجيل دخول المستفيدين */}
      <div className="mt-8 text-center">
        <p className="text-white/90 mb-2">لديك حساب بالفعل؟</p>
        <Link href="/login">
          <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
            تسجيل دخول المستفيدين
          </Button>
        </Link>
      </div>
    </div>
  );
}
