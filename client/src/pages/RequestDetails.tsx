import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowRight, 
  FileText, 
  Building2, 
  Calendar, 
  User,
  MessageSquare,
  Paperclip,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  ClipboardList,
  Zap,
  Eye,
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { PROGRAM_LABELS, STAGE_LABELS, STATUS_LABELS } from "@shared/constants";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Image, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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

const stageSteps = [
  { key: "submission", label: "تقديم الطلب" },
  { key: "initial_review", label: "الفرز الأولي" },
  { key: "field_visit", label: "الزيارة الميدانية" },
  { key: "technical_study", label: "الدراسة الفنية" },
  { key: "financial_approval", label: "الاعتماد المالي" },
  { key: "execution", label: "التنفيذ" },
  { key: "completion", label: "الإغلاق" },
];

export default function RequestDetails() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const requestId = parseInt(params.id || "0");
  const [comment, setComment] = useState("");
  const { user } = useAuth();

  const { data: request, isLoading } = trpc.requests.getById.useQuery({ id: requestId });
  const { data: attachments } = trpc.storage.getRequestAttachments.useQuery({ requestId });
  // history and comments are included in the request data

  const addCommentMutation = trpc.requests.addComment.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة التعليق");
      setComment("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">الطلب غير موجود</p>
          <Link href="/requests">
            <Button variant="outline" className="mt-4">العودة للطلبات</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const currentStageIndex = stageSteps.findIndex(s => s.key === request.currentStage);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان */}
        <div className="flex items-center gap-4">
          <Link href="/requests">
            <Button variant="ghost" size="icon">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{programIcons[request.programType] || "📋"}</span>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{request.requestNumber}</h1>
                <p className="text-muted-foreground">
                  {PROGRAM_LABELS[request.programType]} - {request.mosque?.name || "مسجد غير محدد"}
                </p>
              </div>
            </div>
          </div>
          <span className={`badge ${
            request.status === "completed" ? "bg-green-100 text-green-800" :
            request.status === "rejected" ? "bg-red-100 text-red-800" :
            request.status === "in_progress" ? "bg-blue-100 text-blue-800" :
            "bg-yellow-100 text-yellow-800"
          }`}>
            {STATUS_LABELS[request.status]}
          </span>
        </div>

        {/* شريط المراحل */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {stageSteps.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                return (
                  <div key={stage.key} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? "bg-green-500 text-white" :
                        isCurrent ? "bg-primary text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <span className={`text-xs mt-2 whitespace-nowrap ${
                        isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                      }`}>
                        {stage.label}
                      </span>
                    </div>
                    {index < stageSteps.length - 1 && (
                      <div className={`w-12 h-1 mx-2 ${
                        isCompleted ? "bg-green-500" : "bg-muted"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* التفاصيل الرئيسية */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>تفاصيل الطلب</CardTitle>
                <CardDescription>المعلومات الأساسية للطلب</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">البرنامج</p>
                    <p className="font-medium">{PROGRAM_LABELS[request.programType]}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">المرحلة الحالية</p>
                    <p className="font-medium">{STAGE_LABELS[request.currentStage]}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">الأولوية</p>
                    <p className="font-medium">{request.priority === "urgent" ? "عاجل" : request.priority === "medium" ? "متوسط" : "عادي"}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">تاريخ التقديم</p>
                    <p className="font-medium">{new Date(request.createdAt).toLocaleDateString("ar-SA")}</p>
                  </div>
                </div>
                
                

                {request.estimatedCost && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">التكلفة التقديرية</p>
                    <p className="font-bold text-lg">{Number(request.estimatedCost).toLocaleString()} ر.س</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* التبويبات */}
            <Tabs defaultValue="history" className="space-y-4">
              <TabsList>
                <TabsTrigger value="history">سجل الطلب</TabsTrigger>
                <TabsTrigger value="comments">التعليقات</TabsTrigger>
                <TabsTrigger value="attachments">المرفقات</TabsTrigger>
              </TabsList>

              <TabsContent value="history">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    {request.history && request.history.length > 0 ? (
                      <div className="space-y-4">
                        {request.history.map((item: any) => (
                          <div key={item.id} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{item.action}</p>
                              <p className="text-sm text-muted-foreground">{item.notes}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(item.createdAt).toLocaleString("ar-SA")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">لا يوجد سجل للطلب</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    {/* إضافة تعليق */}
                    <div className="flex gap-3">
                      <Textarea
                        placeholder="أضف تعليقاً..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => addCommentMutation.mutate({ requestId, comment: comment })}
                        disabled={!comment.trim() || addCommentMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* قائمة التعليقات */}
                    {request.comments && request.comments.length > 0 ? (
                      <div className="space-y-4 pt-4 border-t">
                        {request.comments.map((c: any) => (
                          <div key={c.id} className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">{c.userName || "مستخدم"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(c.createdAt).toLocaleString("ar-SA")}
                                </p>
                              </div>
                              <p className="text-sm mt-1">{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">لا توجد تعليقات</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attachments">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    {attachments && attachments.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {attachments.map((attachment: any) => (
                          <div key={attachment.id} className="border rounded-lg overflow-hidden">
                            {attachment.fileType === "image" ? (
                              <div className="relative aspect-video bg-muted">
                                <img
                                  src={attachment.fileUrl}
                                  alt={attachment.fileName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Button size="icon" variant="secondary">
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  </a>
                                  <a href={attachment.fileUrl} download={attachment.fileName}>
                                    <Button size="icon" variant="secondary">
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-video bg-muted flex items-center justify-center">
                                <FileText className="w-12 h-12 text-orange-500" />
                              </div>
                            )}
                            <div className="p-3">
                              <p className="text-sm font-medium truncate" title={attachment.fileName}>
                                {attachment.fileName}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : ''}
                                </span>
                                <a href={attachment.fileUrl} download={attachment.fileName}>
                                  <Button size="sm" variant="ghost">
                                    <Download className="w-3 h-3 ml-1" />
                                    تحميل
                                  </Button>
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Paperclip className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">لا توجد مرفقات</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* الشريط الجانبي */}
          <div className="space-y-6">
            {/* معلومات المسجد */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  المسجد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">اسم المسجد</p>
                    <p className="font-medium">{request.mosque?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المدينة</p>
                    <p className="font-medium">{request.mosque?.city || "-"}</p>
                  </div>
                  <Link href={`/mosques/${request.mosqueId}`}>
                    <Button variant="outline" className="w-full mt-2">
                      عرض تفاصيل المسجد
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* الإجراءات */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>الإجراءات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* أزرار النماذج الميدانية */}
                {(user?.role === "field_team" || user?.role === "super_admin" || user?.role === "system_admin" || user?.role === "projects_office") && (
                  <>
                    {(request.currentStage === "field_visit" || request.currentStage === "initial_review") && (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                        onClick={() => navigate(`/requests/${requestId}/field-inspection`)}
                      >
                        <ClipboardList className="w-4 h-4 ml-2" />
                        إنشاء تقرير المعاينة الميدانية
                      </Button>
                    )}
                  </>
                )}

                {(user?.role === "quick_response" || user?.role === "super_admin" || user?.role === "system_admin" || user?.role === "projects_office") && (
                  <>
                    {(request.programType === "enaya" || request.currentStage === "execution") && (
                      <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                        onClick={() => navigate(`/requests/${requestId}/quick-response`)}
                      >
                        <Zap className="w-4 h-4 ml-2" />
                        إنشاء تقرير الاستجابة السريعة
                      </Button>
                    )}
                  </>
                )}

                {/* عرض التقارير الموجودة */}
                {request.fieldReports && request.fieldReports.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      <Eye className="w-4 h-4 inline ml-1" />
                      تقارير المعاينة ({request.fieldReports.length})
                    </p>
                    {request.fieldReports.map((report: any, index: number) => (
                      <p key={report.id} className="text-xs text-blue-600">
                        تقرير {index + 1}: {new Date(report.visitDate).toLocaleDateString("ar-SA")}
                      </p>
                    ))}
                  </div>
                )}

                {request.quickReports && request.quickReports.length > 0 && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm font-medium text-orange-800 mb-2">
                      <Eye className="w-4 h-4 inline ml-1" />
                      تقارير الاستجابة ({request.quickReports.length})
                    </p>
                    {request.quickReports.map((report: any, index: number) => (
                      <p key={report.id} className="text-xs text-orange-600">
                        تقرير {index + 1}: {new Date(report.responseDate).toLocaleDateString("ar-SA")} - {report.resolved ? "تم الحل" : "قيد المتابعة"}
                      </p>
                    ))}
                  </div>
                )}

                <hr className="my-2" />

                <Button className="w-full gradient-primary text-white" onClick={() => toast.info("قريباً")}>
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  اعتماد الطلب
                </Button>
                <Button variant="outline" className="w-full" onClick={() => toast.info("قريباً")}>
                  تحويل للمرحلة التالية
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => toast.info("قريباً")}>
                  <XCircle className="w-4 h-4 ml-2" />
                  رفض الطلب
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
