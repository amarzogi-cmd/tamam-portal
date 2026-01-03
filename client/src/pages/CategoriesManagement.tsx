import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit2, Trash2, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CategoryWithValues {
  id: number;
  name: string;
  nameAr: string;
  type: string;
  sortOrder: number;
  isActive: boolean;
  values?: Array<{
    id: number;
    value: string;
    valueAr: string;
    sortOrder: number;
    isActive: boolean;
  }>;
}

export default function CategoriesManagement() {

  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddValueOpen, setIsAddValueOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    nameAr: "",
    type: "",
  });

  const [valueForm, setValueForm] = useState({
    value: "",
    valueAr: "",
  });

  // Queries
  const { data: categories = [], refetch: refetchCategories } = trpc.categories.getAllCategories.useQuery();

  // Mutations
  const createCategoryMutation = trpc.categories.createCategory.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء التصنيف بنجاح");
      setCategoryForm({ name: "", nameAr: "", type: "" });
      setIsAddCategoryOpen(false);
      refetchCategories();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteCategoryMutation = trpc.categories.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("تم حذف التصنيف بنجاح");
      refetchCategories();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addValueMutation = trpc.categories.addCategoryValue.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة القيمة بنجاح");
      setValueForm({ value: "", valueAr: "" });
      setIsAddValueOpen(false);
      refetchCategories();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteValueMutation = trpc.categories.deleteCategoryValue.useMutation({
    onSuccess: () => {
      toast.success("تم حذف القيمة بنجاح");
      refetchCategories();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddCategory = () => {
    if (!categoryForm.name || !categoryForm.nameAr || !categoryForm.type) {
      toast.error("جميع الحقول مطلوبة");
      return;
    }
    createCategoryMutation.mutate(categoryForm);
  };

  const handleAddValue = () => {
    if (!valueForm.value || !valueForm.valueAr || !selectedCategoryId) {
      toast.error("جميع الحقول مطلوبة");
      return;
    }
    addValueMutation.mutate({
      categoryId: selectedCategoryId,
      value: valueForm.value,
      valueAr: valueForm.valueAr,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة التصنيفات</h1>
          <p className="text-gray-600 mt-2">إدارة التصنيفات العامة للنظام (مدن، جنسيات، مجالات عمل، وحدات، فئات، بنود)</p>
        </div>
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة تصنيف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة تصنيف جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">الاسم (English)</label>
                <Input
                  placeholder="مثال: cities"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الاسم (العربية)</label>
                <Input
                  placeholder="مثال: المدن"
                  value={categoryForm.nameAr}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">النوع</label>
                <Input
                  placeholder="مثال: city, nationality, work_field"
                  value={categoryForm.type}
                  onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
                />
              </div>
              <Button onClick={handleAddCategory} className="w-full" disabled={createCategoryMutation.isPending}>
                {createCategoryMutation.isPending ? "جاري الإضافة..." : "إضافة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {categories.map((category: any) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        expandedCategory === category.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div>
                    <h3 className="font-semibold">{category.nameAr}</h3>
                    <p className="text-sm text-gray-600">{category.type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isAddValueOpen && selectedCategoryId === category.id} onOpenChange={setIsAddValueOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setIsAddValueOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>إضافة قيمة إلى {category.nameAr}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">القيمة (English)</label>
                          <Input
                            placeholder="مثال: riyadh"
                            value={valueForm.value}
                            onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">القيمة (العربية)</label>
                          <Input
                            placeholder="مثال: الرياض"
                            value={valueForm.valueAr}
                            onChange={(e) => setValueForm({ ...valueForm, valueAr: e.target.value })}
                          />
                        </div>
                        <Button onClick={handleAddValue} className="w-full" disabled={addValueMutation.isPending}>
                          {addValueMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCategoryMutation.mutate({ id: category.id })}
                    disabled={deleteCategoryMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedCategory === category.id && (
              <CardContent className="pt-0">
                {category.values && category.values.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>القيمة (العربية)</TableHead>
                          <TableHead>القيمة (English)</TableHead>
                          <TableHead className="w-20">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.values.map((value: any) => (
                          <TableRow key={value.id}>
                            <TableCell>{value.valueAr}</TableCell>
                            <TableCell>{value.value}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteValueMutation.mutate({ id: value.id })}
                                disabled={deleteValueMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">لا توجد قيم لهذا التصنيف</p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
