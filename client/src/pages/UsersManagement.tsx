import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Shield, UserCheck, UserX, Edit } from "lucide-react";


export default function UsersManagement() {

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("staff");

  // Fetch all users
  const { data: users, isLoading, refetch } = trpc.users.getAll.useQuery();

  // Toggle user status mutation
  const toggleStatus = trpc.users.toggleStatus.useMutation({
    onSuccess: () => {
      alert("تم تحديث حالة المستخدم بنجاح");
      refetch();
    },
    onError: (error: any) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  // Filter users
  const staffUsers = users?.filter(
    (u: any) => u.role !== "service_requester" && u.role !== "imam" && u.role !== "muezzin"
  ) || [];
  
  const serviceUsers = users?.filter(
    (u: any) => u.role === "service_requester" || u.role === "imam" || u.role === "muezzin"
  ) || [];

  const filteredStaff = staffUsers.filter((u: any) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredService = serviceUsers.filter((u: any) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      super_admin: { label: "مدير النظام", variant: "default" },
      admin: { label: "مدير", variant: "default" },
      director: { label: "مدير", variant: "default" },
      projects_office: { label: "مكتب المشاريع", variant: "secondary" },
      field_team: { label: "فريق ميداني", variant: "secondary" },
      financial: { label: "مالية", variant: "secondary" },
      technical_evaluator: { label: "مقيم فني", variant: "secondary" },
      procurement: { label: "مشتريات", variant: "secondary" },
      legal: { label: "قانوني", variant: "secondary" },
      project_manager: { label: "مدير مشروع", variant: "secondary" },
      service_requester: { label: "طالب خدمة", variant: "outline" },
      imam: { label: "إمام", variant: "outline" },
      muezzin: { label: "مؤذن", variant: "outline" },
    };
    const roleInfo = roleMap[role] || { label: role, variant: "outline" as const };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "نشط", variant: "default" },
      pending: { label: "قيد المراجعة", variant: "secondary" },
      suspended: { label: "معطل", variant: "destructive" },
      blocked: { label: "محظور", variant: "destructive" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleToggleStatus = (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    toggleStatus.mutate({ userId, status: newStatus });
  };

  const UserTable = ({ users: tableUsers }: { users: typeof staffUsers }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>الاسم</TableHead>
          <TableHead>البريد الإلكتروني</TableHead>
          <TableHead>الدور</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>تاريخ التسجيل</TableHead>
          <TableHead className="text-left">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableUsers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              لا يوجد مستخدمين
            </TableCell>
          </TableRow>
        ) : (
          tableUsers.map((user: any) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>{getStatusBadge(user.status)}</TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleDateString("ar-SA")}
              </TableCell>
              <TableCell className="text-left">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/users/${user.id}/permissions`}>
                        <Shield className="ml-2 h-4 w-4" />
                        إدارة الصلاحيات
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/users/${user.id}/edit`}>
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل البيانات
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(user.id, user.status)}
                    >
                      {user.status === "active" ? (
                        <>
                          <UserX className="ml-2 h-4 w-4" />
                          تعطيل الحساب
                        </>
                      ) : (
                        <>
                          <UserCheck className="ml-2 h-4 w-4" />
                          تفعيل الحساب
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">
          إدارة حسابات المستخدمين وصلاحياتهم
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="text-2xl font-bold">{users?.length || 0}</div>
          <div className="text-sm text-muted-foreground">إجمالي المستخدمين</div>
        </Card>
        <Card className="p-6">
          <div className="text-2xl font-bold">{staffUsers.length}</div>
          <div className="text-sm text-muted-foreground">الموظفين</div>
        </Card>
        <Card className="p-6">
          <div className="text-2xl font-bold">{serviceUsers.length}</div>
          <div className="text-sm text-muted-foreground">طالبي الخدمة</div>
        </Card>
        <Card className="p-6">
          <div className="text-2xl font-bold">
            {users?.filter((u: any) => u.status === "active").length || 0}
          </div>
          <div className="text-sm text-muted-foreground">الحسابات النشطة</div>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="ابحث عن مستخدم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="staff">
            الموظفين ({staffUsers.length})
          </TabsTrigger>
          <TabsTrigger value="service">
            طالبي الخدمة ({serviceUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <Card>
            <UserTable users={filteredStaff} />
          </Card>
        </TabsContent>

        <TabsContent value="service">
          <Card>
            <UserTable users={filteredService} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
