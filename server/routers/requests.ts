import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { 
  mosqueRequests, 
  requestAttachments, 
  requestComments, 
  requestHistory,
  mosques,
  users,
  auditLogs,
  notifications,
  fieldVisitReports,
  quickResponseReports,
  finalReports,
  quantitySchedules,
  quotations,
  projects,
  stageSettings,
  requestStageTracking,
  contractsEnhanced,
} from "../../drizzle/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";
import { 
  STAGE_TRANSITION_PERMISSIONS, 
  STATUS_CHANGE_PERMISSIONS, 
  STAGE_LABELS,
  TECHNICAL_EVAL_OPTIONS,
  TECHNICAL_EVAL_OPTION_LABELS,
  getPrerequisites,
  PREREQUISITE_ERROR_MESSAGES,
  type PrerequisiteType,
} from "@shared/constants";

// دالة إنشاء رقم طلب فريد
function generateRequestNumber(programType: string): string {
  const prefix = programType.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// البرامج التسعة
const programTypes = [
  "bunyan", "daaem", "enaya", "emdad", "ethraa", 
  "sedana", "taqa", "miyah", "suqya"
] as const;

// المراحل الـ 11
const requestStages = [
  "submitted", "initial_review", "field_visit", 
  "technical_eval", "boq_preparation", "financial_eval_and_approval", 
  "contracting", "execution", 
  "handover", "closed"
] as const;

// حالات الطلب
const requestStatuses = [
  "pending", "under_review", "approved", "rejected", 
  "suspended", "in_progress", "completed"
] as const;

// مخطط إنشاء طلب جديد
const createRequestSchema = z.object({
  mosqueId: z.number().optional().nullable(), // اختياري لبرنامج بنيان
  programType: z.enum(programTypes),
  priority: z.enum(["urgent", "medium", "normal"]).default("normal"),
  programData: z.record(z.string(), z.any()).optional(),
  description: z.string().optional(),
});

// مخطط البحث والفلترة
const searchRequestsSchema = z.object({
  search: z.string().optional(),
  programType: z.enum(programTypes).optional(),
  currentStage: z.enum(requestStages).optional(),
  status: z.enum(requestStatuses).optional(),
  priority: z.enum(["urgent", "medium", "normal"]).optional(),
  mosqueId: z.number().optional(),
  assignedTo: z.number().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

export const requestsRouter = router({
  // إنشاء طلب جديد
  create: protectedProcedure
    .input(createRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من وجود المسجد (برنامج بنيان لا يتطلب مسجد)
      let mosqueData = null;
      if (input.programType !== "bunyan") {
        // البرامج الأخرى تتطلب مسجد موجود
        if (!input.mosqueId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "يجب اختيار مسجد لهذا البرنامج" });
        }
        const mosque = await db.select().from(mosques).where(eq(mosques.id, input.mosqueId)).limit(1);
        if (mosque.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "المسجد غير موجود" });
        }
        mosqueData = mosque[0];
      }
      // برنامج بنيان - لا يتطلب مسجد موجود

      // التحقق من اعتماد المسجد (فقط إذا كان البرنامج يتطلب مسجد)
      if (mosqueData && mosqueData.approvalStatus !== "approved" && ctx.user.role === "service_requester") {
        throw new TRPCError({ code: "FORBIDDEN", message: "المسجد غير معتمد بعد" });
      }

      const requestNumber = generateRequestNumber(input.programType);
      const programDataJson = input.programData ? JSON.stringify(input.programData) : null;

      const result = await db.insert(mosqueRequests).values({
        requestNumber,
        mosqueId: input.programType === "bunyan" ? null : input.mosqueId,
        userId: ctx.user.id,
        programType: input.programType,
        currentStage: "submitted",
        status: "pending",
        priority: input.priority,
        programData: input.programData || {},
      });

      const requestId = Number(result[0].insertId);

      // إضافة سجل في تاريخ الطلب
      await db.insert(requestHistory).values({
        requestId,
        userId: ctx.user.id,
        toStage: "submitted",
        toStatus: "pending",
        action: "request_created",
        notes: input.description || "تم تقديم الطلب",
      });

      // تسجيل في سجل التدقيق
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "request_created",
        entityType: "request",
        entityId: requestId,
        newValues: { requestNumber, programType: input.programType, mosqueId: input.mosqueId },
      });

      // إرسال إشعار لمكتب المشاريع
      const projectsOfficeUsers = await db.select().from(users).where(eq(users.role, "projects_office"));
      for (const user of projectsOfficeUsers) {
        await db.insert(notifications).values({
          userId: user.id,
          title: "طلب جديد",
          message: `تم تقديم طلب جديد رقم ${requestNumber} - برنامج ${input.programType}`,
          type: "request_update",
          relatedType: "request",
          relatedId: requestId,
        });
      }

      return { success: true, requestId, requestNumber, message: "تم تقديم الطلب بنجاح" };
    }),

  // الحصول على طلب بالمعرف
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const result = await db.select().from(mosqueRequests).where(eq(mosqueRequests.id, input.id)).limit(1);
      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      const request = result[0];

      // التحقق من الصلاحية
      const isOwner = request.userId === ctx.user.id;
      const isAssigned = request.assignedTo === ctx.user.id;
      const isInternal = ["super_admin", "system_admin", "projects_office", "field_team", "quick_response", "financial", "project_manager"].includes(ctx.user.role);

      if (!isOwner && !isAssigned && !isInternal) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لعرض هذا الطلب" });
      }

      // الحصول على بيانات المسجد (قد يكون null في حالة برنامج بنيان)
      let mosque: typeof mosques.$inferSelect | null = null;
      if (request.mosqueId) {
        const mosqueResult = await db.select().from(mosques).where(eq(mosques.id, request.mosqueId)).limit(1);
        mosque = mosqueResult[0] || null;
      }

      // الحصول على بيانات مقدم الطلب
      const requester = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      }).from(users).where(eq(users.id, request.userId)).limit(1);

      // الحصول على المرفقات
      const attachments = await db.select().from(requestAttachments).where(eq(requestAttachments.requestId, input.id));

      // الحصول على التعليقات (فلترة التعليقات الداخلية لطالبي الخدمة)
      let comments = await db.select({
        id: requestComments.id,
        comment: requestComments.comment,
        isInternal: requestComments.isInternal,
        isRead: requestComments.isRead,
        createdAt: requestComments.createdAt,
        userName: users.name,
        userId: users.id,
      }).from(requestComments)
        .leftJoin(users, eq(requestComments.userId, users.id))
        .where(eq(requestComments.requestId, input.id))
        .orderBy(desc(requestComments.createdAt));

      if (ctx.user.role === "service_requester") {
        comments = comments.filter(c => !c.isInternal);
      }

      // الحصول على سجل الطلب (فقط للموظفين الداخليين)
      let history: any[] = [];
      if (isInternal || isAssigned) {
        history = await db.select({
          id: requestHistory.id,
          fromStage: requestHistory.fromStage,
          toStage: requestHistory.toStage,
          fromStatus: requestHistory.fromStatus,
          toStatus: requestHistory.toStatus,
          action: requestHistory.action,
          notes: requestHistory.notes,
          createdAt: requestHistory.createdAt,
          userName: users.name,
        }).from(requestHistory)
          .leftJoin(users, eq(requestHistory.userId, users.id))
          .where(eq(requestHistory.requestId, input.id))
          .orderBy(desc(requestHistory.createdAt));
      }

      // الحصول على تقارير الزيارات الميدانية (فقط للموظفين)
      let fieldReports: any[] = [];
      let quickReports: any[] = [];
      if (isInternal || isAssigned) {
        fieldReports = await db.select().from(fieldVisitReports).where(eq(fieldVisitReports.requestId, input.id));
        quickReports = await db.select().from(quickResponseReports).where(eq(quickResponseReports.requestId, input.id));
      }

      // حساب نسبة التقدم
      const stages = ["submitted", "initial_review", "field_visit", "technical_eval", "financial_eval_and_approval", "execution", "closed"];
      const currentStageIndex = stages.indexOf(request.currentStage);
      const progressPercentage = Math.round(((currentStageIndex + 1) / stages.length) * 100);

      // الحصول على المشروع المرتبط بالطلب (إن وجد)
      const projectResult = await db.select({
        id: projects.id,
        projectNumber: projects.projectNumber,
        name: projects.name,
        status: projects.status,
      }).from(projects).where(eq(projects.requestId, input.id)).limit(1);
      const project = projectResult[0] || null;

      return {
        ...request,
        mosque: mosque,
        requester: requester[0] || null,
        attachments,
        comments,
        history,
        fieldReports,
        quickReports,
        project,
        progressPercentage,
        isOwner,
      };
    }),

  // البحث والفلترة في الطلبات
  search: protectedProcedure
    .input(searchRequestsSchema)
    .query(async ({ input, ctx }) => {
      console.log('[search] User:', ctx.user.id, 'Role:', ctx.user.role);
      try {
      const db = await getDb();
      if (!db) {
        console.log('[search] No database connection');
        return { requests: [], total: 0 };
      }

      const conditions = [];

      // المدير العام ومكتب المشاريع يرون جميع الطلبات
      const adminRoles = ["super_admin", "projects_office", "financial_manager", "executive_director", "technical_supervisor"];
      
      // طالب الخدمة يرى فقط طلباته
      if (ctx.user.role === "service_requester") {
        conditions.push(eq(mosqueRequests.userId, ctx.user.id));
      }

      // الفريق الميداني يرى الطلبات المسندة إليه أو في مرحلة الزيارة الميدانية
      if (ctx.user.role === "field_team") {
        conditions.push(
          sql`(${mosqueRequests.assignedTo} = ${ctx.user.id} OR ${mosqueRequests.currentStage} = 'field_visit')`
        );
      }

      // فريق الاستجابة السريعة
      if (ctx.user.role === "quick_response") {
        conditions.push(
          sql`(${mosqueRequests.assignedTo} = ${ctx.user.id} OR ${mosqueRequests.priority} = 'urgent')`
        );
      }
      
      // الأدوار الإدارية ترى جميع الطلبات (لا تضيف شروط)

      if (input.search) {
        conditions.push(
          sql`${mosqueRequests.requestNumber} LIKE ${`%${input.search}%`}`
        );
      }
      if (input.programType) {
        conditions.push(eq(mosqueRequests.programType, input.programType));
      }
      if (input.currentStage) {
        conditions.push(eq(mosqueRequests.currentStage, input.currentStage));
      }
      if (input.status) {
        conditions.push(eq(mosqueRequests.status, input.status));
      }
      if (input.priority) {
        conditions.push(eq(mosqueRequests.priority, input.priority));
      }
      if (input.mosqueId) {
        conditions.push(eq(mosqueRequests.mosqueId, input.mosqueId));
      }
      if (input.assignedTo) {
        conditions.push(eq(mosqueRequests.assignedTo, input.assignedTo));
      }

      const offset = (input.page - 1) * input.limit;

      let query = db.select({
        request: mosqueRequests,
        mosqueName: mosques.name,
        mosqueCity: mosques.city,
        requesterName: users.name,
      }).from(mosqueRequests)
        .leftJoin(mosques, eq(mosqueRequests.mosqueId, mosques.id))
        .leftJoin(users, eq(mosqueRequests.userId, users.id));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }

      const results = await query.orderBy(desc(mosqueRequests.createdAt)).limit(input.limit).offset(offset);
      console.log('[search] Results count:', results.length);

      // الحصول على العدد الإجمالي
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(mosqueRequests);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as typeof countQuery;
      }
      const countResult = await countQuery;
      const total = countResult[0]?.count || 0;
      console.log('[search] Total count:', total, 'Conditions:', conditions.length);

      return {
        requests: results.map(r => ({
          ...r.request,
          mosqueName: r.mosqueName,
          mosqueCity: r.mosqueCity,
          requesterName: r.requesterName,
        })),
        total,
      };
      } catch (error) {
        console.error('[search] Error:', error);
        throw error;
      }
    }),

  // الحصول على طلبات المستخدم الحالي
  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const results = await db.select({
      request: mosqueRequests,
      mosqueName: mosques.name,
      mosqueCity: mosques.city,
    }).from(mosqueRequests)
      .leftJoin(mosques, eq(mosqueRequests.mosqueId, mosques.id))
      .where(eq(mosqueRequests.userId, ctx.user.id))
      .orderBy(desc(mosqueRequests.createdAt));

    return results.map(r => ({
      ...r.request,
      mosqueName: r.mosqueName,
      mosqueCity: r.mosqueCity,
    }));
  }),

  // تحديث مرحلة الطلب
  updateStage: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      newStage: z.enum(requestStages),
      notes: z.string().optional(),
      skipPrerequisites: z.boolean().optional(), // للاستخدام في حالات خاصة فقط
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const request = await db.select().from(mosqueRequests).where(eq(mosqueRequests.id, input.requestId)).limit(1);
      if (request.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      const oldStage = request[0].currentStage;
      const requestTrack = request[0].requestTrack || 'standard';

      // التحقق من صلاحية تحويل المرحلة حسب المرحلة الحالية والدور
      const allowedRoles = STAGE_TRANSITION_PERMISSIONS[oldStage] || [];
      if (!allowedRoles.includes(ctx.user.role)) {
        const currentStageName = STAGE_LABELS[oldStage] || oldStage;
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: `ليس لديك صلاحية لتحويل الطلب من مرحلة "${currentStageName}". الأدوار المسموح لها: ${allowedRoles.map(r => r).join(', ')}` 
        });
      }

      // التحقق من أن المرحلة الجديدة هي المرحلة التالية المنطقية
      // المراحل الـ 11 الجديدة
      const standardStages = ["submitted", "initial_review", "field_visit", "technical_eval", "boq_preparation", "financial_eval_and_approval", "contracting", "execution", "handover", "closed"];
      const quickResponseStages = ["submitted", "initial_review", "field_visit", "technical_eval", "execution", "closed"];
      
      // تحديد المسار بناءً على نوع الطلب
      const isQuickResponse = requestTrack === 'quick_response' || request[0].technicalEvalDecision === 'quick_response';
      const stages = isQuickResponse ? quickResponseStages : standardStages;
      const currentIndex = stages.indexOf(oldStage);
      const newIndex = stages.indexOf(input.newStage);
      
      // السماح فقط بالتقدم للمرحلة التالية (وليس القفز)
      if (newIndex !== currentIndex + 1) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "يمكن فقط التحويل للمرحلة التالية مباشرة" 
        });
      }

      // التحقق من الشروط المسبقة للانتقال
      // ملاحظة: لا يمكن تجاوز الشروط الحرجة (المراجعة الأولية، الزيارة الميدانية) حتى مع skipPrerequisites
      const criticalStages = ['initial_review', 'field_visit'];
      const isCriticalTransition = criticalStages.includes(input.newStage);
      
      if (!input.skipPrerequisites || isCriticalTransition) {
        const prerequisites = getPrerequisites(oldStage, input.newStage, requestTrack);
        const missingPrerequisites: string[] = [];

        for (const prereq of prerequisites) {
          if (!prereq.required) continue;

          let isMet = false;

          // التحقق من تقرير المعاينة الميدانية
          if (prereq.type === 'field_inspection_report') {
            const reports = await db.select().from(fieldVisitReports)
              .where(eq(fieldVisitReports.requestId, input.requestId)).limit(1);
            isMet = reports.length > 0;
          }
          // التحقق من تقرير الاستجابة السريعة
          else if (prereq.type === 'quick_response_report') {
            const reports = await db.select().from(quickResponseReports)
              .where(eq(quickResponseReports.requestId, input.requestId)).limit(1);
            isMet = reports.length > 0;
          }
          // التحقق من قرار التقييم الفني
          else if (prereq.type === 'technical_eval_decision') {
            isMet = !!request[0].technicalEvalDecision;
          }
          // التحقق من وجود جدول الكميات
          else if (prereq.type === 'boq_created') {
            const boqItems = await db.select().from(quantitySchedules)
              .where(eq(quantitySchedules.requestId, input.requestId)).limit(1);
            isMet = boqItems.length > 0;
          }
          // التحقق من وجود عروض أسعار مستلمة
          else if (prereq.type === 'quotes_received') {
            const quotes = await db.select({ id: quotations.id }).from(quotations)
              .where(eq(quotations.requestId, input.requestId)).limit(1);
            isMet = quotes.length > 0;
          }
          // التحقق من وجود عرض سعر معتمد
          else if (prereq.type === 'supplier_selected') {
            const acceptedQuotes = await db.select({ id: quotations.id }).from(quotations)
              .where(and(
                eq(quotations.requestId, input.requestId),
                inArray(quotations.status, ['accepted', 'approved'])
              )).limit(1);
            isMet = acceptedQuotes.length > 0;
          }
          // التحقق من وجود عقد موقع/معتمد
          else if (prereq.type === 'contract_signed') {
            const signedContracts = await db.select({ id: contractsEnhanced.id }).from(contractsEnhanced)
              .where(and(
                eq(contractsEnhanced.requestId, input.requestId),
                inArray(contractsEnhanced.status, ['approved', 'active'])
              )).limit(1);
            isMet = signedContracts.length > 0;
          }
          // التحقق من وجود تقرير نهائي
          else if (prereq.type === 'final_report') {
            const reports = await db.select({ id: finalReports.id }).from(finalReports)
              .where(eq(finalReports.requestId, input.requestId)).limit(1);
            isMet = reports.length > 0;
          }

          if (!isMet) {
            missingPrerequisites.push(PREREQUISITE_ERROR_MESSAGES[prereq.type]);
          }
        }

        if (missingPrerequisites.length > 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `لا يمكن الانتقال للمرحلة التالية. الشروط المطلوبة:\n- ${missingPrerequisites.join('\n- ')}`,
          });
        }
      }

      // تحديد المسؤول الحالي والإدارة حسب المرحلة الجديدة
      let currentResponsible = ctx.user.id;
      let currentResponsibleDepartment = "مكتب المشاريع";
      
      // تحديد الإدارة المسؤولة حسب المرحلة
      const stageDepartmentMap: Record<string, string> = {
        submitted: "مكتب المشاريع",
        initial_review: "مكتب المشاريع",
        field_visit: "الفريق الميداني",
        technical_eval: "مكتب المشاريع",
        boq_preparation: "مكتب المشاريع",
        financial_eval_and_approval: "الإدارة المالية",
        contracting: "مكتب المشاريع",
        execution: requestTrack === 'quick_response' ? "فريق الاستجابة السريعة" : "مدير المشروع",
        handover: "مكتب المشاريع",
        closed: "مكتب المشاريع",
      };
      
      currentResponsibleDepartment = stageDepartmentMap[input.newStage] || "مكتب المشاريع";

      await db.update(mosqueRequests).set({
        currentStage: input.newStage,
        status: input.newStage === "closed" ? "completed" : "in_progress",
        currentResponsible: currentResponsible,
        currentResponsibleDepartment: currentResponsibleDepartment,
      }).where(eq(mosqueRequests.id, input.requestId));

      // إضافة سجل في تاريخ الطلب
      const newStageName = STAGE_LABELS[input.newStage] || input.newStage;
      await db.insert(requestHistory).values({
        requestId: input.requestId,
        userId: ctx.user.id,
        fromStage: oldStage,
        toStage: input.newStage,
        action: "stage_updated",
        notes: input.notes || `تم تحويل الطلب إلى مرحلة ${newStageName}`,
      });

      // إرسال إشعار لمقدم الطلب
      await db.insert(notifications).values({
        userId: request[0].userId,
        title: "تحديث مرحلة الطلب",
        message: `تم تحويل طلبك رقم ${request[0].requestNumber} إلى مرحلة ${newStageName}`,
        type: "request_update",
        relatedType: "request",
        relatedId: input.requestId,
      });

      // تسجيل بداية المرحلة الجديدة للتتبع
      const [stageSetting] = await db.select().from(stageSettings)
        .where(eq(stageSettings.stageCode, input.newStage)).limit(1);
      
      if (stageSetting) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + stageSetting.durationDays);
        
        await db.insert(requestStageTracking).values({
          requestId: input.requestId,
          stageCode: input.newStage,
          startedAt: new Date(),
          dueAt: dueDate,
          assignedTo: ctx.user.id,
        });
      }

      return { success: true, message: `تم تحويل الطلب إلى مرحلة ${newStageName} بنجاح` };
    }),

  // تحديث حالة الطلب
  updateStatus: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      newStatus: z.enum(requestStatuses),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const allowedRoles = ["super_admin", "system_admin", "projects_office"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لتحديث حالة الطلب" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const request = await db.select().from(mosqueRequests).where(eq(mosqueRequests.id, input.requestId)).limit(1);
      if (request.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      const oldStatus = request[0].status;

      await db.update(mosqueRequests).set({
        status: input.newStatus,
        reviewedAt: input.newStatus === "under_review" ? new Date() : request[0].reviewedAt,
        approvedAt: input.newStatus === "approved" ? new Date() : request[0].approvedAt,
        completedAt: input.newStatus === "completed" ? new Date() : request[0].completedAt,
      }).where(eq(mosqueRequests.id, input.requestId));

      await db.insert(requestHistory).values({
        requestId: input.requestId,
        userId: ctx.user.id,
        fromStatus: oldStatus,
        toStatus: input.newStatus,
        action: "status_updated",
        notes: input.notes || `تم تغيير الحالة من ${oldStatus} إلى ${input.newStatus}`,
      });

      // إرسال إشعار لمقدم الطلب
      await db.insert(notifications).values({
        userId: request[0].userId,
        title: "تحديث حالة الطلب",
        message: `تم تحديث حالة طلبك رقم ${request[0].requestNumber} إلى ${input.newStatus}`,
        type: "request_update",
        relatedType: "request",
        relatedId: input.requestId,
      });

      return { success: true, message: "تم تحديث حالة الطلب بنجاح" };
    }),

  // إسناد الطلب لموظف
  assignTo: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const allowedRoles = ["super_admin", "system_admin", "projects_office"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لإسناد الطلبات" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      await db.update(mosqueRequests).set({
        assignedTo: input.userId,
      }).where(eq(mosqueRequests.id, input.requestId));

      // إرسال إشعار للموظف المسند إليه
      const request = await db.select().from(mosqueRequests).where(eq(mosqueRequests.id, input.requestId)).limit(1);
      if (request.length > 0) {
        await db.insert(notifications).values({
          userId: input.userId,
          title: "طلب جديد مسند إليك",
          message: `تم إسناد الطلب رقم ${request[0].requestNumber} إليك`,
          type: "request_update",
          relatedType: "request",
          relatedId: input.requestId,
        });
      }

      return { success: true, message: "تم إسناد الطلب بنجاح" };
    }),

  // إضافة تعليق
  addComment: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      comment: z.string().min(1),
      isInternal: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // طالب الخدمة لا يمكنه إضافة تعليقات داخلية
      const isInternal = ctx.user.role === "service_requester" ? false : input.isInternal;

      await db.insert(requestComments).values({
        requestId: input.requestId,
        userId: ctx.user.id,
        comment: input.comment,
        isInternal,
      });

      return { success: true, message: "تم إضافة التعليق بنجاح" };
    }),

  // إضافة مرفق
  addAttachment: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      fileName: z.string(),
      fileUrl: z.string().url(),
      fileType: z.string().optional(),
      fileSize: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      await db.insert(requestAttachments).values({
        requestId: input.requestId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileType: input.fileType || "document",
        fileSize: input.fileSize || null,
        uploadedBy: ctx.user.id,
      });

      return { success: true, message: "تم إضافة المرفق بنجاح" };
    }),

  // إحصائيات الطلبات
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, byProgram: {}, byStage: {}, byStatus: {} };

    const conditions = [];
    if (ctx.user.role === "service_requester") {
      conditions.push(eq(mosqueRequests.userId, ctx.user.id));
    }

    let totalQuery = db.select({ count: sql<number>`count(*)` }).from(mosqueRequests);
    if (conditions.length > 0) {
      totalQuery = totalQuery.where(and(...conditions)) as typeof totalQuery;
    }
    const total = await totalQuery;

    const byProgram = await db.select({
      programType: mosqueRequests.programType,
      count: sql<number>`count(*)`,
    }).from(mosqueRequests).groupBy(mosqueRequests.programType);

    const byStage = await db.select({
      currentStage: mosqueRequests.currentStage,
      count: sql<number>`count(*)`,
    }).from(mosqueRequests).groupBy(mosqueRequests.currentStage);

    const byStatus = await db.select({
      status: mosqueRequests.status,
      count: sql<number>`count(*)`,
    }).from(mosqueRequests).groupBy(mosqueRequests.status);

    return {
      total: total[0]?.count || 0,
      byProgram: Object.fromEntries(byProgram.map(p => [p.programType, p.count])),
      byStage: Object.fromEntries(byStage.map(s => [s.currentStage, s.count])),
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s.count])),
    };
  }),

  // إضافة تقرير زيارة ميدانية
  addFieldVisitReport: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      visitDate: z.string(),
      // التقييم الفني
      mosqueCondition: z.string().optional(),
      conditionRating: z.enum(["excellent", "good", "fair", "poor", "critical"]).optional(),
      // مساحة مصلى الرجال
      menPrayerLength: z.number().optional(),
      menPrayerWidth: z.number().optional(),
      menPrayerHeight: z.number().optional(),
      // مساحة مصلى النساء
      womenPrayerExists: z.boolean().optional(),
      womenPrayerLength: z.number().optional(),
      womenPrayerWidth: z.number().optional(),
      womenPrayerHeight: z.number().optional(),
      // الاحتياج والتوصيف
      requiredNeeds: z.string().optional(),
      generalDescription: z.string().optional(),
      // فريق المعاينة
      teamMember1: z.string().optional(),
      teamMember2: z.string().optional(),
      teamMember3: z.string().optional(),
      teamMember4: z.string().optional(),
      teamMember5: z.string().optional(),
      // الحقول القديمة للتوافق
      findings: z.string().optional(),
      recommendations: z.string().optional(),
      estimatedCost: z.number().optional(),
      technicalNeeds: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!["field_team", "projects_office", "super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لإضافة تقارير ميدانية" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      await db.insert(fieldVisitReports).values({
        requestId: input.requestId,
        visitedBy: ctx.user.id,
        visitDate: new Date(input.visitDate),
        mosqueCondition: input.mosqueCondition || null,
        conditionRating: input.conditionRating || null,
        menPrayerLength: input.menPrayerLength?.toString() || null,
        menPrayerWidth: input.menPrayerWidth?.toString() || null,
        menPrayerHeight: input.menPrayerHeight?.toString() || null,
        womenPrayerExists: input.womenPrayerExists || false,
        womenPrayerLength: input.womenPrayerLength?.toString() || null,
        womenPrayerWidth: input.womenPrayerWidth?.toString() || null,
        womenPrayerHeight: input.womenPrayerHeight?.toString() || null,
        requiredNeeds: input.requiredNeeds || null,
        generalDescription: input.generalDescription || null,
        teamMember1: input.teamMember1 || null,
        teamMember2: input.teamMember2 || null,
        teamMember3: input.teamMember3 || null,
        teamMember4: input.teamMember4 || null,
        teamMember5: input.teamMember5 || null,
        findings: input.findings || input.requiredNeeds || null,
        recommendations: input.recommendations || null,
        estimatedCost: input.estimatedCost?.toString() || null,
        technicalNeeds: input.technicalNeeds || null,
      });

      // تحديث مرحلة الطلب
      await db.update(mosqueRequests).set({
        currentStage: "technical_eval",
        estimatedCost: input.estimatedCost?.toString() || null,
      }).where(eq(mosqueRequests.id, input.requestId));

      return { success: true, message: "تم إضافة تقرير الزيارة الميدانية بنجاح" };
    }),

  // إضافة تقرير استجابة سريعة
  addQuickResponseReport: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      responseDate: z.string(),
      // التقييم الفني
      technicalEvaluation: z.string().optional(),
      finalEvaluation: z.string().optional(),
      // الأعمال غير المنفذة
      unexecutedWorks: z.string().optional(),
      // الفني المختص
      technicianName: z.string().optional(),
      // الحقول القديمة للتوافق
      issueDescription: z.string(),
      actionsTaken: z.string(),
      resolved: z.boolean().default(false),
      requiresProject: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!["quick_response", "projects_office", "super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لإضافة تقارير الاستجابة السريعة" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      await db.insert(quickResponseReports).values({
        requestId: input.requestId,
        respondedBy: ctx.user.id,
        responseDate: new Date(input.responseDate),
        technicalEvaluation: input.technicalEvaluation || null,
        finalEvaluation: input.finalEvaluation || null,
        unexecutedWorks: input.unexecutedWorks || null,
        technicianName: input.technicianName || null,
        issueDescription: input.issueDescription,
        actionsTaken: input.actionsTaken,
        resolved: input.resolved,
        requiresProject: input.requiresProject,
      });

      // إذا تم حل المشكلة، إغلاق الطلب
      if (input.resolved && !input.requiresProject) {
        await db.update(mosqueRequests).set({
          currentStage: "closed",
          status: "completed",
          completedAt: new Date(),
        }).where(eq(mosqueRequests.id, input.requestId));
      }

      return { success: true, message: "تم إضافة تقرير الاستجابة السريعة بنجاح" };
    }),

  // التقييم الفني - الخيارات الأربعة
  technicalEvalDecision: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      decision: z.enum(['apologize', 'suspend', 'quick_response', 'convert_to_project']),
      justification: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من وجود الطلب
      const request = await db.select().from(mosqueRequests).where(eq(mosqueRequests.id, input.requestId)).limit(1);
      if (request.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      // التحقق من أن الطلب في مرحلة التقييم الفني
      if (request[0].currentStage !== 'technical_eval') {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "يمكن اتخاذ هذا القرار فقط في مرحلة التقييم الفني" 
        });
      }

      // التحقق من الصلاحيات
      const option = TECHNICAL_EVAL_OPTIONS[input.decision];
      if (!(option.allowedRoles as readonly string[]).includes(ctx.user.role)) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: `ليس لديك صلاحية لاتخاذ قرار "${option.name}"` 
        });
      }

      // التحقق من وجود المبررات إذا كانت مطلوبة
      if (option.requiresJustification && !input.justification) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "يجب ذكر المبررات لهذا القرار" 
        });
      }

      // تحديث الطلب حسب القرار
      const updateData: any = {
        status: option.resultStatus,
      };

      // تحديد المرحلة التالية
      if (option.nextStage) {
        updateData.currentStage = option.nextStage;
      }

      // إذا كان القرار هو التحويل للاستجابة السريعة، تحديد المسار
      if (input.decision === 'quick_response') {
        updateData.requestTrack = 'quick_response';
      }

      // إذا كان القرار هو الاعتذار، تحديد تاريخ الإغلاق
      if (input.decision === 'apologize') {
        updateData.completedAt = new Date();
      }

      await db.update(mosqueRequests).set(updateData).where(eq(mosqueRequests.id, input.requestId));

      // إضافة سجل في تاريخ الطلب
      const actionNote = input.justification 
        ? `${option.name}: ${input.justification}`
        : option.name;
      
      await db.insert(requestHistory).values({
        requestId: input.requestId,
        userId: ctx.user.id,
        fromStage: 'technical_eval',
        toStage: option.nextStage || 'technical_eval',
        fromStatus: request[0].status,
        toStatus: option.resultStatus,
        action: `technical_eval_${input.decision}`,
        notes: input.notes || actionNote,
      });

      // إرسال إشعار لمقدم الطلب
      let notificationMessage = '';
      switch (input.decision) {
        case 'apologize':
          notificationMessage = `نعتذر عن عدم إمكانية تنفيذ طلبك رقم ${request[0].requestNumber}`;
          break;
        case 'suspend':
          notificationMessage = `تم تعليق طلبك رقم ${request[0].requestNumber} مؤقتاً`;
          break;
        case 'quick_response':
          notificationMessage = `تم تحويل طلبك رقم ${request[0].requestNumber} لفريق الاستجابة السريعة`;
          break;
        case 'convert_to_project':
          notificationMessage = `تم اعتماد طلبك رقم ${request[0].requestNumber} وتحويله إلى مشروع`;
          break;
      }

      await db.insert(notifications).values({
        userId: request[0].userId,
        title: `تحديث التقييم الفني`,
        message: notificationMessage,
        type: "request_update",
        relatedType: "request",
        relatedId: input.requestId,
      });

      // إرسال إشعارات للفريق المختص حسب المسار
      if (input.decision === 'quick_response') {
        // إشعار فريق الاستجابة السريعة
        const quickResponseTeam = await db.select({ id: users.id })
          .from(users)
          .where(eq(users.role, 'quick_response'));
        
        for (const member of quickResponseTeam) {
          await db.insert(notifications).values({
            userId: member.id,
            title: 'طلب جديد للاستجابة السريعة',
            message: `تم تحويل الطلب رقم ${request[0].requestNumber} إلى مسار الاستجابة السريعة`,
            type: 'info',
            relatedType: 'request',
            relatedId: input.requestId,
          });
        }
      } else if (input.decision === 'convert_to_project') {
        // إشعار الإدارة المالية ومكتب المشاريع
        const financialTeam = await db.select({ id: users.id })
          .from(users)
          .where(inArray(users.role, ['financial', 'projects_office']));
        
        for (const member of financialTeam) {
          await db.insert(notifications).values({
            userId: member.id,
            title: 'مشروع جديد للتقييم المالي',
            message: `تم تحويل الطلب رقم ${request[0].requestNumber} إلى مشروع ويحتاج للتقييم المالي`,
            type: 'info',
            relatedType: 'request',
            relatedId: input.requestId,
          });
        }
      }

      return { 
        success: true, 
        message: `تم ${option.name} بنجاح`,
        nextStage: option.nextStage,
        newStatus: option.resultStatus,
      };
    }),

  // إسناد الزيارة الميدانية لموظف
  assignFieldVisit: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      assignedTo: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!["projects_office", "super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية إسناد الزيارات الميدانية" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من وجود الطلب
      const request = await db.select().from(mosqueRequests).where(eq(mosqueRequests.id, input.requestId)).limit(1);
      if (request.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      // التحقق من وجود الموظف
      const assignee = await db.select().from(users).where(eq(users.id, input.assignedTo)).limit(1);
      if (assignee.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الموظف غير موجود" });
      }

      await db.update(mosqueRequests).set({
        fieldVisitAssignedTo: input.assignedTo,
        fieldVisitNotes: input.notes || null,
      }).where(eq(mosqueRequests.id, input.requestId));

      // إرسال إشعار للموظف المسند إليه
      await db.insert(notifications).values({
        userId: input.assignedTo,
        title: 'مهمة زيارة ميدانية جديدة',
        message: `تم إسناد الطلب رقم ${request[0].requestNumber} إليك للزيارة الميدانية`,
        type: 'info',
        relatedType: 'request',
        relatedId: input.requestId,
      });

      // إضافة سجل في تاريخ الطلب
      await db.insert(requestHistory).values({
        requestId: input.requestId,
        userId: ctx.user.id,
        action: 'field_visit_assigned',
        notes: `تم إسناد الزيارة الميدانية إلى ${assignee[0].name}`,
      });

      return { success: true, message: `تم إسناد الزيارة الميدانية إلى ${assignee[0].name}` };
    }),

  // جدولة الزيارة الميدانية
  scheduleFieldVisit: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      scheduledDate: z.string(),
      scheduledTime: z.string().optional(),
      notes: z.string().optional(),
      contactName: z.string().optional(), // اسم الشخص المسؤول
      contactTitle: z.string().optional(), // صفة الشخص
      contactPhone: z.string().optional(), // رقم جوال الشخص
    }))
    .mutation(async ({ input, ctx }) => {
      if (!["field_team", "projects_office", "super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية جدولة الزيارات الميدانية" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من وجود الطلب
      const request = await db.select().from(mosqueRequests).where(eq(mosqueRequests.id, input.requestId)).limit(1);
      if (request.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      await db.update(mosqueRequests).set({
        fieldVisitScheduledDate: new Date(input.scheduledDate),
        fieldVisitScheduledTime: input.scheduledTime || null,
        fieldVisitNotes: input.notes || request[0].fieldVisitNotes,
        fieldVisitContactName: input.contactName || null,
        fieldVisitContactTitle: input.contactTitle || null,
        fieldVisitContactPhone: input.contactPhone || null,
      }).where(eq(mosqueRequests.id, input.requestId));

      // إرسال إشعار لمقدم الطلب
      await db.insert(notifications).values({
        userId: request[0].userId,
        title: 'تم جدولة زيارة ميدانية',
        message: `تم جدولة زيارة ميدانية لطلبك رقم ${request[0].requestNumber} بتاريخ ${new Date(input.scheduledDate).toLocaleDateString('ar-SA')}`,
        type: 'info',
        relatedType: 'request',
        relatedId: input.requestId,
      });

      // إضافة سجل في تاريخ الطلب
      await db.insert(requestHistory).values({
        requestId: input.requestId,
        userId: ctx.user.id,
        action: 'field_visit_scheduled',
        notes: `تم جدولة الزيارة الميدانية بتاريخ ${new Date(input.scheduledDate).toLocaleDateString('ar-SA')} ${input.scheduledTime || ''}`,
      });

      return { success: true, message: 'تم جدولة الزيارة الميدانية بنجاح' };
    }),

  // الحصول على الزيارات المجدولة (تقويم الزيارات)
  getScheduledVisits: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      assignedTo: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!["field_team", "projects_office", "super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية عرض تقويم الزيارات" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // إذا كان المستخدم من الفريق الميداني، يرى فقط الزيارات المسندة إليه
      const assignedToFilter = ctx.user.role === 'field_team' 
        ? ctx.user.id 
        : input.assignedTo;

      const conditions = [sql`${mosqueRequests.fieldVisitScheduledDate} IS NOT NULL`];
      
      if (assignedToFilter) {
        conditions.push(eq(mosqueRequests.fieldVisitAssignedTo, assignedToFilter));
      }

      const visits = await db.select({
        id: mosqueRequests.id,
        requestNumber: mosqueRequests.requestNumber,
        programType: mosqueRequests.programType,
        currentStage: mosqueRequests.currentStage,
        scheduledDate: mosqueRequests.fieldVisitScheduledDate,
        scheduledTime: mosqueRequests.fieldVisitScheduledTime,
        notes: mosqueRequests.fieldVisitNotes,
        assignedToId: mosqueRequests.fieldVisitAssignedTo,
        mosqueId: mosqueRequests.mosqueId,
        mosqueName: mosques.name,
        mosqueCity: mosques.city,
        assignedToName: users.name,
      })
        .from(mosqueRequests)
        .leftJoin(mosques, eq(mosqueRequests.mosqueId, mosques.id))
        .leftJoin(users, eq(mosqueRequests.fieldVisitAssignedTo, users.id))
        .where(and(...conditions))
        .orderBy(mosqueRequests.fieldVisitScheduledDate);

      return visits;
    }),

  // الحصول على موظفي الفريق الميداني
  getFieldTeamMembers: protectedProcedure
    .query(async ({ ctx }) => {
      if (!["projects_office", "super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية عرض موظفي الفريق الميداني" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const members = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
        .from(users)
        .where(inArray(users.role, ['field_team', 'projects_office', 'super_admin', 'system_admin']))
        .orderBy(users.name);

      return members;
    }),

  // الحصول على طلب برقم الطلب (للتتبع العام)
  getByNumber: publicProcedure
    .input(z.object({ requestNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const result = await db.select().from(mosqueRequests).where(eq(mosqueRequests.requestNumber, input.requestNumber)).limit(1);
      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      const request = result[0];
      
      // إرجاع معلومات محدودة للعامة
      return {
        requestNumber: request.requestNumber,
        programType: request.programType,
        currentStage: request.currentStage,
        status: request.status,
        priority: request.priority,
        createdAt: request.createdAt,
        reviewedAt: request.reviewedAt,
        approvedAt: request.approvedAt,
        completedAt: request.completedAt,
      };
    }),

  // اختيار عرض السعر الفائز للاعتماد المالي
  selectWinningQuotation: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      quotationId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // التحقق من الصلاحيات (الإدارة المالية أو المدير العام)
      if (!["financial", "super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لاختيار عرض السعر الفائز" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من وجود الطلب
      const request = await db.select().from(mosqueRequests).where(eq(mosqueRequests.id, input.requestId)).limit(1);
      if (request.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      // التحقق من أن الطلب في مرحلة التقييم المالي
      if (request[0].currentStage !== "financial_eval_and_approval") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "يمكن اختيار عرض السعر فقط في مرحلة التقييم المالي واعتماد العرض" });
      }

      // التحقق من وجود عرض السعر
      const quotation = await db.select().from(quotations).where(eq(quotations.id, input.quotationId)).limit(1);
      if (quotation.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "عرض السعر غير موجود" });
      }

      // التحقق من أن عرض السعر يخص الطلب نفسه
      if (quotation[0].requestId !== input.requestId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "عرض السعر لا يخص هذا الطلب" });
      }

      // تحديث الطلب بعرض السعر المختار (حفظ quotationNumber)
      await db.update(mosqueRequests).set({
        selectedQuotationId: quotation[0].quotationNumber,
      }).where(eq(mosqueRequests.id, input.requestId));

      // إضافة سجل في تاريخ الطلب
      await db.insert(requestHistory).values({
        requestId: input.requestId,
        userId: ctx.user.id,
        fromStage: "financial_eval_and_approval",
        toStage: "financial_eval_and_approval",
        fromStatus: request[0].status,
        toStatus: request[0].status,
        action: "select_winning_quotation",
        notes: `تم اختيار عرض السعر ${quotation[0].quotationNumber} كعرض فائز`,
      });

      return { success: true, message: "تم اختيار عرض السعر الفائز بنجاح" };
    }),

  // الاعتماد المالي النهائي والانتقال للتنفيذ
  approveFinancially: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      approvalNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // التحقق من الصلاحيات (الإدارة المالية أو المدير العام)
      if (!["financial", "super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية للاعتماد المالي" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من وجود الطلب
      const request = await db.select().from(mosqueRequests).where(eq(mosqueRequests.id, input.requestId)).limit(1);
      if (request.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      // التحقق من أن الطلب في مرحلة التقييم المالي
      if (request[0].currentStage !== "financial_eval_and_approval") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "يمكن الاعتماد المالي فقط في مرحلة التقييم المالي واعتماد العرض" });
      }

      // التحقق من وجود عرض سعر مختار
      if (!request[0].selectedQuotationId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "يجب اختيار عرض سعر أولاً" });
      }

      // جلب بيانات عرض السعر المختار
      const quotation = await db.select().from(quotations).where(eq(quotations.quotationNumber, request[0].selectedQuotationId)).limit(1);
      if (quotation.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "عرض السعر المختار غير موجود" });
      }

      const finalAmount = parseFloat(quotation[0].finalAmount || "0");

      // تحديث الطلب: الانتقال لمرحلة التعاقد وحفظ الميزانية المعتمدة
      await db.update(mosqueRequests).set({
        currentStage: "contracting",
        status: "approved",
        approvedBudget: finalAmount.toString(),
        approvedAt: new Date(),
      }).where(eq(mosqueRequests.id, input.requestId));

      // تحديث حالة عرض السعر إلى "accepted"
      await db.update(quotations).set({
        status: "accepted",
      }).where(eq(quotations.quotationNumber, request[0].selectedQuotationId));

      // إضافة سجل في تاريخ الطلب
      const notes = input.approvalNotes 
        ? `الاعتماد المالي: ${finalAmount.toLocaleString("ar-SA")} ريال. ${input.approvalNotes}`
        : `الاعتماد المالي: ${finalAmount.toLocaleString("ar-SA")} ريال`;
      
      await db.insert(requestHistory).values({
        requestId: input.requestId,
        userId: ctx.user.id,
        fromStage: "financial_eval_and_approval",
        toStage: "contracting",
        fromStatus: request[0].status,
        toStatus: "approved",
        action: "financial_approval",
        notes,
      });

      // إرسال إشعار لمقدم الطلب
      await db.insert(notifications).values({
        userId: request[0].userId,
        title: "تم اعتماد طلبك مالياً",
        message: `تم اعتماد طلبك رقم ${request[0].requestNumber} مالياً بمبلغ ${finalAmount.toLocaleString("ar-SA")} ريال وتم الانتقال لمرحلة التعاقد`,
        type: "request_update",
        relatedType: "request",
        relatedId: input.requestId,
      });

      return { success: true, message: "تم الاعتماد المالي بنجاح وتم الانتقال لمرحلة التعاقد" };
    }),

  // حساب عدد التعليقات غير المقروءة
  getUnreadCommentsCount: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const result = await db.select({ count: sql<number>`count(*)` })
        .from(requestComments)
        .where(
          and(
            eq(requestComments.requestId, input.requestId),
            eq(requestComments.isRead, false)
          )
        );

      return { count: result[0]?.count || 0 };
    }),

    // تحديث التعليقات كمقروءة
  markCommentsAsRead: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
      await db.update(requestComments)
        .set({ isRead: true })
        .where(eq(requestComments.requestId, input.requestId));
      return { success: true };
    }),

  // تحديث حالة إتمام المراجعة الأولية
  updateReviewCompleted: protectedProcedure
    .input(z.object({ 
      requestId: z.number(),
      reviewCompleted: z.boolean()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });
      
      await db.update(mosqueRequests)
        .set({ reviewCompleted: input.reviewCompleted })
        .where(eq(mosqueRequests.id, input.requestId));
      
      return { success: true };
    }),
});
