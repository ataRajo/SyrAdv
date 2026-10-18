import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const OffersTable = ({
  offers,
  isLoading,
  isFetching,
  onDelete,
  onEdit,
  onToggleStatus,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Icon 
          icon="mdi:loading" 
          className="animate-spin text-4xl text-blue-500 dark:text-blue-400" 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900">
              <TableHead className="text-right text-gray-700 dark:text-gray-300">#</TableHead>
              <TableHead className="text-right text-gray-700 dark:text-gray-300">اسم العرض</TableHead>
              <TableHead className="text-right text-gray-700 dark:text-gray-300">الوصف</TableHead>
              <TableHead className="text-right text-gray-700 dark:text-gray-300">السعر</TableHead>
              <TableHead className="text-right text-gray-700 dark:text-gray-300">تاريخ البداية</TableHead>
              <TableHead className="text-right text-gray-700 dark:text-gray-300">تاريخ النهاية</TableHead>
              <TableHead className="text-right text-gray-700 dark:text-gray-300">الحالة</TableHead>
              <TableHead className="text-right text-gray-700 dark:text-gray-300">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  لا توجد عروض
                </TableCell>
              </TableRow>
            ) : (
              offers.map((offer, index) => (
                <TableRow 
                  key={offer.id} 
                  className={`${isFetching ? "opacity-50" : ""} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                >
                  <TableCell className="text-gray-900 dark:text-gray-100">{index + 1}</TableCell>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{offer.offer_name}</TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{offer.offer_description}</TableCell>
                  <TableCell>
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      {offer.offer_price} $
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{offer.from_date}</TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{offer.to_date}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        offer.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {offer.status === "active" ? "نشط" : "غير نشط"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {/* تعديل العرض - "يغير فيه شي" */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(offer)}
                        title="تعديل العرض"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                      </Button>

                      {/* تفعيل/تعطيل العرض - "يفعّلو نفسو" */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus?.(offer)}
                        title={offer.status === "active" ? "تعطيل العرض" : "إعادة تفعيل العرض"}
                        className={
                          offer.status === "active"
                            ? "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            : "text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                        }
                      >
                        <Icon
                          icon={offer.status === "active" ? "mdi:pause-circle-outline" : "mdi:play-circle-outline"}
                          className="w-4 h-4"
                        />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(offer.id)}
                        title="حذف العرض"
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Icon icon="mdi:delete" className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OffersTable;