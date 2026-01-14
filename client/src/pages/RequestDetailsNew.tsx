import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { ArrowRight, FileText, Clock, Users, Paperclip, MessageSquare, Building2, Calendar, User, XCircle, Zap, PauseCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ActiveActionCard } from "@/components/ActiveActionCard";
import { InfoDrawer } from "@/components/InfoDrawer";
import { ProgressStepper } from "@/components/ProgressStepper";
import { getActiveAction, getCompletedSteps, getProgressPercentage } from "@/lib/requestActions";
import { WORKFLOW_STEPS, PROGRAM_LABELS, TECHNICAL_EVAL_OPTIONS, TECHNICAL_EVAL_OPTION_LABELS } from "../../../shared/constants";
import { ProgramIcon } from "@/components/ProgramIcon";
import { toast } from "sonner";

export default function RequestDetailsNew() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const requestId = parseInt(id!);

  // States for drawers
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  
  // States for technical evaluation
  const [showTechnicalEvalDialog, setShowTechnicalEvalDialog] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [justification, setJustification] = useState("");

  // Fetch request data
  const { data: request, isLoading } = trpc.requests.getById.useQuery({ id: requestId });
  const history = request?.history || [];
  const utils = trpc.useUtils();

  // Mutations
  const updateStageMutation = trpc.requests.updateStage.useMutation({
    onSuccess: () => {
      utils.requests.getById.invalidate({ id: requestId });
      toast.success("تم الانتقال إلى المرحلة التالية بنجاح");
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء الانتقال");
    },
  });

  const addCommentMutation = trpc.requests.addComment.useMutation({
    onSuccess: () => {
      utils.requests.getById.invalidate({ id: requestId });
      toast.success("تم إضافة التعليق بنجاح");
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة التعليق");
    },
  });

  const addAttachmentMutation = trpc.requests.addAttachment.useMutation({
    onSuccess: () => {
      utils.requests.getById.invalidate({ id: requestId });
      toast.success("تم رفع المرفق بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء رفع المرفق");
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

  // Handler for stage transition
  const handleStageTransition = () => {
    if (!request || !activeAction) return;
    
    // إذا كان هناك redirectUrl، انتقل إلى الصفحة المحددة
    if (activeAction.actionButton?.redirectUrl) {
      const url = activeAction.actionButton.redirectUrl
        .replace(':requestId', requestId.toString())
        .replace(':projectId', request.project?.id?.toString() || '');
      setLocation(url);
      return;
    }
    
    // إذا لم يكن هناك redirectUrl، انتقل إلى المرحلة التالية
    const nextStage = getNextStage(request.currentStage);
    if (!nextStage) {
      toast.error("لا توجد مرحلة تالية");
      return;
    }
    updateStageMutation.mutate({ requestId, newStage: nextStage as any });
  };

  // Get next stage
  const getNextStage = (currentStage: string) => {
    const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.id === currentStage);
    if (currentIndex === -1 || currentIndex === WORKFLOW_STEPS.length - 1) return null;
    return WORKFLOW_STEPS[currentIndex + 1].id;
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

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">الطلب غير موجود</h2>
          <p className="text-muted-foreground mb-6">لم يتم العثور على الطلب المطلوب</p>
          <Link href="/requests">
            <Button>العودة إلى الطلبات</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Get active action
  const activeAction = getActiveAction(request.currentStage, user?.role, {
    assignedTo: request.assignedTo,
    userId: user?.id,
  });

  const completedSteps = getCompletedSteps(request.currentStage);
  const progress = getProgressPercentage(request.currentStage);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/requests">
                <Button variant="ghost" size="sm">
                  ← رجوع
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <ProgramIcon program={request.programType} className="w-10 h-10" />
                <div>
                  <h1 className="text-2xl font-bold">{request.requestNumber}</h1>
                  <p className="text-sm text-muted-foreground">
                    {request.mosque?.name || "مسجد غير محدد"} • {PROGRAM_LABELS[request.programType as keyof typeof PROGRAM_LABELS]}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProjectInfoOpen(true)}
              >
                <Building2 className="w-4 h-4 ml-2" />
                معلومات المشروع
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimelineOpen(true)}
              >
                <Clock className="w-4 h-4 ml-2" />
                السجل الزمني
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAttachmentsOpen(true)}
              >
                <Paperclip className="w-4 h-4 ml-2" />
                المرفقات
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCommentsOpen(true)}
              >
                <MessageSquare className="w-4 h-4 ml-2" />
                التعليقات
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Progress Stepper */}
        <ProgressStepper
          steps={WORKFLOW_STEPS.map((s) => ({ ...s, label: s.label }))}
          currentStep={request.currentStage}
          completedSteps={completedSteps}
        />

        {/* Active Action Card */}
        {activeAction && (
          <div>
            <ActiveActionCard
              title={activeAction.title}
              description={activeAction.description}
              icon={activeAction.icon as any}
              iconColor={activeAction.iconColor}
              progress={{
                current: WORKFLOW_STEPS.findIndex((s) => s.id === request.currentStage) + 1,
                total: WORKFLOW_STEPS.length,
                percentage: progress,
              }}
              actionButton={
                activeAction.canPerformAction && activeAction.actionButton && request.currentStage !== 'technical_eval'
                  ? {
                      label: activeAction.actionButton.label,
                      onClick: handleStageTransition,
                      disabled: !activeAction.canPerformAction || updateStageMutation.isPending,
                    }
                  : undefined
              }
              additionalActions={
                request.currentStage !== 'technical_eval' ? [
                  {
                    label: "إضافة تعليق",
                    onClick: () => setCommentsOpen(true),
                  },
                  {
                    label: "رفع مرفق",
                    onClick: () => setAttachmentsOpen(true),
                  },
                ] : []
              }
            />
            
            {/* خيارات التقييم الفني */}
            {request.currentStage === 'technical_eval' && activeAction.canPerformAction && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* التحويل إلى مشروع */}
                <button 
                  className="group p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all text-right disabled:opacity-50"
                  onClick={() => {
                    setSelectedDecision('convert_to_project');
                    setShowTechnicalEvalDialog(true);
                  }}
                  disabled={technicalEvalMutation.isPending}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h5 className="font-bold text-green-800 text-base">التحويل إلى مشروع</h5>
                      <p className="text-sm text-green-600">إكمال الطلب والانتقال للتقييم المالي</p>
                    </div>
                  </div>
                </button>

                {/* الاستجابة السريعة */}
                <button 
                  className="group p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all text-right disabled:opacity-50"
                  onClick={() => {
                    setSelectedDecision('quick_response');
                    setShowTechnicalEvalDialog(true);
                  }}
                  disabled={technicalEvalMutation.isPending}
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-purple-600" />
                    <div>
                      <h5 className="font-bold text-purple-800 text-base">الاستجابة السريعة</h5>
                      <p className="text-sm text-purple-600">تحويل للحالات البسيطة التي تحتاج تدخل مباشر</p>
                    </div>
                  </div>
                </button>

                {/* التعليق */}
                <button 
                  className="group p-4 rounded-lg border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all text-right disabled:opacity-50"
                  onClick={() => {
                    setSelectedDecision('suspend');
                    setShowTechnicalEvalDialog(true);
                  }}
                  disabled={technicalEvalMutation.isPending}
                >
                  <div className="flex items-center gap-3">
                    <PauseCircle className="w-6 h-6 text-amber-600" />
                    <div>
                      <h5 className="font-bold text-amber-800 text-base">التعليق</h5>
                      <p className="text-sm text-amber-600">تعليق الطلب مؤقتاً لحين توفر متطلبات</p>
                    </div>
                  </div>
                </button>

                {/* الاعتذار */}
                <button 
                  className="group p-4 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all text-right disabled:opacity-50"
                  onClick={() => {
                    setSelectedDecision('apologize');
                    setShowTechnicalEvalDialog(true);
                  }}
                  disabled={technicalEvalMutation.isPending}
                >
                  <div className="flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <h5 className="font-bold text-red-800 text-base">الاعتذار</h5>
                      <p className="text-sm text-red-600">رفض الطلب نهائياً</p>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawers */}
      <InfoDrawer
        open={projectInfoOpen}
        onOpenChange={setProjectInfoOpen}
        title="معلومات المشروع"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">المسجد</p>
            <p className="text-lg font-semibold">{request.mosque?.name || "غير محدد"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">الموقع</p>
            <p className="text-lg">{request.mosque?.city || "غير محدد"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">البرنامج</p>
            <p className="text-lg">{PROGRAM_LABELS[request.programType as keyof typeof PROGRAM_LABELS]}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">تاريخ التقديم</p>
            <p className="text-lg">{new Date(request.createdAt).toLocaleDateString("ar-SA")}</p>
          </div>
        </div>
      </InfoDrawer>

      <InfoDrawer
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        title="السجل الزمني"
      >
        <div className="space-y-4">
          {history && history.length > 0 ? (
            history.map((item: any, index: number) => (
              <div key={index} className="border-r-2 border-primary pr-4 pb-4">
                <p className="font-semibold">{item.action}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString("ar-SA")}
                </p>
                {item.comment && (
                  <p className="text-sm mt-2 text-muted-foreground">"{item.comment}"</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد أحداث بعد</p>
          )}
        </div>
      </InfoDrawer>

      <InfoDrawer
        open={attachmentsOpen}
        onOpenChange={setAttachmentsOpen}
        title="المرفقات"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground text-center py-8">لا توجد مرفقات بعد</p>
          <Button className="w-full">
            <Paperclip className="w-4 h-4 ml-2" />
            إضافة مرفق جديد
          </Button>
        </div>
      </InfoDrawer>

      <InfoDrawer
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        title="التعليقات"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground text-center py-8">لا توجد تعليقات بعد</p>
          <Button className="w-full">
            <MessageSquare className="w-4 h-4 ml-2" />
            إضافة تعليق جديد
          </Button>
        </div>
      </InfoDrawer>

      {/* Technical Evaluation Dialog */}
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
    </div>
  );
}
