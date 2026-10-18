import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import {
  useGetRoadSignEvaluationsQuery,
  useGetRoadSignEvaluationStatsQuery,
  useUpdateRoadSignEvaluationMutation,
  useApproveAllRoadSignEvaluationsMutation,
  useResetRoadSignEvaluationsMutation,
} from "../../RtkQuery/Slice/RoadSignEvaluations/RoadSignEvaluationsApi";
import { getStaticEvaluation } from "../../Static/staticEvaluations";

// تقييم اللوحات بالذكاء الاصطناعي (نسبة المشاهدة + الجمهور المتوقع) - لوحة
// السوبر أدمن: الذكاء الاصطناعي يقترح، وأنت تعدّل أو تخفي. التقييم يظهر
// للزبون في صفحة الخريطة العامة تلقائيًا ما لم تُخفِه.

const METRICS = [
  { key: "view_rate", label: "نسبة المشاهدة" },
  { key: "population_density_score", label: "الكثافة السكانية" },
  { key: "traffic_score", label: "حركة المرور" },
  { key: "expected_audience_rate", label: "النسبة المتوقعة للجمهور" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "none", label: "بلا تقييم / فشل" },
  { value: "pending", label: "مخفية عن الزبائن" },
  { value: "approved", label: "ظاهرة للزبائن" },
  { value: "manual", label: "معدّلة يدويًا" },
];

// يجب أن يطابق RoadSignEvaluationService::TRAFFIC_WEIGHT (0.5) على الباك-إند.
const combine = (density, traffic) =>
  Math.round((Number(density) + Number(traffic)) / 2);

const toInput = (v) => (v === null || v === undefined ? "" : String(v));

const toPayloadNumber = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Math.round(Number(v));
  return Number.isNaN(n) ? null : Math.max(0, Math.min(100, n));
};

const StatusBadge = ({ evaluation }) => {
  let text = "لم تُقيَّم";
  let cls = "bg-muted text-muted-foreground";

  if (evaluation?.last_error && evaluation?.view_rate == null) {
    text = "فشل التقييم";
    cls = "bg-red-100 text-red-800";
  } else if (evaluation?.is_visible) {
    text = evaluation.source === "manual" ? "ظاهرة (معدّلة)" : "ظاهرة";
    cls = "bg-green-100 text-green-800";
  } else if (evaluation?.view_rate != null || evaluation?.expected_audience_rate != null) {
    text = evaluation.source === "manual" ? "معدّلة - مخفية" : "AI - مخفية";
    cls = "bg-amber-100 text-amber-800";
  }

  return <span className={`text-xs px-2 py-1 rounded ${cls}`}>{text}</span>;
};

const StatCard = ({ label, value, tone = "" }) => (
  <div className="border border-border rounded-lg p-3 bg-card text-card-foreground text-center">
    <div className={`text-2xl font-bold ${tone}`}>{value ?? "—"}</div>
    <div className="text-xs text-muted-foreground mt-1">{label}</div>
  </div>
);

const EvaluationRow = ({ row }) => {
  const ev = row.evaluation || getStaticEvaluation(row.id);

  const fromRow = () => ({
    view_rate: toInput(ev?.view_rate),
    population_density_score: toInput(ev?.population_density_score),
    traffic_score: toInput(ev?.traffic_score),
    expected_audience_rate: toInput(ev?.expected_audience_rate),
    notes: ev?.notes || "",
  });

  const [form, setForm] = useState(fromRow);
  const [expectedTouched, setExpectedTouched] = useState(false);
  const [update, { isLoading: saving }] = useUpdateRoadSignEvaluationMutation();

  const original = fromRow();
  const isDirty = Object.keys(original).some((k) => original[k] !== form[k]);

  // لا نكتب فوق ما يحرّره المستخدم الآن إن وصل تحديث تلقائي (polling).
  const dirtyRef = useRef(false);
  dirtyRef.current = isDirty;
  useEffect(() => {
    if (!dirtyRef.current) {
      setForm(fromRow());
      setExpectedTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ev?.view_rate,
    ev?.population_density_score,
    ev?.traffic_score,
    ev?.expected_audience_rate,
    ev?.notes,
    ev?.source,
    ev?.is_visible,
  ]);

  const setMetric = (key, value) => {
    if (key === "expected_audience_rate") setExpectedTouched(true);

    setForm((f) => {
      const next = { ...f, [key]: value };
      if (
        key !== "expected_audience_rate" &&
        !expectedTouched &&
        (key === "population_density_score" || key === "traffic_score") &&
        next.population_density_score !== "" &&
        next.traffic_score !== ""
      ) {
        next.expected_audience_rate = String(
          combine(next.population_density_score, next.traffic_score)
        );
      }
      return next;
    });
  };

  const hasValues = form.view_rate !== "" || form.expected_audience_rate !== "";

  const handleSave = async () => {
    try {
      await update({
        id: row.id,
        view_rate: toPayloadNumber(form.view_rate),
        population_density_score: toPayloadNumber(form.population_density_score),
        traffic_score: toPayloadNumber(form.traffic_score),
        expected_audience_rate: toPayloadNumber(form.expected_audience_rate),
        notes: form.notes.trim() === "" ? null : form.notes.trim(),
      }).unwrap();
      toast.success("تم حفظ التقييم");
    } catch (err) {
      toast.error(err?.data?.message || "تعذّر حفظ التقييم");
    }
  };

  const handleToggleVisible = async () => {
    try {
      await update({ id: row.id, is_visible: !ev?.is_visible }).unwrap();
      toast.success(ev?.is_visible ? "أُخفي التقييم عن الزبائن" : "التقييم ظاهر للزبائن الآن");
    } catch (err) {
      toast.error(err?.data?.message || "تعذّر تغيير الحالة");
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card text-card-foreground shadow-sm space-y-3">
      <div className="flex gap-3 items-start flex-wrap">
        {row.image ? (
          <img
            src={row.image}
            alt=""
            className="w-24 h-16 object-cover rounded border border-border"
            loading="lazy"
          />
        ) : (
          <div className="w-24 h-16 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground">
            <Icon icon="mdi:image-off-outline" width={22} />
          </div>
        )}

        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">#{row.id}</span>
            {row.roadsign_code && (
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{row.roadsign_code}</span>
            )}
            <StatusBadge evaluation={ev} />
          </div>
          <p className="text-sm mt-1">
            {[row.city, row.region, row.place].filter(Boolean).join(" - ") || "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {[
              row.template?.model,
              row.template?.size && `المقاس: ${row.template.size}`,
              row.template?.display_type === "digital" ? "شاشة" : "فيزيائية",
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {METRICS.map((m) => (
          <label key={m.key} className="text-xs text-muted-foreground space-y-1">
            <span>{m.label} (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={form[m.key]}
              onChange={(e) => setMetric(m.key, e.target.value)}
              className="w-full border border-border rounded-md p-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </label>
        ))}
      </div>

      <textarea
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        rows={2}
        dir="rtl"
        maxLength={600}
        placeholder="ملاحظة تظهر للزبون في المواصفات الفنية (اختياري)..."
        className="w-full border border-border rounded-md p-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {ev?.last_error && ev?.view_rate == null && (
        <p className="text-xs text-red-600">آخر خطأ: {ev.last_error}</p>
      )}

      <div className="flex justify-end items-center gap-2 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={handleToggleVisible}
            disabled={!ev || isDirty || (!ev.is_visible && !hasValues)}
            title={isDirty ? "احفظ التعديلات أولًا" : ""}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm transition disabled:opacity-40 disabled:cursor-not-allowed ${
              ev?.is_visible
                ? "border border-border hover:bg-muted"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <Icon icon={ev?.is_visible ? "mdi:eye-off-outline" : "mdi:check-decagram"} width={18} />
            {ev?.is_visible ? "إخفاء عن الزبائن" : "إظهار للزبائن"}
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="flex items-center gap-1 px-4 py-2 rounded-md bg-green-600 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-700 transition"
          >
            <Icon icon="mdi:content-save" width={18} />
            {saving ? "جارِ الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
};

const RoadSignEvaluationsPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  // افتراضيًا نُبقي التعديلات اليدوية كي لا تضيع بالخطأ.
  const [keepManual, setKeepManual] = useState(true);

  // debounce للبحث
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch } = useGetRoadSignEvaluationsQuery(
    { page, per_page: 20, status, ...(search ? { search } : {}) },
  );
  const { data: statsData } = useGetRoadSignEvaluationStatsQuery();

  const [approveAll, { isLoading: approving }] = useApproveAllRoadSignEvaluationsMutation();
  const [resetEvaluations, { isLoading: resetting }] = useResetRoadSignEvaluationsMutation();

  const rows = data?.data || [];
  const meta = data?.meta;
  const stats = statsData?.data;

  const handleApproveAll = async () => {
    if (
      !window.confirm(
        `سيتم إظهار ${stats?.pending_review ?? "كل"} تقييم مخفي للزبائن في صفحة الخريطة. متابعة؟`
      )
    ) {
      return;
    }
    try {
      const res = await approveAll().unwrap();
      toast.success(res?.message || "تم الإظهار");
    } catch (err) {
      toast.error(err?.data?.message || "تعذّر الإظهار");
    }
  };

  const handleReset = async () => {
    const message = keepManual
      ? "سيتم حذف تقييمات الذكاء الاصطناعي والفاشلة فقط، وستبقى تعديلاتك اليدوية. ستختفي التقييمات المحذوفة من صفحة الخريطة العامة حتى يُعاد تقييمها. هذا الإجراء لا يمكن التراجع عنه. متابعة؟"
      : "سيتم حذف كل التقييمات بما فيها تعديلاتك اليدوية، وستعود كل اللوحات إلى حالة «بحاجة لتقييم». هذا الإجراء لا يمكن التراجع عنه. متابعة؟";

    if (!window.confirm(message)) return;

    try {
      const res = await resetEvaluations({ keep_manual: keepManual }).unwrap();
      toast.success(res?.message || "تم التصفير");
      setPage(1);
    } catch (err) {
      toast.error(err?.data?.message || "تعذّر التصفير");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icon icon="mdi:chart-areaspline" className="text-blue-600" width={28} />
          تقييم اللوحات
        </h1>
        <button
          onClick={() => refetch()}
          className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground"
        >
          <Icon icon="mdi:refresh" className={isFetching ? "animate-spin" : ""} width={18} />
          تحديث
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        نسبة المشاهدة والجمهور المتوقع (من الكثافة السكانية وحركة المرور) بناءً على
        وصف موقع كل لوحة. هذه <strong>تقديرات وليست قياسات فعلية</strong>؛ عدّلها كما تراه مناسبًا. تظهر
        للزبائن في صفحة الخريطة (زر «المواصفات الفنية») تلقائيًا، ويمكنك إخفاء أي لوحة.
      </p>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="إجمالي اللوحات" value={stats.total_signs} />
          <StatCard label="مُقيَّمة" value={stats.evaluated} />
          <StatCard label="ظاهرة للزبائن" value={stats.approved} tone="text-green-600" />
          <StatCard label="مخفية" value={stats.pending_review} tone="text-amber-600" />
          <StatCard label="معدّلة يدويًا" value={stats.manual} tone="text-blue-600" />
          <StatCard label="فشلت" value={stats.failed} tone="text-red-600" />
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={handleApproveAll}
          disabled={approving || !stats?.pending_review}
          className="flex items-center gap-1 px-4 py-2 rounded-md bg-green-600 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-700 transition"
        >
          <Icon icon="mdi:check-all" width={18} />
          إظهار كل المخفية
        </button>
        <button
          onClick={handleReset}
          disabled={resetting || !stats || (!stats.evaluated && !stats.failed)}
          className="flex items-center gap-1 px-4 py-2 rounded-md bg-red-600 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition"
        >
          <Icon icon={resetting ? "mdi:loading" : "mdi:delete-sweep"} className={resetting ? "animate-spin" : ""} width={18} />
          {resetting ? "جارِ التصفير..." : "تصفير التقييمات"}
        </button>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={keepManual}
            onChange={(e) => setKeepManual(e.target.checked)}
            disabled={resetting}
            className="accent-red-600"
          />
          الإبقاء على التعديلات اليدوية
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="بحث بالمكان أو كود اللوحة أو رقمها..."
          dir="rtl"
          className="flex-1 min-w-[220px] border border-border rounded-md p-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="border border-border rounded-md p-2 text-sm bg-background text-foreground"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="w-full flex flex-col justify-center items-center p-10">
          <Icon icon="mdi:loading" className="animate-spin text-blue-600" width={32} />
          <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">لا توجد لوحات مطابقة.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <EvaluationRow key={row.id} row={row} />
          ))}
        </div>
      )}

      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-md border border-border text-sm disabled:opacity-40"
          >
            السابق
          </button>
          <span className="text-sm text-muted-foreground">
            صفحة {meta.current_page} من {meta.total_pages} ({meta.total} لوحة)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
            disabled={page >= meta.total_pages}
            className="px-3 py-1.5 rounded-md border border-border text-sm disabled:opacity-40"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
};

export default RoadSignEvaluationsPage;