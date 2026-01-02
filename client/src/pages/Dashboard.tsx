import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  FileText, 
  Users, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ROLE_LABELS, PROGRAM_LABELS, STAGE_LABELS, STATUS_LABELS } from "@shared/constants";

// أيقونات البرامج
const programIcons: Record<string, string> = {
  bunyan: "🏗️",
  daaem: "🔨",
  enaya: "🔧",
  emdad: "📦",
  ethraa: "🧾",
  sedana: "✨",
  taqa: "☀️",
  miyah: "💧",
  suqya: "🚰",
};

export default function Dashboard() {
  const { user } = useAuth();
  
  // جلب الإحصائيات
  const { data: requestStats } = trpc.requests.getStats.useQuery();
  const { data: mosqueStats } = trpc.mosques.getStats.useQuery();
  const { data: pendingUsers } = trpc.auth.getPendingUsers.useQuery(undefined, {
    enabled: ["super_admin", "system_admin", "projects_office"].includes(user?.role || ""),
  });

  // بطاقات الإحصائيات الرئيسية
  const mainStats = [
    {
      title: "إجمالي الطلبات",
      value: requestStats?.total || 0,
      icon: FileText,
      color: "bg-primary",
      change: "+12%",
    },
    {
      title: "المساجد المسجلة",
      value: mosqueStats?.total || 0,
      icon: Building2,
      color: "bg-[#059669]",
      change: "+8%",
    },
    {
      title: "قيد التنفيذ",
      value: requestStats?.byStatus?.in_progress || 0,
      icon: Clock,
      color: "bg-[#F59E0B]",
      change: "+5%",
    },
    {
      title: "مكتملة",
      value: requestStats?.byStatus?.completed || 0,
      icon: CheckCircle2,
      color: "bg-[#22C55E]",
      change: "+15%",
    },
  ];

  // روابط سريعة حسب الدور
  const getQuickLinks = () => {
    const links = [];
    
    if (["super_admin", "system_admin"].includes(user?.role || "")) {
      links.push(
        { title: "إدارة المستخدمين", href: "/users", icon: Users },
        { title: "إعدادات النظام", href: "/settings", icon: Building2 },
      );
    }
    
    if (["super_admin", "system_admin", "projects_office"].includes(user?.role || "")) {
      links.push(
        { title: "جميع الطلبات", href: "/requests", icon: FileText },
        { title: "المساجد", href: "/mosques", icon: Building2 },
      );
    }
    
    if (user?.role === "field_team") {
      links.push(
        { title: "الزيارات الميدانية", href: "/field-visits", icon: Calendar },
        { title: "طلباتي", href: "/my-requests", icon: FileText },
      );
    }
    
    if (user?.role === "quick_response") {
      links.push(
        { title: "الطلبات العاجلة", href: "/urgent-requests", icon: AlertTriangle },
        { title: "تقاريري", href: "/my-reports", icon: FileText },
      );
    }
    
    if (user?.role === "financial") {
      links.push(
        { title: "التقارير المالية", href: "/financial-reports", icon: TrendingUp },
        { title: "الدفعات", href: "/payments", icon: FileText },
      );
    }

    return links;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* رسالة الترحيب */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              مرحباً، {user?.name || "المستخدم"}
            </h1>
            <p className="text-muted-foreground">
              {ROLE_LABELS[user?.role || ""] || user?.role} - لوحة التحكم
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/service-request">
              <Button className="gradient-primary text-white">
                <Plus className="w-4 h-4 ml-2" />
                طلب جديد
              </Button>
            </Link>
          </div>
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mainStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change} هذا الشهر
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* الطلبات حسب البرنامج */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader>
              <CardTitle>الطلبات حسب البرنامج</CardTitle>
              <CardDescription>توزيع الطلبات على البرامج التسعة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(requestStats?.byProgram || {}).map(([program, count]) => (
                  <div key={program} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-2xl">{programIcons[program] || "📋"}</span>
                    <div>
                      <p className="font-medium text-foreground">{PROGRAM_LABELS[program] || program}</p>
                      <p className="text-sm text-muted-foreground">{count as number} طلب</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* روابط سريعة */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>روابط سريعة</CardTitle>
              <CardDescription>الوصول السريع للصفحات الرئيسية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getQuickLinks().map((link, index) => (
                  <Link key={index} href={link.href}>
                    <Button variant="ghost" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <link.icon className="w-4 h-4" />
                        {link.title}
                      </span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الطلبات حسب المرحلة والحالة */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* حسب المرحلة */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>الطلبات حسب المرحلة</CardTitle>
              <CardDescription>توزيع الطلبات على المراحل السبع</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(requestStats?.byStage || {}).map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{STAGE_LABELS[stage] || stage}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(((count as number) / (requestStats?.total || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground w-8">{count as number}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* حسب الحالة */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>الطلبات حسب الحالة</CardTitle>
              <CardDescription>توزيع الطلبات حسب حالتها الحالية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(requestStats?.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{STATUS_LABELS[status] || status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-secondary rounded-full"
                          style={{ width: `${Math.min(((count as number) / (requestStats?.total || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground w-8">{count as number}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* المستخدمون قيد الانتظار (للمدراء فقط) */}
        {pendingUsers && pendingUsers.length > 0 && (
          <Card className="border-0 shadow-sm border-r-4 border-r-yellow-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    مستخدمون بانتظار الاعتماد
                  </CardTitle>
                  <CardDescription>{pendingUsers.length} مستخدم بانتظار المراجعة</CardDescription>
                </div>
                <Link href="/users?status=pending">
                  <Button variant="outline">عرض الكل</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Link href={`/users/${user.id}`}>
                      <Button size="sm" variant="outline">مراجعة</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
