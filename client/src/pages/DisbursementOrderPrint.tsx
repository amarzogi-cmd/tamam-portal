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

// دالة تحويل التاريخ الميلادي إلى هجري (تقريبي)
function toHijriDate(date: Date): string {
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  const gregorianDay = date.getDate();
  
  // تحويل تقريبي
  const hijriYear = Math.floor((gregorianYear - 622) * (33 / 32));
  const hijriMonth = ((gregorianMonth + 9) % 12) + 1;
  const hijriDay = gregorianDay;
  
  return `${hijriDay} / ${hijriMonth} / ${hijriYear} هـ`;
}

function formatGregorianDate(date: Date): string {
  return `${date.getFullYear()} / ${date.getMonth() + 1} / ${date.getDate()} م`;
}

const PAYMENT_METHOD_MAP: Record<string, string> = {
  bank_transfer: "تحويل بنكي",
  check: "إصدار شيك",
  custody: "صرف من العهدة",
  sadad: "سداد",
};

export default function DisbursementOrderPrint() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: order, isLoading } = trpc.disbursements.getOrderById.useQuery(
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

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">أمر الصرف غير موجود</h2>
          <Button onClick={() => navigate("/disbursements")}>
            العودة لطلبات الصرف
          </Button>
        </div>
      </div>
    );
  }

  const amount = parseFloat(order.amount?.toString() || "0");
  const request = order.disbursementRequest;
  const project = order.project;
  const orderDate = new Date(order.createdAt || new Date());

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
          <div className="flex justify-between items-start mb-6 border-b-4 border-primary pb-4">
            {/* شعار رؤية 2030 */}
            <div className="text-left">
              <img 
                src="/vision-2030-logo.png" 
                alt="رؤية 2030" 
                className="h-16 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="text-xs text-gray-500 mt-1">
                KINGDOM OF SAUDI ARABIA
              </div>
            </div>

            {/* العنوان */}
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-primary mb-2">
                أمر صرف | {PAYMENT_METHOD_MAP[order.paymentMethod || "bank_transfer"]}
              </h1>
              <div className="text-lg font-bold text-gray-600">
                {order.orderNumber}
              </div>
            </div>

            {/* شعار الجمعية */}
            <div className="text-right">
              {orgSettings?.logoUrl ? (
                <img 
                  src={orgSettings.logoUrl} 
                  alt="شعار الجمعية" 
                  className="h-16 w-auto"
                />
              ) : (
                <div className="text-primary font-bold text-lg">
                  {orgSettings?.organizationName || "جمعية عمارة المساجد"}
                </div>
              )}
            </div>
          </div>

          {/* التاريخ */}
          <div className="flex justify-between items-center mb-6 bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center gap-4">
              <span className="font-bold">التاريخ</span>
              <span className="bg-white px-3 py-1 rounded border">{toHijriDate(orderDate)}</span>
              <span className="text-gray-500">الموافق</span>
              <span className="bg-white px-3 py-1 rounded border">{formatGregorianDate(orderDate)}</span>
            </div>
          </div>

          {/* بيانات الصرف الرئيسية */}
          <div className="mb-6 border rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-bold w-32">اصرفوا للمكرم/</td>
                  <td className="p-3 font-bold text-lg">{order.beneficiaryName}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-bold">مبلغ وقدره/</td>
                  <td className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-500 ml-2">رقماً</span>
                        <span className="font-bold text-lg">{amount.toLocaleString()} ريال</span>
                      </div>
                      <div>
                        <span className="text-gray-500 ml-2">كتابة</span>
                        <span className="font-medium">{numberToArabicText(amount)}</span>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 bg-gray-50 font-bold">رقم طلب الصرف/</td>
                  <td className="p-3 font-mono">{request?.requestNumber || "-"}</td>
                </tr>
                <tr>
                  <td className="p-3 bg-gray-50 font-bold">وذلك مقابل/</td>
                  <td className="p-3">{request?.description || request?.title || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* خاص بالمشاريع */}
          {project && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 text-primary">خاص بالمشاريع:</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-bold w-40">اسم المشروع</td>
                      <td className="p-3">{project.name}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-bold">الجهة الداعمة</td>
                      <td className="p-3">{(project as any).fundingSource || "لا يوجد"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 font-bold">إجمالي قيمة الدعم</td>
                      <td className="p-3">{((project as any).fundingAmount || 0).toLocaleString()}</td>
                      <td className="p-3 bg-gray-50 font-bold">إجمالي قيمة العقد</td>
                      <td className="p-3">{((project as any).contractAmount || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 font-bold">إجمالي ما تم دفعه</td>
                      <td className="p-3">{((project as any).totalPaid || 0).toLocaleString()}</td>
                      <td className="p-3 bg-gray-50 font-bold">المبلغ المتبقي بعد صرف المبلغ أعلاه</td>
                      <td className="p-3">{((project as any).remainingAmount || 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* تحويل بنكي من حساب الجمعية إلى */}
          {order.paymentMethod === "bank_transfer" && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 text-primary">تحويل بنكي من حساب الجمعية إلى:</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-bold w-32">اسم الحساب</td>
                      <td className="p-3">{order.beneficiaryName}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-bold">اسم البنك</td>
                      <td className="p-3">{order.beneficiaryBank || "-"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-bold">رقم الآيبان</td>
                      <td className="p-3 font-mono" dir="ltr">{order.beneficiaryIban || "-"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 bg-gray-50 font-bold">رقم سداد</td>
                      <td className="p-3">{(order as any).sadadNumber || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 font-bold">رمز المفوتر</td>
                      <td className="p-3">{(order as any).billerCode || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* جدول التوقيعات */}
          <div className="mt-8">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-right">الوظيفة</th>
                  <th className="border p-3 text-right">الاسم</th>
                  <th className="border p-3 text-right">التوقيع</th>
                  <th className="border p-3 text-right">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3 font-bold">المحاسب</td>
                  <td className="border p-3">{(order as any).accountantName || ""}</td>
                  <td className="border p-3 h-16"></td>
                  <td className="border p-3"></td>
                </tr>
                <tr>
                  <td className="border p-3 font-bold">المدير التنفيذي</td>
                  <td className="border p-3">{(order as any).executiveDirectorName || ""}</td>
                  <td className="border p-3 h-16"></td>
                  <td className="border p-3"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* تذييل الصفحة */}
          <div className="mt-8 pt-4 border-t text-center text-gray-500 text-sm print:mt-4">
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
