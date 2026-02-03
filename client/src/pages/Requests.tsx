import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { PROGRAM_LABELS, STAGE_LABELS, STATUS_LABELS } from "@shared/constants";
import { ProgramIcon } from "@/components/ProgramIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/PermissionGuard";

// تم استبدال programIcons بمكون ProgramIcon

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function Requests() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: requestsData, isLoading } = trpc.requests.search.useQuery({
    search: search || undefined,
    programType: programFilter !== "all" ? programFilter as any : undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
  });

  const requests = requestsData?.requests || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان والإجراءات */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة الطلبات</h1>
            <p className="text-muted-foreground">عرض ومتابعة جميع الطلبات</p>
          </div>
          <PermissionGuard permission="requests.create">
            <Link href="/service-request">
              <Button className="gradient-primary text-white">
                <Plus className="w-4 h-4 ml-2" />
                طلب جديد
              </Button>
            </Link>
          </PermissionGuard>
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{requestsData?.total || 0}</p>
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
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {requests.filter((r: any) => r.status === "pending").length}
                  </p>
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
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {requests.filter((r: any) => r.status === "in_progress").length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {requests.filter((r: any) => r.status === "completed").length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* فلاتر البحث */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="البحث عن طلب..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="البرنامج" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع البرامج</SelectItem>
                  {Object.entries(PROGRAM_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* جدول الطلبات */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground mt-4">جاري التحميل...</p>
              </div>
            ) : requests.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الطلب</TableHead>
                      <TableHead className="text-right">البرنامج</TableHead>
                      <TableHead className="text-right">المسجد</TableHead>
                      <TableHead className="text-right">المرحلة</TableHead>
                      <TableHead className="text-right">المسؤول الحالي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request: any) => (
                      <TableRow 
                        key={request.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/requests/${request.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ProgramIcon program={request.programType} size="md" />
                            <span className="font-medium">{request.requestNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>{PROGRAM_LABELS[request.programType]}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {request.mosqueName || "-"}
                          </span>
                        </TableCell>
                        <TableCell>{STAGE_LABELS[request.currentStage]}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-foreground">{request.currentResponsibleDepartment || "مكتب المشاريع"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`badge ${statusColors[request.status]}`}>
                            {STATUS_LABELS[request.status]}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/requests/${request.id}`}>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Eye className="w-4 h-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => toast.info("قريباً")}>
                                <Edit className="w-4 h-4 ml-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer text-green-600"
                                onClick={() => toast.info("قريباً")}
                              >
                                <CheckCircle className="w-4 h-4 ml-2" />
                                اعتماد
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer text-destructive"
                                onClick={() => toast.info("قريباً")}
                              >
                                <XCircle className="w-4 h-4 ml-2" />
                                رفض
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد طلبات</p>
                <Link href="/service-request">
                  <Button className="mt-4 gradient-primary text-white">
                    تقديم طلب جديد
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
