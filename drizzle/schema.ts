import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ==================== الأدوار والحالات ====================

// الأدوار التسعة للنظام
export const userRoles = [
  "super_admin",      // المدير العام
  "system_admin",     // مدير النظام
  "projects_office",  // مكتب المشاريع
  "field_team",       // الفريق الميداني
  "quick_response",   // فريق الاستجابة السريعة
  "financial",        // الإدارة المالية
  "project_manager",  // مدير المشروع
  "corporate_comm",   // الاتصال المؤسسي
  "service_requester" // طالب الخدمة
] as const;

// البرامج التسعة
export const programTypes = [
  "bunyan",    // بنيان - بناء مسجد جديد
  "daaem",     // دعائم - استكمال المساجد المتعثرة
  "enaya",     // عناية - الصيانة والترميم
  "emdad",     // إمداد - توفير تجهيزات المساجد
  "ethraa",    // إثراء - سداد فواتير الخدمات
  "sedana",    // سدانة - خدمات التشغيل والنظافة
  "taqa",      // طاقة - الطاقة الشمسية
  "miyah",     // مياه - أنظمة المياه
  "suqya"      // سقيا - توفير ماء الشرب
] as const;

// المراحل السبع للطلبات
export const requestStages = [
  "submitted",         // تقديم الطلب
  "initial_review",    // المراجعة الأولية
  "field_visit",       // الزيارة الميدانية
  "technical_eval",    // التقييم الفني
  "financial_eval",    // التقييم المالي
  "execution",         // التنفيذ
  "closed"             // الإغلاق
] as const;

// حالات الطلب
export const requestStatuses = [
  "pending",           // قيد الانتظار
  "under_review",      // قيد المراجعة
  "approved",          // معتمد
  "rejected",          // مرفوض
  "suspended",         // معلق
  "in_progress",       // قيد التنفيذ
  "completed"          // مكتمل
] as const;

// حالات المسجد
export const mosqueStatuses = [
  "new",               // جديد
  "existing",          // قائم
  "under_construction" // تحت الإنشاء
] as const;

// أنواع ملكية المسجد
export const mosqueOwnership = [
  "government",        // حكومي
  "waqf",              // وقف
  "private"            // أهلي
] as const;

// حالات المستخدم
export const userStatuses = [
  "pending",           // قيد الانتظار
  "active",            // نشط
  "suspended",         // معلق
  "blocked"            // محظور
] as const;

// ==================== جداول المستخدمين ====================

// جدول المستخدمين الرئيسي
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }),
  nationalId: varchar("nationalId", { length: 20 }),
  role: mysqlEnum("role", userRoles).default("service_requester").notNull(),
  status: mysqlEnum("status", userStatuses).default("pending").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }).default("local"),
  city: varchar("city", { length: 100 }),
  requesterType: varchar("requesterType", { length: 50 }), // صفة طالب التسجيل (إمام، مؤذن، عضو مجلس إدارة)
  proofDocument: varchar("proofDocument", { length: 500 }), // إثبات الصفة
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// جدول الموظفين (بيانات إضافية للموظفين)
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  employeeNumber: varchar("employeeNumber", { length: 50 }),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  hireDate: timestamp("hireDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// جدول رموز إعادة تعيين كلمة المرور
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== جداول المساجد ====================

// جدول المساجد
export const mosques = mysqlTable("mosques", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  address: text("address"),
  city: varchar("city", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }), // الحي
  area: decimal("area", { precision: 10, scale: 2 }), // المساحة بالمتر المربع
  capacity: int("capacity"), // السعة (عدد المصلين)
  status: mysqlEnum("status", mosqueStatuses).default("new").notNull(),
  ownership: mysqlEnum("ownership", mosqueOwnership).default("waqf").notNull(),
  imamName: varchar("imamName", { length: 255 }),
  imamPhone: varchar("imamPhone", { length: 20 }),
  imamEmail: varchar("imamEmail", { length: 320 }),
  registeredBy: int("registeredBy").references(() => users.id),
  approvedBy: int("approvedBy").references(() => users.id),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending"),
  approvalDate: timestamp("approvalDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// جدول صور المساجد
export const mosqueImages = mysqlTable("mosque_images", {
  id: int("id").autoincrement().primaryKey(),
  mosqueId: int("mosqueId").notNull().references(() => mosques.id),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  imageType: varchar("imageType", { length: 50 }), // main, exterior, interior
  caption: varchar("caption", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== جداول الطلبات ====================

// جدول الطلبات الرئيسي
export const mosqueRequests = mysqlTable("mosque_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestNumber: varchar("requestNumber", { length: 50 }).notNull().unique(),
  mosqueId: int("mosqueId").references(() => mosques.id), // nullable لبرنامج بنيان
  userId: int("userId").notNull().references(() => users.id),
  programType: mysqlEnum("programType", programTypes).notNull(),
  currentStage: mysqlEnum("currentStage", requestStages).default("submitted").notNull(),
  status: mysqlEnum("status", requestStatuses).default("pending").notNull(),
  priority: mysqlEnum("priority", ["urgent", "medium", "normal"]).default("normal"),
  assignedTo: int("assignedTo").references(() => users.id),
  
  // بيانات البرنامج (JSON مرن لكل برنامج)
  programData: json("programData"),
  
  // التكلفة والميزانية
  estimatedCost: decimal("estimatedCost", { precision: 15, scale: 2 }),
  approvedBudget: decimal("approvedBudget", { precision: 15, scale: 2 }),
  
  // التواريخ
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  approvedAt: timestamp("approvedAt"),
  completedAt: timestamp("completedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// جدول مرفقات الطلبات
export const requestAttachments = mysqlTable("request_attachments", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => mosqueRequests.id),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileType: varchar("fileType", { length: 50 }), // image, document, report
  fileSize: int("fileSize"),
  uploadedBy: int("uploadedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// جدول تعليقات الطلبات
export const requestComments = mysqlTable("request_comments", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => mosqueRequests.id),
  userId: int("userId").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  isInternal: boolean("isInternal").default(false), // تعليق داخلي للموظفين فقط
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// جدول سجل تغييرات حالة الطلب
export const requestHistory = mysqlTable("request_history", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => mosqueRequests.id),
  userId: int("userId").notNull().references(() => users.id),
  fromStage: mysqlEnum("fromStage", requestStages),
  toStage: mysqlEnum("toStage", requestStages),
  fromStatus: mysqlEnum("fromStatus", requestStatuses),
  toStatus: mysqlEnum("toStatus", requestStatuses),
  action: varchar("action", { length: 100 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== جداول التقارير ====================

// تقارير الزيارات الميدانية
export const fieldVisitReports = mysqlTable("field_visit_reports", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => mosqueRequests.id),
  visitedBy: int("visitedBy").notNull().references(() => users.id),
  visitDate: timestamp("visitDate").notNull(),
  findings: text("findings"),
  recommendations: text("recommendations"),
  estimatedCost: decimal("estimatedCost", { precision: 15, scale: 2 }),
  technicalNeeds: text("technicalNeeds"),
  conditionRating: mysqlEnum("conditionRating", ["excellent", "good", "fair", "poor", "critical"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// تقارير الاستجابة السريعة
export const quickResponseReports = mysqlTable("quick_response_reports", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => mosqueRequests.id),
  respondedBy: int("respondedBy").notNull().references(() => users.id),
  responseDate: timestamp("responseDate").notNull(),
  issueDescription: text("issueDescription"),
  actionsTaken: text("actionsTaken"),
  resolved: boolean("resolved").default(false),
  requiresProject: boolean("requiresProject").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// التقارير الختامية للمشاريع
export const finalReports = mysqlTable("final_reports", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => mosqueRequests.id),
  projectId: int("projectId").references(() => projects.id),
  preparedBy: int("preparedBy").notNull().references(() => users.id),
  summary: text("summary"),
  achievements: text("achievements"),
  challenges: text("challenges"),
  totalCost: decimal("totalCost", { precision: 15, scale: 2 }),
  completionDate: timestamp("completionDate"),
  satisfactionRating: int("satisfactionRating"), // 1-5
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== جداول المشاريع ====================

// جدول المشاريع
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  projectNumber: varchar("projectNumber", { length: 50 }).notNull().unique(),
  requestId: int("requestId").notNull().references(() => mosqueRequests.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  managerId: int("managerId").references(() => users.id),
  status: mysqlEnum("status", ["planning", "in_progress", "on_hold", "completed", "cancelled"]).default("planning"),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  actualCost: decimal("actualCost", { precision: 15, scale: 2 }),
  startDate: timestamp("startDate"),
  expectedEndDate: timestamp("expectedEndDate"),
  actualEndDate: timestamp("actualEndDate"),
  completionPercentage: int("completionPercentage").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// مراحل تنفيذ المشروع
export const projectPhases = mysqlTable("project_phases", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id),
  phaseName: varchar("phaseName", { length: 255 }).notNull(),
  phaseOrder: int("phaseOrder").notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  completionPercentage: int("completionPercentage").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// جدول العقود
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  contractNumber: varchar("contractNumber", { length: 50 }).notNull().unique(),
  projectId: int("projectId").notNull().references(() => projects.id),
  supplierId: int("supplierId").references(() => suppliers.id),
  contractType: varchar("contractType", { length: 100 }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["draft", "active", "completed", "terminated"]).default("draft"),
  terms: text("terms"),
  documentUrl: varchar("documentUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// جدول الدفعات المالية
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  paymentNumber: varchar("paymentNumber", { length: 50 }).notNull().unique(),
  projectId: int("projectId").references(() => projects.id),
  contractId: int("contractId").references(() => contracts.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentType: mysqlEnum("paymentType", ["advance", "progress", "final", "retention"]).default("progress"),
  status: mysqlEnum("status", ["pending", "approved", "paid", "rejected"]).default("pending"),
  approvedBy: int("approvedBy").references(() => users.id),
  paidAt: timestamp("paidAt"),
  description: text("description"),
  documentUrl: varchar("documentUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== جداول التمويل والتبرعات ====================

// فرص التبرع
export const donationOpportunities = mysqlTable("donation_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").references(() => mosqueRequests.id),
  projectId: int("projectId").references(() => projects.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
  collectedAmount: decimal("collectedAmount", { precision: 15, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["active", "completed", "closed"]).default("active"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  isPublic: boolean("isPublic").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// التبرعات
export const donations = mysqlTable("donations", {
  id: int("id").autoincrement().primaryKey(),
  opportunityId: int("opportunityId").references(() => donationOpportunities.id),
  donorName: varchar("donorName", { length: 255 }),
  donorPhone: varchar("donorPhone", { length: 20 }),
  donorEmail: varchar("donorEmail", { length: 320 }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  isAnonymous: boolean("isAnonymous").default(false),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled"]).default("pending"),
  transactionId: varchar("transactionId", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// الموردين والمقاولين
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["contractor", "supplier", "service_provider"]).default("supplier"),
  contactPerson: varchar("contactPerson", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  commercialRegister: varchar("commercialRegister", { length: 50 }),
  taxNumber: varchar("taxNumber", { length: 50 }),
  rating: int("rating"), // 1-5
  status: mysqlEnum("status", ["active", "inactive", "blacklisted"]).default("active"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// عروض الأسعار
export const quotations = mysqlTable("quotations", {
  id: int("id").autoincrement().primaryKey(),
  quotationNumber: varchar("quotationNumber", { length: 50 }).notNull().unique(),
  requestId: int("requestId").references(() => mosqueRequests.id),
  projectId: int("projectId").references(() => projects.id),
  supplierId: int("supplierId").notNull().references(() => suppliers.id),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  validUntil: timestamp("validUntil"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "expired"]).default("pending"),
  items: json("items"), // تفاصيل البنود
  notes: text("notes"),
  documentUrl: varchar("documentUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// جداول الكميات
export const quantitySchedules = mysqlTable("quantity_schedules", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").references(() => mosqueRequests.id),
  projectId: int("projectId").references(() => projects.id),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  itemDescription: text("itemDescription"),
  unit: varchar("unit", { length: 50 }).notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }),
  totalPrice: decimal("totalPrice", { precision: 15, scale: 2 }),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== جداول الإشعارات ====================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "error", "request_update", "system"]).default("info"),
  relatedType: varchar("relatedType", { length: 50 }), // request, project, user
  relatedId: int("relatedId"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== جداول الإعدادات والتصنيفات ====================

// التصنيفات الرئيسية
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // city, nationality, maintenance_type, etc.
  parentId: int("parentId"),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// قيم التصنيفات
export const categoryValues = mysqlTable("category_values", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull().references(() => categories.id),
  value: varchar("value", { length: 255 }).notNull(),
  valueAr: varchar("valueAr", { length: 255 }).notNull(),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// إعدادات الهوية البصرية
export const brandSettings = mysqlTable("brand_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  settingType: varchar("settingType", { length: 50 }), // text, color, image, json
  description: varchar("description", { length: 255 }),
  updatedBy: int("updatedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// الشعارات
export const brandLogos = mysqlTable("brand_logos", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  logoType: mysqlEnum("logoType", ["primary", "secondary", "white", "dark", "icon"]).default("primary"),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// الألوان
export const brandColors = mysqlTable("brand_colors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  colorType: mysqlEnum("colorType", ["primary", "secondary", "accent", "background", "text"]).default("primary"),
  hexValue: varchar("hexValue", { length: 7 }).notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// تخصيص الصفحة الرئيسية
export const homepageCustomization = mysqlTable("homepage_customization", {
  id: int("id").autoincrement().primaryKey(),
  sectionKey: varchar("sectionKey", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  titleAr: varchar("titleAr", { length: 255 }),
  subtitle: text("subtitle"),
  subtitleAr: text("subtitleAr"),
  content: text("content"),
  contentAr: text("contentAr"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  iconName: varchar("iconName", { length: 100 }),
  sortOrder: int("sortOrder").default(0),
  isVisible: boolean("isVisible").default(true),
  updatedBy: int("updatedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== جداول الشركاء والداعمين ====================

export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  logoUrl: varchar("logoUrl", { length: 500 }),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  partnerType: mysqlEnum("partnerType", ["strategic", "sponsor", "supporter", "media"]).default("supporter"),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== جداول التدقيق ====================

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(), // user, mosque, request, project
  entityId: int("entityId"),
  oldValues: json("oldValues"),
  newValues: json("newValues"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== العلاقات ====================

export const usersRelations = relations(users, ({ many, one }) => ({
  mosques: many(mosques),
  requests: many(mosqueRequests),
  notifications: many(notifications),
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
}));

export const mosquesRelations = relations(mosques, ({ one, many }) => ({
  registeredByUser: one(users, {
    fields: [mosques.registeredBy],
    references: [users.id],
  }),
  requests: many(mosqueRequests),
  images: many(mosqueImages),
}));

export const mosqueRequestsRelations = relations(mosqueRequests, ({ one, many }) => ({
  mosque: one(mosques, {
    fields: [mosqueRequests.mosqueId],
    references: [mosques.id],
  }),
  user: one(users, {
    fields: [mosqueRequests.userId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [mosqueRequests.assignedTo],
    references: [users.id],
  }),
  attachments: many(requestAttachments),
  comments: many(requestComments),
  history: many(requestHistory),
}));

// ==================== أنواع TypeScript ====================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type Mosque = typeof mosques.$inferSelect;
export type InsertMosque = typeof mosques.$inferInsert;
export type MosqueRequest = typeof mosqueRequests.$inferSelect;
export type InsertMosqueRequest = typeof mosqueRequests.$inferInsert;
export type RequestAttachment = typeof requestAttachments.$inferSelect;
export type RequestComment = typeof requestComments.$inferSelect;
export type RequestHistory = typeof requestHistory.$inferSelect;
export type FieldVisitReport = typeof fieldVisitReports.$inferSelect;
export type QuickResponseReport = typeof quickResponseReports.$inferSelect;
export type FinalReport = typeof finalReports.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectPhase = typeof projectPhases.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type DonationOpportunity = typeof donationOpportunities.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type Quotation = typeof quotations.$inferSelect;
export type QuantitySchedule = typeof quantitySchedules.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type CategoryValue = typeof categoryValues.$inferSelect;
export type BrandSetting = typeof brandSettings.$inferSelect;
export type BrandLogo = typeof brandLogos.$inferSelect;
export type BrandColor = typeof brandColors.$inferSelect;
export type HomepageCustomization = typeof homepageCustomization.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

// تصدير الثوابت
export type UserRole = typeof userRoles[number];
export type ProgramType = typeof programTypes[number];
export type RequestStage = typeof requestStages[number];
export type RequestStatus = typeof requestStatuses[number];
export type MosqueStatus = typeof mosqueStatuses[number];
export type MosqueOwnership = typeof mosqueOwnership[number];
export type UserStatus = typeof userStatuses[number];
