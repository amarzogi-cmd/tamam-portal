import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FolderKanban, 
  Plus, 
  Search, 
  MoreVertical,
  Eye,
  Edit,
  Calendar,
  DollarSign,
  Building2,
} from "lucide-react";
import { Link } from "wouter";
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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  planning: "التخطيط",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  on_hold: "متوقف",
  cancelled: "ملغي",
};

const statusColors: Record<string, string> = {
  planning: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  on_hold: "bg-orange-100 text-orange-800",
  cancelled: "bg-red-100 text-red-800",
};

// بيانات تجريبية
const projectsData = [
  { id: 1, name: "بناء مسجد الرحمة", mosque: "مسجد الرحمة", program: "بنيان", status: "in_progress", budget: 500000, spent: 250000, progress: 50, startDate: "2024-01-15" },
  { id: 2, name: "ترميم مسجد النور", mosque: "مسجد النور", program: "عناية", status: "planning", budget: 150000, spent: 0, progress: 0, startDate: "2024-02-01" },
  { id: 3, name: "تجهيز مسجد الهدى", mosque: "مسجد الهدى", program: "إمداد", status: "completed", budget: 80000, spent: 78000, progress: 100, startDate: "2023-10-01" },
];

export default function Projects() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredProjects = projectsData.filter(p => {
    const matchesSearch = p.name.includes(search) || p.mosque.includes(search);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان والإجراءات */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة المشاريع</h1>
            <p className="text-muted-foreground">متابعة وإدارة مشاريع المساجد</p>
          </div>
          <Button className="gradient-primary text-white" onClick={() => toast.info("قريباً")}>
            <Plus className="w-4 h-4 ml-2" />
            مشروع جديد
          </Button>
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المشاريع</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{projectsData.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-primary" />
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
                    {projectsData.filter(p => p.status === "in_progress").length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-yellow-600" />
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
                    {projectsData.filter(p => p.status === "completed").length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الميزانية</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {(projectsData.reduce((sum, p) => sum + p.budget, 0) / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
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
                  placeholder="البحث عن مشروع..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* جدول المشاريع */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {filteredProjects.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المشروع</TableHead>
                      <TableHead className="text-right">المسجد</TableHead>
                      <TableHead className="text-right">البرنامج</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">التقدم</TableHead>
                      <TableHead className="text-right">الميزانية</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FolderKanban className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{project.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {project.startDate}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {project.mosque}
                          </span>
                        </TableCell>
                        <TableCell>{project.program}</TableCell>
                        <TableCell>
                          <span className={`badge ${statusColors[project.status]}`}>
                            {statusLabels[project.status]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={project.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{project.progress}%</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{project.budget.toLocaleString()} ر.س</p>
                            <p className="text-xs text-muted-foreground">
                              صرف: {project.spent.toLocaleString()} ر.س
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/projects/${project.id}`}>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Eye className="w-4 h-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => toast.info("قريباً")}>
                                <Edit className="w-4 h-4 ml-2" />
                                تعديل
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
                <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد مشاريع</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
