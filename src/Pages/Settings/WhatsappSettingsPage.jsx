import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import {
  useGetWhatsappSettingsQuery,
  useUpdateWhatsappSettingMutation,
} from "../../RtkQuery/Slice/Whatsapp/WhatsappSettingsApi";

// دليل placeholders المتاحة لكل نوع رسالة (طلب صريح: لوحة تحكم السوبر
// أدمن بكل أنواع رسائل واتساب في النظام - تفعيل/تعطيل + تعديل النص).
const PLACEHOLDERS_BY_KEY = {
  booking_thank_you: [
    "{customer_name}",
    "{booking_number}",
    "{start_date}",
    "{end_date}",
    "{duration_days}",
    "{roadsigns_count}",
    "{map_link}",
  ],
  overdue_balance: ["{booking_number}", "{remaining}"],
  before_expiry_reminder: [
    "{customer_name}",
    "{booking_number}",
    "{end_date}",
    "{days_left}",
  ],
  after_dismantle_thank_you: ["{customer_name}", "{booking_number}"],
  bulk_welcome_default: ["{customer_name}"],
  bulk_offer_default: ["{customer_name}"],
};

const SettingRow = ({ setting }) => {
  const [enabled, setEnabled] = useState(setting.enabled);
  const [template, setTemplate] = useState(setting.template || "");
  const [leadDays, setLeadDays] = useState(setting.lead_days ?? "");
  const [updateSetting, { isLoading }] = useUpdateWhatsappSettingMutation();

  useEffect(() => {
    setEnabled(setting.enabled);
    setTemplate(setting.template || "");
    setLeadDays(setting.lead_days ?? "");
  }, [setting.id, setting.enabled, setting.template, setting.lead_days]);

  const isDirty =
    enabled !== setting.enabled ||
    template !== (setting.template || "") ||
    String(leadDays) !== String(setting.lead_days ?? "");

  const handleSave = async () => {
    try {
      const payload = { key: setting.key, enabled, template };
      if (setting.key === "before_expiry_reminder") {
        payload.lead_days = leadDays === "" ? null : Number(leadDays);
      }
      await updateSetting(payload).unwrap();
      toast.success("تم حفظ الإعداد بنجاح");
    } catch (err) {
      toast.error(err?.data?.message || "تعذّر حفظ الإعداد");
    }
  };

  const placeholders = PLACEHOLDERS_BY_KEY[setting.key] || [];

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="font-semibold text-lg text-gray-800">{setting.label}</h3>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm text-gray-600">
            {enabled ? "مُفعَّلة" : "معطَّلة"}
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 accent-green-600"
          />
        </label>
      </div>

      {placeholders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {placeholders.map((p) => (
            <span
              key={p}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      <textarea
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        rows={4}
        dir="rtl"
        className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="نص الرسالة..."
      />

      {setting.key === "before_expiry_reminder" && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">
            عدد أيام التذكير قبل نهاية العقد:
          </label>
          <input
            type="number"
            min={1}
            value={leadDays}
            onChange={(e) => setLeadDays(e.target.value)}
            className="w-24 border rounded-md p-1 text-sm"
          />
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!isDirty || isLoading}
          className="flex items-center gap-1 px-4 py-2 rounded-md bg-green-600 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-700 transition"
        >
          <Icon icon="mdi:content-save" width={18} />
          {isLoading ? "جارِ الحفظ..." : "حفظ"}
        </button>
      </div>
    </div>
  );
};

const WhatsappSettingsPage = () => {
  const { data, isLoading, isFetching, refetch } = useGetWhatsappSettingsQuery();
  const settings = data?.data || [];

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-10">
        <Icon icon="mdi:loading" className="animate-spin text-green-600" width={32} />
        <p className="mt-2 text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="mdi:whatsapp" className="text-green-600" width={28} />
          إعدادات إشعارات واتساب
        </h1>
        <button
          onClick={() => refetch()}
          className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
        >
          <Icon icon="mdi:refresh" className={isFetching ? "animate-spin" : ""} width={18} />
          تحديث
        </button>
      </div>

      <p className="text-sm text-gray-500">
        تحكّم بتفعيل أو تعطيل كل نوع رسالة واتساب تلقائية، وعدّل نصها مباشرة دون الحاجة لنشر كود جديد.
      </p>

      {settings.length === 0 ? (
        <p className="text-gray-500 text-sm">
          لا توجد إعدادات بعد - يجب تشغيل seeder الإعدادات الافتراضية أولًا (WhatsappNotificationSettingSeeder).
        </p>
      ) : (
        <div className="space-y-4">
          {settings.map((setting) => (
            <SettingRow key={setting.id} setting={setting} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatsappSettingsPage;
