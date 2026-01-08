import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { stageSettings, requestStageTracking, escalationLogs } from "../../drizzle/schema";
import { eq, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// المراحل الافتراضية مع المدد الزمنية
const defaultStages = [
  { stageCode: "submitted", stageName: "تقديم الطلب", stageOrder: 1, durationDays: 1, description: "تقديم الطلب من قبل طالب الخدمة" },
  { stageCode: "initial_review", stageName: "المراجعة الأولية", stageOrder: 2, durationDays: 3, description: "مراجعة الطلب من مكتب المشاريع" },
  { stageCode: "field_visit", stageName: "الزيارة الميدانية", stageOrder: 3, durationDays: 7, description: "زيارة الموقع والمعاينة" },
  { stageCode: "technical_eval", stageName: "إعداد جدول الكميات", stageOrder: 4, durationDays: 5, description: "إعداد جدول الكميات والمواصفات الفنية" },
  { stageCode: "financial_eval", stageName: "التقييم المالي", stageOrder: 5, durationDays: 10, description: "جمع عروض الأسعار والمقارنة" },
  { stageCode: "quotation_approval", stageName: "اعتماد العرض", stageOrder: 6, durationDays: 3, description: "اعتماد العرض الفائز" },
  { stageCode: "contracting", stageName: "التعاقد", stageOrder: 7, durationDays: 5, description: "إنشاء وتوقيع العقد" },
  { stageCode: "execution", stageName: "التنفيذ", stageOrder: 8, durationDays: 0, description: "تنفيذ المشروع (حسب مدة المشروع)" },
  { stageCode: "delivery", stageName: "الاستلام", stageOrder: 9, durationDays: 7, description: "التقرير الختامي والدفعة الختامية ومحضر الاستلام" },
  { stageCode: "closure", stageName: "الإغلاق", stageOrder: 10, durationDays: 14, description: "قياس الرضا والنشر والتغذية الراجعة" },
];

export const stageSettingsRouter = router({
  // جلب جميع إعدادات المراحل
  getAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const settings = await db.select().from(stageSettings).orderBy(asc(stageSettings.stageOrder));
    return settings;
  }),

  // جلب إعداد مرحلة محددة
  getByCode: protectedProcedure
    .input(z.object({ stageCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [setting] = await db.select().from(stageSettings).where(eq(stageSettings.stageCode, input.stageCode));
      return setting;
    }),

  // تحديث إعداد مرحلة
  update: protectedProcedure
    .input(z.object({
      stageCode: z.string(),
      durationDays: z.number().min(0).optional(),
      warningDays: z.number().min(0).optional(),
      escalationLevel1Days: z.number().min(0).optional(),
      escalationLevel2Days: z.number().min(0).optional(),
      isActive: z.boolean().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // التحقق من الصلاحيات (المدير العام أو مدير النظام فقط)
      if (!["super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لتعديل إعدادات المراحل" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { stageCode, ...updateData } = input;
      await db.update(stageSettings)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(stageSettings.stageCode, stageCode));

      return { success: true };
    }),

  // تهيئة المراحل الافتراضية
  initializeDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    // التحقق من الصلاحيات
    if (!["super_admin", "system_admin"].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لتهيئة المراحل" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // التحقق من وجود مراحل مسبقة
    const existing = await db.select().from(stageSettings);
    if (existing.length > 0) {
      return { success: false, message: "المراحل موجودة مسبقاً" };
    }

    // إضافة المراحل الافتراضية
    for (const stage of defaultStages) {
      await db.insert(stageSettings).values({
        ...stage,
        warningDays: 1,
        escalationLevel1Days: 1,
        escalationLevel2Days: 3,
        isActive: true,
      });
    }

    return { success: true, message: "تم تهيئة المراحل الافتراضية بنجاح" };
  }),

  // جلب الطلبات المتأخرة
  getDelayedRequests: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const delayed = await db.select()
      .from(requestStageTracking)
      .where(eq(requestStageTracking.isDelayed, true))
      .orderBy(desc(requestStageTracking.delayDays));
    return delayed;
  }),

  // جلب سجل التصعيدات
  getEscalationLogs: protectedProcedure
    .input(z.object({
      requestId: z.number().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      if (input.requestId) {
        return await db.select().from(escalationLogs)
          .where(eq(escalationLogs.requestId, input.requestId))
          .orderBy(desc(escalationLogs.createdAt))
          .limit(input.limit);
      }
      
      return await db.select().from(escalationLogs).orderBy(desc(escalationLogs.createdAt)).limit(input.limit);
    }),
});
