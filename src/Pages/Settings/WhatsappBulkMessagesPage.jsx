import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { useGetWorkTypesQuery } from "../../RtkQuery/Slice/WorkTypesApi/WorkTypesApi";
import { useGetWhatsappSettingsQuery } from "../../RtkQuery/Slice/Whatsapp/WhatsappSettingsApi";
import {
  useLazyGetRecipientsPreviewQuery,
  useSendBulkWhatsappMessageMutation,
  useGetWhatsappCampaignsQuery,
} from "../../RtkQuery/Slice/Whatsapp/WhatsappBulkApi";

// رسائل واتساب الجماعية (ترحيب/عروض/مناسبات - طلب صريح): "امكانية ارسال
// رسالة ترحيبية للكل او ل فئة معينة حسب نوع العمل ... رسالة للعروض + رسالة
// مناسبات بتحدد المناسبة والرسالة". نفس الواجهة تغطي الأنواع الثلاثة.
const TYPE_LABELS = {
  welcome: "رسالة ترحيب",
  offer: "رسالة عروض",
  occasion: "رسالة مناسبة",
};

const STATUS_LABELS = {
  queued: "قيد الانتظار",
  sending: "قيد الإرسال",
  completed: "مكتملة",
};

const WhatsappBulkMessagesPage = () => {
  const [type, setType] = useState("welcome");
  const [occasionLabel, setOccasionLabel] = useState("");
  const [segment, setSegment] = useState("all");
  const [workTypeId, setWorkTypeId] = useState("");
  const [message, setMessage] = useState("");
  const [messageTouchedByUser, setMessageTouchedByUser] = useState(false);

  const { data: workTypesData } = useGetWorkTypesQuery();
  const workTypes = workTypesData?.data || [];

  const { data: settingsData } = useGetWhatsappSettingsQuery();
  const settings = settingsData?.data || [];

  const [fetchPreview, { data: previewData, isFetching: isPreviewLoading }] =
    useLazyGetRecipientsPreviewQuery();

  const [sendBulkMessage, { isLoading: isSending }] = useSendBulkWhatsappMessageMutation();

  const { data: campaignsData, isFetching: isCampaignsLoading, refetch: refetchCampaigns } =
    useGetWhatsappCampaignsQuery();
  const campaigns = campaignsData?.data || [];

  // تعبئة النص الافتراضي عند تغيير نوع الحملة (طلب صريح: "يعطيني قبل نص
  // الرسالة مع امكانية تعديله") - فقط إن لم يُعدِّل المستخدم النص يدويًا
  // بعد، ولا يوجد نص افتراضي لرسائل المناسبات (نص حر كل مرة).
  useEffect(() => {
    if (messageTouchedByUser) return;
    if (type === "occasion") {
      setMessage("");
      return;
    }
    const key = type === "welcome" ? "bulk_welcome_default" : "bulk_offer_default";
    const setting = settings.find((s) => s.key === key);
    if (setting?.template) {
      setMessage(setting.template);
    }
  }, [type, settings, messageTouchedByUser]);

  // معاينة عدد المستلمين عند تغيير الفئة المستهدفة.
  useEffect(() => {
    if (segment === "work_type" && !workTypeId) return;
    fetchPreview({ segment, workTypeId: segment === "work_type" ? workTypeId : undefined });
  }, [segment, workTypeId, fetchPreview]);

  const recipientsCount = previewData?.data?.count ?? null;

  const resetForm = () => {
    setOccasionLabel("");
    setMessage("");
    setMessageTouchedByUser(false);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("يرجى كتابة نص الرسالة أولًا");
      return;
    }
    if (type === "occasion" && !occasionLabel.trim()) {
      toast.error("يرجى تحديد اسم المناسبة");
      return;
    }
    if (segment === "work_type" && !workTypeId) {
      toast.error("يرجى اختيار نوع العمل");
      return;
    }

    const confirmed = window.confirm(
      `سيتم إرسال الرسالة إلى ${recipientsCount ?? "..."} عميل تقريبًا، على دفعات لتجنب حظر واتساب. لا يمكن التراجع بعد الإرسال. هل تريد المتابعة؟`
    );
    if (!confirmed) return;

    try {
      await sendBulkMessage({
        type,
        occasion_label: type === "occasion" ? occasionLabel : undefined,
        message,
        segment,
        work_type_id: segment === "work_type" ? workTypeId : undefined,
      }).unwrap();

      toast.success("تم جدولة الحملة بنجاح - سيتم الإرسال تدريجيًا");
      resetForm();
      refetchCampaigns();
    } catch (err) {
      toast.error(err?.data?.message || "تعذّر إرسال الحملة");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Icon icon="mdi:whatsapp" className="text-green-600" width={28} />
        رسائل واتساب الجماعية
      </h1>

      <div className="border border-border rounded-lg p-4 space-y-4 bg-card text-card-foreground shadow-sm">
        {/* نوع الحملة */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">نوع الرسالة</label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setType(value);
                  setMessageTouchedByUser(false);
                }}
                className={`px-4 py-2 rounded-md text-sm border ${
                  type === value
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-background text-foreground border-border"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {type === "occasion" && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">اسم المناسبة</label>
            <input
              type="text"
              value={occasionLabel}
              onChange={(e) => setOccasionLabel(e.target.value)}
              placeholder="مثال: عيد الفطر"
              className="w-full border border-border rounded-md p-2 text-sm bg-background text-foreground"
            />
          </div>
        )}

        {/* الفئة المستهدفة */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">الفئة المستهدفة</label>
          <div className="flex gap-2 flex-wrap items-center">
            <button
              type="button"
              onClick={() => setSegment("all")}
              className={`px-4 py-2 rounded-md text-sm border ${
                segment === "all"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-background text-foreground border-border"
              }`}
            >
              كل العملاء
            </button>
            <button
              type="button"
              onClick={() => setSegment("work_type")}
              className={`px-4 py-2 rounded-md text-sm border ${
                segment === "work_type"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-background text-foreground border-border"
              }`}
            >
              حسب نوع العمل
            </button>

            {segment === "work_type" && (
              <select
                value={workTypeId}
                onChange={(e) => setWorkTypeId(e.target.value)}
                className="border border-border rounded-md p-2 text-sm bg-background text-foreground"
              >
                <option value="">اختر نوع العمل...</option>
                {workTypes.map((wt) => (
                  <option key={wt.id} value={wt.id}>
                    {wt.type}
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            {isPreviewLoading ? (
              "جارِ حساب عدد المستلمين..."
            ) : recipientsCount !== null ? (
              <>
                عدد المستلمين المتوقَّع: <span className="font-semibold">{recipientsCount}</span> عميل (بأرقام هواتف صالحة)
              </>
            ) : (
              "—"
            )}
          </p>
        </div>

        {/* نص الرسالة */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">نص الرسالة</label>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setMessageTouchedByUser(true);
            }}
            rows={5}
            dir="rtl"
            className="w-full border border-border rounded-md p-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="نص الرسالة..."
          />
          <p className="text-xs text-muted-foreground mt-1">يمكن استخدام {"{customer_name}"} داخل النص.</p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={isSending}
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-green-600 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-700 transition"
          >
            <Icon icon="mdi:send" width={18} />
            {isSending ? "جارِ الإرسال..." : "إرسال الحملة"}
          </button>
        </div>
      </div>

      {/* سجل الحملات السابقة */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">سجل الحملات السابقة</h2>
          <button
            onClick={() => refetchCampaigns()}
            className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground"
          >
            <Icon icon="mdi:refresh" className={isCampaignsLoading ? "animate-spin" : ""} width={18} />
            تحديث
          </button>
        </div>

        <div className="overflow-x-auto border border-border rounded-lg bg-card text-card-foreground shadow-sm">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3">النوع</th>
                <th className="p-3">الفئة</th>
                <th className="p-3">المستلمون</th>
                <th className="p-3">نجح</th>
                <th className="p-3">فشل</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    لا توجد حملات سابقة
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-3">
                      {TYPE_LABELS[c.type] || c.type}
                      {c.occasion_label ? ` - ${c.occasion_label}` : ""}
                    </td>
                    <td className="p-3">
                      {c.segment === "all" ? "الكل" : c.work_type?.type || "نوع عمل"}
                    </td>
                    <td className="p-3">{c.total_recipients}</td>
                    <td className="p-3 text-green-600">{c.sent_count}</td>
                    <td className="p-3 text-red-500">{c.failed_count}</td>
                    <td className="p-3">{STATUS_LABELS[c.status] || c.status}</td>
                    <td className="p-3 text-muted-foreground">
                      {c.created_at ? new Date(c.created_at).toLocaleString("ar-EG") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WhatsappBulkMessagesPage;
