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
