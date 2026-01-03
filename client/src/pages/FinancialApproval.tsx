import { useState } from "react";
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
  CheckSquare,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Building2,
  FileText,
  Calculator,
  Receipt,
  Percent,
  DollarSign,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

// نسبة الإشراف الافتراضية
const DEFAULT_SUPERVISION_RATE = 10;

export default function FinancialApproval() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [supervisionRate, setSupervisionRate] = useState(DEFAULT_SUPERVISION_RATE.toString());
  const [approvalNotes, setApprovalNotes] = useState("");

  // جلب الطلبات في مرحلة التقييم المالي
  const { data: requests } = trpc.requests.search.useQuery({
    currentStage: "financial_eval",
  });

  // جلب جدول الكميات للطلب
  const { data: boqData, isLoading: boqLoading } = trpc.projects.getBOQ.useQuery(
    { requestId: parseInt(selectedRequestId) || 0 },
    { enabled: !!selectedRequestId }
  );

  // جلب عروض الأسعار للطلب
  const { data: quotationsData, isLoading: quotationsLoading, refetch } = trpc.projects.getQuotationsByRequest.useQuery(
    { requestId: parseInt(selectedRequestId) || 0 },
    { enabled: !!selectedRequestId }
  );

  // تحديث مرحلة الطلب
  const updateStageMutation = trpc.requests.updateStage.useMutation({
    onSuccess: () => {
      toast.success("تم اعتماد الطلب مالياً وتحويله لمرحلة التنفيذ");
      setShowApprovalDialog(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء اعتماد الطلب");
    },
  });

  // حساب التكاليف
  const boqTotal = boqData?.total || 0;
  const acceptedQuotation = quotationsData?.quotations?.find((q: any) => q.status === "accepted");
  const quotationAmount = acceptedQuotation ? parseFloat(acceptedQuotation.totalAmount) : 0;
  const supervisionAmount = quotationAmount * (parseFloat(supervisionRate) / 100);
  const totalProjectCost = quotationAmount + supervisionAmount;

  const isLoading = boqLoading || quotationsLoading;

  const handleApprove = () => {
    if (!selectedRequestId) return;
    
    updateStageMutation.mutate({
      requestId: parseInt(selectedRequestId),
      newStage: "execution",
      notes: `الاعتماد المالي: ${totalProjectCost.toLocaleString("ar-SA")} ريال (شامل نسبة إشراف ${supervisionRate}%). ${approvalNotes}`,
    });
  };

  // التحقق من جاهزية الاعتماد
  const hasBoq = boqData?.items && boqData.items.length > 0;
  const hasQuotations = quotationsData?.quotations && quotationsData.quotations.length > 0;
  const hasAcceptedQuotation = !!acceptedQuotation;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">الاعتماد المالي</h1>
            <p className="text-muted-foreground">مراجعة واعتماد التكلفة النهائية للمشاريع</p>
          </div>
        </div>

        {/* اختيار الطلب */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              اختيار الطلب
            </CardTitle>
            <CardDescription>اختر الطلب لمراجعة واعتماد التكلفة النهائية</CardDescription>
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
            </div>
          </CardContent>
        </Card>

        {/* ملخص التكلفة */}
        {selectedRequestId && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* التحقق من المتطلبات */}
                {!hasBoq && (
                  <Card className="border-red-500">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 text-red-600">
                        <ClipboardList className="h-8 w-8" />
                        <div>
                          <p className="font-medium">لا يوجد جدول كميات</p>
                          <p className="text-sm">يجب إعداد جدول الكميات أولاً قبل الاعتماد المالي</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => navigate(`/projects/boq?requestId=${selectedRequestId}`)}
                          >
                            إعداد جدول الكميات
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {hasBoq && !hasQuotations && (
                  <Card className="border-yellow-500">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 text-yellow-600">
                        <Receipt className="h-8 w-8" />
                        <div>
                          <p className="font-medium">لا توجد عروض أسعار</p>
                          <p className="text-sm">يجب إضافة عروض أسعار من الموردين قبل الاعتماد المالي</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => navigate("/quotations")}
                          >
                            إضافة عروض أسعار
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  {/* جدول الكميات */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        جدول الكميات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hasBoq ? (
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>البند</TableHead>
                                <TableHead>الكمية</TableHead>
                                <TableHead>الإجمالي</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {boqData.items.slice(0, 5).map((item: any) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.itemName}</TableCell>
                                  <TableCell>{parseFloat(item.quantity).toLocaleString("ar-SA")}</TableCell>
                                  <TableCell>{item.totalPrice ? parseFloat(item.totalPrice).toLocaleString("ar-SA") : "-"} ريال</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {boqData.items.length > 5 && (
                            <p className="text-sm text-muted-foreground text-center">
                              و {boqData.items.length - 5} بنود أخرى...
                            </p>
                          )}
                          <div className="flex justify-between items-center pt-4 border-t">
                            <span className="font-medium">إجمالي جدول الكميات:</span>
                            <span className="text-lg font-bold">{boqTotal.toLocaleString("ar-SA")} ريال</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">لا يوجد جدول كميات</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* عروض الأسعار */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        عروض الأسعار
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hasQuotations ? (
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>المورد</TableHead>
                                <TableHead>المبلغ</TableHead>
                                <TableHead>الحالة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {quotationsData.quotations.map((quotation: any) => (
                                <TableRow key={quotation.id} className={quotation.status === "accepted" ? "bg-green-50" : ""}>
                                  <TableCell>{quotation.supplierName || "غير محدد"}</TableCell>
                                  <TableCell>{parseFloat(quotation.totalAmount).toLocaleString("ar-SA")} ريال</TableCell>
                                  <TableCell>
                                    <Badge variant={quotation.status === "accepted" ? "default" : "outline"}>
                                      {quotation.status === "accepted" ? "معتمد" : quotation.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {acceptedQuotation && (
                            <div className="flex justify-between items-center pt-4 border-t">
                              <span className="font-medium">العرض المعتمد:</span>
                              <span className="text-lg font-bold text-green-600">{quotationAmount.toLocaleString("ar-SA")} ريال</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">لا توجد عروض أسعار</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* ملخص الاعتماد المالي */}
                {hasAcceptedQuotation && (
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-primary" />
                        ملخص الاعتماد المالي
                      </CardTitle>
                      <CardDescription>مراجعة التكلفة النهائية قبل الاعتماد</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* تفاصيل التكلفة */}
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <Receipt className="h-4 w-4" />
                              <span>تكلفة المورد</span>
                            </div>
                            <p className="text-2xl font-bold">{quotationAmount.toLocaleString("ar-SA")} ريال</p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <Percent className="h-4 w-4" />
                              <span>نسبة الإشراف ({supervisionRate}%)</span>
                            </div>
                            <p className="text-2xl font-bold">{supervisionAmount.toLocaleString("ar-SA")} ريال</p>
                          </div>
                          <div className="p-4 bg-primary/10 rounded-lg border border-primary">
                            <div className="flex items-center gap-2 text-primary mb-2">
                              <DollarSign className="h-4 w-4" />
                              <span>الإجمالي النهائي</span>
                            </div>
                            <p className="text-2xl font-bold text-primary">{totalProjectCost.toLocaleString("ar-SA")} ريال</p>
                          </div>
                        </div>

                        {/* نسبة الإشراف */}
                        <div className="flex items-center gap-4">
                          <Label>نسبة الإشراف (%)</Label>
                          <Input
                            type="number"
                            value={supervisionRate}
                            onChange={(e) => setSupervisionRate(e.target.value)}
                            className="w-24"
                            min="0"
                            max="100"
                          />
                        </div>

                        {/* زر الاعتماد */}
                        <div className="flex justify-end gap-4">
                          <Button variant="outline" onClick={() => navigate("/requests/" + selectedRequestId)}>
                            <Eye className="h-4 w-4 ml-2" />
                            عرض تفاصيل الطلب
                          </Button>
                          <Button onClick={() => setShowApprovalDialog(true)}>
                            <CheckCircle2 className="h-4 w-4 ml-2" />
                            اعتماد وتحويل للتنفيذ
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* رسالة عدم وجود عرض معتمد */}
                {!hasAcceptedQuotation && hasQuotations && (
                  <Card className="border-yellow-500">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 text-yellow-600">
                        <Clock className="h-8 w-8" />
                        <div>
                          <p className="font-medium">لم يتم اعتماد عرض سعر بعد</p>
                          <p className="text-sm">يرجى اعتماد أحد عروض الأسعار من صفحة عروض الأسعار قبل الاعتماد المالي</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => navigate("/quotations")}
                          >
                            الذهاب لعروض الأسعار
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* Dialog تأكيد الاعتماد */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد الاعتماد المالي</DialogTitle>
              <DialogDescription>
                سيتم اعتماد الطلب مالياً بمبلغ إجمالي {totalProjectCost.toLocaleString("ar-SA")} ريال وتحويله لمرحلة التنفيذ
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>تكلفة المورد:</span>
                  <span className="font-medium">{quotationAmount.toLocaleString("ar-SA")} ريال</span>
                  <span>نسبة الإشراف ({supervisionRate}%):</span>
                  <span className="font-medium">{supervisionAmount.toLocaleString("ar-SA")} ريال</span>
                  <span className="font-bold">الإجمالي:</span>
                  <span className="font-bold text-primary">{totalProjectCost.toLocaleString("ar-SA")} ريال</span>
                </div>
              </div>
              <div>
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية على الاعتماد..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleApprove} disabled={updateStageMutation.isPending}>
                {updateStageMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                تأكيد الاعتماد
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
