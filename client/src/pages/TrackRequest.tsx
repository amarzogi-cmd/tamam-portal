import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PROGRAM_LABELS, STAGE_LABELS, STATUS_LABELS } from "@shared/constants";

const programIcons: Record<string, string> = {
  bunyan: "🏗️",
  daaem: "🔨",
  enaya: "🔧",
  emdad: "📦",
  ethraa: "🧾",
  sedana: "✨",
  taqa: "☀️",
  miyah: "💧",
  suqya: "🚰",
};

const stageSteps = [
  { key: "submitted", label: "تقديم الطلب" },
  { key: "initial_review", label: "الفرز الأولي" },
  { key: "field_visit", label: "الزيارة الميدانية" },
  { key: "technical_eval", label: "الدراسة الفنية" },
  { key: "financial_eval", label: "الاعتماد المالي" },
  { key: "execution", label: "التنفيذ" },
  { key: "closed", label: "الإغلاق" },
];

export default function TrackRequest() {
  const [requestNumber, setRequestNumber] = useState("");
  const [searchedNumber, setSearchedNumber] = useState("");

  const { data: request, isLoading, error } = trpc.requests.getByNumber.useQuery(
    { requestNumber: searchedNumber },
    { enabled: !!searchedNumber }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestNumber.trim()) {
      setSearchedNumber(requestNumber.trim());
    }
  };

  const currentStageIndex = request ? stageSteps.findIndex(s => s.key === request.currentStage) : -1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background" dir="rtl">
      {/* الهيدر */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-foreground">بوابة تمام</h1>
                  <p className="text-xs text-muted-foreground">للعناية بالمساجد</p>
                </div>
              </div>
            </Link>
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* العنوان */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">تتبع طلبك</h1>
            <p className="text-muted-foreground">أدخل رقم الطلب لمتابعة حالته</p>
          </div>

          {/* نموذج البحث */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={requestNumber}
                    onChange={(e) => setRequestNumber(e.target.value)}
                    placeholder="أدخل رقم الطلب (مثال: BUN-ABC123)"
                    className="pr-12 h-12 text-lg"
                  />
                </div>
                <Button type="submit" className="gradient-primary text-white h-12 px-8">
                  بحث
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* نتيجة البحث */}
          {isLoading && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground mt-4">جاري البحث...</p>
              </CardContent>
            </Card>
          )}

          {error && searchedNumber && (
            <Card className="border-0 shadow-lg border-red-200">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-600 font-medium">الطلب غير موجود</p>
                <p className="text-muted-foreground mt-2">تأكد من رقم الطلب وحاول مرة أخرى</p>
              </CardContent>
            </Card>
          )}

          {request && (
            <div className="space-y-6">
              {/* معلومات الطلب */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{programIcons[request.programType] || "📋"}</span>
                      <div>
                        <CardTitle>{request.requestNumber}</CardTitle>
                        <CardDescription>{PROGRAM_LABELS[request.programType]}</CardDescription>
                      </div>
                    </div>
                    <span className={`badge text-sm ${
                      request.status === "completed" ? "bg-green-100 text-green-800" :
                      request.status === "rejected" ? "bg-red-100 text-red-800" :
                      request.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {STATUS_LABELS[request.status]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">المرحلة الحالية</p>
                      <p className="font-medium">{STAGE_LABELS[request.currentStage]}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">تاريخ التقديم</p>
                      <p className="font-medium">{new Date(request.createdAt).toLocaleDateString("ar-SA")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* شريط المراحل */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>مراحل الطلب</CardTitle>
                  <CardDescription>تتبع تقدم طلبك عبر المراحل المختلفة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stageSteps.map((stage, index) => {
                      const isCompleted = index < currentStageIndex;
                      const isCurrent = index === currentStageIndex;
                      return (
                        <div key={stage.key} className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isCompleted ? "bg-green-500 text-white" :
                            isCurrent ? "bg-primary text-white" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isCurrent ? (
                              <Clock className="w-5 h-5" />
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>
                          <div className={`flex-1 ${isCurrent ? "font-medium text-primary" : ""}`}>
                            {stage.label}
                          </div>
                          {isCompleted && (
                            <span className="text-sm text-green-600">مكتمل</span>
                          )}
                          {isCurrent && (
                            <span className="text-sm text-primary">جاري</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* معلومات إضافية */}
          {!searchedNumber && (
            <Card className="border-0 shadow-sm bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">كيف أجد رقم الطلب؟</h3>
                <p className="text-muted-foreground text-sm">
                  رقم الطلب يتم إرساله إليك عبر البريد الإلكتروني أو الرسائل النصية عند تقديم الطلب.
                  يمكنك أيضاً العثور عليه في لوحة التحكم الخاصة بك إذا كان لديك حساب.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
