import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { organizationSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const organizationRouter = router({
  // جلب إعدادات الجمعية
  getSettings: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

    const settings = await db.select().from(organizationSettings).limit(1);
    
    if (settings.length === 0) {
      // إرجاع قيم افتراضية إذا لم توجد إعدادات
      return {
        id: null,
        organizationName: "",
        organizationNameShort: "",
        licenseNumber: "",
        administrativeSupervisor: "",
        technicalSupervisor: "",
        aboutOrganization: "",
        address: "",
        city: "",
        phone: "",
        email: "",
        website: "",
        logoUrl: "",
        stampUrl: "",
        secondaryLogoUrl: "",
        bankName: "",
        bankAccountName: "",
        iban: "",
        contractPrefix: "CON",
        contractFooterText: "",
        contractTermsAndConditions: "",
        authorizedSignatory: "",
        signatoryTitle: "",
        signatoryPhone: "",
        signatoryEmail: "",
      };
    }
    
    return settings[0];
  }),

  // تحديث إعدادات الجمعية
  updateSettings: protectedProcedure
    .input(z.object({
      // بيانات الجمعية الأساسية
      organizationName: z.string().min(1, "اسم الجمعية مطلوب"),
      organizationNameShort: z.string().optional(),
      licenseNumber: z.string().optional(),
      administrativeSupervisor: z.string().optional(),
      technicalSupervisor: z.string().optional(),
      aboutOrganization: z.string().optional(),
      // بيانات التواصل
      address: z.string().optional(),
      city: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
      website: z.string().optional(),
      // الشعارات والأختام
      logoUrl: z.string().optional(),
      stampUrl: z.string().optional(),
      secondaryLogoUrl: z.string().optional(),
      // البيانات البنكية
      bankName: z.string().optional(),
      bankAccountName: z.string().optional(),
      iban: z.string().optional(),
      // إعدادات العقود
      contractPrefix: z.string().optional(),
      contractFooterText: z.string().optional(),
      contractTermsAndConditions: z.string().optional(),
      // بيانات المفوض بالتوقيع
      authorizedSignatory: z.string().optional(),
      signatoryTitle: z.string().optional(),
      signatoryPhone: z.string().optional(),
      signatoryEmail: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من صلاحية المستخدم (مدير النظام أو المدير العام)
      const allowedRoles = ["admin", "general_manager"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية تعديل إعدادات الجمعية" });
      }

      // التحقق من وجود إعدادات سابقة
      const existingSettings = await db.select().from(organizationSettings).limit(1);

      const settingsData = {
        organizationName: input.organizationName,
        organizationNameShort: input.organizationNameShort || null,
        licenseNumber: input.licenseNumber || null,
        administrativeSupervisor: input.administrativeSupervisor || null,
        technicalSupervisor: input.technicalSupervisor || null,
        aboutOrganization: input.aboutOrganization || null,
        address: input.address || null,
        city: input.city || null,
        phone: input.phone || null,
        email: input.email || null,
        website: input.website || null,
        logoUrl: input.logoUrl || null,
        stampUrl: input.stampUrl || null,
        secondaryLogoUrl: input.secondaryLogoUrl || null,
        bankName: input.bankName || null,
        bankAccountName: input.bankAccountName || null,
        iban: input.iban || null,
        contractPrefix: input.contractPrefix || "CON",
        contractFooterText: input.contractFooterText || null,
        contractTermsAndConditions: input.contractTermsAndConditions || null,
        authorizedSignatory: input.authorizedSignatory || null,
        signatoryTitle: input.signatoryTitle || null,
        signatoryPhone: input.signatoryPhone || null,
        signatoryEmail: input.signatoryEmail || null,
        updatedBy: ctx.user.id,
      };

      if (existingSettings.length === 0) {
        // إنشاء إعدادات جديدة
        await db.insert(organizationSettings).values(settingsData);
      } else {
        // تحديث الإعدادات الموجودة
        await db.update(organizationSettings)
          .set(settingsData)
          .where(eq(organizationSettings.id, existingSettings[0].id));
      }

      return { success: true, message: "تم حفظ إعدادات الجمعية بنجاح" };
    }),

  // رفع الشعار
  uploadLogo: protectedProcedure
    .input(z.object({
      type: z.enum(["logo", "stamp", "secondaryLogo"]),
      fileData: z.string(), // Base64 encoded file
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة" });

      // التحقق من صلاحية المستخدم
      const allowedRoles = ["admin", "general_manager"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية رفع الشعارات" });
      }

      // استيراد دالة التخزين
      const { storagePut } = await import("../storage");

      // تحويل Base64 إلى Buffer
      const base64Data = input.fileData.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // إنشاء اسم فريد للملف
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const extension = input.fileName.split(".").pop() || "png";
      const fileKey = `organization/${input.type}-${timestamp}-${randomSuffix}.${extension}`;

      // رفع الملف
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // تحديث الإعدادات
      const existingSettings = await db.select().from(organizationSettings).limit(1);
      
      const fieldMap = {
        logo: "logoUrl",
        stamp: "stampUrl",
        secondaryLogo: "secondaryLogoUrl",
      };
      
      const updateField = fieldMap[input.type];

      if (existingSettings.length === 0) {
        // إنشاء إعدادات جديدة مع الشعار
        await db.insert(organizationSettings).values({
          organizationName: "الجمعية",
          [updateField]: url,
          updatedBy: ctx.user.id,
        });
      } else {
        // تحديث الشعار في الإعدادات الموجودة
        await db.update(organizationSettings)
          .set({ [updateField]: url, updatedBy: ctx.user.id })
          .where(eq(organizationSettings.id, existingSettings[0].id));
      }

      return { success: true, url };
    }),
});
