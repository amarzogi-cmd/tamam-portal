import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowRight, Printer } from "lucide-react";

// دالة تحويل التاريخ الميلادي إلى هجري (تقريبي)
function toHijriDate(date: Date): string {
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  const gregorianDay = date.getDate();
  
  // تحويل تقريبي
  const hijriYear = Math.floor((gregorianYear - 622) * (33 / 32));
  const hijriMonth = ((gregorianMonth + 9) % 12) + 1;
  const hijriDay = gregorianDay;
  
  return `${hijriDay}/${hijriMonth}/${hijriYear}`;
}

function formatGregorianDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

const FUNDING_SOURCE_MAP: Record<string, string> = {
  donations_store: "متجر التبرعات",
  ehsan_platform: "منصة إحسان",
  direct_donation: "تبرع مباشر",
  other: "أخرى",
};

export default function DisbursementRequestPrint() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: request, isLoading } = trpc.disbursements.getRequestById.useQuery(
    { id: parseInt(params.id || "0") },
    { enabled: !!params.id }
  );

  // جلب إعدادات الجمعية
  const { data: orgSettings } = trpc.organization.getSettings.useQuery();

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">طلب الصرف غير موجود</h2>
          <Button onClick={() => navigate("/disbursements")}>
            العودة لطلبات الصرف
          </Button>
        </div>
      </div>
    );
  }

  const amount = parseFloat(request.amount?.toString() || "0");
  const project = request.project;
  const contract = request.contract;
  const requestDate = new Date(request.requestedAt || new Date());

  // حساب التكاليف
  const actualCost = amount;
  const adminFees = (request as any).adminFees || 0;
  const totalCost = actualCost + adminFees;

  return (
    <>
      {/* أزرار التحكم - تختفي عند الطباعة */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <Button variant="outline" onClick={() => navigate("/disbursements")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          رجوع
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="ml-2 h-4 w-4" />
          طباعة
        </Button>
      </div>

      {/* صفحة الطباعة */}
      <div className="min-h-screen bg-white p-8 print:p-4" dir="rtl">
        <div className="max-w-4xl mx-auto">
          {/* الترويسة */}
          <div className="flex justify-between items-start mb-6">
            {/* التاريخ والرقم */}
            <div className="text-sm space-y-1">
              <div className="flex gap-2">
                <span className="font-bold">التاريخ:</span>
                <span className="border-b border-dotted border-gray-400 px-4">{toHijriDate(requestDate)}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold">الموافق:</span>
                <span className="border-b border-dotted border-gray-400 px-4">{formatGregorianDate(requestDate)}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold">رقم التسلسل:</span>
                <span className="border-b border-dotted border-gray-400 px-4">{request.requestNumber?.replace(/\D/g, '') || ""}</span>
              </div>
            </div>

            {/* شعار الجمعية */}
            <div className="text-center">
              {orgSettings?.logoUrl ? (
                <img 
                  src={orgSettings.logoUrl} 
                  alt="شعار الجمعية" 
                  className="h-20 w-auto mx-auto"
                />
              ) : (
                <div className="text-primary font-bold text-xl">
                  {orgSettings?.organizationName || "جمعية عمارة المساجد"}
                </div>
              )}
              <div className="text-sm text-gray-600 mt-2">
                مكتب إدارة المشاريع PMO
              </div>
            </div>
          </div>

          {/* عنوان النموذج */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary border-b-2 border-primary pb-2 inline-block px-8">
              طلب صرف
            </h1>
          </div>

          {/* مصدر دعم الفرصة */}
          <div className="mb-4">
            <div className="font-bold mb-2">مصدر دعم الفرصة</div>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={(request as any).fundingSource === "donations_store"} 
                  readOnly 
                  className="h-4 w-4"
                />
                متجر التبرعات
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={(request as any).fundingSource === "ehsan_platform"} 
                  readOnly 
                  className="h-4 w-4"
                />
                منصة إحسان
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={(request as any).fundingSource === "direct_donation"} 
                  readOnly 
                  className="h-4 w-4"
                />
                تبرع مباشر
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={(request as any).fundingSource === "other"} 
                  readOnly 
                  className="h-4 w-4"
                />
                أخرى
              </label>
              <span className="border-b border-dotted border-gray-400 flex-1"></span>
            </div>
          </div>

          {/* خاص بدعم المؤسسات المانحة */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="font-bold text-primary mb-3 text-center">
              خاص بدعم المؤسسات المانحة والمسؤولية المجتمعية
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <span className="font-bold">اسم الجهة الداعمة:</span>
                <span className="border-b border-gray-400 px-4 min-w-[200px]">
                  {(request as any).fundingSourceName || orgSettings?.organizationName || "جمعية عمارة المساجد منارة"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold">مبلغ الدعم:</span>
                <span className="border-b border-gray-400 px-4 min-w-[100px]">
                  {amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* بيانات المشروع */}
          <div className="mb-6 border rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-bold w-32">اسم المشروع:</td>
                  <td className="p-3">{project?.name || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-bold">عنوان المشروع:</td>
                  <td className="p-3">{(project as any)?.address || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* وصف الأعمال المطلوبة */}
          <div className="mb-6">
            <div className="font-bold text-center mb-3 text-primary">وصف الأعمال المطلوبة</div>
            <div className="border rounded-lg p-4 min-h-[80px] bg-gray-50">
              {request.description || request.title || "-"}
            </div>
          </div>

          {/* جدول التكاليف */}
          <div className="mb-6 border rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-bold">تكلفة المشروع الفعلية</td>
                  <td className="p-3 text-center">{actualCost.toLocaleString()}</td>
                  <td className="p-3 bg-gray-50 font-bold">الأجور الإدارية</td>
                  <td className="p-3 text-center">{adminFees.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-3 bg-gray-50 font-bold" colSpan={2}>إجمالي قيمة الفرصة</td>
                  <td className="p-3 text-center font-bold text-lg" colSpan={2}>{totalCost.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* الموردون والمقاولون */}
          <div className="mb-6">
            <div className="font-bold mb-3">الموردون والمقاولون</div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-right border-l">اسم المورد</th>
                    <th className="p-3 text-right border-l">الأعمال المنفذة</th>
                    <th className="p-3 text-right">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3 border-l">{contract?.secondPartyName || "-"}</td>
                    <td className="p-3 border-l">{request.description || request.title || "-"}</td>
                    <td className="p-3">{amount.toLocaleString()}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 border-l font-mono" dir="ltr" colSpan={2}>
                      {(contract as any)?.supplierIban || "-"}
                    </td>
                    <td className="p-3 text-gray-500">مصرف الراجحي</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 border-l" colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* التوقيعات */}
          <div className="mt-12 flex justify-between">
            <div className="text-center">
              <div className="font-bold mb-8">الجهة الطالبة</div>
              <div className="border-t border-gray-400 w-40 pt-2">
                {(request as any).requestedByName || ""}
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold mb-8">المدير التنفيذي</div>
              <div className="border-t border-gray-400 w-40 pt-2">
                {orgSettings?.authorizedSignatory || ""}
              </div>
            </div>
          </div>

          {/* تذييل الصفحة */}
          <div className="mt-12 pt-4 border-t text-center text-gray-500 text-sm print:mt-8">
            <p>تم إنشاء هذا المستند آلياً من نظام بوابة تمام للعناية بالمساجد</p>
            <p className="mt-1">تاريخ الطباعة: {new Date().toLocaleDateString("ar-SA")}</p>
          </div>
        </div>
      </div>

      {/* أنماط الطباعة */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
