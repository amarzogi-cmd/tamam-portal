import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  FolderKanban, 
  Building2, 
  Calendar, 
  DollarSign,
  FileText,
  Users,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Link, useParams } from "wouter";

export default function ProjectDetails() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  // بيانات تجريبية
  const project = {
    id: projectId,
    name: "بناء مسجد الرحمة",
    mosque: "مسجد الرحمة",
    program: "بنيان",
    status: "in_progress",
    budget: 500000,
    spent: 250000,
    progress: 50,
    startDate: "2024-01-15",
    endDate: "2024-12-31",
    description: "مشروع بناء مسجد الرحمة في حي النسيم بالرياض",
    contractor: "شركة الخير للمقاولات",
  };

  const phases = [
    { id: 1, name: "الأعمال التحضيرية", status: "completed", progress: 100 },
    { id: 2, name: "الهيكل الإنشائي", status: "completed", progress: 100 },
    { id: 3, name: "أعمال التشطيبات", status: "in_progress", progress: 60 },
    { id: 4, name: "التجهيزات والأثاث", status: "pending", progress: 0 },
  ];

  const payments = [
    { id: 1, date: "2024-01-20", amount: 100000, description: "دفعة مقدمة", status: "paid" },
    { id: 2, date: "2024-03-15", amount: 150000, description: "دفعة الهيكل", status: "paid" },
    { id: 3, date: "2024-06-01", amount: 150000, description: "دفعة التشطيبات", status: "pending" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان */}
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {project.mosque} - {project.program}
            </p>
          </div>
          <span className="badge bg-yellow-100 text-yellow-800">قيد التنفيذ</span>
        </div>

        {/* بطاقات الملخص */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نسبة الإنجاز</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{project.progress}%</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-primary" />
                </div>
              </div>
              <Progress value={project.progress} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الميزانية</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{project.budget.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">ريال سعودي</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المصروف</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{project.spent.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{((project.spent / project.budget) * 100).toFixed(0)}% من الميزانية</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{project.endDate}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="phases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="phases">مراحل المشروع</TabsTrigger>
            <TabsTrigger value="payments">الدفعات المالية</TabsTrigger>
            <TabsTrigger value="documents">المستندات</TabsTrigger>
            <TabsTrigger value="team">فريق العمل</TabsTrigger>
          </TabsList>

          <TabsContent value="phases">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>مراحل المشروع</CardTitle>
                <CardDescription>متابعة تقدم مراحل التنفيذ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phases.map((phase, index) => (
                    <div key={phase.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        phase.status === "completed" ? "bg-green-100" :
                        phase.status === "in_progress" ? "bg-yellow-100" : "bg-muted"
                      }`}>
                        {phase.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : phase.status === "in_progress" ? (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <span className="text-muted-foreground">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{phase.name}</p>
                        <Progress value={phase.progress} className="h-2 mt-2" />
                      </div>
                      <span className="text-sm text-muted-foreground">{phase.progress}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>الدفعات المالية</CardTitle>
                <CardDescription>سجل الدفعات والمستحقات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          payment.status === "paid" ? "bg-green-100" : "bg-yellow-100"
                        }`}>
                          <DollarSign className={`w-5 h-5 ${
                            payment.status === "paid" ? "text-green-600" : "text-yellow-600"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{payment.description}</p>
                          <p className="text-sm text-muted-foreground">{payment.date}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold">{payment.amount.toLocaleString()} ر.س</p>
                        <span className={`badge text-xs ${
                          payment.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {payment.status === "paid" ? "مدفوع" : "قيد الانتظار"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد مستندات مرفقة</p>
                <Button variant="outline" className="mt-4">رفع مستند</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لم يتم تعيين فريق عمل بعد</p>
                <Button variant="outline" className="mt-4">إضافة عضو</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
