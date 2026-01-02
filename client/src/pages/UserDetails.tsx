import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, User, Mail, Phone, Shield, Calendar, MapPin, FileText } from "lucide-react";
import { Link, useParams } from "wouter";
import { ROLE_LABELS } from "@shared/constants";

export default function UserDetails() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  // يمكن إضافة استعلام لجلب بيانات المستخدم هنا
  const user = {
    id: userId,
    name: "محمد أحمد",
    email: "mohammed@example.com",
    phone: "0501234567",
    role: "service_requester",
    status: "active",
    city: "الرياض",
    createdAt: new Date(),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان */}
        <div className="flex items-center gap-4">
          <Link href="/users">
            <Button variant="ghost" size="icon">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">تفاصيل المستخدم</h1>
            <p className="text-muted-foreground">عرض وإدارة بيانات المستخدم</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* البطاقة الرئيسية */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <Avatar className="h-24 w-24 mx-auto border-2">
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold mt-4">{user.name}</h2>
                <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <Shield className="w-4 h-4" />
                  {ROLE_LABELS[user.role] || user.role}
                </p>
                <span className={`badge mt-3 ${user.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {user.status === "active" ? "نشط" : "قيد الانتظار"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* معلومات الاتصال */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader>
              <CardTitle>معلومات الاتصال</CardTitle>
              <CardDescription>بيانات التواصل مع المستخدم</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الجوال</p>
                    <p className="font-medium">{user.phone || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">المدينة</p>
                    <p className="font-medium">{user.city || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString("ar-SA")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* طلبات المستخدم */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              طلبات المستخدم
            </CardTitle>
            <CardDescription>الطلبات المقدمة من هذا المستخدم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
