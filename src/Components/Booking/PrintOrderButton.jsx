import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { useGetOneBookingsQuery } from "../../RtkQuery/Slice/Booking/BookingApi";
import { toast } from "sonner";

export const PrintOrderButton = ({ bookingId }) => {
  const [shouldPrint, setShouldPrint] = useState(false);
  const { data: bookingData, isLoading, error } = useGetOneBookingsQuery(bookingId, {
    skip: !shouldPrint,
  });

  const generateWordDocument = (booking) => {
    try {
      if (!booking) {
        toast.error("لم يتم العثور على بيانات الحجز");
        setShouldPrint(false);
        return;
      }

      const startDate = new Date(booking.start_date).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const companyName = booking.customer?.company_name || "غير محدد";
      const printingType = booking.printing?.type || "غير محدد";

      // 🔥 FILTER: Exclude digital signs
      const physicalSigns = booking.roadsigns?.filter(
        sign => sign.template?.display_type !== "digital"
      ) || [];

      // If no physical signs, show error and stop
      if (physicalSigns.length === 0) {
        toast.error("لا توجد لافتات فيزيائية للطباعة في هذا الحجز");
        setShouldPrint(false);
        return;
      }

      const groupedSigns = {};
      physicalSigns.forEach(sign => {
        const model = sign.template?.model || "غير محدد";
        const type = sign.template?.type || "غير محدد";

        if (!groupedSigns[model]) {
          groupedSigns[model] = {
            model: model,
            type: type,
            count: 1
          };
        } else {
          groupedSigns[model].count++;
        }
      });

      let tableRows = "";
      let idx = 1;
      Object.entries(groupedSigns).forEach(([key, sign]) => {
        tableRows += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${idx}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${sign.count}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${sign.type}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${sign.model}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${printingType}</td>
          </tr>`;
        idx++;
      });

      const htmlContent = `<!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>أوردر طباعة - ${booking.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            margin: 10px 0;
          }
          .date {
            text-align: center;
            margin: 20px 0;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background-color: #2563eb;
            color: white;
            padding: 10px;
            border: 1px solid #1e40af;
            text-align: center;
          }
          td {
            padding: 8px;
            border: 1px solid #ddd;
            text-align: center;
          }
          .signatures {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            margin-top: 40px;
            padding-top: 5px;
            border-top: 1px solid black;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">أوردر طباعة</div>
        </div>
        
        <div class="date">
          التاريخ: ${startDate}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>م</th>
              <th>العدد</th>
              <th>النوع</th>
              <th>النموذج</th>
              <th>نوع الطباعة</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr>
              <td colspan="5" style="background-color: #f3f4f6; font-weight: bold;">
                اسم الشركة: ${companyName}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <p>هذا الأمر صادر بناءً على طلب العميل</p>
        </div>
      </body>
      </html>`;

      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `printing_order_${booking.id}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("تم إنشاء أمر الطباعة بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء أمر الطباعة");
    } finally {
      setShouldPrint(false);
    }
  };

  if (shouldPrint && bookingData && !isLoading) {
    generateWordDocument(bookingData);
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 ml-1 animate-spin" />
        جاري المعالجة...
      </Button>
    );
  }

  if (shouldPrint && isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 ml-1 animate-spin" />
        جاري التحميل...
      </Button>
    );
  }

  if (error && shouldPrint) {
    toast.error("فشل في تحميل بيانات الحجز");
    setShouldPrint(false);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShouldPrint(true)}
      className="text-purple-600 border-purple-200 hover:bg-purple-50"
    >
      <Printer className="h-4 w-4 ml-1" />
      أوردر طباعة
    </Button>
  );
};