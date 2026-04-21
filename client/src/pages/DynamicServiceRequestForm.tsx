import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { 
  PROGRAM_CONFIGS, 
  SHARED_FIELDS, 
  getAllFieldsForProgram,
  getVisibleFieldsForProgram,
} from '@/lib/programFields';
import { 
  validateAllFields, 
  hasErrors,
  areAllRequiredFieldsFilled,
} from '@/lib/formValidation';
import { DynamicFieldRenderer } from '@/components/DynamicForm/DynamicFieldRenderer';
import { ConditionalField } from '@/components/DynamicForm/ConditionalField';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Plus, AlertTriangle } from 'lucide-react';

type Step = 'service-selection' | 'terms' | 'requester-info' | 'details' | 'review';

const STEPS: { key: Step; label: string; order: number }[] = [
  { key: 'service-selection', label: 'اختيار الخدمة', order: 1 },
  { key: 'terms', label: 'الشروط والأحكام', order: 2 },
  { key: 'requester-info', label: 'بيانات مقدم الطلب', order: 3 },
  { key: 'details', label: 'تفاصيل الطلب', order: 4 },
  { key: 'review', label: 'المراجعة والإرسال', order: 5 },
];

export const DynamicServiceRequestForm: React.FC = () => {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>('service-selection');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // الحصول على بيانات المساجد
  const { data: userMosques } = trpc.mosques.getMyMosques.useQuery();

  // الحصول على إعدادات البرنامج المختار
  const selectedProgramConfig = useMemo(() => {
    if (!selectedService) return null;
    return PROGRAM_CONFIGS[selectedService];
  }, [selectedService]);

  // الحصول على جميع الحقول المرئية
  const visibleFields = useMemo(() => {
    if (!selectedService) return [];
    return getVisibleFieldsForProgram(selectedService, formData);
  }, [selectedService, formData]);

  // معالج تغيير الحقول
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    // مسح الخطأ عند التعديل
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // معالج الخطوة التالية
  const handleNextStep = () => {
    if (currentStep === 'service-selection') {
      if (!selectedService) {
        alert('يرجى اختيار خدمة');
        return;
      }
      setCurrentStep('terms');
    } else if (currentStep === 'terms') {
      if (!agreedToTerms) {
        alert('يرجى الموافقة على الشروط والأحكام');
        return;
      }
      setCurrentStep('requester-info');
    } else if (currentStep === 'requester-info') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      const newErrors = validateAllFields(selectedService!, formData);
      if (hasErrors(newErrors)) {
        setErrors(newErrors);
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
      }
      setCurrentStep('review');
    }
  };

  // معالج الخطوة السابقة
  const handlePreviousStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].key);
    }
  };

  // الحصول على بيانات المستخدم الحالي
  const { data: currentUser } = trpc.auth.me.useQuery();

  // معالج الإرسال
  const createRequestMutation = trpc.requests.create.useMutation();

  const handleSubmit = async () => {
    if (!selectedService || !currentUser) return;

    try {
      const programData: Record<string, any> = {};
      
      // جمع جميع بيانات الحقول
      for (const field of visibleFields) {
        if (formData[field.name] !== undefined) {
          programData[field.name] = formData[field.name];
        }
      }

      // إذا كان البرنامج يتطلب مسجد، أضف معرف المسجد
      if (selectedProgramConfig?.requiresMosque && formData.mosqueId) {
        programData.mosqueId = formData.mosqueId;
      }

      await createRequestMutation.mutateAsync({
        programType: selectedService as any,
        programData,
        priority: 'normal',
      });

      alert('تم إرسال الطلب بنجاح');
      navigate('/my-requests');
    } catch (error: any) {
      alert(error?.message || 'حدث خطأ أثناء إرسال الطلب');
    }
  };

  // شريط التقدم
  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* رأس الصفحة */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تقديم طلب خدمة</h1>
          <p className="text-gray-600">نموذج موحد ديناميكي لجميع برامج الخدمات</p>
        </div>

        {/* شريط التقدم */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.key}>
                <div
                  className={`flex flex-col items-center ${
                    index <= currentStepIndex ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      index < currentStepIndex
                        ? 'bg-green-500 text-white'
                        : index === currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {index < currentStepIndex ? '✓' : step.order}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">{step.label}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* محتوى الخطوات */}
        <Card className="p-8 bg-white shadow-lg">
          {/* الخطوة 1: اختيار الخدمة */}
          {currentStep === 'service-selection' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">اختر نوع الخدمة</h2>
                <p className="text-gray-600">اختر البرنامج الذي تريد تقديم طلب خدمة له</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(PROGRAM_CONFIGS).map((program) => {
                  const Icon = program.icon;
                  return (
                    <Card
                      key={program.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                        selectedService === program.id
                          ? 'ring-2 ring-blue-600 bg-blue-50'
                          : 'hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedService(program.id)}
                    >
                      <div className={`w-12 h-12 rounded-lg ${program.color} flex items-center justify-center mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900">{program.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{program.description}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* الخطوة 2: الشروط والأحكام */}
          {currentStep === 'terms' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">الشروط والأحكام</h2>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  يرجى قراءة الشروط والأحكام بعناية قبل المتابعة
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto space-y-4">
                <h3 className="font-bold text-gray-900">شروط تقديم الطلب:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                  <li>يجب أن تكون البيانات المقدمة صحيحة وكاملة</li>
                  <li>يجب أن تكون المسجد مسجل في النظام</li>
                  <li>يجب الالتزام بجميع الشروط والأحكام</li>
                  <li>الجمعية تحتفظ بحق قبول أو رفض الطلب</li>
                  <li>يجب تقديم جميع المستندات المطلوبة</li>
                  <li>الطلب ملزم قانونياً بعد الموافقة عليه</li>
                </ul>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-gray-700 cursor-pointer">
                  أوافق على الشروط والأحكام
                </label>
              </div>
            </div>
          )}

          {/* الخطوة 3: بيانات مقدم الطلب */}
          {currentStep === 'requester-info' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">بيانات مقدم الطلب</h2>
                <p className="text-gray-600">البيانات التالية مأخوذة من حسابك</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الاسم</p>
                    <p className="font-medium text-gray-900">{currentUser?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">البريد الإلكتروني</p>
                    <p className="font-medium text-gray-900">{currentUser?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">رقم الجوال</p>
                    <p className="font-medium text-gray-900">{currentUser?.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الدور</p>
                    <p className="font-medium text-gray-900">{currentUser?.role || '-'}</p>
                  </div>
                </div>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  إذا كنت تريد تعديل بيانات حسابك، يرجى الذهاب إلى صفحة الإعدادات
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* الخطوة 4: تفاصيل الطلب */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  تفاصيل الطلب - {selectedProgramConfig?.name}
                </h2>
                <p className="text-gray-600">{selectedProgramConfig?.description}</p>
              </div>

              {/* تنبيه بيانات المسجد الناقصة */}
              {formData.mosqueId && userMosques && (
                (() => {
                  const selectedMosque = userMosques.find((m: any) => m.id === parseInt(formData.mosqueId));
                  const missingFields = [];
                  if (!selectedMosque?.imamName) missingFields.push('بيانات الإمام');
                  if (!selectedMosque?.address) missingFields.push('العنوان التفصيلي');
                  
                  return missingFields.length > 0 ? (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium mb-1">بيانات المسجد غير مكتملة</p>
                            <p className="text-sm">البيانات الناقصة: {missingFields.join('، ')}</p>
                          </div>
                          <Button 
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
                            onClick={() => {
                              alert('سيتم فتح نموذج تسجيل بيانات المسجد');
                            }}
                          >
                            <Plus className="w-4 h-4 ml-1" />
                            إضافة البيانات
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : null;
                })()
              )}

              <div className="space-y-6">
                {visibleFields.map((field) => (
                  <ConditionalField
                    key={field.name}
                    field={field}
                    formData={formData}
                    value={formData[field.name]}
                    onChange={(value) => handleFieldChange(field.name, value)}
                    error={errors[field.name]}
                    mosqueOptions={userMosques}
                  />
                ))}
              </div>
            </div>
          )}

          {/* الخطوة 5: المراجعة والإرسال */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">المراجعة والإرسال</h2>
                <p className="text-gray-600">يرجى مراجعة البيانات قبل إرسال الطلب</p>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  جميع البيانات صحيحة وكاملة. يمكنك الآن إرسال الطلب
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                {/* ملخص البرنامج */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">نوع الخدمة</p>
                  <div className="flex items-center gap-3">
                    {selectedProgramConfig && (
                      <>
                        <div className={`w-10 h-10 rounded-lg ${selectedProgramConfig.color} flex items-center justify-center`}>
                          <selectedProgramConfig.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{selectedProgramConfig.name}</p>
                          <p className="text-sm text-gray-600">{selectedProgramConfig.description}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* بيانات مقدم الطلب */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">بيانات مقدم الطلب</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">الاسم</p>
                      <p className="font-medium text-gray-900">{currentUser?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">البريد</p>
                      <p className="font-medium text-gray-900">{currentUser?.email}</p>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* تفاصيل الطلب */}
                <div>
                  <p className="text-sm text-gray-500 mb-4">تفاصيل الطلب</p>
                  <div className="space-y-3">
                    {visibleFields.map((field) => (
                      <div key={field.name}>
                        <p className="text-sm text-gray-500">{field.label}</p>
                        <p className="font-medium text-gray-900">
                          {formData[field.name] ? String(formData[field.name]) : '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* أزرار التنقل */}
          <div className="flex gap-4 mt-8 pt-6 border-t">
            {currentStep !== 'service-selection' && (
              <Button variant="outline" onClick={handlePreviousStep} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
            )}

            {currentStep !== 'review' && (
              <Button onClick={handleNextStep} className="ml-auto flex items-center gap-2">
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}

            {currentStep === 'review' && (
              <Button
                onClick={handleSubmit}
                disabled={createRequestMutation.isPending}
                className="ml-auto flex items-center gap-2"
              >
                {createRequestMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    إرسال الطلب
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
