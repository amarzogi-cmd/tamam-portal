import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, Calendar, FileText, ArrowRight } from "lucide-react";

export default function FieldVisitExecute() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    executionDate: "",
    executionTime: "",
    attendees: "",
    notes: "",
  });

  // جلب بيانات الطلب
  const { data: request, isLoading } = trpc.requests.getById.useQuery(
    { id: Number(requestId) },
    { enabled: !!requestId }
  );

  // تأكيد تنفيذ الزيارة
  const utils = trpc.useUtils();
  const executeMutation = trpc.fieldVisits.executeVisit.useMutation({
    onSuccess: () => {
      toast.success("تم تأكيد تنفيذ الزيارة الميدانية بنجاح");
      utils.requests.getById.invalidate({ id: Number(requestId) });
      setLocation(`/requests/${requestId}`);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تأكيد تنفيذ الزيارة");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.executionDate || !formData.executionTime) {
      toast.error("يرجى تحديد تاريخ ووقت التنفيذ الفعلي");
      return;
    }

    executeMutation.mutate({
      requestId: Number(requestId),
      executionDate: formData.executionDate,
      executionTime: formData.executionTime,
      attendees: formData.attendees,
      notes: formData.notes,
    });
  };

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
    <div className="container mx-auto py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => setLocation(`/requests/${requestId}`)}
        className="mb-6"
      >
        ← رجوع للطلب
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6" />
            تأكيد تنفيذ الزيارة الميدانية
          </CardTitle>
          <CardDescription>
            تسجيل تنفيذ الزيارة الميدانية للطلب {(request as any)?.requestNumber}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* تاريخ التنفيذ */}
            <div className="space-y-2">
              <Label htmlFor="executionDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                تاريخ التنفيذ الفعلي *
              </Label>
              <Input
                id="executionDate"
                type="date"
                value={formData.executionDate}
                onChange={(e) => setFormData({ ...formData, executionDate: e.target.value })}
                required
              />
            </div>

            {/* وقت التنفيذ */}
            <div className="space-y-2">
              <Label htmlFor="executionTime" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                وقت التنفيذ الفعلي *
              </Label>
              <Input
                id="executionTime"
                type="time"
                value={formData.executionTime}
                onChange={(e) => setFormData({ ...formData, executionTime: e.target.value })}
                required
              />
            </div>

            {/* الحضور */}
            <div className="space-y-2">
              <Label htmlFor="attendees" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                الحضور من الفريق
              </Label>
              <Input
                id="attendees"
                placeholder="أسماء الحاضرين (مفصولة بفاصلة)"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              />
            </div>

            {/* ملاحظات */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات التنفيذ</Label>
              <Textarea
                id="notes"
                placeholder="أي ملاحظات أو تفاصيل عن الزيارة الميدانية..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation(`/requests/${requestId}`)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={executeMutation.isPending}
              >
                {executeMutation.isPending ? (
                  <>جاري الحفظ...</>
                ) : (
                  <>
                    تأكيد التنفيذ
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
