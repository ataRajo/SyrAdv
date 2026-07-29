import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { Loader2 } from "lucide-react";
import { useGetCustomersByWorkTypeQuery } from "../../../../../RtkQuery/Slice/Customers/CustomersApi";

const DialogWorkTypeCustomers = ({ show, handleClose, workTypeId, workTypeName }) => {
  const { data, isLoading, isError } = useGetCustomersByWorkTypeQuery(workTypeId, {
    skip: !show || !workTypeId,
  });

  const customers = data?.data || [];

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:account-group" className="text-blue-500" />
            زبائن نوع العمل: {workTypeName}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {isError && (
          <div className="text-center py-8 text-red-500">
            فشل في تحميل الزبائن
          </div>
        )}

        {!isLoading && !isError && customers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا يوجد زبائن مرتبطين بهذا النوع
          </div>
        )}

        {!isLoading && !isError && customers.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded font-semibold text-sm">
              <span>الاسم</span>
              <span>الشركة</span>
              <span>الهاتف</span>
            </div>
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="grid grid-cols-3 gap-4 p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-medium">{customer.full_name}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {customer.company_name || "—"}
                </span>
                <span className="text-gray-600 dark:text-gray-400" dir="ltr">
                  {customer.phone_number || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DialogWorkTypeCustomers;