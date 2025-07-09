import { format } from "date-fns";
import { productTypeMap } from "../../../../Static/StaticData";

export const OrderFieldsShow = [
  { label: 'النوع', key: 'type', icon: 'mdi:format-list-bulleted-type', format: (value) => productTypeMap[value] || 'Unknown' },
  { label: 'التاريخ', key: 'action_date', icon: 'mdi:calendar', format: (value) => format(new Date(value), 'MMM dd, yyyy') },
  { label: 'الملاحظات', key: 'notes', icon: 'mdi:note-text' },
  { label: 'تم الإنشاء في', key: 'created_at', icon: 'mdi:calendar-plus', format: (value) => format(new Date(value), 'MMM dd, yyyy HH:mm') },
  { label: 'اسم الموظف', key: 'user.full_name', icon: 'mdi:account' },
  { label: 'بريد الموظف', key: 'user.email', icon: 'mdi:email' },
  { label: 'اسم الزبون', key: 'customer.full_name', icon: 'mdi:account-outline' },
  { label: 'اسم الشركة', key: 'customer.company_name', icon: 'mdi:office-building' },
  { label: 'تموضع اللوحات', key: 'road_sign.place', icon: 'mdi:map-marker' },
  { label: 'المساحة الاعلانية', key: 'road_sign.advertising_meters', icon: 'mdi:image-area', format: (value) => `${value}m²` },
];