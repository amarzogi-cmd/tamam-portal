import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Receipt,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Building2,
  Send,
  FileText,
  Calendar,
  ClipboardList,
} from "lucide-react";

// حالات عروض الأسعار
const QUOTATION_STATUS = {
  pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  accepted: { label: "معتمد", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-800", icon: XCircle },
  expired: { label: "منتهي", color: "bg-gray-100 text-gray-800", icon: Clock },
};

export default function Quotations() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  
  // حالة نموذج إضافة عرض سعر
  const [formData, setFormData] = useState({
    quotationNumber: "",
    totalAmount: "",
    validUntil: "",
    notes: "",
  });

  // جلب الطلبات في مرحلة التقييم المالي
  const { data: requests } = trpc.requests.search.useQuery({
    currentStage: "financial_eval",
  });

  // جلب الموردين المعتمدين
  const { data: suppliers } = trpc.suppliers.getApproved.useQuery({});

  // جلب عروض الأسعار للطلب المحدد
  const { data: quotationsData, isLoading: quotationsLoading, refetch: refetchQuotations } = trpc.projects.getQuotationsByRequest.useQuery(
    { requestId: parseInt(selectedRequestId) || 0 },
    { enabled: !!selectedRequestId }
  );

  // جلب جدول الكميات للطلب المحدد
  const { data: boqData, isLoading: boqLoading } = trpc.projects.getBOQ.useQuery(
    { requestId: parseInt(selectedRequestId) || 0 },
    { enabled: !!selectedRequestId }
  );

  // إضافة عرض سعر
  const addQuotationMutation = trpc.projects.createQuotation.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة عرض السعر بنجاح");
      setShowAddDialog(false);
      resetForm();
      refetchQuotations();
    },
    onError: (error: any) => {
      // تنظيف رسالة الخطأ من البيانات الطويلة
      const errorMessage = error.message?.substring(0, 200) || "حدث خطأ أثناء إضافة عرض السعر";
      toast.error(errorMessage);
    },
  });

  // اعتماد عرض سعر
  const approveQuotationMutation = trpc.projects.updateQuotationStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة عرض السعر بنجاح");
      refetchQuotations();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث حالة عرض السعر");
    },
  });

  const resetForm = () => {
    setFormData({
      quotationNumber: "",
      totalAmount: "",
      validUntil: "",
      notes: "",
    });
    setSelectedSupplierId("");
  };

  const handleAddQuotation = () => {
    if (!selectedRequestId) {
      toast.error("يرجى اختيار الطلب أولاً");
      return;
    }
    if (!selectedSupplierId) {
      toast.error("يرجى اختيار المورد");
      return;
    }
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      toast.error("يرجى إدخال المبلغ الإجمالي");
      return;
    }

    addQuotationMutation.mutate({
      requestId: parseInt(selectedRequestId),
      supplierId: parseInt(selectedSupplierId),
      totalAmount: parseFloat(formData.totalAmount),
      validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
      notes: formData.notes,
    });
  };

  const handleApproveQuotation = (id: number) => {
    approveQuotationMutation.mutate({ id, status: "accepted" });
  };

  const handleRejectQuotation = (id: number) => {
    approveQuotationMutation.mutate({ id, status: "rejected" });
  };

  // حساب إجمالي جدول الكميات
  const boqTotal = boqData?.items?.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.totalPrice) || 0);
  }, 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">عروض الأسعار</h1>
            <p className="text-muted-foreground">إدارة عروض الأسعار من الموردين</p>
          </div>
        </div>

        {/* اختيار الطلب */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              اختيار الطلب
            </CardTitle>
            <CardDescription>اختر الطلب لعرض أو إضافة عروض الأسعار</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>الطلب</Label>
                <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطلب..." />
                  </SelectTrigger>
                  <SelectContent>
                    {requests?.requests?.map((request: any) => (
                      <SelectItem key={request.id} value={request.id.toString()}>
                        {request.requestNumber} - {request.mosqueName || "طلب جديد"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedRequestId && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة عرض سعر
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* عرض جدول الكميات للطلب المحدد */}
        {selectedRequestId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                جدول الكميات للطلب
              </CardTitle>
              <CardDescription>
                البنود المطلوب تسعيرها من الموردين
              </CardDescription>
            </CardHeader>
            <CardContent>
              {boqLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : boqData?.items && boqData.items.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>البند</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>الوحدة</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead className="text-center">سعر الوحدة</TableHead>
                        <TableHead className="text-center">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boqData.items.map((item: any, index: number) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {item.itemDescription || "-"}
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-center">{parseFloat(item.quantity).toLocaleString("ar-SA")}</TableCell>
                          <TableCell className="text-center">
                            {item.unitPrice ? `${parseFloat(item.unitPrice).toLocaleString("ar-SA")} ريال` : "-"}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {item.totalPrice ? `${parseFloat(item.totalPrice).toLocaleString("ar-SA")} ريال` : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end">
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold">
                      إجمالي جدول الكميات: {boqTotal.toLocaleString("ar-SA")} ريال
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا يوجد جدول كميات لهذا الطلب</p>
                  <p className="text-sm mt-2">يجب إعداد جدول الكميات أولاً قبل طلب عروض الأسعار</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate(`/projects/boq?requestId=${selectedRequestId}`)}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إعداد جدول الكميات
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* جدول عروض الأسعار */}
        {selectedRequestId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                عروض الأسعار المقدمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quotationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : quotationsData?.quotations && quotationsData.quotations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم العرض</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>صالح حتى</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotationsData.quotations.map((quotation: any) => {
                      const statusConfig = QUOTATION_STATUS[quotation.status as keyof typeof QUOTATION_STATUS] || QUOTATION_STATUS.pending;
                      return (
                        <TableRow key={quotation.id}>
                          <TableCell className="font-medium">{quotation.quotationNumber}</TableCell>
                          <TableCell>{quotation.supplierName || "غير محدد"}</TableCell>
                          <TableCell>{parseFloat(quotation.totalAmount).toLocaleString("ar-SA")} ريال</TableCell>
                          <TableCell>
                            {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString("ar-SA") : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {quotation.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600"
                                    onClick={() => handleApproveQuotation(quotation.id)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 ml-1" />
                                    اعتماد
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => handleRejectQuotation(quotation.id)}
                                  >
                                    <XCircle className="h-4 w-4 ml-1" />
                                    رفض
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد عروض أسعار لهذا الطلب</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة أول عرض سعر
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog إضافة عرض سعر */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة عرض سعر</DialogTitle>
              <DialogDescription>أدخل تفاصيل عرض السعر من المورد</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>المورد *</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المورد..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>رقم العرض (اختياري)</Label>
                <Input
                  value={formData.quotationNumber}
                  onChange={(e) => setFormData({ ...formData, quotationNumber: e.target.value })}
                  placeholder="سيتم توليده تلقائياً إذا تُرك فارغاً"
                />
              </div>
              <div>
                <Label>المبلغ الإجمالي (ريال) *</Label>
                <Input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>صالح حتى</Label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
              <div>
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddQuotation} disabled={addQuotationMutation.isPending}>
                {addQuotationMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
