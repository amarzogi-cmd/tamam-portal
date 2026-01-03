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
  PauseCircle,
  FolderKanban,
  AlertCircle,
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { 
  PROGRAM_LABELS, 
  STAGE_LABELS, 
  STATUS_LABELS, 
  STAGE_TRANSITION_PERMISSIONS, 
  STATUS_CHANGE_PERMISSIONS, 
  ROLE_LABELS,
  TECHNICAL_EVAL_OPTIONS,
  TECHNICAL_EVAL_OPTION_LABELS,
} from "@shared/constants";
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
  { key: "submitted", label: "تقديم الطلب" },
  { key: "initial_review", label: "الفرز الأولي" },
  { key: "field_visit", label: "الزيارة الميدانية" },
  { key: "technical_eval", label: "الدراسة الفنية" },
  { key: "financial_eval", label: "الاعتماد المالي" },
  { key: "execution", label: "التنفيذ" },
  { key: "closed", label: "الإغلاق" },
];

export default function RequestDetails() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const requestId = parseInt(params.id || "0");
  const [comment, setComment] = useState("");
  const { user } = useAuth();
  const [showTechnicalEvalDialog, setShowTechnicalEvalDialog] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [justification, setJustification] = useState("");

  const { data: request, isLoading } = trpc.requests.getById.useQuery({ id: requestId });
  const { data: attachments } = trpc.storage.getRequestAttachments.useQuery({ requestId });
  // history and comments are included in the request data

  const utils = trpc.useUtils();

  const addCommentMutation = trpc.requests.addComment.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة التعليق");
      setComment("");
      utils.requests.getById.invalidate({ id: requestId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStageMutation = trpc.requests.updateStage.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث مرحلة الطلب بنجاح");
      utils.requests.getById.invalidate({ id: requestId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatusMutation = trpc.requests.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب بنجاح");
      utils.requests.getById.invalidate({ id: requestId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const technicalEvalMutation = trpc.requests.technicalEvalDecision.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowTechnicalEvalDialog(false);
      setSelectedDecision(null);
      setJustification("");
      utils.requests.getById.invalidate({ id: requestId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // دالة لتحويل الطلب للمرحلة التالية
  const handleAdvanceStage = () => {
    if (!request) return;
    // المراحل السبع كما هي في الـ backend
    const stages = ["submitted", "initial_review", "field_visit", "technical_eval", "financial_eval", "execution", "closed"];
    const currentIndex = stages.indexOf(request.currentStage);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1] as any;
      updateStageMutation.mutate({
        requestId,
        newStage: nextStage,
        notes: `تم تحويل الطلب إلى مرحلة ${nextStage}`,
      });
    }
  };

  // دالة لاعتماد الطلب
  const handleApprove = () => {
    updateStatusMutation.mutate({
      requestId,
      newStatus: "approved",
      notes: "تم اعتماد الطلب",
    });
  };

  // دالة لرفض الطلب
  const handleReject = () => {
    updateStatusMutation.mutate({
      requestId,
      newStatus: "rejected",
      notes: "تم رفض الطلب",
    });
  };

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
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="history">سجل الطلب</TabsTrigger>
                <TabsTrigger value="comments">التعليقات</TabsTrigger>
                <TabsTrigger value="attachments">المرفقات</TabsTrigger>
                {(request.currentStage === 'financial_eval' || request.currentStage === 'execution' || request.currentStage === 'closed') && (
                  <TabsTrigger value="financial">التقييم المالي</TabsTrigger>
                )}
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

              {/* تبويب التقييم المالي */}
              {(request.currentStage === 'financial_eval' || request.currentStage === 'execution' || request.currentStage === 'closed') && (
                <FinancialEvalTab requestId={requestId} />
              )}
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

                {/* زر تقرير الاستجابة السريعة - يظهر فقط في مسار الاستجابة السريعة */}
                {(user?.role === "quick_response" || user?.role === "super_admin" || user?.role === "system_admin" || user?.role === "projects_office" || user?.role === "field_team") && (
                  <>
                    {/* يظهر فقط إذا كان الطلب في مسار الاستجابة السريعة وفي مرحلة التنفيذ */}
                    {request.requestTrack === "quick_response" && request.currentStage === "execution" && (
                      <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                        onClick={() => navigate(`/requests/${requestId}/quick-response`)}
                      >
                        <Zap className="w-4 h-4 ml-2" />
                        إنشاء تقرير الاستجابة السريعة
                      </Button>
                    )}
                    {/* رسالة توضيحية إذا كان الطلب في مسار الاستجابة السريعة ولكن ليس في مرحلة التنفيذ */}
                    {request.requestTrack === "quick_response" && request.currentStage !== "execution" && request.currentStage !== "closed" && (
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-700 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          هذا الطلب في مسار الاستجابة السريعة
                        </p>
                        <p className="text-xs text-orange-600 mt-1">سيتم تفعيل زر التقرير عند الوصول لمرحلة التنفيذ</p>
                      </div>
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

                {/* أزرار الإجراءات حسب الصلاحيات */}
                {(() => {
                  const canTransition = user?.role && STAGE_TRANSITION_PERMISSIONS[request.currentStage]?.includes(user.role);
                  const canApprove = user?.role && STATUS_CHANGE_PERMISSIONS.approve?.includes(user.role);
                  const canReject = user?.role && STATUS_CHANGE_PERMISSIONS.reject?.includes(user.role);
                  const allowedRolesForStage = STAGE_TRANSITION_PERMISSIONS[request.currentStage] || [];
                  
                  return (
                    <>
                      {/* زر اعتماد الطلب */}
                      {canApprove ? (
                        <Button 
                          className="w-full gradient-primary text-white" 
                          onClick={handleApprove}
                          disabled={updateStatusMutation.isPending || request.status === "approved"}
                        >
                          <CheckCircle2 className="w-4 h-4 ml-2" />
                          {updateStatusMutation.isPending ? "جاري..." : "اعتماد الطلب"}
                        </Button>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">ليس لديك صلاحية اعتماد الطلب</p>
                        </div>
                      )}

                      {/* زر تحويل المرحلة */}
                      {request.currentStage !== "closed" && request.currentStage !== "technical_eval" && (
                        canTransition ? (
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={handleAdvanceStage}
                            disabled={updateStageMutation.isPending}
                          >
                            <ArrowRight className="w-4 h-4 ml-2" />
                            {updateStageMutation.isPending ? "جاري..." : "تحويل للمرحلة التالية"}
                          </Button>
                        ) : (
                          <div className="p-3 bg-amber-50 rounded-lg">
                            <p className="text-sm text-amber-800 font-medium mb-1">لا يمكنك تحويل الطلب من هذه المرحلة</p>
                            <p className="text-xs text-amber-600">
                              الأدوار المسموح لها: {allowedRolesForStage.map(r => ROLE_LABELS[r] || r).join('، ')}
                            </p>
                          </div>
                        )
                      )}

                      {/* الخيارات الأربعة للتقييم الفني */}
                      {request.currentStage === "technical_eval" && canTransition && (
                        <div className="space-y-4">
                          {/* عنوان القسم */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                            <h4 className="text-sm font-bold text-blue-800 mb-1 flex items-center">
                              <ClipboardList className="w-4 h-4 ml-2" />
                              قرار التقييم الفني
                            </h4>
                            <p className="text-xs text-blue-600">اختر أحد الخيارات التالية بناءً على نتائج الدراسة الفنية</p>
                          </div>

                          {/* الخيارات الإيجابية */}
                          <div className="grid grid-cols-1 gap-3">
                            {/* التحويل إلى مشروع */}
                            <button 
                              className="group relative p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all text-right disabled:opacity-50" 
                              onClick={() => {
                                setSelectedDecision('convert_to_project');
                                setShowTechnicalEvalDialog(true);
                              }}
                              disabled={technicalEvalMutation.isPending}
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-500 rounded-lg text-white">
                                  <FolderKanban className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-bold text-green-800">التحويل إلى مشروع</h5>
                                  <p className="text-xs text-green-600 mt-1">للطلبات التي تحتاج تقييم مالي وعقود موردين</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-green-400 group-hover:translate-x-[-4px] transition-transform" />
                              </div>
                            </button>

                            {/* التحويل للاستجابة السريعة */}
                            <button 
                              className="group relative p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all text-right disabled:opacity-50" 
                              onClick={() => {
                                setSelectedDecision('quick_response');
                                setShowTechnicalEvalDialog(true);
                              }}
                              disabled={technicalEvalMutation.isPending}
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-500 rounded-lg text-white">
                                  <Zap className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-bold text-purple-800">التحويل إلى الاستجابة السريعة</h5>
                                  <p className="text-xs text-purple-600 mt-1">للحالات البسيطة التي يمكن تنفيذها مباشرة</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-[-4px] transition-transform" />
                              </div>
                            </button>
                          </div>

                          {/* فاصل */}
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-white px-2 text-gray-400">أو</span>
                            </div>
                          </div>

                          {/* الخيارات الأخرى */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* تعليق الطلب */}
                            <button 
                              className="group p-3 rounded-lg border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all text-right disabled:opacity-50" 
                              onClick={() => {
                                setSelectedDecision('suspend');
                                setShowTechnicalEvalDialog(true);
                              }}
                              disabled={technicalEvalMutation.isPending}
                            >
                              <div className="flex items-center gap-2">
                                <PauseCircle className="w-5 h-5 text-amber-600" />
                                <div>
                                  <h5 className="font-bold text-amber-800 text-sm">تعليق الطلب</h5>
                                  <p className="text-xs text-amber-600">مع ذكر المبررات</p>
                                </div>
                              </div>
                            </button>

                            {/* الاعتذار عن الطلب */}
                            <button 
                              className="group p-3 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all text-right disabled:opacity-50" 
                              onClick={() => {
                                setSelectedDecision('apologize');
                                setShowTechnicalEvalDialog(true);
                              }}
                              disabled={technicalEvalMutation.isPending}
                            >
                              <div className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <div>
                                  <h5 className="font-bold text-red-800 text-sm">الاعتذار</h5>
                                  <p className="text-xs text-red-600">رفض الطلب نهائياً</p>
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* زر رفض الطلب */}
                      {canReject ? (
                        <Button 
                          variant="destructive" 
                          className="w-full" 
                          onClick={handleReject}
                          disabled={updateStatusMutation.isPending || request.status === "rejected"}
                        >
                          <XCircle className="w-4 h-4 ml-2" />
                          {updateStatusMutation.isPending ? "جاري..." : "رفض الطلب"}
                        </Button>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">ليس لديك صلاحية رفض الطلب</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog التقييم الفني */}
      {showTechnicalEvalDialog && selectedDecision && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">
              {TECHNICAL_EVAL_OPTION_LABELS[selectedDecision]}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {TECHNICAL_EVAL_OPTIONS[selectedDecision as keyof typeof TECHNICAL_EVAL_OPTIONS]?.description}
            </p>

            {/* حقل المبررات (مطلوب للاعتذار والتعليق) */}
            {(selectedDecision === 'apologize' || selectedDecision === 'suspend') && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  المبررات <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="اكتب المبررات هنا..."
                  rows={4}
                />
              </div>
            )}

            {/* ملاحظات إضافية (اختياري) */}
            {(selectedDecision === 'convert_to_project' || selectedDecision === 'quick_response') && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">ملاحظات (اختياري)</label>
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="أضف ملاحظات إضافية..."
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTechnicalEvalDialog(false);
                  setSelectedDecision(null);
                  setJustification("");
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={() => {
                  technicalEvalMutation.mutate({
                    requestId,
                    decision: selectedDecision as any,
                    justification: justification || undefined,
                  });
                }}
                disabled={
                  technicalEvalMutation.isPending ||
                  ((selectedDecision === 'apologize' || selectedDecision === 'suspend') && !justification.trim())
                }
                className={
                  selectedDecision === 'convert_to_project' ? 'bg-green-600 hover:bg-green-700' :
                  selectedDecision === 'quick_response' ? 'bg-purple-600 hover:bg-purple-700' :
                  selectedDecision === 'suspend' ? 'bg-amber-500 hover:bg-amber-600' :
                  'bg-red-600 hover:bg-red-700'
                }
              >
                {technicalEvalMutation.isPending ? 'جاري...' : 'تأكيد'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// مكون تبويب التقييم المالي
function FinancialEvalTab({ requestId }: { requestId: number }) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const utils = trpc.useUtils();

  // جلب جدول الكميات
  const { data: boqData, isLoading: boqLoading } = trpc.projects.getBOQ.useQuery(
    { requestId },
    { enabled: !!requestId }
  );

  // جلب عروض الأسعار
  const { data: quotationsData, isLoading: quotationsLoading, refetch: refetchQuotations } = trpc.projects.getQuotationsByRequest.useQuery(
    { requestId },
    { enabled: !!requestId }
  );

  // اعتماد عرض سعر
  const approveQuotationMutation = trpc.projects.updateQuotationStatus.useMutation({
    onSuccess: () => {
      toast.success("تم اعتماد عرض السعر بنجاح");
      setShowApproveDialog(false);
      setSelectedQuotation(null);
      refetchQuotations();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء اعتماد عرض السعر");
    },
  });

  const openApproveDialog = (quotation: any) => {
    setSelectedQuotation(quotation);
    setApprovedAmount(quotation.totalAmount?.toString() || "");
    setApprovalNotes("");
    setShowApproveDialog(true);
  };

  const handleApprove = () => {
    if (!selectedQuotation) return;
    approveQuotationMutation.mutate({
      id: selectedQuotation.id,
      status: "accepted",
      approvedAmount: parseFloat(approvedAmount) || parseFloat(selectedQuotation.totalAmount),
      approvalNotes: approvalNotes || undefined,
    });
  };

  const handleReject = (id: number) => {
    approveQuotationMutation.mutate({ id, status: "rejected" });
  };

  // حساب إجمالي جدول الكميات
  const boqTotal = boqData?.items?.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.totalPrice) || 0);
  }, 0) || 0;

  // العرض المعتمد
  const approvedQuotation = quotationsData?.quotations?.find((q: any) => q.status === "accepted");
  const approvedCost = approvedQuotation 
    ? parseFloat(approvedQuotation.approvedAmount || approvedQuotation.totalAmount) 
    : 0;
  const supervisionFee = approvedCost * 0.1;
  const totalCost = approvedCost + supervisionFee;

  return (
    <TabsContent value="financial">
      <div className="space-y-6">
        {/* جدول الكميات */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              جدول الكميات (BOQ)
            </CardTitle>
            <CardDescription>تفاصيل البنود والكميات المطلوبة</CardDescription>
          </CardHeader>
          <CardContent>
            {boqLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : boqData?.items && boqData.items.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-right p-3 font-medium">#</th>
                        <th className="text-right p-3 font-medium">البند</th>
                        <th className="text-right p-3 font-medium">الوحدة</th>
                        <th className="text-right p-3 font-medium">الكمية</th>
                        <th className="text-right p-3 font-medium">سعر الوحدة</th>
                        <th className="text-right p-3 font-medium">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boqData.items.map((item: any, index: number) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3">{item.itemName}</td>
                          <td className="p-3">{item.unit}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">{parseFloat(item.unitPrice).toLocaleString("ar-SA")} ريال</td>
                          <td className="p-3 font-medium">{parseFloat(item.totalPrice).toLocaleString("ar-SA")} ريال</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-left font-bold text-primary">
                  إجمالي جدول الكميات: {boqTotal.toLocaleString("ar-SA")} ريال
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed">
                <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">لم يتم إعداد جدول الكميات بعد</p>
                <Link href={`/projects/boq?requestId=${requestId}`}>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 ml-2" />
                    إعداد جدول الكميات
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* عروض الأسعار */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              عروض الأسعار
            </CardTitle>
            <CardDescription>العروض المقدمة من الموردين - اختر العرض الأنسب</CardDescription>
          </CardHeader>
          <CardContent>
            {quotationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : quotationsData?.quotations && quotationsData.quotations.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-right p-3 font-medium">رقم العرض</th>
                        <th className="text-right p-3 font-medium">المورد</th>
                        <th className="text-right p-3 font-medium">المبلغ الإجمالي</th>
                        <th className="text-right p-3 font-medium">المبلغ المعتمد</th>
                        <th className="text-right p-3 font-medium">الحالة</th>
                        <th className="text-right p-3 font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotationsData.quotations.map((quotation: any) => (
                        <tr key={quotation.id} className={`border-b ${quotation.status === 'accepted' ? 'bg-green-50' : ''}`}>
                          <td className="p-3 font-medium">{quotation.quotationNumber}</td>
                          <td className="p-3">{quotation.supplierName || "غير محدد"}</td>
                          <td className="p-3">{parseFloat(quotation.totalAmount).toLocaleString("ar-SA")} ريال</td>
                          <td className="p-3">
                            {quotation.approvedAmount 
                              ? `${parseFloat(quotation.approvedAmount).toLocaleString("ar-SA")} ريال`
                              : "-"
                            }
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {quotation.status === 'accepted' ? 'معتمد' :
                               quotation.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                            </span>
                          </td>
                          <td className="p-3">
                            {quotation.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => openApproveDialog(quotation)}
                                >
                                  <CheckCircle2 className="w-4 h-4 ml-1" />
                                  اعتماد
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleReject(quotation.id)}
                                >
                                  <XCircle className="w-4 h-4 ml-1" />
                                  رفض
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">لا توجد عروض أسعار حتى الآن</p>
                <Link href="/quotations">
                  <Button variant="outline">
                    <Send className="w-4 h-4 ml-2" />
                    إدارة عروض الأسعار
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ملخص التكلفة */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              ملخص التكلفة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approvedQuotation ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">تكلفة المورد</p>
                  <p className="text-xl font-bold text-green-700">{approvedCost.toLocaleString("ar-SA")} ريال</p>
                </div>
                <div className="p-4 bg-white rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">نسبة الإشراف (10%)</p>
                  <p className="text-xl font-bold text-green-700">{supervisionFee.toLocaleString("ar-SA")} ريال</p>
                </div>
                <div className="p-4 bg-white rounded-lg text-center border-2 border-green-500 col-span-2">
                  <p className="text-sm text-muted-foreground">الإجمالي النهائي</p>
                  <p className="text-2xl font-bold text-green-700">{totalCost.toLocaleString("ar-SA")} ريال</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-muted-foreground">لم يتم اعتماد عرض سعر بعد</p>
                <p className="text-sm text-muted-foreground">اختر عرض السعر الأنسب من الجدول أعلاه</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog اعتماد عرض السعر */}
      {showApproveDialog && selectedQuotation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-2">اعتماد عرض السعر</h3>
            <p className="text-sm text-muted-foreground mb-4">
              يمكنك تعديل المبلغ المعتمد إذا تم التفاوض على سعر مختلف
            </p>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم العرض:</span>
                  <span className="font-medium">{selectedQuotation.quotationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المورد:</span>
                  <span className="font-medium">{selectedQuotation.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المبلغ الأصلي:</span>
                  <span className="font-medium">
                    {parseFloat(selectedQuotation.totalAmount).toLocaleString("ar-SA")} ريال
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">المبلغ المعتمد (ريال) *</label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="أدخل المبلغ المعتمد"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  يمكنك تعديل المبلغ إذا تم التفاوض مع المورد
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات الاعتماد (اختياري)</label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="أي ملاحظات حول الاعتماد أو التفاوض..."
                />
              </div>

              {approvedAmount && parseFloat(approvedAmount) !== parseFloat(selectedQuotation.totalAmount) && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">سيتم اعتماد مبلغ مختلف عن العرض الأصلي</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!approvedAmount || parseFloat(approvedAmount) <= 0 || approveQuotationMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveQuotationMutation.isPending ? 'جاري...' : 'اعتماد العرض'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </TabsContent>
  );
}
