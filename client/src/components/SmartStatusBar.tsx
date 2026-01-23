import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { STAGE_LABELS, STAGE_TRANSITION_PERMISSIONS } from "@shared/constants";
import { getCurrentActiveAction, getStageProgress, type ActionConfig } from "@shared/stageActionConfig";

interface SmartStatusBarProps {
  request: any;
  user: any;
  existingContract: any;
  quotations: any;
  boqItems: any;
  onAdvanceStage: () => void;
  onNavigate: (path: string) => void;
  isLoading?: boolean;
}

// المراحل الـ 11 بالترتيب
const ALL_STAGES = [
  "submitted", 
  "initial_review", 
  "field_visit", 
  "technical_eval", 
  "boq_preparation",
  "financial_eval", 
  "quotation_approval",
  "contracting",
  "execution", 
  "handover",
  "closed"
];

// حساب نسبة التقدم
const calculateProgress = (currentStage: string, track: string = 'standard'): number => {
  // للاستجابة السريعة، نستخدم مراحل مختلفة
  const quickResponseStages = ["submitted", "initial_review", "field_visit", "technical_eval", "execution", "closed"];
  const stages = track === 'quick_response' ? quickResponseStages : ALL_STAGES;
  const currentIndex = stages.indexOf(currentStage);
  if (currentIndex === -1) return 0;
  return Math.round(((currentIndex + 1) / stages.length) * 100);
};

export default function SmartStatusBar({
  request,
  user,
  existingContract,
  quotations,
  boqItems,
  onAdvanceStage,
  onNavigate,
  isLoading = false,
}: SmartStatusBarProps) {
  const currentStage = request?.currentStage || 'submitted';
  const requestTrack = request?.requestTrack || 'standard';
  const progress = calculateProgress(currentStage, requestTrack);
  const canTransition = user?.role && STAGE_TRANSITION_PERMISSIONS[currentStage]?.includes(user.role);

  // إضافة بيانات إضافية للطلب لاستخدامها في دوال checkCompletion
  const enrichedRequest = {
    ...request,
    fieldVisitReportId: request?.fieldVisitReportId,
    technicalEvalDecision: request?.technicalEvalDecision,
    boqItemsCount: boqItems?.items?.length || 0,
    quotationsCount: quotations?.quotations?.length || 0,
    selectedQuotationId: request?.selectedQuotationId,
    contractId: existingContract?.id,
    contractStatus: existingContract?.status,
    quickResponseReportId: request?.quickResponseReportId,
  };

  // الحصول على الإجراء النشط الحالي
  const activeAction = getCurrentActiveAction(currentStage, user?.role || '', enrichedRequest);
  
  // حساب نسبة التقدم داخل المرحلة الحالية
  const stageProgress = getStageProgress(currentStage, enrichedRequest);

  // تحديد لون الشريط حسب المرحلة
  const getStageColor = (stage: string): string => {
    const colorMap: Record<string, string> = {
      submitted: "blue",
      initial_review: "indigo",
      field_visit: "purple",
      technical_eval: "amber",
      boq_preparation: "cyan",
      financial_eval: "green",
      quotation_approval: "teal",
      contracting: "emerald",
      execution: "orange",
      handover: "lime",
      closed: "gray",
    };
    return colorMap[stage] || "blue";
  };

  const stageColor = getStageColor(currentStage);

  const colorClasses: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    indigo: "from-indigo-500 to-indigo-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    gray: "from-gray-500 to-gray-600",
    cyan: "from-cyan-500 to-cyan-600",
    teal: "from-teal-500 to-teal-600",
    emerald: "from-emerald-500 to-emerald-600",
    lime: "from-lime-500 to-lime-600",
  };

  const bgColorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    indigo: "bg-indigo-50 border-indigo-200",
    purple: "bg-purple-50 border-purple-200",
    amber: "bg-amber-50 border-amber-200",
    green: "bg-green-50 border-green-200",
    orange: "bg-orange-50 border-orange-200",
    gray: "bg-gray-50 border-gray-200",
    cyan: "bg-cyan-50 border-cyan-200",
    teal: "bg-teal-50 border-teal-200",
    emerald: "bg-emerald-50 border-emerald-200",
    lime: "bg-lime-50 border-lime-200",
  };

  const textColorClasses: Record<string, string> = {
    blue: "text-blue-700",
    indigo: "text-indigo-700",
    purple: "text-purple-700",
    amber: "text-amber-700",
    green: "text-green-700",
    orange: "text-orange-700",
    gray: "text-gray-700",
    cyan: "text-cyan-700",
    teal: "text-teal-700",
    emerald: "text-emerald-700",
    lime: "text-lime-700",
  };

  const renderActionButton = () => {
    if (!activeAction) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CheckCircle2 className="h-4 w-4" />
          <span>جميع الإجراءات مكتملة</span>
        </div>
      );
    }

    // التحقق من الصلاحية
    if (!canTransition) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>لا توجد صلاحية لتنفيذ هذا الإجراء</span>
        </div>
      );
    }

    // إذا كان الإجراء يحتوي على مسار (route)، نفتح الصفحة
    if (activeAction.route) {
      return (
        <Link href={activeAction.route + (request?.id ? `?requestId=${request.id}` : '')}>
          <Button 
            className={`bg-gradient-to-r ${colorClasses[stageColor]} hover:opacity-90`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              <>
                {activeAction.label}
                <ArrowRight className="mr-2 h-4 w-4" />
              </>
            )}
          </Button>
        </Link>
      );
    }

    // إذا لم يكن هناك مسار، نستخدم onAdvanceStage (للانتقال للمرحلة التالية)
    return (
      <Button 
        onClick={onAdvanceStage}
        className={`bg-gradient-to-r ${colorClasses[stageColor]} hover:opacity-90`}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            جاري المعالجة...
          </>
        ) : (
          <>
            {activeAction.label}
            <ArrowRight className="mr-2 h-4 w-4" />
          </>
        )}
      </Button>
    );
  };

  return (
    <Card className={`border-2 ${bgColorClasses[stageColor]}`}>
      <CardContent className="p-6">
        {/* رأس البطاقة */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[stageColor]} text-white`}>
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${textColorClasses[stageColor]}`}>
                  {STAGE_LABELS[currentStage] || currentStage}
                </h3>
                <p className="text-sm text-gray-600">
                  المرحلة الحالية
                </p>
              </div>
            </div>
          </div>
          
          {/* نسبة التقدم الإجمالية */}
          <div className="text-left">
            <div className={`text-2xl font-bold ${textColorClasses[stageColor]}`}>
              {progress}%
            </div>
            <div className="text-xs text-gray-500">
              التقدم الإجمالي
            </div>
          </div>
        </div>

        {/* شريط التقدم الإجمالي */}
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
        </div>

        {/* الإجراء النشط الحالي */}
        {activeAction && (
          <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[stageColor]} text-white`}>
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {activeAction.label}
                </h4>
                <p className="text-sm text-gray-600">
                  {activeAction.description}
                </p>
                {/* نسبة التقدم داخل المرحلة */}
                {stageProgress > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>التقدم في المرحلة</span>
                      <span>{stageProgress}%</span>
                    </div>
                    <Progress value={stageProgress} className="h-1" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* زر الإجراء */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {activeAction ? (
              <span>الإجراء المطلوب: <strong>{activeAction.label}</strong></span>
            ) : (
              <span>جميع الإجراءات مكتملة في هذه المرحلة</span>
            )}
          </div>
          {renderActionButton()}
        </div>

        {/* رسالة عدم وجود صلاحية */}
        {!canTransition && activeAction && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">لا توجد صلاحية لتنفيذ هذا الإجراء</p>
                <p className="text-xs">
                  الأدوار المسموح لها: {STAGE_TRANSITION_PERMISSIONS[currentStage]?.map((role: string) => 
                    role === 'super_admin' ? 'المدير العام' :
                    role === 'system_admin' ? 'مدير النظام' :
                    role === 'projects_office' ? 'مكتب المشاريع' :
                    role === 'field_team' ? 'الفريق الميداني' :
                    role === 'financial' ? 'الإدارة المالية' :
                    role === 'project_manager' ? 'مدير المشروع' :
                    role === 'quick_response' ? 'فريق الاستجابة السريعة' :
                    role
                  ).join('، ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
