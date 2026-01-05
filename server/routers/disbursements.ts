import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  disbursementRequests,
  disbursementOrders,
  disbursementRequestStatuses,
  disbursementOrderStatuses,
  projects,
  contractsEnhanced,
  contractPayments,
  suppliers,
  users,
  notifications,
} from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// توليد رقم طلب صرف
async function generateDisbursementRequestNumber(db: NonNullable<Awaited<ReturnType<typeof getDb>>>): Promise<string> {
  const currentYear = new Date().getFullYear();
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(disbursementRequests);
  const sequence = (countResult?.count || 0) + 1;
  return `DR-${currentYear}-${sequence.toString().padStart(4, "0")}`;
}

// توليد رقم أمر صرف
async function generateDisbursementOrderNumber(db: NonNullable<Awaited<ReturnType<typeof getDb>>>): Promise<string> {
  const currentYear = new Date().getFullYear();
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(disbursementOrders);
  const sequence = (countResult?.count || 0) + 1;
  return `DO-${currentYear}-${sequence.toString().padStart(4, "0")}`;
}

export const disbursementsRouter = router({
  // ==================== طلبات الصرف ====================

  // جلب قائمة طلبات الصرف
  listRequests: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        status: z.enum(disbursementRequestStatuses).optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const { projectId, status, page = 1, limit = 10 } = input || {};

      const conditions = [];
      if (projectId) conditions.push(eq(disbursementRequests.projectId, projectId));
      if (status) conditions.push(eq(disbursementRequests.status, status));

      const requests = await db
        .select({
          id: disbursementRequests.id,
          requestNumber: disbursementRequests.requestNumber,
          title: disbursementRequests.title,
          amount: disbursementRequests.amount,
          paymentType: disbursementRequests.paymentType,
          status: disbursementRequests.status,
          requestedAt: disbursementRequests.requestedAt,
          projectId: disbursementRequests.projectId,
          projectName: projects.name,
          projectNumber: projects.projectNumber,
          requestedByName: users.name,
        })
        .from(disbursementRequests)
        .leftJoin(projects, eq(disbursementRequests.projectId, projects.id))
        .leftJoin(users, eq(disbursementRequests.requestedBy, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(disbursementRequests.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(disbursementRequests)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        requests,
        total: countResult?.count || 0,
        page,
        limit,
      };
    }),

  // جلب طلب صرف بالتفصيل
  getRequestById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const [request] = await db
        .select({
          id: disbursementRequests.id,
          requestNumber: disbursementRequests.requestNumber,
          title: disbursementRequests.title,
          description: disbursementRequests.description,
          amount: disbursementRequests.amount,
          paymentType: disbursementRequests.paymentType,
          completionPercentage: disbursementRequests.completionPercentage,
          attachmentsJson: disbursementRequests.attachmentsJson,
          status: disbursementRequests.status,
          requestedAt: disbursementRequests.requestedAt,
          approvedAt: disbursementRequests.approvedAt,
          approvalNotes: disbursementRequests.approvalNotes,
          rejectedAt: disbursementRequests.rejectedAt,
          rejectionReason: disbursementRequests.rejectionReason,
          projectId: disbursementRequests.projectId,
          contractId: disbursementRequests.contractId,
          contractPaymentId: disbursementRequests.contractPaymentId,
        })
        .from(disbursementRequests)
        .where(eq(disbursementRequests.id, input.id));

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "طلب الصرف غير موجود" });
      }

      // جلب بيانات المشروع
      const [project] = await db
        .select({
          id: projects.id,
          name: projects.name,
          projectNumber: projects.projectNumber,
        })
        .from(projects)
        .where(eq(projects.id, request.projectId));

      // جلب بيانات العقد إن وجد
      let contract = null;
      if (request.contractId) {
        const [contractData] = await db
          .select({
            id: contractsEnhanced.id,
            contractNumber: contractsEnhanced.contractNumber,
            contractTitle: contractsEnhanced.contractTitle,
            secondPartyName: contractsEnhanced.secondPartyName,
          })
          .from(contractsEnhanced)
          .where(eq(contractsEnhanced.id, request.contractId));
        contract = contractData;
      }

      // جلب أمر الصرف المرتبط إن وجد
      const [order] = await db
        .select()
        .from(disbursementOrders)
        .where(eq(disbursementOrders.disbursementRequestId, input.id));

      return {
        ...request,
        project,
        contract,
        disbursementOrder: order || null,
      };
    }),

  // إنشاء طلب صرف جديد
  createRequest: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        contractId: z.number().optional(),
        contractPaymentId: z.number().optional(),
        title: z.string().min(1, "عنوان الطلب مطلوب"),
        description: z.string().optional(),
        amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
        paymentType: z.enum(["advance", "progress", "final", "retention"]).default("progress"),
        completionPercentage: z.number().min(0).max(100).optional(),
        attachments: z.array(z.object({
          name: z.string(),
          url: z.string(),
          type: z.string().optional(),
        })).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من الصلاحيات
      const allowedRoles = ["super_admin", "system_admin", "projects_office", "project_manager"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية إنشاء طلب صرف" });
      }

      // التحقق من وجود المشروع
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.projectId));

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "المشروع غير موجود" });
      }

      const requestNumber = await generateDisbursementRequestNumber(db);

      const [result] = await db.insert(disbursementRequests).values({
        requestNumber,
        projectId: input.projectId,
        contractId: input.contractId,
        contractPaymentId: input.contractPaymentId,
        title: input.title,
        description: input.description,
        amount: input.amount.toString(),
        paymentType: input.paymentType,
        completionPercentage: input.completionPercentage,
        attachmentsJson: input.attachments ? JSON.stringify(input.attachments) : null,
        status: "pending",
        requestedBy: ctx.user.id,
      });

      // إرسال إشعار للإدارة المالية
      const financialUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "financial"));

      for (const user of financialUsers) {
        await db.insert(notifications).values({
          userId: user.id,
          title: "طلب صرف جديد",
          message: `تم تقديم طلب صرف جديد رقم ${requestNumber} للمشروع ${project.name}`,
          type: "info",
          relatedType: "disbursement_request",
          relatedId: Number(result.insertId),
        });
      }

      return {
        success: true,
        id: result.insertId,
        requestNumber,
        message: "تم إنشاء طلب الصرف بنجاح",
      };
    }),

  // اعتماد طلب صرف
  approveRequest: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من الصلاحيات
      const allowedRoles = ["super_admin", "system_admin", "general_manager", "financial"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية اعتماد طلب الصرف" });
      }

      const [request] = await db
        .select()
        .from(disbursementRequests)
        .where(eq(disbursementRequests.id, input.id));

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "طلب الصرف غير موجود" });
      }

      if (request.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن اعتماد هذا الطلب في حالته الحالية" });
      }

      await db
        .update(disbursementRequests)
        .set({
          status: "approved",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          approvalNotes: input.notes,
        })
        .where(eq(disbursementRequests.id, input.id));

      // إرسال إشعار لمقدم الطلب
      await db.insert(notifications).values({
        userId: request.requestedBy,
        title: "تم اعتماد طلب الصرف",
        message: `تم اعتماد طلب الصرف رقم ${request.requestNumber}`,
        type: "success",
        relatedType: "disbursement_request",
        relatedId: input.id,
      });

      return { success: true, message: "تم اعتماد طلب الصرف بنجاح" };
    }),

  // رفض طلب صرف
  rejectRequest: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().min(1, "سبب الرفض مطلوب"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const allowedRoles = ["super_admin", "system_admin", "general_manager", "financial"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية رفض طلب الصرف" });
      }

      const [request] = await db
        .select()
        .from(disbursementRequests)
        .where(eq(disbursementRequests.id, input.id));

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "طلب الصرف غير موجود" });
      }

      await db
        .update(disbursementRequests)
        .set({
          status: "rejected",
          rejectedBy: ctx.user.id,
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        })
        .where(eq(disbursementRequests.id, input.id));

      // إرسال إشعار لمقدم الطلب
      await db.insert(notifications).values({
        userId: request.requestedBy,
        title: "تم رفض طلب الصرف",
        message: `تم رفض طلب الصرف رقم ${request.requestNumber}: ${input.reason}`,
        type: "error",
        relatedType: "disbursement_request",
        relatedId: input.id,
      });

      return { success: true, message: "تم رفض طلب الصرف" };
    }),

  // ==================== أوامر الصرف ====================

  // جلب قائمة أوامر الصرف
  listOrders: protectedProcedure
    .input(
      z.object({
        status: z.enum(disbursementOrderStatuses).optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const { status, page = 1, limit = 10 } = input || {};

      const conditions = [];
      if (status) conditions.push(eq(disbursementOrders.status, status));

      const orders = await db
        .select({
          id: disbursementOrders.id,
          orderNumber: disbursementOrders.orderNumber,
          amount: disbursementOrders.amount,
          beneficiaryName: disbursementOrders.beneficiaryName,
          paymentMethod: disbursementOrders.paymentMethod,
          status: disbursementOrders.status,
          createdAt: disbursementOrders.createdAt,
          requestNumber: disbursementRequests.requestNumber,
          requestTitle: disbursementRequests.title,
          projectName: projects.name,
        })
        .from(disbursementOrders)
        .leftJoin(disbursementRequests, eq(disbursementOrders.disbursementRequestId, disbursementRequests.id))
        .leftJoin(projects, eq(disbursementRequests.projectId, projects.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(disbursementOrders.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(disbursementOrders)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        orders,
        total: countResult?.count || 0,
        page,
        limit,
      };
    }),

  // جلب أمر صرف بالتفصيل
  getOrderById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const [order] = await db
        .select()
        .from(disbursementOrders)
        .where(eq(disbursementOrders.id, input.id));

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "أمر الصرف غير موجود" });
      }

      // جلب طلب الصرف المرتبط
      const [request] = await db
        .select()
        .from(disbursementRequests)
        .where(eq(disbursementRequests.id, order.disbursementRequestId));

      // جلب المشروع
      let project = null;
      if (request) {
        const [projectData] = await db
          .select()
          .from(projects)
          .where(eq(projects.id, request.projectId));
        project = projectData;
      }

      return {
        ...order,
        disbursementRequest: request,
        project,
      };
    }),

  // إنشاء أمر صرف
  createOrder: protectedProcedure
    .input(
      z.object({
        disbursementRequestId: z.number(),
        beneficiaryName: z.string().min(1, "اسم المستفيد مطلوب"),
        beneficiaryBank: z.string().optional(),
        beneficiaryIban: z.string().optional(),
        paymentMethod: z.enum(["bank_transfer", "check", "cash"]).default("bank_transfer"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من الصلاحيات
      const allowedRoles = ["super_admin", "system_admin", "financial"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية إنشاء أمر صرف" });
      }

      // التحقق من طلب الصرف
      const [request] = await db
        .select()
        .from(disbursementRequests)
        .where(eq(disbursementRequests.id, input.disbursementRequestId));

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "طلب الصرف غير موجود" });
      }

      if (request.status !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "طلب الصرف غير معتمد" });
      }

      // التحقق من عدم وجود أمر صرف سابق
      const [existingOrder] = await db
        .select()
        .from(disbursementOrders)
        .where(eq(disbursementOrders.disbursementRequestId, input.disbursementRequestId));

      if (existingOrder) {
        throw new TRPCError({ code: "CONFLICT", message: "يوجد أمر صرف مرتبط بهذا الطلب بالفعل" });
      }

      const orderNumber = await generateDisbursementOrderNumber(db);

      const [result] = await db.insert(disbursementOrders).values({
        orderNumber,
        disbursementRequestId: input.disbursementRequestId,
        amount: request.amount,
        beneficiaryName: input.beneficiaryName,
        beneficiaryBank: input.beneficiaryBank,
        beneficiaryIban: input.beneficiaryIban,
        paymentMethod: input.paymentMethod,
        status: "pending",
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        id: result.insertId,
        orderNumber,
        message: "تم إنشاء أمر الصرف بنجاح",
      };
    }),

  // اعتماد أمر صرف
  approveOrder: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const allowedRoles = ["super_admin", "system_admin", "general_manager"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية اعتماد أمر الصرف" });
      }

      const [order] = await db
        .select()
        .from(disbursementOrders)
        .where(eq(disbursementOrders.id, input.id));

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "أمر الصرف غير موجود" });
      }

      if (order.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن اعتماد هذا الأمر في حالته الحالية" });
      }

      await db
        .update(disbursementOrders)
        .set({
          status: "approved",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          approvalNotes: input.notes,
        })
        .where(eq(disbursementOrders.id, input.id));

      return { success: true, message: "تم اعتماد أمر الصرف بنجاح" };
    }),

  // تنفيذ أمر صرف (الدفع الفعلي)
  executeOrder: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        transactionReference: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const allowedRoles = ["super_admin", "system_admin", "financial"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية تنفيذ أمر الصرف" });
      }

      const [order] = await db
        .select()
        .from(disbursementOrders)
        .where(eq(disbursementOrders.id, input.id));

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "أمر الصرف غير موجود" });
      }

      if (order.status !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "أمر الصرف غير معتمد" });
      }

      await db
        .update(disbursementOrders)
        .set({
          status: "executed",
          executedBy: ctx.user.id,
          executedAt: new Date(),
          transactionReference: input.transactionReference,
        })
        .where(eq(disbursementOrders.id, input.id));

      // تحديث حالة طلب الصرف
      await db
        .update(disbursementRequests)
        .set({ status: "paid" })
        .where(eq(disbursementRequests.id, order.disbursementRequestId));

      // تحديث حالة دفعة العقد إن وجدت
      const [request] = await db
        .select()
        .from(disbursementRequests)
        .where(eq(disbursementRequests.id, order.disbursementRequestId));

      if (request?.contractPaymentId) {
        await db
          .update(contractPayments)
          .set({
            status: "paid",
            paidAt: new Date(),
            paidBy: ctx.user.id,
          })
          .where(eq(contractPayments.id, request.contractPaymentId));
      }

      return { success: true, message: "تم تنفيذ أمر الصرف بنجاح" };
    }),

  // رفض أمر صرف
  rejectOrder: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().min(1, "سبب الرفض مطلوب"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const allowedRoles = ["super_admin", "system_admin", "general_manager"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية رفض أمر الصرف" });
      }

      await db
        .update(disbursementOrders)
        .set({
          status: "rejected",
          rejectedBy: ctx.user.id,
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        })
        .where(eq(disbursementOrders.id, input.id));

      return { success: true, message: "تم رفض أمر الصرف" };
    }),

  // جلب طلبات الصرف للمشروع
  getRequestsByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const requests = await db
        .select({
          id: disbursementRequests.id,
          requestNumber: disbursementRequests.requestNumber,
          title: disbursementRequests.title,
          amount: disbursementRequests.amount,
          paymentType: disbursementRequests.paymentType,
          status: disbursementRequests.status,
          requestedAt: disbursementRequests.requestedAt,
          approvedAt: disbursementRequests.approvedAt,
        })
        .from(disbursementRequests)
        .where(eq(disbursementRequests.projectId, input.projectId))
        .orderBy(desc(disbursementRequests.createdAt));

      return { requests };
    }),

  // إحصائيات طلبات الصرف
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

    const [pendingRequests] = await db
      .select({ count: sql<number>`count(*)` })
      .from(disbursementRequests)
      .where(eq(disbursementRequests.status, "pending"));

    const [approvedRequests] = await db
      .select({ count: sql<number>`count(*)` })
      .from(disbursementRequests)
      .where(eq(disbursementRequests.status, "approved"));

    const [pendingOrders] = await db
      .select({ count: sql<number>`count(*)` })
      .from(disbursementOrders)
      .where(eq(disbursementOrders.status, "pending"));

    const [totalPaid] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(disbursementRequests)
      .where(eq(disbursementRequests.status, "paid"));

    return {
      pendingRequests: pendingRequests?.count || 0,
      approvedRequests: approvedRequests?.count || 0,
      pendingOrders: pendingOrders?.count || 0,
      totalPaid: totalPaid?.total || 0,
    };
  }),
});
