import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertCircle,
} from "lucide-react";

import { Handshake } from "lucide-react";

// حالات عروض الأسعار
const QUOTATION_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  negotiating: { label: "قيد التفاوض", color: "bg-blue-100 text-blue-800", icon: Handshake },
  accepted: { label: "معتمد", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-800", icon: XCircle },
  expired: { label: "منتهي", color: "bg-gray-100 text-gray-800", icon: Clock },
};

// نوع بند التسعير
interface QuotationItem {
  boqItemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  totalPrice: number;
}

export default function Quotations() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [includeUnapproved, setIncludeUnapproved] = useState(true);
  
  // حالة نافذة الاعتماد المتقدمة
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedQuotationForApproval, setSelectedQuotationForApproval] = useState<any>(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  
  // حالة نافذة التفاوض
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false);
  const [selectedQuotationForNegotiation, setSelectedQuotationForNegotiation] = useState<any>(null);
  const [negotiatedAmount, setNegotiatedAmount] = useState("");
  const [negotiationNotes, setNegotiationNotes] = useState("");
  
  // حالة نموذج إضافة عرض سعر
  const [formData, setFormData] = useState({
    quotationNumber: "",
    validUntil: "",
    notes: "",
  });

  // حالة تسعير البنود
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);

  // جلب الطلبات في مرحلة التقييم المالي
  const { data: requests } = trpc.requests.search.useQuery({
    currentStage: "financial_eval",
  });

  // جلب الموردين النشطين (مع خيار إظهار غير المعتمدين)
  const { data: suppliers } = trpc.suppliers.getActiveSuppliers.useQuery({
    includeUnapproved: includeUnapproved,
  });

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

  // تهيئة بنود التسعير عند فتح نافذة الإضافة
  useEffect(() => {
    if (showAddDialog && boqData?.items) {
      setQuotationItems(
        boqData.items.map((item: any) => ({
          boqItemId: item.id,
          itemName: item.itemName,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unitPrice: "",
          totalPrice: 0,
        }))
      );
    }
  }, [showAddDialog, boqData]);

  // إضافة عرض سعر
  const addQuotationMutation = trpc.projects.createQuotation.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة عرض السعر بنجاح");
      setShowAddDialog(false);
      resetForm();
      refetchQuotations();
    },
    onError: (error: any) => {
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

  // بدء التفاوض
  const startNegotiationMutation = trpc.projects.startNegotiation.useMutation({
    onSuccess: () => {
      toast.success("تم بدء التفاوض بنجاح");
      refetchQuotations();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء بدء التفاوض");
    },
  });

  // حفظ نتيجة التفاوض
  const saveNegotiationMutation = trpc.projects.saveNegotiationResult.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ نتيجة التفاوض بنجاح");
      setShowNegotiationDialog(false);
      setSelectedQuotationForNegotiation(null);
      setNegotiatedAmount("");
      setNegotiationNotes("");
      refetchQuotations();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء حفظ نتيجة التفاوض");
    },
  });

  // اعتماد بعد التفاوض
  const approveAfterNegotiationMutation = trpc.projects.approveQuotationAfterNegotiation.useMutation({
    onSuccess: (data) => {
      toast.success(`تم اعتماد العرض بمبلغ ${data.approvedAmount?.toLocaleString()} ريال`);
      refetchQuotations();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء اعتماد العرض");
    },
  });

  const resetForm = () => {
    setFormData({
      quotationNumber: "",
      validUntil: "",
      notes: "",
    });
    setSelectedSupplierId("");
    setQuotationItems([]);
  };

  // تحديث سعر بند
  const updateItemPrice = (index: number, unitPrice: string) => {
    setQuotationItems((prev) => {
      const updated = [...prev];
      const price = parseFloat(unitPrice) || 0;
      updated[index] = {
        ...updated[index],
        unitPrice,
        totalPrice: price * updated[index].quantity,
      };
      return updated;
    });
  };

  // حساب الإجمالي
  const totalAmount = useMemo(() => {
    return quotationItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [quotationItems]);

  const handleAddQuotation = () => {
    if (!selectedRequestId) {
      toast.error("يرجى اختيار الطلب أولاً");
      return;
    }
    if (!selectedSupplierId) {
      toast.error("يرجى اختيار المورد");
      return;
    }
    
    // التحقق من تسعير جميع البنود
    const unpriced = quotationItems.filter((item) => !item.unitPrice || parseFloat(item.unitPrice) <= 0);
    if (unpriced.length > 0) {
      toast.error(`يرجى تسعير جميع البنود (${unpriced.length} بند غير مسعر)`);
      return;
    }

    if (totalAmount <= 0) {
      toast.error("يرجى إدخال أسعار صحيحة للبنود");
      return;
    }

    addQuotationMutation.mutate({
      requestId: parseInt(selectedRequestId),
      supplierId: parseInt(selectedSupplierId),
      totalAmount: totalAmount,
      validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
      notes: formData.notes,
      items: quotationItems.map((item) => ({
        boqItemId: item.boqItemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: item.totalPrice,
      })),
    });
  };

  // فتح نافذة الاعتماد المتقدمة
  const openApproveDialog = (quotation: any) => {
    setSelectedQuotationForApproval(quotation);
    setApprovedAmount(quotation.totalAmount?.toString() || "");
    setApprovalNotes("");
    setShowApproveDialog(true);
  };

  // تنفيذ الاعتماد مع المبلغ المعدل والمبرر
  const handleConfirmApproval = () => {
    if (!selectedQuotationForApproval) return;
    approveQuotationMutation.mutate({
      id: selectedQuotationForApproval.id,
      status: "accepted" as const,
      approvedAmount: approvedAmount ? parseFloat(approvedAmount) : undefined,
      notes: approvalNotes || undefined,
    });
    setShowApproveDialog(false);
    setSelectedQuotationForApproval(null);
    setApprovedAmount("");
    setApprovalNotes("");
  };

  const handleRejectQuotation = (id: number) => {
    approveQuotationMutation.mutate({ id, status: "rejected" });
  };

  // إلغاء اعتماد عرض السعر (إعادته لحالة قيد المراجعة)
  const handleCancelApproval = (id: number) => {
    approveQuotationMutation.mutate({ id, status: "pending" });
  };

  // إعادة عرض مرفوض للمراجعة
  const handleReactivateQuotation = (id: number) => {
    approveQuotationMutation.mutate({ id, status: "pending" });
  };

  // بدء التفاوض على عرض
  const handleStartNegotiation = (quotation: any) => {
    startNegotiationMutation.mutate({ id: quotation.id });
  };

  // فتح نافذة التفاوض
  const openNegotiationDialog = (quotation: any) => {
    setSelectedQuotationForNegotiation(quotation);
    setNegotiatedAmount(quotation.negotiatedAmount?.toString() || quotation.totalAmount?.toString() || "");
    setNegotiationNotes(quotation.negotiationNotes || "");
    setShowNegotiationDialog(true);
  };

  // حفظ نتيجة التفاوض
  const handleSaveNegotiation = () => {
    if (!selectedQuotationForNegotiation) return;
    if (!negotiatedAmount || parseFloat(negotiatedAmount) <= 0) {
      toast.error("يرجى إدخال المبلغ بعد التفاوض");
      return;
    }
    saveNegotiationMutation.mutate({
      id: selectedQuotationForNegotiation.id,
      negotiatedAmount: parseFloat(negotiatedAmount),
      negotiationNotes: negotiationNotes || undefined,
    });
  };

  // اعتماد العرض بعد التفاوض
  const handleApproveAfterNegotiation = (quotation: any, useNegotiatedAmount: boolean = true) => {
    approveAfterNegotiationMutation.mutate({
      id: quotation.id,
      useNegotiatedAmount,
      notes: `تم الاعتماد بعد التفاوض`,
    });
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

        {/* قائمة الطلبات في مرحلة التقييم المالي */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              الطلبات في مرحلة التقييم المالي
            </CardTitle>
            <CardDescription>اختر الطلب لعرض جدول الكميات وعروض الأسعار</CardDescription>
          </CardHeader>
          <CardContent>
            {requests?.requests && requests.requests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>المسجد</TableHead>
                    <TableHead>البرنامج</TableHead>
                    <TableHead>تاريخ التقديم</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.requests.map((request: any) => (
                    <TableRow 
                      key={request.id} 
                      className={selectedRequestId === request.id.toString() ? "bg-primary/10" : "cursor-pointer hover:bg-muted/50"}
                      onClick={() => setSelectedRequestId(request.id.toString())}
                    >
                      <TableCell className="font-mono text-sm">{request.requestNumber}</TableCell>
                      <TableCell className="font-medium">{request.mosqueName || "غير محدد"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {request.programType === 'construction' ? 'بناء' :
                           request.programType === 'renovation' ? 'ترميم' :
                           request.programType === 'expansion' ? 'توسعة' :
                           request.programType === 'maintenance' ? 'صيانة' : request.programType}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(request.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>
                        <Button
                          variant={selectedRequestId === request.id.toString() ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequestId(request.id.toString());
                          }}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          {selectedRequestId === request.id.toString() ? "محدد" : "عرض"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد طلبات في مرحلة التقييم المالي</p>
              </div>
            )}
            {selectedRequestId && (
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة عرض سعر للطلب المحدد
                </Button>
              </div>
            )}
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
                      <TableHead>المبلغ الأصلي</TableHead>
                      <TableHead>بعد التفاوض</TableHead>
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
                            {quotation.negotiatedAmount ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-green-600">
                                  {parseFloat(quotation.negotiatedAmount).toLocaleString("ar-SA")} ريال
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  وفر {((1 - parseFloat(quotation.negotiatedAmount) / parseFloat(quotation.totalAmount)) * 100).toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
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
                              {/* حالة قيد المراجعة */}
                              {quotation.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600"
                                    onClick={() => handleStartNegotiation(quotation)}
                                  >
                                    <Handshake className="h-4 w-4 ml-1" />
                                    تفاوض
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600"
                                    onClick={() => openApproveDialog(quotation)}
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
                              {/* حالة قيد التفاوض */}
                              {quotation.status === "negotiating" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600"
                                    onClick={() => openNegotiationDialog(quotation)}
                                  >
                                    <Handshake className="h-4 w-4 ml-1" />
                                    تسجيل النتيجة
                                  </Button>
                                  {quotation.negotiatedAmount && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-600"
                                      onClick={() => handleApproveAfterNegotiation(quotation, true)}
                                    >
                                      <CheckCircle2 className="h-4 w-4 ml-1" />
                                      اعتماد
                                    </Button>
                                  )}
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
                              {/* حالة معتمد */}
                              {quotation.status === "accepted" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-orange-600"
                                  onClick={() => handleCancelApproval(quotation.id)}
                                >
                                  <XCircle className="h-4 w-4 ml-1" />
                                  إلغاء الاعتماد
                                </Button>
                              )}
                              {/* حالة مرفوض */}
                              {quotation.status === "rejected" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600"
                                  onClick={() => handleReactivateQuotation(quotation.id)}
                                >
                                  <Clock className="h-4 w-4 ml-1" />
                                  إعادة للمراجعة
                                </Button>
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

        {/* Dialog إضافة عرض سعر مع تسعير البنود */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة عرض سعر</DialogTitle>
              <DialogDescription>أدخل تفاصيل عرض السعر من المورد مع تسعير كل بند</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* معلومات المورد */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>المورد *</Label>
                  <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المورد..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          <div className="flex items-center gap-2">
                            {supplier.name}
                            {supplier.approvalStatus !== "approved" && (
                              <Badge variant="outline" className="text-xs">غير معتمد</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="includeUnapproved"
                      checked={includeUnapproved}
                      onCheckedChange={(checked) => setIncludeUnapproved(checked as boolean)}
                    />
                    <label htmlFor="includeUnapproved" className="text-sm text-muted-foreground">
                      إظهار الموردين غير المعتمدين
                    </label>
                  </div>
                </div>
                <div>
                  <Label>صالح حتى</Label>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
              </div>

              {/* جدول تسعير البنود */}
              {quotationItems.length > 0 ? (
                <div>
                  <Label className="mb-2 block">تسعير البنود *</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>البند</TableHead>
                          <TableHead>الوحدة</TableHead>
                          <TableHead className="text-center w-24">الكمية</TableHead>
                          <TableHead className="text-center w-32">سعر الوحدة (ريال)</TableHead>
                          <TableHead className="text-center w-32">الإجمالي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotationItems.map((item, index) => (
                          <TableRow key={item.boqItemId}>
                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-center">{item.quantity.toLocaleString("ar-SA")}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItemPrice(index, e.target.value)}
                                placeholder="0"
                                className="text-center"
                                min="0"
                                step="0.01"
                              />
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {item.totalPrice > 0 ? `${item.totalPrice.toLocaleString("ar-SA")} ريال` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end mt-4">
                    <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg">
                      <span className="text-sm">الإجمالي الكلي:</span>
                      <span className="text-xl font-bold mr-2">{totalAmount.toLocaleString("ar-SA")} ريال</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد بنود في جدول الكميات</p>
                  <p className="text-sm mt-2">يجب إعداد جدول الكميات أولاً</p>
                </div>
              )}

              {/* ملاحظات */}
              <div>
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أي ملاحظات إضافية على عرض السعر..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleAddQuotation} 
                disabled={addQuotationMutation.isPending || quotationItems.length === 0}
              >
                {addQuotationMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                إضافة عرض السعر
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog التفاوض */}
        <Dialog open={showNegotiationDialog} onOpenChange={setShowNegotiationDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-blue-600" />
                التفاوض على عرض السعر
              </DialogTitle>
              <DialogDescription>
                أدخل المبلغ المتفق عليه بعد التفاوض مع المورد
              </DialogDescription>
            </DialogHeader>
            {selectedQuotationForNegotiation && (
              <div className="space-y-4">
                {/* معلومات العرض */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم العرض:</span>
                    <span className="font-medium">{selectedQuotationForNegotiation.quotationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المورد:</span>
                    <span className="font-medium">{selectedQuotationForNegotiation.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ الأصلي:</span>
                    <span className="font-bold text-primary">
                      {parseFloat(selectedQuotationForNegotiation.totalAmount || 0).toLocaleString("ar-SA")} ريال
                    </span>
                  </div>
                </div>

                {/* المبلغ بعد التفاوض */}
                <div>
                  <Label>المبلغ بعد التفاوض (ريال) *</Label>
                  <Input
                    type="number"
                    value={negotiatedAmount}
                    onChange={(e) => setNegotiatedAmount(e.target.value)}
                    placeholder="أدخل المبلغ بعد التفاوض..."
                    className="mt-1"
                  />
                  {negotiatedAmount && parseFloat(negotiatedAmount) < parseFloat(selectedQuotationForNegotiation.totalAmount || 0) && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-800 text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        وفر: {(parseFloat(selectedQuotationForNegotiation.totalAmount || 0) - parseFloat(negotiatedAmount)).toLocaleString("ar-SA")} ريال
                        ({((1 - parseFloat(negotiatedAmount) / parseFloat(selectedQuotationForNegotiation.totalAmount || 1)) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* ملاحظات التفاوض */}
                <div>
                  <Label>ملاحظات التفاوض</Label>
                  <Textarea
                    value={negotiationNotes}
                    onChange={(e) => setNegotiationNotes(e.target.value)}
                    placeholder="مثال: تم الاتفاق على تخفيض السعر مقابل..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNegotiationDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSaveNegotiation}
                disabled={!negotiatedAmount || saveNegotiationMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saveNegotiationMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                حفظ نتيجة التفاوض
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog اعتماد عرض السعر المتقدمة */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>اعتماد عرض السعر</DialogTitle>
              <DialogDescription>
                يمكنك تعديل المبلغ المعتمد بعد التفاوض مع المورد
              </DialogDescription>
            </DialogHeader>
            {selectedQuotationForApproval && (
              <div className="space-y-4">
                {/* معلومات العرض */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم العرض:</span>
                    <span className="font-medium">{selectedQuotationForApproval.quotationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المورد:</span>
                    <span className="font-medium">{selectedQuotationForApproval.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ الأصلي:</span>
                    <span className="font-bold text-primary">
                      {parseFloat(selectedQuotationForApproval.totalAmount || 0).toLocaleString("ar-SA")} ريال
                    </span>
                  </div>
                </div>

                {/* المبلغ المعتمد */}
                <div>
                  <Label>المبلغ المعتمد (ريال) *</Label>
                  <Input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    placeholder="أدخل المبلغ المعتمد..."
                    className="mt-1"
                  />
                  {approvedAmount && parseFloat(approvedAmount) !== parseFloat(selectedQuotationForApproval.totalAmount || 0) && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>سيتم اعتماد مبلغ مختلف عن العرض الأصلي</span>
                    </div>
                  )}
                </div>

                {/* المبرر/الملاحظات */}
                <div>
                  <Label>مبرر الاعتماد / ملاحظات</Label>
                  <Textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="مثال: تم التفاوض مع المورد للوصول إلى هذا المبلغ..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleConfirmApproval}
                disabled={!approvedAmount || approveQuotationMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveQuotationMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                اعتماد العرض
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
