import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Search,
  Filter,
  ArrowRight,
  Eye,
  Calendar,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

const stageSteps = [
  { key: "submission", label: "تقديم الطلب", icon: FileText },
  { key: "initial_review", label: "الفرز الأولي", icon: Eye },
  { key: "field_visit", label: "الزيارة الميدانية", icon: Building2 },
  { key: "technical_study", label: "الدراسة الفنية", icon: FileText },
  { key: "financial_approval", label: "الاعتماد المالي", icon: CheckCircle2 },
  { key: "execution", label: "التنفيذ", icon: Clock },
  { key: "completion", label: "الإغلاق", icon: CheckCircle2 },
];

export default function MyRequests() {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  
  // جلب طلبات المستخدم
  const { data: myRequests, isLoading } = trpc.requests.getMyRequests.useQuery();

  // تصفية الطلبات
  const filteredRequests = useMemo(() => {
    if (!myRequests) return [];
    
    return myRequests.filter(request => {
      const matchesSearch = searchTerm === "" || 
        request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.mosqueName || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesProgram = programFilter === "all" || request.programType === programFilter;
      
      return matchesSearch && matchesStatus && matchesProgram;
    });
  }, [myRequests, searchTerm, statusFilter, programFilter]);

  // إحصائيات
  const stats = useMemo(() => {
    if (!myRequests) return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    return {
      total: myRequests.length,
      pending: myRequests.filter(r => r.status === "pending").length,
      inProgress: myRequests.filter(r => r.status === "in_progress").length,
      completed: myRequests.filter(r => r.status === "completed").length,
    };
  }, [myRequests]);

  const getCurrentStageIndex = (stage: string) => {
    return stageSteps.findIndex(s => s.key === stage);
  };

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
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/requester">
                      <User className="ml-2 h-4 w-4" />
                      <span>لوحة التحكم</span>
                    </Link>
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
        {/* العنوان والتنقل */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/requester">
            <Button variant="ghost" size="icon">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">طلباتي</h1>
            <p className="text-muted-foreground">متابعة جميع الطلبات المقدمة</p>
          </div>
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("pending")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">قيد الانتظار</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("in_progress")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("completed")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">مكتملة</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* أدوات البحث والتصفية */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="البحث برقم الطلب أو اسم المسجد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="حالة الطلب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>

              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="البرنامج" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع البرامج</SelectItem>
                  {Object.entries(PROGRAM_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Link href="/service-request">
                <Button className="gradient-primary text-white w-full md:w-auto">
                  <Plus className="w-4 h-4 ml-2" />
                  طلب جديد
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* قائمة الطلبات */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="h-24 bg-muted animate-pulse rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const currentStageIndex = getCurrentStageIndex(request.currentStage);
              
              return (
                <Link key={request.id} href={`/requests/${request.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* معلومات الطلب */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-3xl">{programIcons[request.programType] || "📋"}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-foreground">{request.requestNumber}</h3>
                              <Badge variant="outline" className={statusColors[request.status]}>
                                {STATUS_LABELS[request.status]}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                              {PROGRAM_LABELS[request.programType]} - {request.mosqueName || "مسجد غير محدد"}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(request.createdAt).toLocaleDateString("ar-SA")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {STAGE_LABELS[request.currentStage]}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* شريط المراحل المصغر */}
                        <div className="flex items-center gap-1 lg:w-auto w-full overflow-x-auto pb-2 lg:pb-0">
                          {stageSteps.map((stage, index) => {
                            const isCompleted = index < currentStageIndex;
                            const isCurrent = index === currentStageIndex;
                            return (
                              <div key={stage.key} className="flex items-center">
                                <div 
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                                    isCompleted ? "bg-green-500 text-white" :
                                    isCurrent ? "bg-primary text-white" :
                                    "bg-muted text-muted-foreground"
                                  }`}
                                  title={stage.label}
                                >
                                  {isCompleted ? "✓" : index + 1}
                                </div>
                                {index < stageSteps.length - 1 && (
                                  <div className={`w-4 h-0.5 ${
                                    isCompleted ? "bg-green-500" : "bg-muted"
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* زر العرض */}
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">لا توجد طلبات</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== "all" || programFilter !== "all" 
                  ? "لا توجد طلبات تطابق معايير البحث"
                  : "لم تقم بتقديم أي طلبات بعد"
                }
              </p>
              <Link href="/service-request">
                <Button className="gradient-primary text-white">
                  <Plus className="w-4 h-4 ml-2" />
                  تقديم طلب جديد
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
