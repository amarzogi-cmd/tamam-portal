import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { mosquesRouter } from "./routers/mosques";
import { requestsRouter } from "./routers/requests";

export const appRouter = router({
  system: systemRouter,
  
  // نظام المصادقة
  auth: authRouter,
  
  // إدارة المساجد
  mosques: mosquesRouter,
  
  // إدارة الطلبات
  requests: requestsRouter,
});

export type AppRouter = typeof appRouter;
