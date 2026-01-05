import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  FileText,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "مسودة", variant: "secondary" },
  pending: { label: "قيد المراجعة", variant: "default" },
  approved: { label: "معتمد", variant: "outline" },
  rejected: { label: "مرفوض", variant: "destructive" },
  paid: { label: "مصروف", variant: "outline" },
};

const PAYMENT_TYPE_MAP: Record<string, string> = {
  advance: "دفعة مقدمة",
  progress: "دفعة مرحلية",
  final: "دفعة نهائية",
  retention: "ضمان حسن التنفيذ",
};

export default function DisbursementRequests() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("requests");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // نوافذ الحوار
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  
  // بيانات طلب صرف جديد
  const [newRequest, setNewRequest] = useState({
    projectId: 0,
    title: "",
    description: "",
    amount: "",
    paymentType: "progress" as "advance" | "progress" | "final" | "retention",
    completionPercentage: "",
  });
  
  // بيانات أمر صرف جديد
  const [newOrder, setNewOrder] = useState({
    beneficiaryName: "",
    beneficiaryBank: "",
    beneficiaryIban: "",
    paymentMethod: "bank_transfer" as "bank_transfer" | "check" | "cash",
  });

  // استعلامات البيانات
  const { data: requestsData, refetch: refetchRequests } = trpc.disbursements.listRequests.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
  });
  
  const { data: ordersData, refetch: refetchOrders } = trpc.disbursements.listOrders.useQuery({});
  
  const { data: statsData } = trpc.disbursements.getStats.useQuery();
  
  const { data: projectsData } = trpc.projects.getAll.useQuery({});

  // Mutations
  const createRequestMutation = trpc.disbursements.createRequest.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء طلب الصرف بنجاح");
      setShowCreateDialog(false);
      setNewRequest({
        projectId: 0,
        title: "",
        description: "",
        amount: "",
        paymentType: "progress",
        completionPercentage: "",
      });
      refetchRequests();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء طلب الصرف");
    },
  });

  const approveRequestMutation = trpc.disbursements.approveRequest.useMutation({
    onSuccess: () => {
      toast.success("تم اعتماد طلب الصرف بنجاح");
      setShowApproveDialog(false);
      setApprovalNotes("");
      refetchRequests();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء اعتماد طلب الصرف");
    },
  });

  const rejectRequestMutation = trpc.disbursements.rejectRequest.useMutation({
    onSuccess: () => {
      toast.success("تم رفض طلب الصرف");
      setShowRejectDialog(false);
      setRejectionReason("");
      refetchRequests();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء رفض طلب الصرف");
    },
  });

  const createOrderMutation = trpc.disbursements.createOrder.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء أمر الصرف بنجاح");
      setShowCreateOrderDialog(false);
      setNewOrder({
        beneficiaryName: "",
        beneficiaryBank: "",
        beneficiaryIban: "",
        paymentMethod: "bank_transfer",
      });
      refetchOrders();
      refetchRequests();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء أمر الصرف");
    },
  });

  const approveOrderMutation = trpc.disbursements.approveOrder.useMutation({
    onSuccess: () => {
      toast.success("تم اعتماد أمر الصرف بنجاح");
      refetchOrders();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء اعتماد أمر الصرف");
    },
  });

  const executeOrderMutation = trpc.disbursements.executeOrder.useMutation({
    onSuccess: () => {
      toast.success("تم تنفيذ أمر الصرف بنجاح");
      refetchOrders();
      refetchRequests();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تنفيذ أمر الصرف");
    },
  });

  // التحقق من الصلاحيات
  const canCreateRequest = ["super_admin", "system_admin", "projects_office", "project_manager"].includes(user?.role || "");
  const canApproveRequest = ["super_admin", "system_admin", "general_manager", "financial"].includes(user?.role || "");
  const canCreateOrder = ["super_admin", "system_admin", "financial"].includes(user?.role || "");
  const canApproveOrder = ["super_admin", "system_admin", "general_manager"].includes(user?.role || "");
  const canExecuteOrder = ["super_admin", "system_admin", "financial"].includes(user?.role || "");

  const handleCreateRequest = () => {
    if (!newRequest.projectId || !newRequest.title || !newRequest.amount) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createRequestMutation.mutate({
      projectId: newRequest.projectId,
      title: newRequest.title,
      description: newRequest.description,
      amount: parseFloat(newRequest.amount),
      paymentType: newRequest.paymentType,
      completionPercentage: newRequest.completionPercentage ? parseInt(newRequest.completionPercentage) : undefined,
    });
  };

  const handleCreateOrder = () => {
    if (!selectedRequest || !newOrder.beneficiaryName) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createOrderMutation.mutate({
      disbursementRequestId: selectedRequest.id,
      ...newOrder,
    });
  };

  const filteredRequests = requestsData?.requests?.filter((req) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        req.requestNumber?.toLowerCase().includes(search) ||
        req.title?.toLowerCase().includes(search) ||
        req.projectName?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان والإحصائيات */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">طلبات الصرف وأوامر الصرف</h1>
            <p className="text-muted-foreground">إدارة طلبات الصرف المالية للمشاريع</p>
          </div>
          {canCreateRequest && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="ml-2 h-4 w-4" />
              طلب صرف جديد
            </Button>
          )}
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلبات قيد المراجعة</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData?.pendingRequests || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلبات معتمدة</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData?.approvedRequests || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أوامر قيد الاعتماد</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData?.pendingOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المصروف</CardTitle>
              <Banknote className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Number(statsData?.totalPaid || 0).toLocaleString()} ريال
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التبويبات */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="requests">طلبات الصرف</TabsTrigger>
            <TabsTrigger value="orders">أوامر الصرف</TabsTrigger>
          </TabsList>

          {/* طلبات الصرف */}
          <TabsContent value="requests" className="space-y-4">
            {/* الفلاتر */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الطلب أو العنوان أو المشروع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="ml-2 h-4 w-4" />
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                  <SelectItem value="paid">مصروف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* جدول طلبات الصرف */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>العنوان</TableHead>
                      <TableHead>المشروع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>نوع الدفعة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          لا توجد طلبات صرف
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests?.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-mono">{request.requestNumber}</TableCell>
                          <TableCell>{request.title}</TableCell>
                          <TableCell>{request.projectName}</TableCell>
                          <TableCell>{Number(request.amount).toLocaleString()} ريال</TableCell>
                          <TableCell>{PAYMENT_TYPE_MAP[request.paymentType || "progress"]}</TableCell>
                          <TableCell>
                            <Badge variant={STATUS_MAP[request.status || "pending"]?.variant}>
                              {STATUS_MAP[request.status || "pending"]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.requestedAt
                              ? new Date(request.requestedAt).toLocaleDateString("ar-SA")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canApproveRequest && request.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setShowApproveDialog(true);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setShowRejectDialog(true);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {canCreateOrder && request.status === "approved" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowCreateOrderDialog(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* أوامر الصرف */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الأمر</TableHead>
                      <TableHead>طلب الصرف</TableHead>
                      <TableHead>المشروع</TableHead>
                      <TableHead>المستفيد</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>طريقة الدفع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersData?.orders?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          لا توجد أوامر صرف
                        </TableCell>
                      </TableRow>
                    ) : (
                      ordersData?.orders?.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono">{order.orderNumber}</TableCell>
                          <TableCell>{order.requestNumber}</TableCell>
                          <TableCell>{order.projectName}</TableCell>
                          <TableCell>{order.beneficiaryName}</TableCell>
                          <TableCell>{Number(order.amount).toLocaleString()} ريال</TableCell>
                          <TableCell>
                            {order.paymentMethod === "bank_transfer"
                              ? "تحويل بنكي"
                              : order.paymentMethod === "check"
                              ? "شيك"
                              : "نقدي"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === "executed"
                                  ? "outline"
                                  : order.status === "approved"
                                  ? "default"
                                  : order.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {order.status === "draft"
                                ? "مسودة"
                                : order.status === "pending"
                                ? "قيد الاعتماد"
                                : order.status === "approved"
                                ? "معتمد"
                                : order.status === "rejected"
                                ? "مرفوض"
                                : "منفذ"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {canApproveOrder && order.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => approveOrderMutation.mutate({ id: order.id })}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {canExecuteOrder && order.status === "approved" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600"
                                  onClick={() => executeOrderMutation.mutate({ id: order.id })}
                                >
                                  <Banknote className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* نافذة إنشاء طلب صرف */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>طلب صرف جديد</DialogTitle>
              <DialogDescription>أدخل بيانات طلب الصرف</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>المشروع *</Label>
                <Select
                  value={newRequest.projectId.toString()}
                  onValueChange={(v) => setNewRequest({ ...newRequest, projectId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectsData?.map((project: any) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>عنوان الطلب *</Label>
                <Input
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="مثال: دفعة مرحلية للأعمال الإنشائية"
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="تفاصيل إضافية عن طلب الصرف..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المبلغ (ريال) *</Label>
                  <Input
                    type="number"
                    value={newRequest.amount}
                    onChange={(e) => setNewRequest({ ...newRequest, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع الدفعة</Label>
                  <Select
                    value={newRequest.paymentType}
                    onValueChange={(v: any) => setNewRequest({ ...newRequest, paymentType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advance">دفعة مقدمة</SelectItem>
                      <SelectItem value="progress">دفعة مرحلية</SelectItem>
                      <SelectItem value="final">دفعة نهائية</SelectItem>
                      <SelectItem value="retention">ضمان حسن التنفيذ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>نسبة الإنجاز المرتبطة (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newRequest.completionPercentage}
                  onChange={(e) => setNewRequest({ ...newRequest, completionPercentage: e.target.value })}
                  placeholder="مثال: 30"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateRequest} disabled={createRequestMutation.isPending}>
                {createRequestMutation.isPending ? "جاري الإنشاء..." : "إنشاء الطلب"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* نافذة اعتماد طلب الصرف */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>اعتماد طلب الصرف</DialogTitle>
              <DialogDescription>
                هل تريد اعتماد طلب الصرف رقم {selectedRequest?.requestNumber}؟
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">{selectedRequest?.title}</p>
                <p className="text-sm text-muted-foreground">
                  المبلغ: {Number(selectedRequest?.amount || 0).toLocaleString()} ريال
                </p>
              </div>
              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="أي ملاحظات على الاعتماد..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                إلغاء
              </Button>
              <Button
                onClick={() =>
                  approveRequestMutation.mutate({
                    id: selectedRequest?.id,
                    notes: approvalNotes,
                  })
                }
                disabled={approveRequestMutation.isPending}
              >
                {approveRequestMutation.isPending ? "جاري الاعتماد..." : "اعتماد"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* نافذة رفض طلب الصرف */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>رفض طلب الصرف</DialogTitle>
              <DialogDescription>
                هل تريد رفض طلب الصرف رقم {selectedRequest?.requestNumber}؟
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>سبب الرفض *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="يرجى توضيح سبب رفض الطلب..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  rejectRequestMutation.mutate({
                    id: selectedRequest?.id,
                    reason: rejectionReason,
                  })
                }
                disabled={!rejectionReason || rejectRequestMutation.isPending}
              >
                {rejectRequestMutation.isPending ? "جاري الرفض..." : "رفض"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* نافذة إنشاء أمر صرف */}
        <Dialog open={showCreateOrderDialog} onOpenChange={setShowCreateOrderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء أمر صرف</DialogTitle>
              <DialogDescription>
                إنشاء أمر صرف لطلب رقم {selectedRequest?.requestNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">{selectedRequest?.title}</p>
                <p className="text-sm text-muted-foreground">
                  المبلغ: {Number(selectedRequest?.amount || 0).toLocaleString()} ريال
                </p>
              </div>
              <div className="space-y-2">
                <Label>اسم المستفيد *</Label>
                <Input
                  value={newOrder.beneficiaryName}
                  onChange={(e) => setNewOrder({ ...newOrder, beneficiaryName: e.target.value })}
                  placeholder="اسم المورد أو المقاول"
                />
              </div>
              <div className="space-y-2">
                <Label>البنك</Label>
                <Input
                  value={newOrder.beneficiaryBank}
                  onChange={(e) => setNewOrder({ ...newOrder, beneficiaryBank: e.target.value })}
                  placeholder="اسم البنك"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الآيبان</Label>
                <Input
                  value={newOrder.beneficiaryIban}
                  onChange={(e) => setNewOrder({ ...newOrder, beneficiaryIban: e.target.value })}
                  placeholder="SA..."
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select
                  value={newOrder.paymentMethod}
                  onValueChange={(v: any) => setNewOrder({ ...newOrder, paymentMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                    <SelectItem value="cash">نقدي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateOrderDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateOrder} disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? "جاري الإنشاء..." : "إنشاء أمر الصرف"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
