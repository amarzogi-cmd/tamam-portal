import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  FileText, 
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  LogOut,
  User,
  Bell,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PROGRAM_LABELS, STAGE_LABELS, STATUS_LABELS } from "@shared/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function RequesterDashboard() {
  const { user, logout } = useAuth();
  
  // جلب طلبات المستخدم
  const { data: myRequests, isLoading } = trpc.requests.getMyRequests.useQuery();
  // جلب مساجد المستخدم
  const { data: myMosques } = trpc.mosques.getMyMosques.useQuery();

  const pendingRequests = myRequests?.filter(r => r.status === "pending") || [];
  const inProgressRequests = myRequests?.filter(r => r.status === "in_progress") || [];
  const completedRequests = myRequests?.filter(r => r.status === "completed") || [];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* شريط التنقل */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">بوابة تمام</h1>
                <p className="text-xs text-muted-foreground">للعناية بالمساجد</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-muted rounded-lg px-2 py-1 transition-colors">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="ml-2 h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                    <LogOut className="ml-2 h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* رسالة الترحيب */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            مرحباً، {user?.name}
          </h1>
          <p className="text-muted-foreground">
            يمكنك من هنا إدارة طلباتك ومساجدك المسجلة
          </p>
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{myRequests?.length || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{pendingRequests.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{inProgressRequests.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{completedRequests.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link href="/requests/new">
            <Button className="gradient-primary text-white">
              <Plus className="w-4 h-4 ml-2" />
              تقديم طلب جديد
            </Button>
          </Link>
          <Link href="/mosques/new">
            <Button variant="outline">
              <Building2 className="w-4 h-4 ml-2" />
              تسجيل مسجد جديد
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* آخر الطلبات */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>آخر الطلبات</CardTitle>
                  <CardDescription>آخر الطلبات المقدمة</CardDescription>
                </div>
                <Link href="/my-requests">
                  <Button variant="ghost" size="sm">
                    عرض الكل
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : myRequests && myRequests.length > 0 ? (
                <div className="space-y-3">
                  {myRequests.slice(0, 5).map((request) => (
                    <Link key={request.id} href={`/requests/${request.id}`}>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{programIcons[request.programType] || "📋"}</span>
                          <div>
                            <p className="font-medium text-foreground">
                              {PROGRAM_LABELS[request.programType]} - {request.requestNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {STAGE_LABELS[request.currentStage]}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${statusColors[request.status]}`}>
                          {STATUS_LABELS[request.status]}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد طلبات حتى الآن</p>
                  <Link href="/requests/new">
                    <Button className="mt-4 gradient-primary text-white">
                      تقديم طلب جديد
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* المساجد المسجلة */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>مساجدي</CardTitle>
                  <CardDescription>المساجد المسجلة باسمك</CardDescription>
                </div>
                <Link href="/my-mosques">
                  <Button variant="ghost" size="sm">
                    عرض الكل
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {myMosques && myMosques.length > 0 ? (
                <div className="space-y-3">
                  {myMosques.slice(0, 4).map((mosque) => (
                    <Link key={mosque.id} href={`/mosques/${mosque.id}`}>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{mosque.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{mosque.city}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد مساجد مسجلة</p>
                  <Link href="/mosques/new">
                    <Button variant="outline" className="mt-4">
                      تسجيل مسجد
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* البرامج المتاحة */}
        <Card className="mt-6 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>البرامج المتاحة</CardTitle>
            <CardDescription>اختر البرنامج المناسب لتقديم طلبك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
              {Object.entries(PROGRAM_LABELS).map(([key, label]) => (
                <Link key={key} href={`/requests/new?program=${key}`}>
                  <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer text-center">
                    <span className="text-3xl">{programIcons[key]}</span>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
