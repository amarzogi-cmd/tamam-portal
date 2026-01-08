import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Settings, 
  Clock, 
  AlertTriangle, 
  ArrowUpCircle,
  Save,
  RotateCcw,
  CheckCircle,
  Loader2
} from "lucide-react";

interface StageSettingForm {
  stageCode: string;
  stageName: string;
  durationDays: number;
  warningDays: number;
  escalationLevel1Days: number;
  escalationLevel2Days: number;
  isActive: boolean;
  description: string;
}

export default function StageSettings() {
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [formData, setFormData] = useState<StageSettingForm | null>(null);

  const { data: stages, isLoading, refetch } = trpc.stageSettings.getAll.useQuery();
  const initializeMutation = trpc.stageSettings.initializeDefaults.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        refetch();
      } else {
        toast.info(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = trpc.stageSettings.update.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ التغييرات بنجاح");
      setEditingStage(null);
      setFormData(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleEdit = (stage: any) => {
    setEditingStage(stage.stageCode);
    setFormData({
      stageCode: stage.stageCode,
      stageName: stage.stageName,
      durationDays: stage.durationDays,
      warningDays: stage.warningDays || 1,
      escalationLevel1Days: stage.escalationLevel1Days || 1,
      escalationLevel2Days: stage.escalationLevel2Days || 3,
      isActive: stage.isActive ?? true,
      description: stage.description || "",
    });
  };

  const handleSave = () => {
    if (!formData) return;
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setEditingStage(null);
    setFormData(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              إعدادات المراحل والمدد الزمنية
            </h1>
            <p className="text-muted-foreground mt-1">
              تخصيص المدد الزمنية لكل مرحلة ونظام التصعيد
            </p>
          </div>
          {(!stages || stages.length === 0) && (
            <Button 
              onClick={() => initializeMutation.mutate()}
              disabled={initializeMutation.isPending}
            >
              {initializeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <RotateCcw className="h-4 w-4 ml-2" />
              )}
              تهيئة المراحل الافتراضية
            </Button>
          )}
        </div>

        {/* Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">دليل الألوان</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">المدة المحددة</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">تنبيه قبل التأخير</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">تصعيد للمدير المباشر</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">تصعيد للمدير التنفيذي</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stages List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stages && stages.length > 0 ? (
          <div className="grid gap-4">
            {stages.map((stage, index) => (
              <Card key={stage.stageCode} className={`transition-all ${editingStage === stage.stageCode ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {stage.stageName}
                          {stage.isActive ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              نشط
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400">
                              غير نشط
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{stage.description}</CardDescription>
                      </div>
                    </div>
                    {editingStage !== stage.stageCode && (
                      <Button variant="outline" size="sm" onClick={() => handleEdit(stage)}>
                        تعديل
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingStage === stage.stageCode && formData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            المدة المحددة (أيام)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.durationDays}
                            onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            تنبيه قبل (أيام)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.warningDays}
                            onChange={(e) => setFormData({ ...formData, warningDays: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <ArrowUpCircle className="h-4 w-4 text-orange-500" />
                            تصعيد للمدير المباشر (أيام إضافية)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.escalationLevel1Days}
                            onChange={(e) => setFormData({ ...formData, escalationLevel1Days: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <ArrowUpCircle className="h-4 w-4 text-red-500" />
                            تصعيد للمدير التنفيذي (أيام إضافية)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.escalationLevel2Days}
                            onChange={(e) => setFormData({ ...formData, escalationLevel2Days: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                          />
                          <Label>المرحلة نشطة</Label>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={handleCancel}>
                          إلغاء
                        </Button>
                        <Button onClick={handleSave} disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          ) : (
                            <Save className="h-4 w-4 ml-2" />
                          )}
                          حفظ
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm text-muted-foreground">المدة</div>
                          <div className="font-bold text-blue-700">
                            {stage.durationDays === 0 ? "حسب المشروع" : `${stage.durationDays} يوم`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div>
                          <div className="text-sm text-muted-foreground">تنبيه قبل</div>
                          <div className="font-bold text-yellow-700">{stage.warningDays || 1} يوم</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                        <ArrowUpCircle className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="text-sm text-muted-foreground">تصعيد مستوى 1</div>
                          <div className="font-bold text-orange-700">+{stage.escalationLevel1Days || 1} يوم</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                        <ArrowUpCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <div className="text-sm text-muted-foreground">تصعيد مستوى 2</div>
                          <div className="font-bold text-red-700">+{stage.escalationLevel2Days || 3} أيام</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لم يتم تهيئة المراحل بعد</h3>
              <p className="text-muted-foreground mb-4">
                اضغط على زر "تهيئة المراحل الافتراضية" لإنشاء المراحل مع المدد الزمنية الافتراضية
              </p>
              <Button onClick={() => initializeMutation.mutate()} disabled={initializeMutation.isPending}>
                {initializeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 ml-2" />
                )}
                تهيئة المراحل الافتراضية
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
