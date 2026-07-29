import React, { memo, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { 
  Trash2, 
  Edit, 
  Plus, 
  Loader2, 
  Loader, 
  Search,
  Filter,
  MapPin,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Signpost,
} from "lucide-react";
import { RegionsCityContext } from "../../Context/RegionsCityContextApi";
import { useAuth } from "../../Context/AuthProvider";
import { Permissions } from "../../Static/StaticData";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DialogTrigger } from "@radix-ui/react-dialog";

const RegionsTab = () => {
  const {
    cityFilter,
    setCityFilter,
    cities,
    regionForm,
    setRegionForm,
    editRegionId,
    setEditRegionId,
    isRegionDialogOpen,
    setIsRegionDialogOpen,
    filteredRegions,
    isRegionsLoading,
    addRegionLoading,
    handleSubmit,
    handleEdit,
    handleDeleteDialog,
  } = useContext(RegionsCityContext);
  const { hasPermission } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [staticStatus] = useState(1);

  // Filter regions by search term
  const searchFilteredRegions = filteredRegions.filter(region =>
    region.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cities.find(city => city.id === region.city_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle opening dialog for adding new region
  const handleAddRegion = () => {
    setRegionForm({ name: "", city_id: "", is_active: 1 });
    setEditRegionId(null);
    setIsRegionDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsRegionDialogOpen(false);
    setTimeout(() => {
      setRegionForm({ name: "", city_id: "", is_active: 1 });
      setEditRegionId(null);
    }, 300);
  };

  return (
    <TabsContent value="regions" className="space-y-6 p-2 sm:p-4">
      {/* Header Section */}
      <Card className="border-2 dark:border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                إدارة المناطق
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                إضافة وتعديل وحذف المناطق في المدن المختلفة
              </p>
            </div>
            
            {hasPermission(Permissions.CreateRegions) && (
              <Dialog 
                open={isRegionDialogOpen} 
                onOpenChange={(open) => {
                  setIsRegionDialogOpen(open);
                  if (!open) {
                    handleDialogClose();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button 
                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    onClick={handleAddRegion}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">إضافة منطقة</span>
                    <span className="inline sm:hidden">إضافة</span>
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
                  if (addRegionLoading) {
                    e.preventDefault();
                  }
                }}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      {editRegionId ? "تعديل منطقة" : "إضافة منطقة جديدة"}
                    </DialogTitle>
                    <DialogDescription>
                      {editRegionId 
                        ? `جاري تعديل المنطقة رقم ${editRegionId}` 
                        : "أدخل معلومات المنطقة الجديدة"
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        اسم المنطقة
                      </label>
                      <Input
                        placeholder="مثال: المزة، شارع بغداد..."
                        value={regionForm.name || ""}
                        onChange={(e) =>
                          setRegionForm({ ...regionForm, name: e.target.value })
                        }
                        className="dark:bg-gray-800 dark:border-gray-700"
                        disabled={addRegionLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        المدينة
                      </label>
                      <Select
                        value={regionForm.city_id?.toString() || ""}
                        onValueChange={(value) =>
                          setRegionForm({ ...regionForm, city_id: parseInt(value) })
                        }
                        disabled={addRegionLoading}
                      >
                        <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectValue placeholder="اختر مدينة" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          {cities.map((city) => (
                            <SelectItem 
                              key={city.id} 
                              value={city.id.toString()}
                              className="dark:hover:bg-gray-700"
                            >
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-500" />
                                {city.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        الحالة
                      </label>
                      <Select
                        value={staticStatus.toString()}
                        onValueChange={(value) =>
                          setRegionForm({ ...regionForm, is_active: parseInt(value) })
                        }
                        disabled={addRegionLoading}
                      >
                        <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="1" className="dark:hover:bg-gray-700">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>متوفرة</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDialogClose}
                      disabled={addRegionLoading}
                      className="w-full sm:w-auto"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        handleSubmit("region", editRegionId, regionForm);
                      }}
                      disabled={addRegionLoading || !regionForm.name || !regionForm.city_id}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {addRegionLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {editRegionId ? "جاري التعديل..." : "جاري الإضافة..."}
                        </>
                      ) : editRegionId ? (
                        "حفظ التعديلات"
                      ) : (
                        "إضافة المنطقة"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن منطقة أو مدينة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="border-0 p-0 h-auto w-[140px] focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="فلتر حسب المدينة" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="all" className="dark:hover:bg-gray-700">
                      جميع المدن
                    </SelectItem>
                    {cities.map((city) => (
                      <SelectItem 
                        key={city.id} 
                        value={city.id.toString()}
                        className="dark:hover:bg-gray-700"
                      >
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  مسح البحث
                </Button>
              )}
            </div>
          </div>
          
          {/* Stats Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">إجمالي المناطق</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{filteredRegions.length}</p>
                </div>
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">متاحة</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {filteredRegions.filter(r => r.is_active === 1).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">نتائج البحث</p>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{searchFilteredRegions.length}</p>
                </div>
                <Search className="h-8 w-8 text-gray-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regions Table */}
      <Card className="border-2 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>قائمة المناطق</span>
            <Badge variant="outline" className="text-sm">
              {searchFilteredRegions.length} منطقة
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {isRegionsLoading ? (
            <div className="w-full h-64 flex flex-col justify-center items-center gap-4">
              <Loader className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-gray-600 dark:text-gray-400">جاري تحميل المناطق...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">يتم تحميل البيانات من الخادم</p>
            </div>
          ) : searchFilteredRegions.length === 0 ? (
            <div className="w-full h-64 flex flex-col justify-center items-center gap-4 text-center p-8">
              <AlertCircle className="h-12 w-12 text-gray-400" />
              <div>
                <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                  {searchTerm ? "لم يتم العثور على نتائج" : "لا توجد مناطق"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {searchTerm 
                    ? `لا توجد مناطق تطابق "${searchTerm}"`
                    : "ابدأ بإضافة منطقة جديدة باستخدام زر 'إضافة منطقة'"
                  }
                </p>
              </div>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  عرض جميع المناطق
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <TableRow className="border-b dark:border-gray-700">
                      <TableHead className="font-bold text-gray-900 dark:text-gray-300">#</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          اسم المنطقة
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          المدينة
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-300">الحالة</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-300">
                        <div className="flex items-center gap-2">
عدد اللوحات في المنطقة
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-300 text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  
                  <TableBody>
                    {searchFilteredRegions.map((region, index) => (
                      <TableRow 
                        key={region.id} 
                        className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''
                        }`}
                      >
                        <TableCell className="font-medium text-gray-700 dark:text-gray-300">
                          {region.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {region.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {cities.find((city) => city.id === region.city_id)?.name || "غير معروف"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={region.is_active === 1 ? "default" : "secondary"}
                            className={`gap-1 ${
                              region.is_active === 1
                                ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {region.is_active === 1 ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                متوفرة
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                غير متوفرة
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Signpost className="h-4 w-4 text-orange-500" />
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {region.roadsigns_count || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {hasPermission(Permissions.EditRegions) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit("region", region)}
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                title="تعديل"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}

                            {hasPermission(Permissions.DeleteRegions) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDialog("region", region.id)}
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Table Footer */}
              <div className="px-4 py-3 border-t dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
                  <div className="text-gray-600 dark:text-gray-400">
                    عرض {searchFilteredRegions.length} من {filteredRegions.length} منطقة
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{cities.length}</span> مدينة
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{searchFilteredRegions.length}</span> منطقة
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default memo(RegionsTab);