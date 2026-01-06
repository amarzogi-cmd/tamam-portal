import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, User, Mail, Phone, Shield, Calendar, MapPin, FileText, Loader2 } from "lucide-react";
import { Link, useParams } from "wouter";
import { ROLE_LABELS } from "@shared/constants";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function UserDetails() {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id || "0");

  // جلب بيانات المستخدم من قاعدة البيانات
  const { data: user, isLoading, error } = trpc.auth.getUserById.useQuery(
    { userId },
    { enabled: userId > 0 }
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="border-0 shadow-sm max-w-md w-full">
            <CardContent className="p-6 text-center">
              <p className="text-destructive mb-4">حدث خطأ في تحميل بيانات المستخدم</p>
              <Link href="/users">
                <Button variant="outline" className="w-full">
                  العودة إلى قائمة المستخدمين
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
                <span className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium ${
                  user.status === "active" 
                    ? "bg-green-100 text-green-800" 
                    : user.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {user.status === "active" ? "نشط" : user.status === "pending" ? "قيد الانتظار" : "معلق"}
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
                    <p className="font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-SA") : "-"}
                    </p>
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
            <p className="text-muted-foreground text-center py-8">
              لا توجد طلبات لهذا المستخدم حالياً
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
