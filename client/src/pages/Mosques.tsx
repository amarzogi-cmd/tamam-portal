import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
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

const statusLabels: Record<string, string> = {
  new: "جديد",
  existing: "قائم",
  under_construction: "تحت الإنشاء",
};

const ownershipLabels: Record<string, string> = {
  government: "حكومي",
  endowment: "وقف",
  private: "أهلي",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  existing: "bg-green-100 text-green-800",
  under_construction: "bg-yellow-100 text-yellow-800",
};

export default function Mosques() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const { data: mosquesData, isLoading } = trpc.mosques.search.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter as "new" | "existing" | "under_construction" : undefined,
    city: cityFilter !== "all" ? cityFilter : undefined,
  });
  const mosques = mosquesData?.mosques || [];

  const { data: stats } = trpc.mosques.getStats.useQuery();

  // استخراج المدن الفريدة
  const cities = Array.from(new Set(mosques.map((m: { city: string }) => m.city).filter(Boolean))) as string[];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان والإجراءات */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">المساجد</h1>
            <p className="text-muted-foreground">إدارة المساجد المسجلة في النظام</p>
          </div>
          <Link href="/mosques/new">
            <Button className="gradient-primary text-white">
              <Plus className="w-4 h-4 ml-2" />
              إضافة مسجد
            </Button>
          </Link>
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المساجد</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats?.total || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مساجد جديدة</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats?.byStatus?.new || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مساجد قائمة</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats?.byStatus?.existing || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">تحت الإنشاء</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats?.byStatus?.under_construction || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-yellow-600" />
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
                  placeholder="البحث عن مسجد..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="حالة المسجد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="new">جديد</SelectItem>
                  <SelectItem value="existing">قائم</SelectItem>
                  <SelectItem value="under_construction">تحت الإنشاء</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="المدينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدن</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* جدول المساجد */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground mt-4">جاري التحميل...</p>
              </div>
            ) : mosques.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم المسجد</TableHead>
                      <TableHead className="text-right">المدينة</TableHead>
                      <TableHead className="text-right">الحي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الملكية</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mosques.map((mosque: any) => (
                      <TableRow key={mosque.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{mosque.name}</p>
                              <p className="text-sm text-muted-foreground">{mosque.mosqueNumber}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{mosque.city}</TableCell>
                        <TableCell>{mosque.district || "-"}</TableCell>
                        <TableCell>
                          <span className={`badge ${statusColors[mosque.status]}`}>
                            {statusLabels[mosque.status]}
                          </span>
                        </TableCell>
                        <TableCell>{ownershipLabels[mosque.ownership] || mosque.ownership}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/mosques/${mosque.id}`}>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Eye className="w-4 h-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/mosques/${mosque.id}/edit`}>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Edit className="w-4 h-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem className="cursor-pointer text-destructive">
                                <Trash2 className="w-4 h-4 ml-2" />
                                حذف
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
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد مساجد مسجلة</p>
                <Link href="/mosques/new">
                  <Button className="mt-4 gradient-primary text-white">
                    إضافة مسجد جديد
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
