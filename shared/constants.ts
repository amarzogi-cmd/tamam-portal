// ==================== الأدوار التسعة ====================
export const USER_ROLES = {
  super_admin: { key: 'super_admin', label: 'المدير العام', labelEn: 'Super Admin' },
  system_admin: { key: 'system_admin', label: 'مدير النظام', labelEn: 'System Admin' },
  projects_office: { key: 'projects_office', label: 'مكتب المشاريع', labelEn: 'Projects Office' },
  field_team: { key: 'field_team', label: 'الفريق الميداني', labelEn: 'Field Team' },
  quick_response: { key: 'quick_response', label: 'فريق الاستجابة السريعة', labelEn: 'Quick Response Team' },
  financial: { key: 'financial', label: 'الإدارة المالية', labelEn: 'Financial Management' },
  project_manager: { key: 'project_manager', label: 'مدير المشروع', labelEn: 'Project Manager' },
  corporate_comm: { key: 'corporate_comm', label: 'الاتصال المؤسسي', labelEn: 'Corporate Communications' },
  service_requester: { key: 'service_requester', label: 'طالب الخدمة', labelEn: 'Service Requester' },
} as const;

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'المدير العام',
  system_admin: 'مدير النظام',
  projects_office: 'مكتب المشاريع',
  field_team: 'الفريق الميداني',
  quick_response: 'فريق الاستجابة السريعة',
  financial: 'الإدارة المالية',
  project_manager: 'مدير المشروع',
  corporate_comm: 'الاتصال المؤسسي',
  service_requester: 'طالب الخدمة',
};

// الأدوار الداخلية (الموظفين)
export const INTERNAL_ROLES = [
  'super_admin',
  'system_admin',
  'projects_office',
  'field_team',
  'quick_response',
  'financial',
  'project_manager',
  'corporate_comm',
];

// ==================== البرامج التسعة ====================
export const PROGRAMS = {
  bunyan: {
    key: 'bunyan',
    name: 'بنيان',
    nameEn: 'Bunyan',
    description: 'بناء مسجد جديد',
    icon: 'Building2',
    color: '#1E40AF', // أزرق داكن
  },
  daaem: {
    key: 'daaem',
    name: 'دعائم',
    nameEn: 'Daaem',
    description: 'استكمال المساجد المتعثرة',
    icon: 'Hammer',
    color: '#7C3AED', // بنفسجي
  },
  enaya: {
    key: 'enaya',
    name: 'عناية',
    nameEn: 'Enaya',
    description: 'الصيانة والترميم',
    icon: 'Wrench',
    color: '#059669', // أخضر
  },
  emdad: {
    key: 'emdad',
    name: 'إمداد',
    nameEn: 'Emdad',
    description: 'توفير تجهيزات المساجد',
    icon: 'Package',
    color: '#D97706', // برتقالي
  },
  ethraa: {
    key: 'ethraa',
    name: 'إثراء',
    nameEn: 'Ethraa',
    description: 'سداد فواتير الخدمات',
    icon: 'Receipt',
    color: '#DC2626', // أحمر
  },
  sedana: {
    key: 'sedana',
    name: 'سدانة',
    nameEn: 'Sedana',
    description: 'خدمات التشغيل والنظافة',
    icon: 'Sparkles',
    color: '#0891B2', // سماوي
  },
  taqa: {
    key: 'taqa',
    name: 'طاقة',
    nameEn: 'Taqa',
    description: 'الطاقة الشمسية',
    icon: 'Sun',
    color: '#F59E0B', // أصفر
  },
  miyah: {
    key: 'miyah',
    name: 'مياه',
    nameEn: 'Miyah',
    description: 'أنظمة المياه',
    icon: 'Droplets',
    color: '#0284C7', // أزرق فاتح
  },
  suqya: {
    key: 'suqya',
    name: 'سقيا',
    nameEn: 'Suqya',
    description: 'توفير ماء الشرب',
    icon: 'GlassWater',
    color: '#06B6D4', // تركواز
  },
} as const;

export const PROGRAM_LABELS: Record<string, string> = {
  bunyan: 'بنيان',
  daaem: 'دعائم',
  enaya: 'عناية',
  emdad: 'إمداد',
  ethraa: 'إثراء',
  sedana: 'سدانة',
  taqa: 'طاقة',
  miyah: 'مياه',
  suqya: 'سقيا',
};

// ==================== المراحل السبع للطلبات ====================
export const REQUEST_STAGES = {
  submitted: {
    key: 'submitted',
    name: 'تقديم الطلب',
    nameEn: 'Submitted',
    order: 1,
    description: 'تم تقديم الطلب وبانتظار المراجعة',
    color: '#6B7280', // رمادي
    icon: 'FileText',
  },
  initial_review: {
    key: 'initial_review',
    name: 'المراجعة الأولية',
    nameEn: 'Initial Review',
    order: 2,
    description: 'مراجعة البيانات والمستندات',
    color: '#3B82F6', // أزرق
    icon: 'FileSearch',
  },
  field_visit: {
    key: 'field_visit',
    name: 'الزيارة الميدانية',
    nameEn: 'Field Visit',
    order: 3,
    description: 'زيارة الموقع والمعاينة',
    color: '#8B5CF6', // بنفسجي
    icon: 'MapPin',
  },
  technical_eval: {
    key: 'technical_eval',
    name: 'التقييم الفني',
    nameEn: 'Technical Evaluation',
    order: 4,
    description: 'تقييم الاحتياجات الفنية',
    color: '#F59E0B', // برتقالي
    icon: 'ClipboardCheck',
  },
  financial_eval: {
    key: 'financial_eval',
    name: 'التقييم المالي',
    nameEn: 'Financial Evaluation',
    order: 5,
    description: 'تقدير التكاليف والميزانية',
    color: '#10B981', // أخضر
    icon: 'Calculator',
  },
  execution: {
    key: 'execution',
    name: 'التنفيذ',
    nameEn: 'Execution',
    order: 6,
    description: 'تنفيذ الأعمال المطلوبة',
    color: '#06B6D4', // سماوي
    icon: 'Cog',
  },
  closed: {
    key: 'closed',
    name: 'الإغلاق',
    nameEn: 'Closed',
    order: 7,
    description: 'تم إنجاز الطلب',
    color: '#22C55E', // أخضر فاتح
    icon: 'CheckCircle2',
  },
} as const;

export const STAGE_LABELS: Record<string, string> = {
  submitted: 'تقديم الطلب',
  initial_review: 'المراجعة الأولية',
  field_visit: 'الزيارة الميدانية',
  technical_eval: 'التقييم الفني',
  financial_eval: 'التقييم المالي',
  execution: 'التنفيذ',
  closed: 'الإغلاق',
};

// ==================== حالات الطلب ====================
export const REQUEST_STATUSES = {
  pending: { key: 'pending', label: 'قيد الانتظار', color: '#6B7280' },
  under_review: { key: 'under_review', label: 'قيد المراجعة', color: '#3B82F6' },
  approved: { key: 'approved', label: 'معتمد', color: '#22C55E' },
  rejected: { key: 'rejected', label: 'مرفوض', color: '#EF4444' },
  suspended: { key: 'suspended', label: 'معلق', color: '#F59E0B' },
  in_progress: { key: 'in_progress', label: 'قيد التنفيذ', color: '#06B6D4' },
  completed: { key: 'completed', label: 'مكتمل', color: '#10B981' },
} as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  under_review: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  suspended: 'معلق',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
};

// ==================== حالات المسجد ====================
export const MOSQUE_STATUSES = {
  new: { key: 'new', label: 'جديد', color: '#3B82F6' },
  existing: { key: 'existing', label: 'قائم', color: '#22C55E' },
  under_construction: { key: 'under_construction', label: 'تحت الإنشاء', color: '#F59E0B' },
} as const;

export const MOSQUE_STATUS_LABELS: Record<string, string> = {
  new: 'جديد',
  existing: 'قائم',
  under_construction: 'تحت الإنشاء',
};

// ==================== أنواع ملكية المسجد ====================
export const MOSQUE_OWNERSHIP = {
  government: { key: 'government', label: 'حكومي', color: '#1E40AF' },
  waqf: { key: 'waqf', label: 'وقف', color: '#7C3AED' },
  private: { key: 'private', label: 'أهلي', color: '#059669' },
} as const;

export const OWNERSHIP_LABELS: Record<string, string> = {
  government: 'حكومي',
  waqf: 'وقف',
  private: 'أهلي',
};

// ==================== حالات المستخدم ====================
export const USER_STATUSES = {
  pending: { key: 'pending', label: 'قيد الانتظار', color: '#F59E0B' },
  active: { key: 'active', label: 'نشط', color: '#22C55E' },
  suspended: { key: 'suspended', label: 'معلق', color: '#6B7280' },
  blocked: { key: 'blocked', label: 'محظور', color: '#EF4444' },
} as const;

export const USER_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  active: 'نشط',
  suspended: 'معلق',
  blocked: 'محظور',
};

// ==================== أولويات الطلب ====================
export const PRIORITIES = {
  urgent: { key: 'urgent', label: 'عاجل', color: '#EF4444' },
  medium: { key: 'medium', label: 'متوسط', color: '#F59E0B' },
  normal: { key: 'normal', label: 'عادي', color: '#6B7280' },
} as const;

export const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'عاجل',
  medium: 'متوسط',
  normal: 'عادي',
};

// ==================== أنواع صفة طالب الخدمة ====================
export const REQUESTER_TYPES = [
  { value: 'imam', label: 'إمام المسجد' },
  { value: 'muezzin', label: 'مؤذن المسجد' },
  { value: 'board_member', label: 'عضو مجلس إدارة' },
  { value: 'committee_member', label: 'عضو لجنة' },
  { value: 'volunteer', label: 'متطوع' },
  { value: 'other', label: 'أخرى' },
] as const;

// ==================== أنواع المرفقات ====================
export const ATTACHMENT_TYPES = {
  image: { key: 'image', label: 'صورة' },
  document: { key: 'document', label: 'مستند' },
  report: { key: 'report', label: 'تقرير' },
  contract: { key: 'contract', label: 'عقد' },
  invoice: { key: 'invoice', label: 'فاتورة' },
} as const;

// ==================== أنواع الشركاء ====================
export const PARTNER_TYPES = {
  strategic: { key: 'strategic', label: 'شريك استراتيجي' },
  sponsor: { key: 'sponsor', label: 'راعي' },
  supporter: { key: 'supporter', label: 'داعم' },
  media: { key: 'media', label: 'شريك إعلامي' },
} as const;

// ==================== صلاحيات الأدوار ====================
export const ROLE_PERMISSIONS = {
  super_admin: {
    canManageUsers: true,
    canManageRoles: true,
    canManageSettings: true,
    canViewAllRequests: true,
    canApproveRequests: true,
    canManageProjects: true,
    canManageFinance: true,
    canViewReports: true,
    canManageMosques: true,
    canManagePartners: true,
    canManageBranding: true,
  },
  system_admin: {
    canManageUsers: true,
    canManageRoles: true,
    canManageSettings: true,
    canViewAllRequests: true,
    canApproveRequests: false,
    canManageProjects: false,
    canManageFinance: false,
    canViewReports: true,
    canManageMosques: true,
    canManagePartners: true,
    canManageBranding: true,
  },
  projects_office: {
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false,
    canViewAllRequests: true,
    canApproveRequests: true,
    canManageProjects: true,
    canManageFinance: false,
    canViewReports: true,
    canManageMosques: true,
    canManagePartners: false,
    canManageBranding: false,
  },
  field_team: {
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false,
    canViewAllRequests: false,
    canApproveRequests: false,
    canManageProjects: false,
    canManageFinance: false,
    canViewReports: false,
    canManageMosques: false,
    canManagePartners: false,
    canManageBranding: false,
    canSubmitFieldReports: true,
  },
  quick_response: {
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false,
    canViewAllRequests: false,
    canApproveRequests: false,
    canManageProjects: false,
    canManageFinance: false,
    canViewReports: false,
    canManageMosques: false,
    canManagePartners: false,
    canManageBranding: false,
    canSubmitQuickResponse: true,
  },
  financial: {
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false,
    canViewAllRequests: true,
    canApproveRequests: false,
    canManageProjects: false,
    canManageFinance: true,
    canViewReports: true,
    canManageMosques: false,
    canManagePartners: false,
    canManageBranding: false,
  },
  project_manager: {
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false,
    canViewAllRequests: false,
    canApproveRequests: false,
    canManageProjects: true,
    canManageFinance: false,
    canViewReports: true,
    canManageMosques: false,
    canManagePartners: false,
    canManageBranding: false,
  },
  corporate_comm: {
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false,
    canViewAllRequests: true,
    canApproveRequests: false,
    canManageProjects: false,
    canManageFinance: false,
    canViewReports: true,
    canManageMosques: false,
    canManagePartners: true,
    canManageBranding: true,
  },
  service_requester: {
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false,
    canViewAllRequests: false,
    canApproveRequests: false,
    canManageProjects: false,
    canManageFinance: false,
    canViewReports: false,
    canManageMosques: false,
    canManagePartners: false,
    canManageBranding: false,
    canSubmitRequests: true,
    canViewOwnRequests: true,
  },
} as const;


// ==================== صلاحيات تحويل المراحل ====================
// تحديد الأدوار المسموح لها بتحويل الطلب من كل مرحلة إلى المرحلة التالية
export const STAGE_TRANSITION_PERMISSIONS: Record<string, string[]> = {
  // من تقديم الطلب إلى الفرز الأولي
  submitted: ['super_admin', 'system_admin', 'projects_office'],
  
  // من الفرز الأولي إلى الزيارة الميدانية
  initial_review: ['super_admin', 'system_admin', 'projects_office'],
  
  // من الزيارة الميدانية إلى الدراسة الفنية (الفريق الميداني يمكنه التحويل بعد تقديم تقرير المعاينة)
  field_visit: ['super_admin', 'system_admin', 'projects_office', 'field_team'],
  
  // من الدراسة الفنية إلى الاعتماد المالي
  technical_eval: ['super_admin', 'system_admin', 'projects_office'],
  
  // من الاعتماد المالي إلى التنفيذ (الإدارة المالية يمكنها الاعتماد)
  financial_eval: ['super_admin', 'system_admin', 'financial'],
  
  // من التنفيذ إلى الإغلاق
  execution: ['super_admin', 'system_admin', 'projects_office', 'quick_response'],
  
  // مرحلة الإغلاق - لا يمكن التحويل منها
  closed: [],
};

// صلاحيات اعتماد/رفض الطلبات
export const STATUS_CHANGE_PERMISSIONS: Record<string, string[]> = {
  // اعتماد الطلب
  approve: ['super_admin', 'system_admin', 'projects_office'],
  
  // رفض الطلب
  reject: ['super_admin', 'system_admin', 'projects_office'],
  
  // تعليق الطلب
  suspend: ['super_admin', 'system_admin', 'projects_office'],
};

// دالة للتحقق من صلاحية تحويل المرحلة
export function canTransitionStage(userRole: string, currentStage: string): boolean {
  const allowedRoles = STAGE_TRANSITION_PERMISSIONS[currentStage] || [];
  return allowedRoles.includes(userRole);
}

// دالة للتحقق من صلاحية تغيير الحالة
export function canChangeStatus(userRole: string, action: string): boolean {
  const allowedRoles = STATUS_CHANGE_PERMISSIONS[action] || [];
  return allowedRoles.includes(userRole);
}

// الحصول على اسم المرحلة التالية
export function getNextStage(currentStage: string): string | null {
  const stages = ['submitted', 'initial_review', 'field_visit', 'technical_eval', 'financial_eval', 'execution', 'closed'];
  const currentIndex = stages.indexOf(currentStage);
  if (currentIndex >= 0 && currentIndex < stages.length - 1) {
    return stages[currentIndex + 1];
  }
  return null;
}

// ==================== خيارات التقييم الفني (الخيارات الأربعة) ====================
export const TECHNICAL_EVAL_OPTIONS = {
  apologize: {
    key: 'apologize',
    name: 'الاعتذار عن الطلب',
    nameEn: 'Apologize for Request',
    description: 'رفض الطلب مع ذكر المبررات',
    requiresJustification: true,
    nextStage: 'closed',
    resultStatus: 'rejected',
    allowedRoles: ['super_admin', 'system_admin', 'projects_office'],
    icon: 'XCircle',
    color: '#EF4444',
  },
  suspend: {
    key: 'suspend',
    name: 'تعليق الطلب',
    nameEn: 'Suspend Request',
    description: 'تعليق الطلب مع ذكر المبررات',
    requiresJustification: true,
    nextStage: null, // يبقى في نفس المرحلة
    resultStatus: 'suspended',
    allowedRoles: ['super_admin', 'system_admin', 'projects_office'],
    icon: 'PauseCircle',
    color: '#F59E0B',
  },
  quick_response: {
    key: 'quick_response',
    name: 'التحويل إلى الاستجابة السريعة',
    nameEn: 'Transfer to Quick Response',
    description: 'تتم الزيارة واستكمال الخدمة ثم يتم رفع تقرير الاستجابة السريعة',
    requiresJustification: false,
    nextStage: 'execution', // ينتقل للتنفيذ مباشرة
    resultStatus: 'in_progress',
    allowedRoles: ['super_admin', 'system_admin', 'projects_office'],
    assignTo: 'quick_response', // يسند لفريق الاستجابة السريعة
    icon: 'Zap',
    color: '#8B5CF6',
  },
  convert_to_project: {
    key: 'convert_to_project',
    name: 'التحويل إلى مشروع',
    nameEn: 'Convert to Project',
    description: 'تحويل الطلب إلى مشروع والانتقال للتقييم المالي',
    requiresJustification: false,
    nextStage: 'financial_eval',
    resultStatus: 'approved',
    allowedRoles: ['super_admin', 'system_admin', 'projects_office'],
    createsProject: true,
    icon: 'FolderKanban',
    color: '#22C55E',
  },
} as const;

export const TECHNICAL_EVAL_OPTION_LABELS: Record<string, string> = {
  apologize: 'الاعتذار عن الطلب',
  suspend: 'تعليق الطلب',
  quick_response: 'التحويل إلى الاستجابة السريعة',
  convert_to_project: 'التحويل إلى مشروع',
};

// ==================== الخطوات الفرعية لكل مرحلة ====================
export const STAGE_SUBSTEPS = {
  submitted: [
    { key: 'account_login', name: 'تسجيل الدخول', responsible: 'service_requester' },
    { key: 'mosque_registration', name: 'تسجيل المسجد', responsible: 'service_requester' },
    { key: 'service_request', name: 'تعبئة نموذج الطلب', responsible: 'service_requester' },
  ],
  initial_review: [
    { key: 'account_approval', name: 'اعتماد تسجيل الحساب/المسجد', responsible: 'projects_office', durationDays: 1 },
    { key: 'initial_evaluation', name: 'الاطلاع على الطلب وتقييمه', responsible: 'projects_office', durationDays: 2 },
    { key: 'assign_technical', name: 'إسناد الطلب للدراسة الفنية', responsible: 'projects_office' },
  ],
  field_visit: [
    { key: 'schedule_visit', name: 'جدولة زيارة ميدانية', responsible: 'field_team', durationDays: 1 },
    { key: 'field_visit_form', name: 'نموذج الزيارة الميدانية', responsible: 'field_team', durationDays: 5 },
    { key: 'technical_report', name: 'التقرير الفني', responsible: 'field_team', durationDays: 1 },
  ],
  technical_eval: [
    { key: 'review_report', name: 'مراجعة التقرير الفني', responsible: 'projects_office', durationDays: 1 },
    { key: 'make_decision', name: 'اتخاذ القرار (الخيارات الأربعة)', responsible: 'projects_office', durationDays: 1 },
  ],
  financial_eval: [
    { key: 'prepare_boq', name: 'إعداد جدول الكميات', responsible: 'projects_office', durationDays: 10 },
    { key: 'request_quotes', name: 'طلب عروض الأسعار', responsible: 'projects_office', durationDays: 5 },
    { key: 'receive_quotes', name: 'استقبال العروض وترشيح الموردين', responsible: 'projects_office', durationDays: 5 },
    { key: 'calculate_cost', name: 'تحديد التكلفة + نسبة الإشراف', responsible: 'system' },
    { key: 'create_opportunity', name: 'رفع فرصة على موقع التبرعات', responsible: 'projects_office', durationDays: 1 },
  ],
  execution: [
    { key: 'prepare_contract', name: 'إعداد عقد المشروع', responsible: 'projects_office', durationDays: 1 },
    { key: 'sign_contract', name: 'إبرام العقد مع المورد', responsible: 'financial', durationDays: 1 },
    { key: 'request_payment', name: 'طلب صرف دفعة مالية', responsible: 'project_manager', durationDays: 1 },
    { key: 'prepare_payment_order', name: 'إعداد أمر صرف', responsible: 'financial', durationDays: 1 },
    { key: 'follow_execution', name: 'متابعة التنفيذ حسب المراحل', responsible: 'project_manager' },
  ],
  closed: [
    { key: 'final_report', name: 'التقرير الختامي', responsible: 'project_manager', durationDays: 5 },
    { key: 'stakeholder_satisfaction', name: 'قياس رضا أصحاب المصلحة', responsible: 'corporate_comm', durationDays: 1 },
    { key: 'beneficiary_satisfaction', name: 'قياس رضا المستفيد', responsible: 'corporate_comm', durationDays: 1 },
    { key: 'publish_results', name: 'النشر على الموقع والشبكات الاجتماعية', responsible: 'corporate_comm', durationDays: 1 },
    { key: 'close_project', name: 'إغلاق عمليات المشروع وصرف الدفعة الختامية', responsible: 'project_manager', durationDays: 1 },
  ],
} as const;

// ==================== مسارات الطلب ====================
export const REQUEST_TRACKS = {
  standard: {
    key: 'standard',
    name: 'المسار العادي (مشروع)',
    description: 'المسار الكامل من التقديم إلى الإغلاق',
    stages: ['submitted', 'initial_review', 'field_visit', 'technical_eval', 'financial_eval', 'execution', 'closed'],
  },
  quick_response: {
    key: 'quick_response',
    name: 'مسار الاستجابة السريعة',
    description: 'مسار مختصر للحالات البسيطة',
    stages: ['submitted', 'initial_review', 'field_visit', 'technical_eval', 'execution', 'closed'],
  },
  rejected: {
    key: 'rejected',
    name: 'مسار الاعتذار',
    description: 'الطلبات التي تم الاعتذار عنها',
    stages: ['submitted', 'initial_review', 'field_visit', 'technical_eval', 'closed'],
  },
} as const;


// ==================== الشروط المسبقة للانتقال بين المراحل ====================
export type PrerequisiteType = 
  | 'field_inspection_report'  // تقرير المعاينة الميدانية
  | 'quick_response_report'    // تقرير الاستجابة السريعة
  | 'technical_eval_decision'  // قرار التقييم الفني
  | 'boq_created'              // جدول الكميات
  | 'quotes_received'          // عروض الأسعار
  | 'supplier_selected'        // اختيار المورد
  | 'contract_signed'          // توقيع العقد
  | 'final_report'             // التقرير الختامي
  | 'satisfaction_survey';     // استبيان الرضا

export interface StagePrerequisite {
  type: PrerequisiteType;
  name: string;
  description: string;
  required: boolean;
  checkField?: string;  // الحقل الذي يتم التحقق منه في قاعدة البيانات
  checkTable?: string;  // الجدول الذي يتم التحقق منه
}

export const STAGE_PREREQUISITES: Record<string, StagePrerequisite[]> = {
  // من تقديم الطلب إلى المراجعة الأولية - لا توجد شروط
  submitted_to_initial_review: [],
  
  // من المراجعة الأولية إلى الزيارة الميدانية - لا توجد شروط
  initial_review_to_field_visit: [],
  
  // من الزيارة الميدانية إلى التقييم الفني - يجب وجود تقرير المعاينة
  field_visit_to_technical_eval: [
    {
      type: 'field_inspection_report',
      name: 'تقرير المعاينة الميدانية',
      description: 'يجب رفع تقرير المعاينة الميدانية قبل الانتقال للتقييم الفني',
      required: true,
      checkTable: 'field_inspection_reports',
      checkField: 'requestId',
    },
  ],
  
  // من التقييم الفني إلى التقييم المالي (مسار المشروع)
  technical_eval_to_financial_eval: [
    {
      type: 'technical_eval_decision',
      name: 'قرار التقييم الفني',
      description: 'يجب اختيار "التحويل إلى مشروع" للانتقال للتقييم المالي',
      required: true,
      checkField: 'technicalEvalDecision',
      checkTable: 'mosque_requests',
    },
  ],
  
  // من التقييم الفني إلى التنفيذ (مسار الاستجابة السريعة)
  technical_eval_to_execution_quick: [
    {
      type: 'technical_eval_decision',
      name: 'قرار التقييم الفني',
      description: 'يجب اختيار "التحويل إلى الاستجابة السريعة" للانتقال للتنفيذ',
      required: true,
      checkField: 'technicalEvalDecision',
      checkTable: 'mosque_requests',
    },
  ],
  
  // من التقييم المالي إلى التنفيذ (مسار المشروع)
  financial_eval_to_execution: [
    {
      type: 'boq_created',
      name: 'جدول الكميات',
      description: 'يجب إعداد جدول الكميات قبل الانتقال للتنفيذ',
      required: true,
      checkTable: 'boq_items',
      checkField: 'projectId',
    },
    {
      type: 'supplier_selected',
      name: 'اختيار المورد',
      description: 'يجب ترشيح واختيار المورد المناسب',
      required: true,
      checkTable: 'quotes',
      checkField: 'status',
    },
  ],
  
  // من التنفيذ إلى الإغلاق (مسار الاستجابة السريعة)
  execution_to_closed_quick: [
    {
      type: 'quick_response_report',
      name: 'تقرير الاستجابة السريعة',
      description: 'يجب رفع تقرير الاستجابة السريعة قبل إغلاق الطلب',
      required: true,
      checkTable: 'quick_response_reports',
      checkField: 'requestId',
    },
  ],
  
  // من التنفيذ إلى الإغلاق (مسار المشروع)
  execution_to_closed_project: [
    {
      type: 'contract_signed',
      name: 'العقد الموقع',
      description: 'يجب وجود عقد موقع مع المورد',
      required: true,
      checkTable: 'contracts',
      checkField: 'projectId',
    },
    {
      type: 'final_report',
      name: 'التقرير الختامي',
      description: 'يجب رفع التقرير الختامي للمشروع',
      required: false,
      checkTable: 'final_reports',
      checkField: 'projectId',
    },
  ],
};

// دالة للحصول على الشروط المسبقة بناءً على المرحلة الحالية والتالية والمسار
export function getPrerequisites(
  currentStage: string,
  nextStage: string,
  requestTrack: string = 'standard'
): StagePrerequisite[] {
  const key = `${currentStage}_to_${nextStage}`;
  
  // التحقق من المسار للحالات الخاصة
  if (currentStage === 'execution' && nextStage === 'closed') {
    if (requestTrack === 'quick_response') {
      return STAGE_PREREQUISITES['execution_to_closed_quick'] || [];
    }
    return STAGE_PREREQUISITES['execution_to_closed_project'] || [];
  }
  
  if (currentStage === 'technical_eval' && nextStage === 'execution') {
    return STAGE_PREREQUISITES['technical_eval_to_execution_quick'] || [];
  }
  
  return STAGE_PREREQUISITES[key] || [];
}

// رسائل الخطأ للشروط المسبقة
export const PREREQUISITE_ERROR_MESSAGES: Record<PrerequisiteType, string> = {
  field_inspection_report: 'يجب رفع تقرير المعاينة الميدانية قبل الانتقال للمرحلة التالية',
  quick_response_report: 'يجب رفع تقرير الاستجابة السريعة قبل إغلاق الطلب',
  technical_eval_decision: 'يجب اتخاذ قرار التقييم الفني (أحد الخيارات الأربعة)',
  boq_created: 'يجب إعداد جدول الكميات قبل الانتقال للتنفيذ',
  quotes_received: 'يجب استلام عروض الأسعار من الموردين',
  supplier_selected: 'يجب اختيار المورد المناسب من العروض المقدمة',
  contract_signed: 'يجب توقيع العقد مع المورد قبل إغلاق المشروع',
  final_report: 'يجب رفع التقرير الختامي للمشروع',
  satisfaction_survey: 'يجب إكمال استبيان رضا المستفيد',
};
