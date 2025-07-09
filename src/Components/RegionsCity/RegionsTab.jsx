import React, { memo, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Trash2, Edit, Plus, Loader2, Loader } from "lucide-react";
import { RegionsCityContext } from "../../Context/RegionsCityContextApi";
import { useAuth } from "../../Context/AuthProvider";
import { Permissions } from "../../Static/StaticData";

const RegionsTab = () => {
  const {
    cityFilter,
    setCityFilter,
    cities,
    regionForm,
    setRegionForm,
    editRegionId,
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

  return (
    <TabsContent value="regions">
      <div className="flex justify-between mb-4">
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المدن</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id.toString()}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={isRegionDialogOpen} onOpenChange={setIsRegionDialogOpen}>
          {hasPermission(Permissions.CreateRegions) && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> إضافة منطقة
              </Button>
            </DialogTrigger>
          )}

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editRegionId ? "تعديل منطقة" : "إضافة منطقة جديدة"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="إسم المنطقة"
                value={regionForm.name}
                onChange={(e) =>
                  setRegionForm({ ...regionForm, name: e.target.value })
                }
              />
              <Select
                value={regionForm.city_id.toString()}
                onValueChange={(value) =>
                  setRegionForm({ ...regionForm, city_id: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="إختر مدينة" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={regionForm.is_active.toString()}
                onValueChange={(value) =>
                  setRegionForm({ ...regionForm, is_active: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">متوفر</SelectItem>
                  <SelectItem value="0">غير متوفر</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleSubmit("region", editRegionId, regionForm)}
              >
                {addRegionLoading ? (
                  <Loader2 />
                ) : (
                  <>{editRegionId ? "تعديل" : "إضافة"}</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {isRegionsLoading ? (
        <div className="w-full h-full flex-col flex justify-center items-center">
          <Loader />
          <p> جاري التحميل ...</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الرقم</TableHead>
              <TableHead>إسم المنطقة</TableHead>
              <TableHead>المدينة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegions.map((region) => (
              <TableRow key={region.id}>
                <TableCell>{region.id}</TableCell>
                <TableCell>{region.name}</TableCell>
                <TableCell>
                  {cities.find((city) => city.id === region.city_id)?.name ||
                    "Unknown"}
                </TableCell>
                <TableCell>
                  {region.is_active ? "متوفر" : "غير متوفر"}
                </TableCell>
                <TableCell>
                  {hasPermission(Permissions.EditRegions) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit("region", region)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {hasPermission(Permissions.DeleteRegions) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDialog("region", region.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TabsContent>
  );
};

export default memo(RegionsTab);
