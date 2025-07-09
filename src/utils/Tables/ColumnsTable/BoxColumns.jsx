import { format } from "date-fns";

export const BoxColumns = [
   
    { 
      header: ' المبالغ  المدفوعة ',
      accessor: 'total_paid_received',
      format: (value) => parseInt(value).toFixed(2),
      prefixIcon: 'mdi:currency-usd',
      className: 'min-w-[150px]',
      cellClassName: 'font-medium',
    },
    {
      header: ' المبالغ المتبقية',
      accessor: 'total_customer_remaining',
      format: (value) => parseInt(value).toFixed(2),
      prefixIcon: 'mdi:currency-usd',
      className: 'min-w-[130px]',
      
    },
    {
      header: 'المجموع',
      accessor: 'total_booking_amount',
      format: (value) => parseInt(value).toFixed(2),
      prefixIcon: 'mdi:currency-usd',
      className: 'min-w-[90px] text-right',
      cellClassName: 'text-right font-mono',
    },
 
  ];