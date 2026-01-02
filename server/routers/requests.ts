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
} from "../../drizzle/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";

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

// المراحل السبع
const requestStages = [
  "submitted", "initial_review", "field_visit", 
  "technical_eval", "financial_eval", "execution", "closed"
] as const;

// حالات الطلب
const requestStatuses = [
  "pending", "under_review", "approved", "rejected", 
  "suspended", "in_progress", "completed"
] as const;

// مخطط إنشاء طلب جديد
const createRequestSchema = z.object({
  mosqueId: z.number(),
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

      // التحقق من وجود المسجد
      const mosque = await db.select().from(mosques).where(eq(mosques.id, input.mosqueId)).limit(1);
      if (mosque.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "المسجد غير موجود" });
      }

      // التحقق من اعتماد المسجد
      if (mosque[0].approvalStatus !== "approved" && ctx.user.role === "service_requester") {
        throw new TRPCError({ code: "FORBIDDEN", message: "المسجد غير معتمد بعد" });
      }

      const requestNumber = generateRequestNumber(input.programType);
      const programDataJson = input.programData ? JSON.stringify(input.programData) : null;

      const result = await db.insert(mosqueRequests).values({
        requestNumber,
        mosqueId: input.mosqueId,
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

      // الحصول على بيانات المسجد
      const mosque = await db.select().from(mosques).where(eq(mosques.id, request.mosqueId)).limit(1);

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

      // الحصول على سجل الطلب
      const history = await db.select({
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

      // الحصول على تقارير الزيارات الميدانية
      const fieldReports = await db.select().from(fieldVisitReports).where(eq(fieldVisitReports.requestId, input.id));

      // الحصول على تقارير الاستجابة السريعة
      const quickReports = await db.select().from(quickResponseReports).where(eq(quickResponseReports.requestId, input.id));

      return {
        ...request,
        mosque: mosque[0] || null,
        requester: requester[0] || null,
        attachments,
        comments,
        history,
        fieldReports,
        quickReports,
      };
    }),

  // البحث والفلترة في الطلبات
  search: protectedProcedure
    .input(searchRequestsSchema)
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { requests: [], total: 0 };

      const conditions = [];

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

      // الحصول على العدد الإجمالي
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(mosqueRequests);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as typeof countQuery;
      }
      const countResult = await countQuery;
      const total = countResult[0]?.count || 0;

      return {
        requests: results.map(r => ({
          ...r.request,
          mosqueName: r.mosqueName,
          mosqueCity: r.mosqueCity,
          requesterName: r.requesterName,
        })),
        total,
      };
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
    }))
    .mutation(async ({ input, ctx }) => {
      // التحقق من الصلاحية
      const allowedRoles = ["super_admin", "system_admin", "projects_office", "field_team", "quick_response", "financial", "project_manager"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لتحديث مرحلة الطلب" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const request = await db.select().from(mosqueRequests).where(eq(mosqueRequests.id, input.requestId)).limit(1);
      if (request.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      const oldStage = request[0].currentStage;

      await db.update(mosqueRequests).set({
        currentStage: input.newStage,
        status: input.newStage === "closed" ? "completed" : "in_progress",
      }).where(eq(mosqueRequests.id, input.requestId));

      // إضافة سجل في تاريخ الطلب
      await db.insert(requestHistory).values({
        requestId: input.requestId,
        userId: ctx.user.id,
        fromStage: oldStage,
        toStage: input.newStage,
        action: "stage_updated",
        notes: input.notes || `تم نقل الطلب من ${oldStage} إلى ${input.newStage}`,
      });

      // إرسال إشعار لمقدم الطلب
      await db.insert(notifications).values({
        userId: request[0].userId,
        title: "تحديث حالة الطلب",
        message: `تم تحديث مرحلة طلبك رقم ${request[0].requestNumber} إلى ${input.newStage}`,
        type: "request_update",
        relatedType: "request",
        relatedId: input.requestId,
      });

      return { success: true, message: "تم تحديث مرحلة الطلب بنجاح" };
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
      findings: z.string(),
      recommendations: z.string().optional(),
      estimatedCost: z.number().optional(),
      technicalNeeds: z.string().optional(),
      conditionRating: z.enum(["excellent", "good", "fair", "poor", "critical"]).optional(),
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
        findings: input.findings,
        recommendations: input.recommendations || null,
        estimatedCost: input.estimatedCost?.toString() || null,
        technicalNeeds: input.technicalNeeds || null,
        conditionRating: input.conditionRating || null,
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
});
