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
  FileSpreadsheet,
  FileCheck,
  Handshake,
  PackageCheck,
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

// تعريف الإجراءات المطلوبة لكل مرحلة (11 مرحلة)
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
    title: "في انتظار المراجعة الأولية",
    description: "يتم مراجعة الطلب من قبل مكتب المشاريع",
    icon: Clock,
    actionLabel: "تحويل للمراجعة الأولية",
    actionType: 'advance',
    color: "blue",
  },
  initial_review: {
    title: "المراجعة الأولية",
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
    title: "التقييم الفني",
    description: "يتم تقييم الطلب فنياً واتخاذ القرار",
    icon: FolderKanban,
    actionLabel: "اتخاذ قرار التقييم الفني",
    actionType: 'custom',
    color: "amber",
  },
  boq_preparation: {
    title: "إعداد جدول الكميات",
    description: "يتم إعداد جدول الكميات والمواصفات الفنية",
    icon: FileSpreadsheet,
    actionLabel: "إعداد جدول الكميات",
    actionType: 'navigate',
    actionPath: '/boq',
    color: "cyan",
  },
  financial_eval: {
    title: "التقييم المالي",
    description: "يتم جمع عروض الأسعار ومقارنتها",
    icon: DollarSign,
    actionLabel: "إدارة عروض الأسعار",
    actionType: 'navigate',
    actionPath: '/quotations',
    color: "green",
  },
  quotation_approval: {
    title: "اعتماد العرض",
    description: "يتم اعتماد العرض الفائز",
    icon: FileCheck,
    actionLabel: "اعتماد العرض",
    actionType: 'info',
    color: "teal",
  },
  contracting: {
    title: "التعاقد",
    description: "يتم إنشاء العقد وتوقيعه",
    icon: Handshake,
    actionLabel: "إنشاء العقد",
    actionType: 'navigate',
    actionPath: '/contracts/new/request/',
    color: "emerald",
  },
  execution: {
    title: "مرحلة التنفيذ",
    description: "يتم تنفيذ الأعمال حسب العقد",
    icon: Zap,
    actionLabel: "متابعة التنفيذ",
    actionType: 'info',
    color: "orange",
  },
  handover: {
    title: "الاستلام",
    description: "يتم الاستلام الابتدائي والنهائي",
    icon: PackageCheck,
    actionLabel: "إدارة الاستلام",
    actionType: 'info',
    color: "lime",
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

// تحديد الخطوة التالية في مرحلة إعداد جدول الكميات
const getBOQStep = (boqItems: any): {
  step: number;
  label: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  isComplete: boolean;
} => {
  const hasBoq = boqItems?.items && boqItems.items.length > 0;
  
  if (!hasBoq) {
    return {
      step: 1,
      label: "إضافة بنود جدول الكميات",
      description: "قم بإضافة بنود جدول الكميات (BOQ) لتحديد الأعمال والكميات المطلوبة",
      actionLabel: "إعداد جدول الكميات",
      actionPath: "/boq",
      isComplete: false,
    };
  }

  return {
    step: 2,
    label: "جاهز للتقييم المالي",
    description: "تم إعداد جدول الكميات ويمكن الانتقال للتقييم المالي",
    actionLabel: "الانتقال للتقييم المالي",
    actionPath: "",
    isComplete: true,
  };
};

// تحديد الخطوة التالية في التقييم المالي
const getFinancialEvalStep = (quotations: any): {
  step: number;
  label: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  isComplete: boolean;
} => {
  const hasQuotations = quotations?.quotations && quotations.quotations.length > 0;
  const hasApprovedQuotation = quotations?.quotations?.some((q: any) => q.status === 'approved' || q.status === 'accepted');

  if (!hasQuotations) {
    return {
      step: 1,
      label: "طلب عروض الأسعار",
      description: "قم بطلب عروض أسعار من الموردين المعتمدين",
      actionLabel: "طلب عروض أسعار",
      actionPath: "/quotations",
      isComplete: false,
    };
  }

  if (!hasApprovedQuotation) {
    return {
      step: 2,
      label: "مقارنة العروض",
      description: "قم بمراجعة ومقارنة عروض الأسعار المقدمة",
      actionLabel: "مراجعة العروض",
      actionPath: "/quotations",
      isComplete: false,
    };
  }

  return {
    step: 3,
    label: "جاهز لاعتماد العرض",
    description: "تم استلام العروض ويمكن الانتقال لاعتماد العرض",
    actionLabel: "الانتقال لاعتماد العرض",
    actionPath: "",
    isComplete: true,
  };
};

// تحديد الخطوة التالية في التعاقد
const getContractingStep = (existingContract: any): {
  step: number;
  label: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  isComplete: boolean;
} => {
  const hasContract = !!existingContract;
  const isContractApproved = existingContract?.status === 'approved' || existingContract?.status === 'signed';

  if (!hasContract) {
    return {
      step: 1,
      label: "إنشاء العقد",
      description: "قم بإنشاء عقد مع المورد المعتمد",
      actionLabel: "إنشاء العقد",
      actionPath: "/contracts/new/request/",
      isComplete: false,
    };
  }

  if (!isContractApproved) {
    return {
      step: 2,
      label: "توقيع العقد",
      description: "قم بمراجعة وتوقيع العقد للانتقال لمرحلة التنفيذ",
      actionLabel: "عرض العقد",
      actionPath: `/contracts/${existingContract.id}/preview`,
      isComplete: false,
    };
  }

  return {
    step: 3,
    label: "جاهز للتنفيذ",
    description: "تم توقيع العقد ويمكن الانتقال لمرحلة التنفيذ",
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
  const requestTrack = request?.requestTrack || 'standard';
  const stageInfo = STAGE_ACTIONS[currentStage] || STAGE_ACTIONS.submitted;
  const progress = calculateProgress(currentStage, requestTrack);
  const canTransition = user?.role && STAGE_TRANSITION_PERMISSIONS[currentStage]?.includes(user.role);
  const allowedRoles = STAGE_TRANSITION_PERMISSIONS[currentStage] || [];

  // للمراحل المختلفة، نحصل على الخطوة الحالية
  const boqStep = currentStage === 'boq_preparation' 
    ? getBOQStep(boqItems) 
    : null;
  const financialStep = currentStage === 'financial_eval' 
    ? getFinancialEvalStep(quotations) 
    : null;
  const contractingStep = currentStage === 'contracting' 
    ? getContractingStep(existingContract) 
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
    if (isLoading) {
      return (
        <Button disabled className="min-w-[180px]">
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          جاري...
        </Button>
      );
    }

    // لمرحلة إعداد جدول الكميات
    if (currentStage === 'boq_preparation' && boqStep) {
      if (boqStep.isComplete) {
        return (
          <Button 
            onClick={onAdvanceStage}
            className="min-w-[180px] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            disabled={!canTransition}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            الانتقال للتقييم المالي
          </Button>
        );
      }

      return (
        <Button 
          onClick={() => onNavigate(`/requests/${request.id}${boqStep.actionPath}`)}
          className={`min-w-[180px] bg-gradient-to-r ${colorClasses[stageInfo.color]}`}
        >
          <FileSpreadsheet className="w-4 h-4 ml-2" />
          {boqStep.actionLabel}
        </Button>
      );
    }

    // للتقييم المالي
    if (currentStage === 'financial_eval' && financialStep) {
      if (financialStep.isComplete) {
        return (
          <Button 
            onClick={onAdvanceStage}
            className="min-w-[180px] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            disabled={!canTransition}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            الانتقال لاعتماد العرض
          </Button>
        );
      }

      return (
        <Button 
          onClick={() => onNavigate(`/requests/${request.id}${financialStep.actionPath}`)}
          className={`min-w-[180px] bg-gradient-to-r ${colorClasses[stageInfo.color]}`}
        >
          <DollarSign className="w-4 h-4 ml-2" />
          {financialStep.actionLabel}
        </Button>
      );
    }

    // لمرحلة التعاقد
    if (currentStage === 'contracting' && contractingStep) {
      if (contractingStep.isComplete) {
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

      const actionPath = contractingStep.actionPath.includes('/request/')
        ? `${contractingStep.actionPath}${request.id}`
        : contractingStep.actionPath;

      return (
        <Link href={actionPath}>
          <Button className={`min-w-[180px] bg-gradient-to-r ${colorClasses[stageInfo.color]}`}>
            <Handshake className="w-4 h-4 ml-2" />
            {contractingStep.actionLabel}
          </Button>
        </Link>
      );
    }

    // للزيارة الميدانية
    if (stageInfo.actionType === 'navigate' && stageInfo.actionPath) {
      const actionPath = stageInfo.actionPath.includes('/request/')
        ? `${stageInfo.actionPath}${request.id}`
        : `/requests/${request.id}${stageInfo.actionPath}`;
      
      return (
        <Button 
          onClick={() => onNavigate(actionPath)}
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

  // حساب عدد الخطوات للمرحلة الحالية
  const getStepIndicator = () => {
    if (currentStage === 'boq_preparation' && boqStep) {
      return (
        <div className="flex items-center gap-1 mt-2">
          {[1, 2].map((step) => (
            <div
              key={step}
              className={`w-8 h-1.5 rounded-full transition-colors ${
                step < boqStep.step 
                  ? 'bg-green-500' 
                  : step === boqStep.step 
                    ? `bg-gradient-to-r ${colorClasses[stageInfo.color]}`
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      );
    }

    if (currentStage === 'financial_eval' && financialStep) {
      return (
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3].map((step) => (
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
      );
    }

    if (currentStage === 'contracting' && contractingStep) {
      return (
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-6 h-1.5 rounded-full transition-colors ${
                step < contractingStep.step 
                  ? 'bg-green-500' 
                  : step === contractingStep.step 
                    ? `bg-gradient-to-r ${colorClasses[stageInfo.color]}`
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      );
    }

    return null;
  };

  // الحصول على العنوان والوصف الحالي
  const getCurrentInfo = () => {
    if (currentStage === 'boq_preparation' && boqStep) {
      return {
        title: `الخطوة ${boqStep.step}: ${boqStep.label}`,
        description: boqStep.description,
      };
    }
    if (currentStage === 'financial_eval' && financialStep) {
      return {
        title: `الخطوة ${financialStep.step}: ${financialStep.label}`,
        description: financialStep.description,
      };
    }
    if (currentStage === 'contracting' && contractingStep) {
      return {
        title: `الخطوة ${contractingStep.step}: ${contractingStep.label}`,
        description: contractingStep.description,
      };
    }
    return {
      title: stageInfo.title,
      description: stageInfo.description,
    };
  };

  const currentInfo = getCurrentInfo();

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
                  {currentInfo.title}
                </h3>
                <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">
                  {progress}% مكتمل
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentInfo.description}
              </p>
              
              {/* مؤشر الخطوات */}
              {getStepIndicator()}
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
