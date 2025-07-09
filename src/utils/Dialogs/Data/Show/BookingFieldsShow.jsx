import { format } from "date-fns";
import { productTypeMap } from "../../../../Static/StaticData";

export const BookingFieldsShow = [
  { label: 'النوع', key: 'type', icon: 'mdi:format-list-bulleted-type', format: (value) => productTypeMap[value] || 'غير معروف' },
  { label: 'تاريخ البدء', key: 'start_date', icon: 'mdi:calendar-start', format: (value) => format(new Date(value), 'MMM dd, yyyy') },
  { label: 'تاريخ الانتهاء', key: 'end_date', icon: 'mdi:calendar-end', format: (value) => format(new Date(value), 'MMM dd, yyyy') },
  { label: 'إجمالي مساحة الإعلان', key: 'total_advertising_space', icon: 'mdi:image-area', format: (value) => `${value}m²` },
  { label: 'إجمالي مساحة الطباعة', key: 'total_printing_space', icon: 'mdi:printer', format: (value) => `${value}m²` },
  { label: 'السعر الإجمالي', key: 'total_price', icon: 'mdi:currency-usd', format: (value) => `$${value}` },
  { label: 'اسم المستخدم', key: 'user.full_name', icon: 'mdi:account' },
  { label: 'بريد المستخدم', key: 'user.email', icon: 'mdi:email' },
  { label: 'اسم الزبون', key: 'customer.full_name', icon: 'mdi:account-outline' },
  { label: 'اسم الشركة', key: 'customer.company_name', icon: 'mdi:office-building' },
];