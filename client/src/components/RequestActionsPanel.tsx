import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  ClipboardList, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Zap,
  FolderKanban,
  PauseCircle,
  CalendarDays,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import type { RequestStage, UserRole } from "@shared/types";
import { 
  STAGE_TRANSITION_PERMISSIONS, 
  STATUS_CHANGE_PERMISSIONS,
  ROLE_LABELS,
  STAGE_LABELS 
} from "@shared/constants";

interface RequestActionsPanelProps {
  request: any;
  user: any;
  onAdvanceStage: () => void;
  onApprove: () => void;
  onReject: () => void;
  onShowAssignDialog: () => void;
  onShowScheduleDialog: () => void;
  onShowTechnicalEvalDialog: (decision: string) => void;
  isLoading: boolean;
}

export function RequestActionsPanel({
  request,
  user,
  onAdvanceStage,
  onApprove,
  onReject,
  onShowAssignDialog,
  onShowScheduleDialog,
  onShowTechnicalEvalDialog,
  isLoading
}: RequestActionsPanelProps) {
  const requestId = request.id;
  const currentStage = request.currentStage as RequestStage;
  const userRole = user?.role as UserRole;

  // التحقق من الصلاحيات
  const canTransition = userRole && STAGE_TRANSITION_PERMISSIONS[currentStage]?.includes(userRole);
  const canApprove = userRole && STATUS_CHANGE_PERMISSIONS.approve?.includes(userRole);
  const canReject = userRole && STATUS_CHANGE_PERMISSIONS.reject?.includes(userRole);
  const allowedRolesForStage = STAGE_TRANSITION_PERMISSIONS[currentStage] || [];

  // إذا كان المستخدم طالب خدمة، لا يعرض أي إجراءات
  if (userRole === "service_requester") {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            يتم معالجة طلبك حالياً من قبل الفريق المختص
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            سيتم إشعارك بأي تحديثات على الطلب
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* قسم الإجراءات الأساسية */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>الإجراءات المتاحة</CardTitle>
          <CardDescription>
            المرحلة الحالية: {STAGE_LABELS[currentStage]}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* إجراءات مرحلة المراجعة الأولية */}
          {currentStage === "initial_review" && (
            <>
              {(userRole === "projects_office" || userRole === "super_admin" || userRole === "system_admin") && (
                <>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                    onClick={onShowAssignDialog}
                  >
                    <Users className="w-4 h-4 ml-2" />
                    إسناد الزيارة الميدانية
                  </Button>
                  <Button 
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white" 
                    onClick={onShowScheduleDialog}
                  >
                    <CalendarDays className="w-4 h-4 ml-2" />
                    جدولة الزيارة الميدانية
                  </Button>
                </>
              )}
            </>
          )}

          {/* إجراءات مرحلة الزيارة الميدانية */}
          {currentStage === "field_visit" && (
            <>
              {(userRole === "field_team" || userRole === "super_admin" || userRole === "system_admin" || userRole === "projects_office") && (
                <Link href={`/requests/${requestId}/field-inspection`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <ClipboardList className="w-4 h-4 ml-2" />
                    إنشاء تقرير المعاينة الميدانية
                  </Button>
                </Link>
              )}
            </>
          )}

          {/* إجراءات مسار الاستجابة السريعة */}
          {request.requestTrack === "quick_response" && currentStage === "execution" && (
            <>
              {(userRole === "quick_response" || userRole === "super_admin" || userRole === "system_admin" || userRole === "projects_office" || userRole === "field_team") && (
                <Link href={`/requests/${requestId}/quick-response`}>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    <Zap className="w-4 h-4 ml-2" />
                    إنشاء تقرير الاستجابة السريعة
                  </Button>
                </Link>
              )}
            </>
          )}

          {/* رسالة توضيحية لمسار الاستجابة السريعة */}
          {request.requestTrack === "quick_response" && currentStage !== "execution" && currentStage !== "closed" && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                هذا الطلب في مسار الاستجابة السريعة
              </p>
              <p className="text-xs text-orange-600 mt-1">
                سيتم تفعيل زر التقرير عند الوصول لمرحلة التنفيذ
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* قسم اعتماد/رفض الطلب */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>اعتماد الطلب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canApprove ? (
            <Button 
              className="w-full gradient-primary text-white" 
              onClick={onApprove}
              disabled={isLoading || request.status === "approved"}
            >
              <CheckCircle2 className="w-4 h-4 ml-2" />
              {isLoading ? "جاري..." : "اعتماد الطلب"}
            </Button>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                ليس لديك صلاحية اعتماد الطلب
              </p>
            </div>
          )}

          {canReject && (
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={onReject}
              disabled={isLoading || request.status === "rejected"}
            >
              <XCircle className="w-4 h-4 ml-2" />
              {isLoading ? "جاري..." : "رفض الطلب"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* قسم تحويل المرحلة */}
      {currentStage !== "closed" && currentStage !== "technical_eval" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>تحويل المرحلة</CardTitle>
          </CardHeader>
          <CardContent>
            {currentStage === "field_visit" ? (
              canTransition ? (
                <Link href={`/field-inspection/${requestId}`}>
                  <Button variant="default" className="w-full gradient-primary text-white">
                    <FileText className="w-4 h-4 ml-2" />
                    رفع تقرير الزيارة الميدانية
                  </Button>
                </Link>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium mb-1">
                    لا يمكنك رفع التقرير
                  </p>
                  <p className="text-xs text-amber-600">
                    الأدوار المسموح لها: {allowedRolesForStage.map(r => ROLE_LABELS[r] || r).join('، ')}
                  </p>
                </div>
              )
            ) : (
              canTransition ? (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={onAdvanceStage}
                  disabled={isLoading}
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  {isLoading ? "جاري..." : "تحويل للمرحلة التالية"}
                </Button>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium mb-1">
                    لا يمكنك تحويل الطلب من هذه المرحلة
                  </p>
                  <p className="text-xs text-amber-600">
                    الأدوار المسموح لها: {allowedRolesForStage.map(r => ROLE_LABELS[r] || r).join('، ')}
                  </p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* قسم التقييم الفني */}
      {currentStage === "technical_eval" && canTransition && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              قرار التقييم الفني
            </CardTitle>
            <CardDescription>
              اختر أحد الخيارات التالية بناءً على نتائج الدراسة الفنية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* التحويل إلى مشروع */}
            <button 
              className="group w-full p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all text-right disabled:opacity-50" 
              onClick={() => onShowTechnicalEvalDialog('convert_to_project')}
              disabled={isLoading}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500 rounded-lg text-white">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-green-800">التحويل إلى مشروع</h5>
                  <p className="text-xs text-green-600 mt-1">
                    للطلبات التي تحتاج تقييم مالي وعقود موردين
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-green-400 group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </button>

            {/* التحويل للاستجابة السريعة */}
            <button 
              className="group w-full p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all text-right disabled:opacity-50" 
              onClick={() => onShowTechnicalEvalDialog('quick_response')}
              disabled={isLoading}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500 rounded-lg text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-purple-800">التحويل إلى الاستجابة السريعة</h5>
                  <p className="text-xs text-purple-600 mt-1">
                    للحالات البسيطة التي يمكن تنفيذها مباشرة
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </button>

            {/* فاصل */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-400">أو</span>
              </div>
            </div>

            {/* تعليق الطلب */}
            <button 
              className="group w-full p-3 rounded-lg border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all text-right disabled:opacity-50" 
              onClick={() => onShowTechnicalEvalDialog('suspend')}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <h5 className="font-bold text-amber-800 text-sm">تعليق الطلب</h5>
                  <p className="text-xs text-amber-600">مع ذكر المبررات</p>
                </div>
              </div>
            </button>

            {/* الاعتذار عن الطلب */}
            <button 
              className="group w-full p-3 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all text-right disabled:opacity-50" 
              onClick={() => onShowTechnicalEvalDialog('apologize')}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <h5 className="font-bold text-red-800 text-sm">الاعتذار عن الطلب</h5>
                  <p className="text-xs text-red-600">مع ذكر الأسباب</p>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
