import { format } from "date-fns";

export const BrokersColumns = [
   
    {
      header: 'الاسم الكامل',
      accessor: 'full_name',
      prefixIcon: 'mdi:account-outline',
      className: 'min-w-[150px]',
      cellClassName: 'font-medium',
    },
    {
      header: 'رقم الهاتف',
      accessor: 'number',
      prefixIcon: 'mdi:phone-outline',
      className: 'min-w-[130px]',
      format: (value) => {
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{4})$/);
        return match ? `+${match[1]} ${match[2]} ${match[3]} ${match[4]}` : value;
      },
    },
    {
      header: 'الخصم',
      accessor: 'discount',
      prefixIcon: 'mdi:percent-outline',
      className: 'min-w-[90px] text-right',
      cellClassName: 'text-right font-mono',
      format: (value) => `${value}%`,
    },
    // {
    //   header: 'تاريخ الإنشاء',
    //   accessor: 'created_at',
    //   prefixIcon: 'mdi:calendar-plus',
    //   className: 'min-w-[120px]',
    //   format: (value) => format(new Date(value), 'MMM dd, yyyy'),
    // },
    // {
    //   header: 'آخر تعديل',
    //   accessor: 'updated_at',
    //   prefixIcon: 'mdi:calendar-sync',
    //   className: 'min-w-[120px]',
    //   format: (value) => format(new Date(value), 'MMM dd, yyyy'),
    // },
  ];