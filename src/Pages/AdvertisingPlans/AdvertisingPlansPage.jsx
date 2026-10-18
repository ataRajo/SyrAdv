// AdvertisingPlansPage.jsx
//
// قائمة الخطط الإعلانية (ميزة جديدة - طلب صريح من العميل). كل خطة =
// مجموعة لوحات + سعر نهائي + رابط عام للزبون، تبقى "نشطة" 48 ساعة ثم
// تُؤرشف تلقائياً. هذه الصفحة تسمح بإنشاء خطة جديدة، تعديلها، أرشفتها
// يدوياً، مشاركتها (رابط واحد أو أكثر) مع الزبون، وتحويلها لحجز فعلي بعد
// موافقته.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Eye,
  Pencil,
  Share2,
  Archive,
  ArchiveRestore,
  Trash2,
  Search,
  Loader2,
  ClipboardList,
  MessageCircleMore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetAdvertisingPlansQuery,
  useArchiveAdvertisingPlanMutation,
  useRestoreAdvertisingPlanMutation,
  useDeleteAdvertisingPlanMutation,
} from "../../RtkQuery/Slice/AdvertisingPlans/AdvertisingPlansApi";
import AdvertisingPlanStatusBadge from "../../Components/AdvertisingPlans/AdvertisingPlanStatusBadge";
import SharePlanDialog from "../../Components/AdvertisingPlans/SharePlanDialog";
import { showToast } from "../../utils/Notifictions/showToast";

const TABS = [
  { value: "", label: "الكل" },
  { value: "active", label: "نشطة" },
  { value: "archived", label: "مؤرشفة" },
];

export default function AdvertisingPlansPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [shareTarget, setShareTarget] = useState(null);

  const { data: response, isLoading, isFetching } = useGetAdvertisingPlansQuery({
    status: status || undefined,
    search: search || undefined,
  });

  const [archivePlan] = useArchiveAdvertisingPlanMutation();
  const [restorePlan] = useRestoreAdvertisingPlanMutation();
  const [deletePlan] = useDeleteAdvertisingPlanMutation();

  const plans = response?.data || [];
  const activePlansForShare = useMemo(
    () => plans.filter((p) => !p.is_archived && p.id !== shareTarget?.id),
    [plans, shareTarget]
  );

  const handleArchiveToggle = async (plan) => {
    try {
      if (plan.is_archived) {
        await restorePlan(plan.id).unwrap();
        showToast("success", "تمت إعادة تنشيط الخطة");
      } else {
        await archivePlan(plan.id).unwrap();
        showToast("success", "تمت أرشفة الخطة");
      }
    } catch (err) {
      showToast("error", err?.data?.message || "تعذّر تنفيذ العملية");
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`هل أنت متأكد من حذف الخطة "${plan.name}"؟`)) return;
    try {
      await deletePlan(plan.id).unwrap();
      showToast("success", "تم حذف الخطة");
    } catch (err) {
      showToast("error", err?.data?.message || "تعذّر حذف الخطة");
    }
  };

  return (
    <div dir="rtl" className="p-4 lg:p-6 bg-background text-foreground min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            الخطط الإعلانية
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            إنشاء ومشاركة عروض اللوحات مع الزبائن قبل تحويلها لحجز فعلي
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/advertising-plans/add")} className="gap-2">
          <Plus className="h-4 w-4" />
          خطة إعلانية جديدة
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                status === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث باسم الخطة أو الزبون..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 text-sm rounded-lg border border-input bg-background text-foreground"
          />
        </div>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right">الخطة</TableHead>
                <TableHead className="text-right">الزبون</TableHead>
                <TableHead className="text-right">عدد اللوحات</TableHead>
                <TableHead className="text-right">السعر النهائي</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">العمليات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    لا توجد خطط إعلانية حالياً
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id} className="hover:bg-muted/30">
                    <TableCell>
                      <button
                        className="font-medium text-right hover:underline"
                        onClick={() => navigate(`/dashboard/advertising-plans/${plan.id}`)}
                      >
                        {plan.name || `خطة #${plan.id}`}
                      </button>
                      {plan.customer_requested_at && (
                        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                          <MessageCircleMore className="h-3 w-3" />
                          الزبون طلب حجزها
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {plan.customer?.company_name || plan.customer?.full_name || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{plan.road_signs?.length ?? 0}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {(plan.total_price || 0).toLocaleString("ar-EG")} ل.س
                    </TableCell>
                    <TableCell>
                      <AdvertisingPlanStatusBadge plan={plan} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="عرض"
                          onClick={() => navigate(`/dashboard/advertising-plans/${plan.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="تعديل"
                          onClick={() => navigate(`/dashboard/advertising-plans/edit/${plan.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="مشاركة مع الزبون"
                          onClick={() => setShareTarget(plan)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title={plan.is_archived ? "إعادة تنشيط" : "أرشفة"}
                          onClick={() => handleArchiveToggle(plan)}
                        >
                          {plan.is_archived ? (
                            <ArchiveRestore className="h-4 w-4" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="حذف"
                          onClick={() => handleDelete(plan)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {shareTarget && (
        <SharePlanDialog
          open={Boolean(shareTarget)}
          onOpenChange={(open) => !open && setShareTarget(null)}
          currentPlan={shareTarget}
          candidatePlans={activePlansForShare}
        />
      )}
    </div>
  );
}
