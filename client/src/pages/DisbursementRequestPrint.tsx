import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowRight, Printer } from "lucide-react";

// دالة تحويل الأرقام إلى نص عربي
function numberToArabicText(num: number): string {
  if (num === 0) return "صفر";
  
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const tens = ["", "عشر", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

  function convertHundreds(n: number): string {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const o = n % 10;
      return o ? `${ones[o]} و${tens[t]}` : tens[t];
    }
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return rest ? `${hundreds[h]} و${convertHundreds(rest)}` : hundreds[h];
  }

  function convertThousands(n: number): string {
    if (n < 1000) return convertHundreds(n);
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    let result = "";
    if (thousands === 1) result = "ألف";
    else if (thousands === 2) result = "ألفان";
    else if (thousands >= 3 && thousands <= 10) result = `${ones[thousands]} آلاف`;
    else result = `${convertHundreds(thousands)} ألف`;
    return rest ? `${result} و${convertHundreds(rest)}` : result;
  }

  function convertMillions(n: number): string {
    if (n < 1000000) return convertThousands(n);
    const millions = Math.floor(n / 1000000);
    const rest = n % 1000000;
    let result = "";
    if (millions === 1) result = "مليون";
    else if (millions === 2) result = "مليونان";
    else if (millions >= 3 && millions <= 10) result = `${ones[millions]} ملايين`;
    else result = `${convertThousands(millions)} مليون`;
    return rest ? `${result} و${convertThousands(rest)}` : result;
  }

  return `فقط ${convertMillions(Math.floor(num))} ريال`;
}

function toHijriDate(date: Date): string {
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  const gregorianDay = date.getDate();
  
  const hijriYear = Math.floor((gregorianYear - 622) * (33 / 32));
  const hijriMonth = ((gregorianMonth + 9) % 12) + 1;
  const hijriDay = gregorianDay;
  
  return `${hijriDay}/${hijriMonth}/${hijriYear}`;
}

function formatGregorianDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export default function DisbursementRequestPrint() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: request, isLoading } = trpc.disbursements.getRequestById.useQuery(
    { id: parseInt(params.id || "0") },
    { enabled: !!params.id }
  );

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

  const actualCost = amount;
  const adminFees = (request as any).adminFees || 0;
  const totalCost = actualCost + adminFees;

  return (
    <>
      {/* أزرار التحكم */}
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

      {/* صفحة الطباعة - تصميم مضغوط */}
      <div className="min-h-screen bg-white print:p-0" dir="rtl">
        <div className="max-w-[210mm] mx-auto p-4 print:p-3 print:max-w-none">
          
          {/* الترويسة */}
          <div className="flex justify-between items-start mb-3">
            {/* التاريخ والرقم */}
            <div className="text-[10px] space-y-0.5 print:text-[9px]">
              <div className="flex gap-1">
                <span className="font-bold">التاريخ:</span>
                <span className="border-b border-dotted border-gray-400 px-2">{toHijriDate(requestDate)}</span>
              </div>
              <div className="flex gap-1">
                <span className="font-bold">الموافق:</span>
                <span className="border-b border-dotted border-gray-400 px-2">{formatGregorianDate(requestDate)}</span>
              </div>
              <div className="flex gap-1">
                <span className="font-bold">رقم التسلسل:</span>
                <span className="border-b border-dotted border-gray-400 px-2 font-mono">{request.requestNumber}</span>
              </div>
            </div>

            {/* شعار الجمعية */}
            <div className="text-center">
              {orgSettings?.logoUrl ? (
                <img src={orgSettings.logoUrl} alt="شعار الجمعية" className="h-12 w-auto mx-auto print:h-10" />
              ) : (
                <div className="text-primary font-bold text-sm print:text-xs">
                  {orgSettings?.organizationName || "جمعية عمارة المساجد"}
                </div>
              )}
              <div className="text-[9px] text-gray-600 mt-1 print:text-[8px]">مكتب إدارة المشاريع PMO</div>
            </div>
          </div>

          {/* عنوان النموذج */}
          <div className="text-center mb-3">
            <h1 className="text-lg font-bold text-primary border-b-2 border-primary pb-1 inline-block px-6 print:text-base">
              طلب صرف
            </h1>
          </div>

          {/* مصدر دعم الفرصة */}
          <div className="mb-2">
            <div className="font-bold text-[10px] mb-1 print:text-[9px]">مصدر دعم الفرصة</div>
            <div className="flex gap-4 text-[9px] print:text-[8px]">
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={(request as any).fundingSource === "donations_store"} readOnly className="h-3 w-3" />
                متجر التبرعات
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={(request as any).fundingSource === "ehsan_platform"} readOnly className="h-3 w-3" />
                منصة إحسان
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={(request as any).fundingSource === "direct_donation"} readOnly className="h-3 w-3" />
                تبرع مباشر
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={(request as any).fundingSource === "other"} readOnly className="h-3 w-3" />
                أخرى
              </label>
            </div>
          </div>

          {/* خاص بدعم المؤسسات المانحة */}
          <div className="mb-2 bg-blue-50 p-2 rounded border border-blue-200">
            <div className="font-bold text-primary text-[10px] mb-1 text-center print:text-[9px]">
              خاص بدعم المؤسسات المانحة والمسؤولية المجتمعية
            </div>
            <div className="flex justify-between items-center text-[10px] print:text-[9px]">
              <div className="flex gap-1">
                <span className="font-bold">اسم الجهة الداعمة:</span>
                <span className="border-b border-gray-400 px-2">
                  {(request as any).fundingSourceName || orgSettings?.organizationName || "جمعية عمارة المساجد منارة"}
                </span>
              </div>
              <div className="flex gap-1">
                <span className="font-bold">مبلغ الدعم:</span>
                <span className="border-b border-gray-400 px-2">{amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* بيانات المشروع */}
          <table className="w-full border-collapse text-[10px] print:text-[9px] mb-2">
            <tbody>
              <tr className="border">
                <td className="p-1.5 bg-gray-50 font-bold w-24 border-l">اسم المشروع:</td>
                <td className="p-1.5">{project?.name || "-"}</td>
              </tr>
              <tr className="border">
                <td className="p-1.5 bg-gray-50 font-bold border-l">عنوان المشروع:</td>
                <td className="p-1.5">{(project as any)?.address || "-"}</td>
              </tr>
            </tbody>
          </table>

          {/* وصف الأعمال المطلوبة */}
          <div className="mb-2">
            <div className="font-bold text-[10px] text-center mb-1 text-primary print:text-[9px]">وصف الأعمال المطلوبة</div>
            <div className="border rounded p-2 min-h-[40px] bg-gray-50 text-[10px] print:text-[9px]">
              {request.description || request.title || "-"}
            </div>
          </div>

          {/* المبلغ المطلوب - إبراز خاص */}
          <div className="mb-2 bg-gradient-to-l from-primary/10 to-primary/5 border-2 border-primary rounded-lg p-3 print:p-2">
            <div className="text-center">
              <div className="text-[10px] text-primary font-bold mb-1 print:text-[9px]">المبلغ المطلوب صرفه</div>
              <div className="text-2xl font-bold text-primary print:text-xl">
                {amount.toLocaleString()} <span className="text-lg print:text-base">ريال سعودي</span>
              </div>
              <div className="text-[10px] text-gray-600 mt-1 print:text-[9px]">{numberToArabicText(amount)}</div>
            </div>
          </div>

          {/* جدول التكاليف */}
          <table className="w-full border-collapse text-[10px] print:text-[9px] mb-2">
            <tbody>
              <tr className="border">
                <td className="p-1.5 bg-gray-50 font-bold border-l">تكلفة المشروع الفعلية</td>
                <td className="p-1.5 text-center">{actualCost.toLocaleString()}</td>
                <td className="p-1.5 bg-gray-50 font-bold border-l">الأجور الإدارية</td>
                <td className="p-1.5 text-center">{adminFees.toLocaleString()}</td>
              </tr>
              <tr className="border">
                <td className="p-1.5 bg-gray-50 font-bold border-l" colSpan={2}>إجمالي قيمة الفرصة</td>
                <td className="p-1.5 text-center font-bold" colSpan={2}>{totalCost.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* الموردون والمقاولون */}
          <div className="mb-2">
            <div className="font-bold text-[10px] mb-1 print:text-[9px]">الموردون والمقاولون</div>
            <table className="w-full border-collapse text-[9px] print:text-[8px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-1 text-right border">اسم المورد</th>
                  <th className="p-1 text-right border">الأعمال المنفذة</th>
                  <th className="p-1 text-right border w-20">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1 border">{contract?.secondPartyName || "-"}</td>
                  <td className="p-1 border">{request.description || request.title || "-"}</td>
                  <td className="p-1 border">{amount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-1 border font-mono text-[8px]" dir="ltr" colSpan={2}>
                    IBAN: {(contract as any)?.supplierIban || "-"}
                  </td>
                  <td className="p-1 border text-gray-500">{(contract as any)?.supplierBank || "مصرف الراجحي"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* التوقيعات */}
          <div className="mt-4 flex justify-between text-[10px] print:text-[9px]">
            <div className="text-center">
              <div className="font-bold mb-6">الجهة الطالبة</div>
              <div className="border-t border-gray-400 w-32 pt-1">
                {(request as any).requestedByName || ""}
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold mb-6">المدير التنفيذي</div>
              <div className="border-t border-gray-400 w-32 pt-1">
                {orgSettings?.authorizedSignatory || ""}
              </div>
            </div>
          </div>

          {/* تذييل الصفحة */}
          <div className="mt-3 pt-2 border-t text-center text-gray-500 text-[9px] print:text-[8px]">
            <p>تم إنشاء هذا المستند آلياً من نظام بوابة تمام للعناية بالمساجد</p>
            <p className="mt-0.5">تاريخ الطباعة: {new Date().toLocaleDateString("ar-SA")}</p>
          </div>
        </div>
      </div>

      {/* أنماط الطباعة */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm;
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
