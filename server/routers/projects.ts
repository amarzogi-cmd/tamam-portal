import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { projects, projectPhases, contracts, payments, quantitySchedules, quotations, suppliers, mosqueRequests, users, mosques } from "../../drizzle/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// توليد رقم مشروع فريد
function generateProjectNumber(): string {
  const prefix = "PRJ";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// توليد رقم عقد فريد
function generateContractNumber(): string {
  const prefix = "CON";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// توليد رقم دفعة فريد
function generatePaymentNumber(): string {
  const prefix = "PAY";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// توليد رقم عرض سعر فريد
function generateQuotationNumber(): string {
  const prefix = "QUO";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export const projectsRouter = router({
  // الحصول على جميع المشاريع
  getAll: protectedProcedure
    .input(z.object({
      status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const filters = [];
      if (input?.status) {
        filters.push(eq(projects.status, input.status));
      }

      const projectsList = await db
        .select({
          id: projects.id,
          projectNumber: projects.projectNumber,
          name: projects.name,
          description: projects.description,
          status: projects.status,
          budget: projects.budget,
          actualCost: projects.actualCost,
          startDate: projects.startDate,
          expectedEndDate: projects.expectedEndDate,
          completionPercentage: projects.completionPercentage,
          createdAt: projects.createdAt,
          requestId: projects.requestId,
          managerId: projects.managerId,
          managerName: users.name,
        })
        .from(projects)
        .leftJoin(users, eq(projects.managerId, users.id))
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(desc(projects.createdAt))
        .limit(input?.limit || 50)
        .offset(input?.offset || 0);

      return projectsList;
    }),

  // الحصول على مشروع بالتفاصيل
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const [project] = await db
        .select({
          id: projects.id,
          projectNumber: projects.projectNumber,
          name: projects.name,
          description: projects.description,
          status: projects.status,
          budget: projects.budget,
          actualCost: projects.actualCost,
          startDate: projects.startDate,
          expectedEndDate: projects.expectedEndDate,
          completionPercentage: projects.completionPercentage,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          requestId: projects.requestId,
          managerId: projects.managerId,
          managerName: users.name,
        })
        .from(projects)
        .leftJoin(users, eq(projects.managerId, users.id))
        .where(eq(projects.id, input.id));

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "المشروع غير موجود" });
      }

      // جلب الطلب المرتبط
      const [request] = await db
        .select({
          id: mosqueRequests.id,
          requestNumber: mosqueRequests.requestNumber,
          programType: mosqueRequests.programType,
          mosqueName: mosques.name,
          mosqueCity: mosques.city,
        })
        .from(mosqueRequests)
        .leftJoin(mosques, eq(mosqueRequests.mosqueId, mosques.id))
        .where(eq(mosqueRequests.id, project.requestId));

      // جلب مراحل المشروع
      const phases = await db
        .select()
        .from(projectPhases)
        .where(eq(projectPhases.projectId, input.id))
        .orderBy(projectPhases.phaseOrder);

      // جلب العقود
      const projectContracts = await db
        .select({
          id: contracts.id,
          contractNumber: contracts.contractNumber,
          contractType: contracts.contractType,
          amount: contracts.amount,
          status: contracts.status,
          startDate: contracts.startDate,
          endDate: contracts.endDate,
          supplierName: suppliers.name,
        })
        .from(contracts)
        .leftJoin(suppliers, eq(contracts.supplierId, suppliers.id))
        .where(eq(contracts.projectId, input.id));

      // جلب الدفعات
      const projectPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.projectId, input.id))
        .orderBy(desc(payments.createdAt));

      // جلب جداول الكميات
      const boq = await db
        .select()
        .from(quantitySchedules)
        .where(eq(quantitySchedules.projectId, input.id));

      // جلب عروض الأسعار
      const projectQuotations = await db
        .select({
          id: quotations.id,
          quotationNumber: quotations.quotationNumber,
          totalAmount: quotations.totalAmount,
          status: quotations.status,
          validUntil: quotations.validUntil,
          supplierName: suppliers.name,
          createdAt: quotations.createdAt,
        })
        .from(quotations)
        .leftJoin(suppliers, eq(quotations.supplierId, suppliers.id))
        .where(eq(quotations.projectId, input.id));

      return {
        ...project,
        request,
        phases,
        contracts: projectContracts,
        payments: projectPayments,
        boq,
        quotations: projectQuotations,
      };
    }),

  // إنشاء مشروع من طلب معتمد
  createFromRequest: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      budget: z.number().optional(),
      managerId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من وجود الطلب
      const [request] = await db
        .select()
        .from(mosqueRequests)
        .where(eq(mosqueRequests.id, input.requestId));

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      // التحقق من عدم وجود مشروع مرتبط بالطلب
      const [existingProject] = await db
        .select()
        .from(projects)
        .where(eq(projects.requestId, input.requestId));

      if (existingProject) {
        throw new TRPCError({ code: "CONFLICT", message: "يوجد مشروع مرتبط بهذا الطلب بالفعل" });
      }

      const projectNumber = generateProjectNumber();

      const [newProject] = await db.insert(projects).values({
        projectNumber,
        requestId: input.requestId,
        name: input.name,
        description: input.description,
        budget: input.budget?.toString(),
        managerId: input.managerId,
        status: "planning",
      });

      // إنشاء المراحل الافتراضية
      const defaultPhases = [
        { phaseName: "التخطيط والتصميم", phaseOrder: 1 },
        { phaseName: "التعاقد", phaseOrder: 2 },
        { phaseName: "التنفيذ", phaseOrder: 3 },
        { phaseName: "المراجعة والاستلام", phaseOrder: 4 },
        { phaseName: "الإغلاق", phaseOrder: 5 },
      ];

      for (const phase of defaultPhases) {
        await db.insert(projectPhases).values({
          projectId: newProject.insertId,
          phaseName: phase.phaseName,
          phaseOrder: phase.phaseOrder,
          status: phase.phaseOrder === 1 ? "in_progress" : "pending",
        });
      }

      // تحديث حالة الطلب
      await db
        .update(mosqueRequests)
        .set({ status: "in_progress", currentStage: "execution" })
        .where(eq(mosqueRequests.id, input.requestId));

      return {
        projectId: newProject.insertId,
        projectNumber,
      };
    }),

  // تحديث مشروع
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
      budget: z.number().optional(),
      actualCost: z.number().optional(),
      completionPercentage: z.number().min(0).max(100).optional(),
      managerId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const { id, ...updateData } = input;
      
      const updateValues: any = {};
      if (updateData.name) updateValues.name = updateData.name;
      if (updateData.description) updateValues.description = updateData.description;
      if (updateData.status) updateValues.status = updateData.status;
      if (updateData.budget !== undefined) updateValues.budget = updateData.budget.toString();
      if (updateData.actualCost !== undefined) updateValues.actualCost = updateData.actualCost.toString();
      if (updateData.completionPercentage !== undefined) updateValues.completionPercentage = updateData.completionPercentage;
      if (updateData.managerId) updateValues.managerId = updateData.managerId;
      if (updateData.startDate) updateValues.startDate = updateData.startDate;
      if (updateData.endDate) updateValues.endDate = updateData.endDate;

      await db
        .update(projects)
        .set(updateValues)
        .where(eq(projects.id, id));

      return { success: true };
    }),

  // ==================== جداول الكميات (BOQ) ====================

  // إضافة بند في جدول الكميات
  addBOQItem: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      requestId: z.number().optional(),
      itemName: z.string().min(1),
      itemDescription: z.string().optional(),
      unit: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const totalPrice = input.unitPrice ? input.quantity * input.unitPrice : null;

      const [item] = await db.insert(quantitySchedules).values({
        projectId: input.projectId,
        requestId: input.requestId,
        itemName: input.itemName,
        itemDescription: input.itemDescription,
        unit: input.unit,
        quantity: input.quantity.toString(),
        unitPrice: input.unitPrice?.toString(),
        totalPrice: totalPrice?.toString(),
        category: input.category,
      });

      return { id: item.insertId };
    }),

  // تحديث بند في جدول الكميات
  updateBOQItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      itemName: z.string().optional(),
      itemDescription: z.string().optional(),
      unit: z.string().optional(),
      quantity: z.number().positive().optional(),
      unitPrice: z.number().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const { id, ...updateData } = input;

      // جلب البند الحالي لحساب السعر الإجمالي
      const [currentItem] = await db
        .select()
        .from(quantitySchedules)
        .where(eq(quantitySchedules.id, id));

      if (!currentItem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "البند غير موجود" });
      }

      const quantity = updateData.quantity ?? parseFloat(currentItem.quantity);
      const unitPrice = updateData.unitPrice ?? (currentItem.unitPrice ? parseFloat(currentItem.unitPrice) : null);
      const totalPrice = unitPrice ? quantity * unitPrice : null;

      const updateValues: any = {};
      if (updateData.itemName) updateValues.itemName = updateData.itemName;
      if (updateData.itemDescription) updateValues.itemDescription = updateData.itemDescription;
      if (updateData.unit) updateValues.unit = updateData.unit;
      if (updateData.quantity) updateValues.quantity = updateData.quantity.toString();
      if (updateData.unitPrice !== undefined) updateValues.unitPrice = updateData.unitPrice?.toString();
      if (totalPrice !== null) updateValues.totalPrice = totalPrice.toString();
      if (updateData.category) updateValues.category = updateData.category;

      await db
        .update(quantitySchedules)
        .set(updateValues)
        .where(eq(quantitySchedules.id, id));

      return { success: true };
    }),

  // حذف بند من جدول الكميات
  deleteBOQItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      await db.delete(quantitySchedules).where(eq(quantitySchedules.id, input.id));
      return { success: true };
    }),

  // جلب جدول الكميات لمشروع
  getBOQ: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const items = await db
        .select()
        .from(quantitySchedules)
        .where(eq(quantitySchedules.projectId, input.projectId))
        .orderBy(quantitySchedules.category, quantitySchedules.itemName);

      // حساب الإجمالي
      const total = items.reduce((sum: number, item: typeof items[0]) => {
        return sum + (item.totalPrice ? parseFloat(item.totalPrice) : 0);
      }, 0);

      return { items, total };
    }),

  // ==================== العقود ====================

  // إنشاء عقد
  createContract: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      supplierId: z.number(),
      contractType: z.string(),
      amount: z.number().positive(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      terms: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const contractNumber = generateContractNumber();

      const [contract] = await db.insert(contracts).values({
        contractNumber,
        projectId: input.projectId,
        supplierId: input.supplierId,
        contractType: input.contractType,
        amount: input.amount.toString(),
        startDate: input.startDate,
        endDate: input.endDate,
        terms: input.terms,
        status: "draft",
      });

      return { id: contract.insertId, contractNumber };
    }),

  // تحديث عقد
  updateContract: protectedProcedure
    .input(z.object({
      id: z.number(),
      contractType: z.string().optional(),
      amount: z.number().positive().optional(),
      status: z.enum(["draft", "active", "completed", "terminated"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      terms: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const { id, ...updateData } = input;

      const updateValues: any = {};
      if (updateData.contractType) updateValues.contractType = updateData.contractType;
      if (updateData.amount) updateValues.amount = updateData.amount.toString();
      if (updateData.status) updateValues.status = updateData.status;
      if (updateData.startDate) updateValues.startDate = updateData.startDate;
      if (updateData.endDate) updateValues.endDate = updateData.endDate;
      if (updateData.terms) updateValues.terms = updateData.terms;

      await db
        .update(contracts)
        .set(updateValues)
        .where(eq(contracts.id, id));

      return { success: true };
    }),

  // ==================== الدفعات ====================

  // إنشاء دفعة
  createPayment: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      contractId: z.number().optional(),
      amount: z.number().positive(),
      paymentType: z.enum(["advance", "progress", "final", "retention"]),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const paymentNumber = generatePaymentNumber();

      const [payment] = await db.insert(payments).values({
        paymentNumber,
        projectId: input.projectId,
        contractId: input.contractId,
        amount: input.amount.toString(),
        paymentType: input.paymentType,
        description: input.description,
        status: "pending",
      });

      return { id: payment.insertId, paymentNumber };
    }),

  // تحديث حالة الدفعة
  updatePaymentStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "paid", "rejected"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const updateValues: any = { status: input.status };
      
      if (input.status === "approved") {
        updateValues.approvedBy = ctx.user.id;
      }
      if (input.status === "paid") {
        updateValues.paidAt = new Date();
      }

      await db
        .update(payments)
        .set(updateValues)
        .where(eq(payments.id, input.id));

      return { success: true };
    }),

  // ==================== عروض الأسعار ====================

  // إنشاء عرض سعر
  createQuotation: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
      requestId: z.number().optional(),
      supplierId: z.number(),
      totalAmount: z.number().positive(),
      validUntil: z.date().optional(),
      items: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number(),
      })).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const quotationNumber = generateQuotationNumber();

      const [quotation] = await db.insert(quotations).values({
        quotationNumber,
        projectId: input.projectId,
        requestId: input.requestId,
        supplierId: input.supplierId,
        totalAmount: input.totalAmount.toString(),
        validUntil: input.validUntil,
        items: input.items,
        notes: input.notes,
        status: "pending",
      });

      return { id: quotation.insertId, quotationNumber };
    }),

  // تحديث حالة عرض السعر
  updateQuotationStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "accepted", "rejected", "expired"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      await db
        .update(quotations)
        .set({ status: input.status })
        .where(eq(quotations.id, input.id));

      return { success: true };
    }),

  // ==================== الموردين ====================

  // جلب جميع الموردين
  getSuppliers: protectedProcedure
    .input(z.object({
      type: z.enum(["contractor", "supplier", "service_provider"]).optional(),
      status: z.enum(["active", "inactive", "blacklisted"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const filters = [];
      if (input?.type) {
        filters.push(eq(suppliers.type, input.type));
      }
      if (input?.status) {
        filters.push(eq(suppliers.status, input.status));
      }

      const suppliersList = await db
        .select()
        .from(suppliers)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(suppliers.name);

      return suppliersList;
    }),

  // إنشاء مورد
  createSupplier: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      type: z.enum(["contractor", "supplier", "service_provider"]),
      contactPerson: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
      commercialRegister: z.string().optional(),
      taxNumber: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const [supplier] = await db.insert(suppliers).values({
        ...input,
        status: "active",
      });

      return { id: supplier.insertId };
    }),

  // تحديث مورد
  updateSupplier: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      type: z.enum(["contractor", "supplier", "service_provider"]).optional(),
      contactPerson: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
      commercialRegister: z.string().optional(),
      taxNumber: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
      status: z.enum(["active", "inactive", "blacklisted"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const { id, ...updateData } = input;

      await db
        .update(suppliers)
        .set(updateData)
        .where(eq(suppliers.id, id));

      return { success: true };
    }),

  // ==================== مراحل المشروع ====================

  // تحديث مرحلة
  updatePhase: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "in_progress", "completed"]).optional(),
      completionPercentage: z.number().min(0).max(100).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      const { id, ...updateData } = input;

      await db
        .update(projectPhases)
        .set(updateData)
        .where(eq(projectPhases.id, id));

      return { success: true };
    }),

  // ==================== الإحصائيات ====================

  // إحصائيات المشاريع
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        planning: sql<number>`SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END)`,
        inProgress: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)`,
        completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
        onHold: sql<number>`SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END)`,
        totalBudget: sql<number>`SUM(CAST(budget AS DECIMAL(15,2)))`,
        totalActualCost: sql<number>`SUM(CAST(actualCost AS DECIMAL(15,2)))`,
      })
      .from(projects);

    return stats;
  }),
});
