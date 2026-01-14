import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { ArrowRight, FileText, Clock, Users, Paperclip, MessageSquare, Building2, Calendar, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActiveActionCard } from "@/components/ActiveActionCard";
import { InfoDrawer } from "@/components/InfoDrawer";
import { ProgressStepper } from "@/components/ProgressStepper";
import { getActiveAction, getCompletedSteps, getProgressPercentage } from "@/lib/requestActions";
import { WORKFLOW_STEPS, PROGRAM_LABELS } from "../../../shared/constants";
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
              activeAction.canPerformAction && activeAction.actionButton
                ? {
                    label: activeAction.actionButton.label,
                    onClick: handleStageTransition,
                    disabled: !activeAction.canPerformAction || updateStageMutation.isPending,
                  }
                : undefined
            }
            additionalActions={[
              {
                label: "إضافة تعليق",
                onClick: () => setCommentsOpen(true),
              },
              {
                label: "رفع مرفق",
                onClick: () => setAttachmentsOpen(true),
              },
            ]}
          />
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
    </div>
  );
}
