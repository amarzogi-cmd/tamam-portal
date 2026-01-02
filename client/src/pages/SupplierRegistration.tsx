import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { FileUpload } from "@/components/FileUpload";
import { 
  Building2, 
  Phone, 
  CreditCard, 
  FileText, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  MapPin
} from "lucide-react";

// أنواع البيانات
// مجالات العمل المتاحة
type WorkFieldType = "construction" | "engineering_consulting" | "electrical" | "plumbing" | "hvac" | 
  "finishing" | "carpentry" | "aluminum" | "painting" | "flooring" | "landscaping" | "cleaning" | 
  "maintenance" | "security_systems" | "sound_systems" | "solar_energy" | "water_systems" | 
  "furniture" | "carpets" | "supplies" | "other";

interface EntityInfo {
  name: string;
  entityType: "company" | "establishment";
  commercialRegister: string;
  commercialActivity: string;
  yearsOfExperience: number;
  workFields: WorkFieldType[];
}

interface ContactInfo {
  address: string;
  city: string;
  googleMapsUrl: string;
  email: string;
  phone: string;
  phoneSecondary: string;
  contactPerson: string;
  contactPersonTitle: string;
}

interface BankInfo {
  bankAccountName: string;
  bankName: string;
  iban: string;
  taxNumber: string;
}

interface Attachments {
  commercialRegisterDoc: string;
  vatCertificateDoc: string;
  nationalAddressDoc: string;
}

// مجالات العمل
const WORK_FIELDS: { key: WorkFieldType; label: string }[] = [
  { key: "construction", label: "بناء وتشييد" },
  { key: "engineering_consulting", label: "استشارات هندسية" },
  { key: "electrical", label: "أعمال كهربائية" },
  { key: "plumbing", label: "أعمال سباكة" },
  { key: "hvac", label: "تكييف وتبريد" },
  { key: "finishing", label: "تشطيبات" },
  { key: "carpentry", label: "نجارة" },
  { key: "aluminum", label: "ألمنيوم" },
  { key: "painting", label: "دهانات" },
  { key: "flooring", label: "أرضيات" },
  { key: "landscaping", label: "تنسيق حدائق" },
  { key: "cleaning", label: "نظافة" },
  { key: "maintenance", label: "صيانة" },
  { key: "security_systems", label: "أنظمة أمنية" },
  { key: "sound_systems", label: "أنظمة صوتية" },
  { key: "solar_energy", label: "طاقة شمسية" },
  { key: "water_systems", label: "أنظمة مياه" },
  { key: "furniture", label: "أثاث" },
  { key: "carpets", label: "سجاد" },
  { key: "supplies", label: "توريدات" },
  { key: "other", label: "أخرى" },
];

// البنوك السعودية
const SAUDI_BANKS = [
  "البنك الأهلي السعودي",
  "مصرف الراجحي",
  "بنك الرياض",
  "البنك السعودي الفرنسي",
  "البنك السعودي البريطاني (ساب)",
  "بنك البلاد",
  "بنك الجزيرة",
  "البنك العربي الوطني",
  "بنك الإنماء",
  "مصرف الإنماء",
  "بنك الخليج الدولي",
  "بنك الاستثمار السعودي",
];

export default function SupplierRegistration() {
  const [, navigate] = useLocation();

  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // بيانات النموذج
  const [entityInfo, setEntityInfo] = useState<EntityInfo>({
    name: "",
    entityType: "establishment",
    commercialRegister: "",
    commercialActivity: "",
    yearsOfExperience: 0,
    workFields: [],
  });

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    address: "",
    city: "",
    googleMapsUrl: "",
    email: "",
    phone: "",
    phoneSecondary: "",
    contactPerson: "",
    contactPersonTitle: "",
  });

  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankAccountName: "",
    bankName: "",
    iban: "",
    taxNumber: "",
  });

  const [attachments, setAttachments] = useState<Attachments>({
    commercialRegisterDoc: "",
    vatCertificateDoc: "",
    nationalAddressDoc: "",
  });

  // Mutation لتسجيل المورد
  const registerMutation = trpc.suppliers.register.useMutation({
    onSuccess: () => {
      toast.success("تم التسجيل بنجاح - سيتم مراجعة طلبك من قبل الإدارة");
      navigate("/supplier/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ في التسجيل");
      setIsSubmitting(false);
    },
  });

  // التحقق من صحة الخطوة الحالية
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!entityInfo.name || !entityInfo.commercialRegister || !entityInfo.commercialActivity) {
          toast.error("يرجى ملء جميع الحقول المطلوبة");
          return false;
        }
        if (entityInfo.workFields.length === 0) {
          toast.error("يرجى اختيار مجال عمل واحد على الأقل");
          return false;
        }
        return true;
      case 2:
        if (!contactInfo.address || !contactInfo.email || !contactInfo.phone || 
            !contactInfo.contactPerson || !contactInfo.contactPersonTitle) {
          toast.error("يرجى ملء جميع الحقول المطلوبة");
          return false;
        }
        // التحقق من صحة البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactInfo.email)) {
          toast.error("البريد الإلكتروني غير صحيح");
          return false;
        }
        return true;
      case 3:
        if (!bankInfo.bankAccountName || !bankInfo.bankName || !bankInfo.iban || !bankInfo.taxNumber) {
          toast.error("يرجى ملء جميع الحقول المطلوبة");
          return false;
        }
        // التحقق من صحة الآيبان
        if (!bankInfo.iban.match(/^SA\d{22}$/)) {
          toast.error("رقم الآيبان غير صحيح (يجب أن يبدأ بـ SA متبوعاً بـ 22 رقم)");
          return false;
        }
        return true;
      case 4:
        if (!attachments.commercialRegisterDoc || !attachments.vatCertificateDoc || !attachments.nationalAddressDoc) {
          toast.error("يرجى رفع جميع المرفقات المطلوبة");
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
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  // الانتقال للخطوة السابقة
  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // إرسال النموذج
  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setIsSubmitting(true);
    
    registerMutation.mutate({
      ...entityInfo,
      ...contactInfo,
      ...bankInfo,
      ...attachments,
    });
  };

  // تحديث مجالات العمل
  const toggleWorkField = (field: WorkFieldType) => {
    setEntityInfo((prev) => ({
      ...prev,
      workFields: prev.workFields.includes(field)
        ? prev.workFields.filter((f) => f !== field)
        : [...prev.workFields, field],
    }));
  };

  // التحقق من تسجيل الدخول
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>تسجيل الدخول مطلوب</CardTitle>
            <CardDescription>يرجى تسجيل الدخول أولاً للتسجيل كمورد</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/")}>
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // خطوات التسجيل
  const steps = [
    { number: 1, title: "معلومات الكيان", icon: Building2 },
    { number: 2, title: "معلومات التواصل", icon: Phone },
    { number: 3, title: "الحساب البنكي", icon: CreditCard },
    { number: 4, title: "المرفقات", icon: FileText },
    { number: 5, title: "المراجعة", icon: Check },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">تسجيل مورد جديد</h1>
          <p className="text-gray-600 mt-2">قم بتعبئة البيانات المطلوبة للتسجيل كمورد معتمد</p>
        </div>

        {/* شريط التقدم */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep >= step.number
                      ? "bg-primary border-primary text-white"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block w-16 md:w-24 h-1 mx-2 ${
                      currentStep > step.number ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span
                key={step.number}
                className={`text-xs sm:text-sm ${
                  currentStep >= step.number ? "text-primary font-medium" : "text-gray-400"
                }`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* محتوى الخطوة */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "أدخل البيانات الأساسية للتعريف بالمنشأة"}
              {currentStep === 2 && "أدخل بيانات الاتصال والموقع الجغرافي"}
              {currentStep === 3 && "أدخل البيانات المالية الخاصة بالتحويلات"}
              {currentStep === 4 && "قم برفع المستندات الرسمية الداعمة"}
              {currentStep === 5 && "راجع البيانات قبل الإرسال"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* الخطوة 1: معلومات الكيان */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم الكيان *</Label>
                    <Input
                      id="name"
                      value={entityInfo.name}
                      onChange={(e) => setEntityInfo({ ...entityInfo, name: e.target.value })}
                      placeholder="اسم الشركة أو المؤسسة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entityType">نوع الكيان *</Label>
                    <Select
                      value={entityInfo.entityType}
                      onValueChange={(value: "company" | "establishment") =>
                        setEntityInfo({ ...entityInfo, entityType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الكيان" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">شركة</SelectItem>
                        <SelectItem value="establishment">مؤسسة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commercialRegister">رقم السجل التجاري *</Label>
                    <Input
                      id="commercialRegister"
                      value={entityInfo.commercialRegister}
                      onChange={(e) =>
                        setEntityInfo({ ...entityInfo, commercialRegister: e.target.value })
                      }
                      placeholder="أدخل رقم السجل التجاري"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience">عدد سنوات الخبرة *</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      min="0"
                      value={entityInfo.yearsOfExperience}
                      onChange={(e) =>
                        setEntityInfo({ ...entityInfo, yearsOfExperience: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commercialActivity">النشاط حسب السجل التجاري *</Label>
                  <Textarea
                    id="commercialActivity"
                    value={entityInfo.commercialActivity}
                    onChange={(e) =>
                      setEntityInfo({ ...entityInfo, commercialActivity: e.target.value })
                    }
                    placeholder="أدخل النشاط كما هو مسجل في السجل التجاري"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>مجالات العمل التي ينفذها الكيان *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-lg bg-gray-50">
                    {WORK_FIELDS.map((field) => (
                      <div key={field.key} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={field.key}
                          checked={entityInfo.workFields.includes(field.key)}
                          onCheckedChange={() => toggleWorkField(field.key)}
                        />
                        <Label htmlFor={field.key} className="text-sm cursor-pointer">
                          {field.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* الخطوة 2: معلومات التواصل */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">عنوان الكيان *</Label>
                  <Textarea
                    id="address"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                    placeholder="أدخل العنوان التفصيلي"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Input
                      id="city"
                      value={contactInfo.city}
                      onChange={(e) => setContactInfo({ ...contactInfo, city: e.target.value })}
                      placeholder="المدينة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="googleMapsUrl">رابط موقع Google Maps</Label>
                    <div className="flex gap-2">
                      <Input
                        id="googleMapsUrl"
                        value={contactInfo.googleMapsUrl}
                        onChange={(e) =>
                          setContactInfo({ ...contactInfo, googleMapsUrl: e.target.value })
                        }
                        placeholder="https://maps.google.com/..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (contactInfo.googleMapsUrl) {
                            window.open(contactInfo.googleMapsUrl, "_blank");
                          }
                        }}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      placeholder="example@domain.com"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم التواصل *</Label>
                    <Input
                      id="phone"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      placeholder="05XXXXXXXX"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneSecondary">رقم تواصل آخر</Label>
                  <Input
                    id="phoneSecondary"
                    value={contactInfo.phoneSecondary}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, phoneSecondary: e.target.value })
                    }
                    placeholder="رقم إضافي (اختياري)"
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">اسم مسؤول التواصل *</Label>
                    <Input
                      id="contactPerson"
                      value={contactInfo.contactPerson}
                      onChange={(e) =>
                        setContactInfo({ ...contactInfo, contactPerson: e.target.value })
                      }
                      placeholder="الاسم الكامل"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonTitle">وظيفته في الكيان *</Label>
                    <Input
                      id="contactPersonTitle"
                      value={contactInfo.contactPersonTitle}
                      onChange={(e) =>
                        setContactInfo({ ...contactInfo, contactPersonTitle: e.target.value })
                      }
                      placeholder="مثال: مدير المبيعات"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* الخطوة 3: معلومات الحساب البنكي */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountName">اسم الحساب *</Label>
                    <Input
                      id="bankAccountName"
                      value={bankInfo.bankAccountName}
                      onChange={(e) => setBankInfo({ ...bankInfo, bankAccountName: e.target.value })}
                      placeholder="اسم صاحب الحساب"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">اسم البنك *</Label>
                    <Select
                      value={bankInfo.bankName}
                      onValueChange={(value) => setBankInfo({ ...bankInfo, bankName: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر البنك" />
                      </SelectTrigger>
                      <SelectContent>
                        {SAUDI_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iban">رقم الآيبان (IBAN) *</Label>
                  <Input
                    id="iban"
                    value={bankInfo.iban}
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      if (!value.startsWith("SA")) {
                        value = "SA" + value.replace(/^SA/i, "");
                      }
                      if (value.length > 24) value = value.slice(0, 24);
                      setBankInfo({ ...bankInfo, iban: value });
                    }}
                    placeholder="SA0000000000000000000000"
                    dir="ltr"
                    maxLength={24}
                  />
                  <p className="text-xs text-gray-500">يجب أن يبدأ بـ SA متبوعاً بـ 22 رقم</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxNumber">الرقم الضريبي *</Label>
                  <Input
                    id="taxNumber"
                    value={bankInfo.taxNumber}
                    onChange={(e) => setBankInfo({ ...bankInfo, taxNumber: e.target.value })}
                    placeholder="أدخل الرقم الضريبي"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {/* الخطوة 4: المرفقات */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>ملاحظة:</strong> يجب أن تكون جميع المستندات سارية المفعول
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>إرفاق السجل التجاري *</Label>
                  <FileUpload
                    label="السجل التجاري"
                    description="ارفع صورة السجل التجاري الساري"
                    maxFiles={1}
                    onFilesSelected={(files) => {
                      if (files.length > 0 && files[0].fileData) {
                        setAttachments({ ...attachments, commercialRegisterDoc: files[0].fileData });
                      }
                    }}
                  />
                  {attachments.commercialRegisterDoc && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="h-4 w-4" /> تم رفع الملف
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>إرفاق شهادة ضريبة القيمة المضافة *</Label>
                  <FileUpload
                    label="شهادة الضريبة"
                    description="ارفع شهادة ضريبة القيمة المضافة السارية"
                    maxFiles={1}
                    onFilesSelected={(files) => {
                      if (files.length > 0 && files[0].fileData) {
                        setAttachments({ ...attachments, vatCertificateDoc: files[0].fileData });
                      }
                    }}
                  />
                  {attachments.vatCertificateDoc && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="h-4 w-4" /> تم رفع الملف
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>إرفاق العنوان الوطني *</Label>
                  <FileUpload
                    label="العنوان الوطني"
                    description="ارفع شهادة العنوان الوطني"
                    maxFiles={1}
                    onFilesSelected={(files) => {
                      if (files.length > 0 && files[0].fileData) {
                        setAttachments({ ...attachments, nationalAddressDoc: files[0].fileData });
                      }
                    }}
                  />
                  {attachments.nationalAddressDoc && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="h-4 w-4" /> تم رفع الملف
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* الخطوة 5: المراجعة */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {/* معلومات الكيان */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    معلومات الكيان
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">اسم الكيان:</span>
                      <p className="font-medium">{entityInfo.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">نوع الكيان:</span>
                      <p className="font-medium">
                        {entityInfo.entityType === "company" ? "شركة" : "مؤسسة"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">السجل التجاري:</span>
                      <p className="font-medium">{entityInfo.commercialRegister}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">سنوات الخبرة:</span>
                      <p className="font-medium">{entityInfo.yearsOfExperience} سنة</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">النشاط التجاري:</span>
                      <p className="font-medium">{entityInfo.commercialActivity}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">مجالات العمل:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entityInfo.workFields.map((field) => (
                          <span
                            key={field}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                          >
                            {WORK_FIELDS.find((f) => f.key === field)?.label || field}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* معلومات التواصل */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    معلومات التواصل
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <span className="text-gray-500">العنوان:</span>
                      <p className="font-medium">{contactInfo.address}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">البريد الإلكتروني:</span>
                      <p className="font-medium" dir="ltr">{contactInfo.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">رقم التواصل:</span>
                      <p className="font-medium" dir="ltr">{contactInfo.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">مسؤول التواصل:</span>
                      <p className="font-medium">{contactInfo.contactPerson}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">الوظيفة:</span>
                      <p className="font-medium">{contactInfo.contactPersonTitle}</p>
                    </div>
                  </div>
                </div>

                {/* معلومات البنك */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    معلومات الحساب البنكي
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">اسم الحساب:</span>
                      <p className="font-medium">{bankInfo.bankAccountName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">البنك:</span>
                      <p className="font-medium">{bankInfo.bankName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">الآيبان:</span>
                      <p className="font-medium" dir="ltr">{bankInfo.iban}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">الرقم الضريبي:</span>
                      <p className="font-medium" dir="ltr">{bankInfo.taxNumber}</p>
                    </div>
                  </div>
                </div>

                {/* المرفقات */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    المرفقات
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>السجل التجاري</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>شهادة ضريبة القيمة المضافة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>العنوان الوطني</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    بالضغط على "إرسال الطلب" فإنك توافق على صحة البيانات المدخلة وسيتم مراجعة طلبك من قبل الإدارة
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* أزرار التنقل */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </Button>

          {currentStep < 5 ? (
            <Button onClick={nextStep} className="gap-2">
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  إرسال الطلب
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
