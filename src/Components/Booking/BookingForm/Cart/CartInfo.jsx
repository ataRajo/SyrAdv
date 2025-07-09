import { memo, useContext } from "react";
import { productTypeOptions, typeOptions } from "../../../../Static/StaticData";
import { BookingContext } from "../../../../Context/BookingContext";

const CartInfo = () => {
  const { customers, formik } = useContext(BookingContext);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4   bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          الزبون:
        </span>
        <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium truncate">
          {customers?.find((c) => c.id === parseInt(formik.values.customer_id))
            ?.full_name || "غير محدد"}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          نوع الحجز:
        </span>
        <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
          {typeOptions.find((t) => t.value === parseInt(formik.values.type))
            ?.label || "غير محدد"}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          تاريخ البداية:
        </span>
        <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
          {formik.values.start_date || "غير محدد"}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          تاريخ النهاية:
        </span>
        <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
          {formik.values.end_date || "غير محدد"}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          نوع المنتج:
        </span>
        <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
          {productTypeOptions.find(
            (p) => p.value === parseInt(formik.values.product_type)
          )?.label || "غير محدد"}
        </span>
      </div>
    </div>
  );
};

export default memo(CartInfo);
