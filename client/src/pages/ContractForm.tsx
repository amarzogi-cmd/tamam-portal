import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  FileText,
  Building2,
  User,
  Calendar,
  DollarSign,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  Save,
} from "lucide-react";

// أنواع العقود
const CONTRACT_TYPES = [
  { value: "supervision", label: "إشراف هندسي" },
  { value: "construction", label: "مقاولات" },
  { value: "supply", label: "توريد" },
  { value: "maintenance", label: "صيانة" },
  { value: "consulting", label: "استشارات" },
];

// وحدات المدة
const DURATION_UNITS = [
  { value: "days", label: "يوم" },
  { value: "weeks", label: "أسبوع" },
  { value: "months", label: "شهر" },
  { value: "years", label: "سنة" },
];

export default function ContractForm() {
  const [, navigate] = useLocation();
  const params = useParams();
  const projectId = params.projectId ? parseInt(params.projectId) : undefined;
  
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // بيانات العقد
  const [contractData, setContractData] = useState({
    // نوع العقد والمشروع
    contractType: "" as string,
    projectId: projectId || null as number | null,
    
    // المورد (الطرف الثاني)
    supplierId: null as number | null,
    
    // تفاصيل العقد
    subject: "",
    description: "",
    
    // المدة
    duration: 0,
    durationUnit: "months" as string,
    startDate: "",
    
    // القيمة المالية
    totalValue: 0,
    
    // الشروط
    termsAndConditions: "",
    notes: "",
  });

  // جلب الموردين المعتمدين
  const { data: suppliersData, isLoading: suppliersLoading } = trpc.suppliers.list.useQuery({
    approvalStatus: "approved",
    limit: 100,
  });

  // جلب المشاريع
  const { data: projectsData, isLoading: projectsLoading } = trpc.projects.getAll.useQuery({
    limit: 100,
  });

  // جلب إعدادات الجمعية
  const { data: orgSettings } = trpc.contracts.getOrganizationSettings.useQuery();

  // جلب تفاصيل المورد المختار
  const { data: selectedSupplier } = trpc.suppliers.getById.useQuery(
    { id: contractData.supplierId! },
    { enabled: !!contractData.supplierId }
  );

  // Mutation لإنشاء العقد
  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: (data) => {
      toast.success("تم إنشاء العقد بنجاح");
      navigate(`/contracts/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء العقد");
      setIsSubmitting(false);
    },
  });

  // تحميل الشروط الافتراضية
  useEffect(() => {
    if (orgSettings?.contractTermsAndConditions && !contractData.termsAndConditions) {
      setContractData(prev => ({
        ...prev,
        termsAndConditions: orgSettings.contractTermsAndConditions || "",
      }));
    }
  }, [orgSettings]);

  // التحقق من صحة الخطوة الحالية
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!contractData.contractType) {
          toast.error("يرجى اختيار نوع العقد");
          return false;
        }
        return true;
      case 2:
        if (!contractData.supplierId) {
          toast.error("يرجى اختيار المورد");
          return false;
        }
        return true;
      case 3:
        if (!contractData.subject) {
          toast.error("يرجى إدخال موضوع العقد");
          return false;
        }
        if (!contractData.duration || contractData.duration <= 0) {
          toast.error("يرجى إدخال مدة العقد");
          return false;
        }
        if (!contractData.startDate) {
          toast.error("يرجى تحديد تاريخ البدء");
          return false;
        }
        if (!contractData.totalValue || contractData.totalValue <= 0) {
          toast.error("يرجى إدخال قيمة العقد");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // الانتقال للخطوة التالية
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  // الانتقال للخطوة السابقة
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // إرسال العقد
  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    // جلب بيانات المورد المختار
    const supplier = selectedSupplier;
    if (!supplier) {
      toast.error("يرجى اختيار المورد");
      setIsSubmitting(false);
      return;
    }
    
    createMutation.mutate({
      contractType: contractData.contractType as any,
      contractTitle: contractData.subject,
      projectId: contractData.projectId || undefined,
      supplierId: contractData.supplierId!,
      // بيانات الطرف الثاني من المورد
      secondPartyName: supplier.name,
      secondPartyCommercialRegister: supplier.commercialRegister || undefined,
      secondPartyRepresentative: supplier.contactPerson || undefined,
      secondPartyTitle: supplier.contactPersonTitle || undefined,
      secondPartyAddress: supplier.address || undefined,
      secondPartyPhone: supplier.phone || undefined,
      secondPartyEmail: supplier.email || undefined,
      secondPartyBankName: supplier.bankName || undefined,
      secondPartyIban: supplier.iban || undefined,
      secondPartyAccountName: supplier.bankAccountName || undefined,
      // قيمة ومدة العقد
      contractAmount: contractData.totalValue,
      duration: contractData.duration,
      durationUnit: contractData.durationUnit as any,
      contractDate: contractData.startDate,
      // البنود الإضافية
      customTerms: contractData.termsAndConditions || undefined,
    });
  };

  const suppliers = suppliersData?.suppliers || [];
  const projects = projectsData || [];

  // خطوات النموذج
  const steps = [
    { id: 1, title: "نوع العقد", icon: FileText },
    { id: 2, title: "الطرف الثاني", icon: Building2 },
    { id: 3, title: "تفاصيل العقد", icon: DollarSign },
    { id: 4, title: "المراجعة", icon: Eye },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* العنوان */}
        <div>
          <h1 className="text-2xl font-bold">إنشاء عقد جديد</h1>
          <p className="text-muted-foreground">
            إنشاء عقد مع مورد معتمد
          </p>
        </div>

        {/* شريط الخطوات */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      isActive ? "text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 md:w-24 h-1 mx-2 ${
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* محتوى الخطوات */}
        <Card>
          <CardContent className="pt-6">
            {/* الخطوة 1: نوع العقد */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>نوع العقد *</Label>
                  <Select
                    value={contractData.contractType}
                    onValueChange={(value) => setContractData({ ...contractData, contractType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع العقد" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>المشروع (اختياري)</Label>
                  <Select
                    value={contractData.projectId?.toString() || "none"}
                    onValueChange={(value) => setContractData({ 
                      ...contractData, 
                      projectId: value === "none" ? null : parseInt(value) 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المشروع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون مشروع</SelectItem>
                      {projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    يمكنك ربط العقد بمشروع موجود أو إنشاء عقد مستقل
                  </p>
                </div>
              </div>
            )}

            {/* الخطوة 2: اختيار المورد */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>المورد (الطرف الثاني) *</Label>
                  {suppliersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg bg-yellow-50">
                      <Building2 className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
                      <p className="text-yellow-700">لا يوجد موردين معتمدين</p>
                      <p className="text-sm text-yellow-600">
                        يجب اعتماد مورد واحد على الأقل قبل إنشاء العقد
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => navigate("/suppliers")}
                      >
                        إدارة الموردين
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {suppliers.map((supplier) => (
                        <div
                          key={supplier.id}
                          onClick={() => setContractData({ ...contractData, supplierId: supplier.id })}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            contractData.supplierId === supplier.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary"
                              : "hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{supplier.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {supplier.entityType === "company" ? "شركة" : "مؤسسة"} - 
                                السجل التجاري: {supplier.commercialRegister}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {supplier.contactPerson} - {supplier.phone}
                              </p>
                            </div>
                            {contractData.supplierId === supplier.id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* عرض تفاصيل المورد المختار */}
                {selectedSupplier && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3">بيانات المورد المختار</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">الممثل:</span>
                        <p>{selectedSupplier.contactPerson}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الوظيفة:</span>
                        <p>{selectedSupplier.contactPersonTitle}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">البريد:</span>
                        <p dir="ltr">{selectedSupplier.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الآيبان:</span>
                        <p dir="ltr">{selectedSupplier.iban}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* الخطوة 3: تفاصيل العقد */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">موضوع العقد *</Label>
                  <Input
                    id="subject"
                    value={contractData.subject}
                    onChange={(e) => setContractData({ ...contractData, subject: e.target.value })}
                    placeholder="مثال: عقد إشراف هندسي على مشروع بناء مسجد..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">وصف العقد</Label>
                  <Textarea
                    id="description"
                    value={contractData.description}
                    onChange={(e) => setContractData({ ...contractData, description: e.target.value })}
                    placeholder="وصف تفصيلي لنطاق العمل..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">مدة العقد *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={contractData.duration || ""}
                      onChange={(e) => setContractData({ ...contractData, duration: parseInt(e.target.value) || 0 })}
                      placeholder="المدة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وحدة المدة *</Label>
                    <Select
                      value={contractData.durationUnit}
                      onValueChange={(value) => setContractData({ ...contractData, durationUnit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">تاريخ البدء *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={contractData.startDate}
                      onChange={(e) => setContractData({ ...contractData, startDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalValue">قيمة العقد (ريال) *</Label>
                  <Input
                    id="totalValue"
                    type="number"
                    min="0"
                    value={contractData.totalValue || ""}
                    onChange={(e) => setContractData({ ...contractData, totalValue: parseFloat(e.target.value) || 0 })}
                    placeholder="القيمة الإجمالية"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">الشروط والأحكام</Label>
                  <Textarea
                    id="termsAndConditions"
                    value={contractData.termsAndConditions}
                    onChange={(e) => setContractData({ ...contractData, termsAndConditions: e.target.value })}
                    placeholder="الشروط والأحكام الخاصة بالعقد..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    value={contractData.notes}
                    onChange={(e) => setContractData({ ...contractData, notes: e.target.value })}
                    placeholder="أي ملاحظات إضافية..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* الخطوة 4: المراجعة */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">مراجعة بيانات العقد</h3>

                {/* الطرف الأول */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    الطرف الأول (الجمعية)
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">الاسم:</span>
                      <p className="font-medium">{orgSettings?.organizationName || "جمعية تمام للعناية بالمساجد"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">رقم الترخيص:</span>
                      <p>{orgSettings?.licenseNumber || "-"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">مفوض التوقيع:</span>
                      <p>{orgSettings?.authorizedSignatory || "-"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الصفة:</span>
                      <p>{orgSettings?.signatoryTitle || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* الطرف الثاني */}
                {selectedSupplier && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      الطرف الثاني (المورد)
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">الاسم:</span>
                        <p className="font-medium">{selectedSupplier.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">السجل التجاري:</span>
                        <p dir="ltr">{selectedSupplier.commercialRegister}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الممثل:</span>
                        <p>{selectedSupplier.contactPerson}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الصفة:</span>
                        <p>{selectedSupplier.contactPersonTitle}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* تفاصيل العقد */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    تفاصيل العقد
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">نوع العقد:</span>
                      <p className="font-medium">
                        {CONTRACT_TYPES.find(t => t.value === contractData.contractType)?.label}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المشروع:</span>
                      <p>
                        {contractData.projectId
                          ? projects.find((p: any) => p.id === contractData.projectId)?.name
                          : "بدون مشروع"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">موضوع العقد:</span>
                      <p className="font-medium">{contractData.subject}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المدة:</span>
                      <p>
                        {contractData.duration}{" "}
                        {DURATION_UNITS.find(u => u.value === contractData.durationUnit)?.label}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">تاريخ البدء:</span>
                      <p>{new Date(contractData.startDate).toLocaleDateString("ar-SA")}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">قيمة العقد:</span>
                      <p className="font-bold text-lg text-primary">
                        {contractData.totalValue.toLocaleString("ar-SA")} ريال
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* أزرار التنقل */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            السابق
          </Button>

          {currentStep < 4 ? (
            <Button onClick={nextStep}>
              التالي
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/contracts/preview?data=${encodeURIComponent(JSON.stringify(contractData))}`)}
              >
                <Eye className="h-4 w-4 ml-2" />
                معاينة العقد
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                إنشاء العقد
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
