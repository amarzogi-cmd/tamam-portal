import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ClipboardList,
  Zap,
  FolderKanban,
  Eye,
  DollarSign,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { STAGE_LABELS, STAGE_TRANSITION_PERMISSIONS, ROLE_LABELS } from "@shared/constants";

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

// تعريف الإجراءات المطلوبة لكل مرحلة
const STAGE_ACTIONS: Record<string, {
  title: string;
  description: string;
  icon: any;
  actionLabel: string;
  actionType: 'advance' | 'navigate' | 'info' | 'custom';
  actionPath?: string;
  color: string;
}> = {
  submitted: {
    title: "في انتظار الفرز الأولي",
    description: "يتم مراجعة الطلب من قبل مكتب المشاريع",
    icon: Clock,
    actionLabel: "تحويل للفرز الأولي",
    actionType: 'advance',
    color: "blue",
  },
  initial_review: {
    title: "الفرز الأولي",
    description: "يتم تقييم الطلب وتحديد الأولوية",
    icon: ClipboardList,
    actionLabel: "تحويل للزيارة الميدانية",
    actionType: 'advance',
    color: "indigo",
  },
  field_visit: {
    title: "الزيارة الميدانية",
    description: "يتم إجراء معاينة ميدانية للموقع",
    icon: Eye,
    actionLabel: "إنشاء تقرير المعاينة",
    actionType: 'navigate',
    actionPath: '/field-inspection',
    color: "purple",
  },
  technical_eval: {
    title: "الدراسة الفنية",
    description: "يتم تقييم الطلب فنياً واتخاذ القرار",
    icon: FolderKanban,
    actionLabel: "اتخاذ قرار التقييم الفني",
    actionType: 'custom',
    color: "amber",
  },
  financial_eval: {
    title: "الاعتماد المالي",
    description: "يتم إعداد جدول الكميات وعروض الأسعار والعقد",
    icon: DollarSign,
    actionLabel: "إدارة التقييم المالي",
    actionType: 'info',
    color: "green",
  },
  execution: {
    title: "مرحلة التنفيذ",
    description: "يتم تنفيذ الأعمال حسب العقد",
    icon: Zap,
    actionLabel: "متابعة التنفيذ",
    actionType: 'info',
    color: "orange",
  },
  closed: {
    title: "تم الإغلاق",
    description: "تم إكمال الطلب بنجاح",
    icon: CheckCircle2,
    actionLabel: "عرض التفاصيل",
    actionType: 'info',
    color: "gray",
  },
};

// حساب نسبة التقدم
const calculateProgress = (currentStage: string): number => {
  const stages = ["submitted", "initial_review", "field_visit", "technical_eval", "financial_eval", "execution", "closed"];
  const currentIndex = stages.indexOf(currentStage);
  return Math.round(((currentIndex + 1) / stages.length) * 100);
};

// تحديد الخطوة التالية في التقييم المالي
const getFinancialEvalStep = (boqItems: any, quotations: any, existingContract: any): {
  step: number;
  label: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  isComplete: boolean;
} => {
  const hasBoq = boqItems?.items && boqItems.items.length > 0;
  const hasQuotations = quotations?.quotations && quotations.quotations.length > 0;
  const hasApprovedQuotation = quotations?.quotations?.some((q: any) => q.status === 'approved' || q.status === 'accepted');
  const hasContract = !!existingContract;
  const isContractApproved = existingContract?.status === 'approved';

  if (!hasBoq) {
    return {
      step: 1,
      label: "إعداد جدول الكميات",
      description: "قم بإعداد جدول الكميات (BOQ) لتحديد البنود والكميات المطلوبة",
      actionLabel: "إعداد جدول الكميات",
      actionPath: "/boq",
      isComplete: false,
    };
  }

  if (!hasQuotations) {
    return {
      step: 2,
      label: "طلب عروض الأسعار",
      description: "قم بطلب عروض أسعار من الموردين المعتمدين",
      actionLabel: "طلب عروض أسعار",
      actionPath: "/quotations",
      isComplete: false,
    };
  }

  if (!hasApprovedQuotation) {
    return {
      step: 3,
      label: "اعتماد عرض السعر",
      description: "قم بمراجعة واعتماد أحد عروض الأسعار المقدمة",
      actionLabel: "مراجعة العروض",
      actionPath: "/quotations",
      isComplete: false,
    };
  }

  if (!hasContract) {
    return {
      step: 4,
      label: "إنشاء العقد",
      description: "قم بإنشاء عقد مع المورد المعتمد",
      actionLabel: "إنشاء العقد",
      actionPath: "/contracts/new/request/",
      isComplete: false,
    };
  }

  if (!isContractApproved) {
    return {
      step: 5,
      label: "اعتماد العقد",
      description: "قم بمراجعة واعتماد العقد للانتقال لمرحلة التنفيذ",
      actionLabel: "عرض العقد",
      actionPath: `/contracts/${existingContract.id}/preview`,
      isComplete: false,
    };
  }

  return {
    step: 6,
    label: "جاهز للتنفيذ",
    description: "تم اعتماد العقد ويمكن الانتقال لمرحلة التنفيذ",
    actionLabel: "الانتقال للتنفيذ",
    actionPath: "",
    isComplete: true,
  };
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
  const stageInfo = STAGE_ACTIONS[currentStage] || STAGE_ACTIONS.submitted;
  const progress = calculateProgress(currentStage);
  const canTransition = user?.role && STAGE_TRANSITION_PERMISSIONS[currentStage]?.includes(user.role);
  const allowedRoles = STAGE_TRANSITION_PERMISSIONS[currentStage] || [];

  // للتقييم المالي، نحصل على الخطوة الحالية
  const financialStep = currentStage === 'financial_eval' 
    ? getFinancialEvalStep(boqItems, quotations, existingContract) 
    : null;

  const Icon = stageInfo.icon;

  // تحديد لون الشريط
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    indigo: "from-indigo-500 to-indigo-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    gray: "from-gray-500 to-gray-600",
  };

  const bgColorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    indigo: "bg-indigo-50 border-indigo-200",
    purple: "bg-purple-50 border-purple-200",
    amber: "bg-amber-50 border-amber-200",
    green: "bg-green-50 border-green-200",
    orange: "bg-orange-50 border-orange-200",
    gray: "bg-gray-50 border-gray-200",
  };

  const textColorClasses: Record<string, string> = {
    blue: "text-blue-700",
    indigo: "text-indigo-700",
    purple: "text-purple-700",
    amber: "text-amber-700",
    green: "text-green-700",
    orange: "text-orange-700",
    gray: "text-gray-700",
  };

  const renderActionButton = () => {
    if (isLoading) {
      return (
        <Button disabled className="min-w-[180px]">
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          جاري...
        </Button>
      );
    }

    // للتقييم المالي، نعرض زر الخطوة الحالية
    if (currentStage === 'financial_eval' && financialStep) {
      if (financialStep.isComplete) {
        return (
          <Button 
            onClick={onAdvanceStage}
            className="min-w-[180px] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            disabled={!canTransition}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            الانتقال لمرحلة التنفيذ
          </Button>
        );
      }

      const actionPath = financialStep.actionPath.includes('/request/')
        ? `${financialStep.actionPath}${request.id}`
        : financialStep.actionPath;

      return (
        <Link href={actionPath}>
          <Button className={`min-w-[180px] bg-gradient-to-r ${colorClasses[stageInfo.color]}`}>
            <FileText className="w-4 h-4 ml-2" />
            {financialStep.actionLabel}
          </Button>
        </Link>
      );
    }

    // للزيارة الميدانية
    if (stageInfo.actionType === 'navigate' && stageInfo.actionPath) {
      return (
        <Button 
          onClick={() => onNavigate(`/requests/${request.id}${stageInfo.actionPath}`)}
          className={`min-w-[180px] bg-gradient-to-r ${colorClasses[stageInfo.color]}`}
        >
          <Icon className="w-4 h-4 ml-2" />
          {stageInfo.actionLabel}
        </Button>
      );
    }

    // للتقييم الفني - لا نعرض زر هنا لأن الخيارات في الشريط الجانبي
    if (currentStage === 'technical_eval') {
      return (
        <div className={`text-sm ${textColorClasses[stageInfo.color]} flex items-center gap-2`}>
          <AlertCircle className="w-4 h-4" />
          اختر قرار التقييم من الشريط الجانبي
        </div>
      );
    }

    // للمراحل الأخرى
    if (stageInfo.actionType === 'advance' && canTransition) {
      return (
        <Button 
          onClick={onAdvanceStage}
          className={`min-w-[180px] bg-gradient-to-r ${colorClasses[stageInfo.color]}`}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          {stageInfo.actionLabel}
        </Button>
      );
    }

    // إذا لم يكن لديه صلاحية
    if (!canTransition && stageInfo.actionType === 'advance') {
      return (
        <div className="text-sm text-muted-foreground">
          <p>الأدوار المسموح لها:</p>
          <p className="text-xs">{allowedRoles.map(r => ROLE_LABELS[r] || r).join('، ')}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className={`border-0 shadow-sm overflow-hidden ${bgColorClasses[stageInfo.color]}`}>
      {/* شريط التقدم */}
      <div className={`h-1 bg-gradient-to-r ${colorClasses[stageInfo.color]}`} style={{ width: `${progress}%` }} />
      
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* المعلومات */}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[stageInfo.color]} text-white`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold ${textColorClasses[stageInfo.color]}`}>
                  {currentStage === 'financial_eval' && financialStep 
                    ? `الخطوة ${financialStep.step}: ${financialStep.label}`
                    : stageInfo.title
                  }
                </h3>
                <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">
                  {progress}% مكتمل
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentStage === 'financial_eval' && financialStep 
                  ? financialStep.description
                  : stageInfo.description
                }
              </p>
              
              {/* مؤشر خطوات التقييم المالي */}
              {currentStage === 'financial_eval' && financialStep && (
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div
                      key={step}
                      className={`w-6 h-1.5 rounded-full transition-colors ${
                        step < financialStep.step 
                          ? 'bg-green-500' 
                          : step === financialStep.step 
                            ? `bg-gradient-to-r ${colorClasses[stageInfo.color]}`
                            : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* زر الإجراء */}
          <div className="flex items-center gap-3">
            {renderActionButton()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
