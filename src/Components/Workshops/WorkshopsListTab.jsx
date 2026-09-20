  import React, { useMemo, useState } from "react";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Icon } from "@iconify/react";
  import { useGetUsersQuery, useUpdateUsersMutation } from "../../RtkQuery/Slice/Users/UsersApi";
  import { useGetWorkshopOrdersQuery } from "../../RtkQuery/Slice/Workshops/WorkshopsApi";
  import toast from "react-hot-toast";

  const ORDER_TYPE_LABELS = {
    1: "فك",
    2: "تركيب",
    3: "فك وتركيب",
    4: "صيانة",
  };

  /**
   * ⚠️ ميزة جديدة أُضيفت لإصلاح خطأ فعلي: "هذا الحساب غير مرتبط بأي ورشة"
   * كان يظهر لأي عامل ورشة لأنه لم توجد أصلًا أي واجهة لربط مستخدم بورشة -
   * فقط CRUD الورشة نفسها (name/phone/is_active) كان موجودًا. هذا الحوار
   * يسرد كل المستخدمين بدور 'workshop' ويتيح تبديل انتمائهم لهذه الورشة
   * تحديدًا عبر users.workshop_id (الحقل نفسه الذي يستخدمه الباك-إند في كل
   * فحوصات الملكية - راجع DEVELOPER_GUIDE.md، الجزء التاسع).
   */
  const MembersDialog = ({ workshop, open, onOpenChange }) => {
    const { data: allUsers = [], isFetching } = useGetUsersQuery();
    const [updateUser, { isLoading: isSaving }] = useUpdateUsersMutation();
    const [savingId, setSavingId] = useState(null);

    const workshopWorkers = allUsers.filter((u) =>
      (u.roles ?? []).some((r) => r.name === "workshop")
    );

    const toggleMembership = async (user) => {
      const isMember = user.workshop_id === workshop.id;
      setSavingId(user.id);
      try {
        await updateUser({
          id: user.id,
          workshop_id: isMember ? null : workshop.id,
        }).unwrap();
        toast.success(isMember ? "تم إخراج العامل من الورشة" : "تم ضم العامل للورشة");
      } catch (error) {
        toast.error(error?.data?.message || "فشل تحديث انتماء العامل");
      } finally {
        setSavingId(null);
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>أعضاء ورشة "{workshop?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {isFetching && <div className="text-center text-muted-foreground py-4">جارٍ التحميل...</div>}
            {!isFetching && workshopWorkers.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                لا يوجد مستخدمون بدور "عامل ورشة" بعد. أنشئ مستخدمًا من صفحة المستخدمين
                بدور workshop أولًا.
              </div>
            )}
            {workshopWorkers.map((user) => {
              const isMember = user.workshop_id === workshop?.id;
              const belongsElsewhere = user.workshop_id && !isMember;
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between border border-border/50 rounded-md p-2"
                >
                  <div>
                    <div className="text-sm font-medium">{user.full_name}</div>
                    {belongsElsewhere && (
                      <div className="text-xs text-amber-600">
                        منتمٍ لورشة أخرى حاليًا - سيُنقَل إلى هنا
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isMember ? "destructive" : "outline"}
                    disabled={isSaving && savingId === user.id}
                    onClick={() => toggleMembership(user)}
                  >
                    {isSaving && savingId === user.id
                      ? "..."
                      : isMember
                      ? "إخراج"
                      : "ضمّ للورشة"}
                  </Button>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  /**
   * الأوامر المُسنَدة لورشة بعينها (طلب العميل: "معرفة الأوردرات التي
   * أُسندت لهذه الورشة" عند الإسناد لورشة) - أيقونة العين في جدول
   * الورشات. GET /workshops/{id}/orders.
   */
  const WorkshopOrdersDialog = ({ workshop, open, onOpenChange }) => {
    const { data, isFetching } = useGetWorkshopOrdersQuery(
      { id: workshop?.id },
      { skip: !workshop?.id }
    );
    const orders = data?.data ?? [];

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>الأوامر المُسنَدة لورشة "{workshop?.name}"</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border border-border rounded-md">
            <table className="w-full text-sm text-center">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="p-2 text-center">اللوحة</th>
                  <th className="p-2 text-center">المدينة/المنطقة</th>
                  <th className="p-2 text-center">النوع</th>
                  <th className="p-2 text-center">تاريخ التنفيذ المخطَّط</th>
                  <th className="p-2 text-center">العامل المُسنَد</th>
                  <th className="p-2 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {isFetching && (
                  <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
                )}
                {!isFetching && orders.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">لا يوجد أوامر مُسنَدة لهذه الورشة بعد</td></tr>
                )}
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-2 text-center">{order.road_sign?.roadsign_code || `#${order.road_sign_id}`}</td>
                    <td className="p-2 text-xs text-muted-foreground text-center">
                      {order.road_sign?.city?.name || "-"} / {order.road_sign?.region?.name || "-"}
                    </td>
                    <td className="p-2 text-xs text-center">{ORDER_TYPE_LABELS[order.type] || order.type}</td>
                    <td className="p-2 text-xs text-center">{order.action_date || "-"}</td>
                    <td className="p-2 text-xs text-center">{order.assigned_worker?.full_name || "أي عامل من الورشة"}</td>
                    <td className="p-2 text-xs text-center">
                      {order.executed_at ? (
                        <span className="text-emerald-600 font-medium">مُنفَّذ</span>
                      ) : order.received_at ? (
                        <span className="text-blue-600 font-medium">مُستلَم</span>
                      ) : (
                        <span className="text-amber-600 font-medium">بانتظار الاستلام</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  /**
   * إضافة/تعديل ورشة - يتضمن إسناد مدير الورشة (طلب العميل: "عند إضافة
   * ورشة يجب أن نُسنِد لها مدير ورشة" - مدير واحد خاص بهذه الورشة تحديدًا،
   * لا مديرًا عامًا لكل الورشات). المدير نفسه حساب User بدور
   * 'workshop_manager' مرتبط عبر users.workshop_id تمامًا مثل عمال الورشة
   * العاديين (دور 'workshop') - راجع MembersDialog أعلاه لنفس النمط؛ الفرق
   * هنا فقط أن الإسناد يتم مباشرة من نموذج الورشة نفسه بدل حوار منفصل، بما
   * أن كل ورشة تحتاج مديرًا واحدًا محددًا سلفًا لا مجموعة عمال متغيرة.
   */
  const WorkshopForm = ({ initial, managers, currentManagerId, onCancel, onSave, isSaving }) => {
    const [form, setForm] = useState({
      name: initial?.name || "",
      phone: initial?.phone || "",
      is_active: initial?.is_active ?? true,
      manager_id: currentManagerId ? String(currentManagerId) : "",
    });
    const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

    const selectedManager = (managers ?? []).find((m) => String(m.id) === form.manager_id);
    const managerBelongsElsewhere = Boolean(
      selectedManager && selectedManager.workshop_id && selectedManager.workshop_id !== (initial?.id ?? null)
    );

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label>اسم الورشة</Label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>رقم الهاتف (اختياري)</Label>
          <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>مدير الورشة</Label>
          <Select value={form.manager_id || "none"} onValueChange={(v) => set("manager_id")(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="اختر مدير الورشة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بلا مدير (لاحقًا)</SelectItem>
              {(managers ?? []).map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.full_name}
                  {m.workshop_id && m.workshop_id !== (initial?.id ?? null) ? " (مدير ورشة أخرى حاليًا)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {managerBelongsElsewhere && (
            <p className="text-xs text-amber-600">
              هذا المستخدم مدير ورشة أخرى حاليًا - سيُنقَل لإدارة هذه الورشة بدلًا منها.
            </p>
          )}
          {(managers ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">
              لا يوجد مستخدمون بدور "مدير ورشة" بعد. أنشئ مستخدمًا من صفحة المستخدمين بدور workshop_manager أولًا.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="workshop-active"
            checked={form.is_active}
            onChange={(e) => set("is_active")(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="workshop-active">ورشة نشطة</Label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSaving || !form.name}>
            {isSaving ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  /**
   * إدارة الورشات (CRUD) - كل ورشة "فريق" تنظيمي فقط، عمالها حسابات User
   * عادية بدور 'workshop' مرتبطة عبر users.workshop_id (لا حساب دخول خاص
   * بالورشة نفسها - راجع DEVELOPER_GUIDE.md، الجزء الثالث).
   */
  const WorkshopsListTab = ({ workshops }) => {
    const {
      workshops: list,
      isFetchingWorkshops,
      workshopDialogOpen,
      setWorkshopDialogOpen,
      editingWorkshop,
      setEditingWorkshop,
      saveWorkshop,
      isAddingWorkshop,
      isUpdatingWorkshop,
      deleteWorkshopTarget,
      setDeleteWorkshopTarget,
      confirmDeleteWorkshop,
      isDeletingWorkshop,
    } = workshops;

    const [membersDialogWorkshop, setMembersDialogWorkshop] = useState(null);
    const [ordersDialogWorkshop, setOrdersDialogWorkshop] = useState(null);
    const [isSavingManager, setIsSavingManager] = useState(false);

    // مديرو الورشات (دور 'workshop_manager') - لقائمة الاختيار في نموذج
    // الورشة، ولعرض اسم مدير كل ورشة في الجدول. نفس مصدر البيانات
    // المُستخدَم في MembersDialog (دور 'workshop' هناك، هذا الدور هنا).
    const { data: allUsers = [] } = useGetUsersQuery();
    const managers = useMemo(
      () => allUsers.filter((u) => (u.roles ?? []).some((r) => r.name === "workshop_manager")),
      [allUsers]
    );
    const managerByWorkshopId = useMemo(() => {
      const map = {};
      managers.forEach((m) => {
        if (m.workshop_id) map[m.workshop_id] = m;
      });
      return map;
    }, [managers]);

    const [updateUser] = useUpdateUsersMutation();

    // حفظ الورشة (إنشاء/تعديل) ثم إسناد المدير المختار لها - خطوتان
    // منفصلتان على الباك-إند (workshops ثم users.workshop_id) لكن خطوة
    // واحدة من منظور المستخدم، تمامًا كما طلب العميل: "عند إضافة ورشة يجب
    // أن نُسنِد لها مدير ورشة".
    const handleSaveWorkshopWithManager = async (formData) => {
      const { manager_id, ...workshopFields } = formData;
      const workshop = await saveWorkshop(workshopFields);
      if (!workshop || typeof workshop !== "object") return;

      const previousManager = managerByWorkshopId[workshop.id];
      const nextManagerId = manager_id ? Number(manager_id) : null;

      if (nextManagerId === (previousManager?.id ?? null)) return;

      setIsSavingManager(true);
      try {
        if (nextManagerId) {
          await updateUser({ id: nextManagerId, workshop_id: workshop.id }).unwrap();
        }
        // المدير السابق لهذه الورشة (إن وُجد وتغيَّر) يُخرَج منها - ورشة
        // واحدة = مدير واحد فقط، تمامًا مثل منطق toggleMembership أدناه.
        if (previousManager && previousManager.id !== nextManagerId) {
          await updateUser({ id: previousManager.id, workshop_id: null }).unwrap();
        }
        toast.success("تم تحديث مدير الورشة بنجاح");
      } catch (error) {
        toast.error(error?.data?.message || "فشل إسناد مدير الورشة");
      } finally {
        setIsSavingManager(false);
      }
    };

    return (
      <div className="border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">الورشات</h3>
          <Button
            size="sm"
            onClick={() => {
              setEditingWorkshop(null);
              setWorkshopDialogOpen(true);
            }}
          >
            <Icon icon="mdi:account-hard-hat-outline" className="w-4 h-4 ml-1" />
            ورشة جديدة
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2 text-center">الاسم</th>
                <th className="p-2 text-center">الهاتف</th>
                <th className="p-2 text-center">المنطقة</th>
                <th className="p-2 text-center">مدير الورشة</th>
                <th className="p-2 text-center">الأوامر المُعلَّقة</th>
                <th className="p-2 text-center">الحالة</th>
                <th className="p-2 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingWorkshops && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    جارٍ التحميل...
                  </td>
                </tr>
              )}
              {!isFetchingWorkshops && (list ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    لا يوجد ورشات بعد
                  </td>
                </tr>
              )}
              {(list ?? []).map((w) => (
                <tr key={w.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-2 text-center font-medium">{w.name}</td>
                  <td className="p-2 text-xs text-center">{w.phone || "-"}</td>
                  <td className="p-2 text-xs text-muted-foreground text-center">
                    {w.region?.name || "-"}
                  </td>
                  <td className="p-2 text-xs text-center">
                    {managerByWorkshopId[w.id] ? (
                      managerByWorkshopId[w.id].full_name
                    ) : (
                      <span className="text-amber-600">بلا مدير</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {w.pending_orders_count > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 text-xs font-bold text-white bg-amber-500 rounded-full">
                        {w.pending_orders_count}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">0</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {w.is_active ? (
                      <span className="text-xs text-emerald-600 font-medium">نشطة</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">معطَّلة</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOrdersDialogWorkshop(w)}
                        title="عرض الأوامر المُسنَدة لهذه الورشة"
                      >
                        <Icon icon="mdi:eye-outline" className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMembersDialogWorkshop(w)}
                        title="عمال الورشة"
                      >
                        <Icon icon="mdi:account-group-outline" className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingWorkshop(w);
                          setWorkshopDialogOpen(true);
                        }}
                      >
                        <Icon icon="mdi:pencil" className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteWorkshopTarget(w)}
                      >
                        <Icon icon="mdi:trash-can-outline" className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Dialog
          open={workshopDialogOpen}
          onOpenChange={(open) => {
            setWorkshopDialogOpen(open);
            if (!open) setEditingWorkshop(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingWorkshop ? "تعديل الورشة" : "ورشة جديدة"}</DialogTitle>
            </DialogHeader>
            <WorkshopForm
              initial={editingWorkshop}
              managers={managers}
              currentManagerId={editingWorkshop ? managerByWorkshopId[editingWorkshop.id]?.id ?? null : null}
              onCancel={() => setWorkshopDialogOpen(false)}
              onSave={handleSaveWorkshopWithManager}
              isSaving={isAddingWorkshop || isUpdatingWorkshop || isSavingManager}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!deleteWorkshopTarget}
          onOpenChange={(open) => !open && setDeleteWorkshopTarget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد حذف الورشة</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              هل أنت متأكد من حذف ورشة "{deleteWorkshopTarget?.name}"؟ لا يمكن حذف ورشة لديها
              أوامر لم تُنفَّذ بعد.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteWorkshopTarget(null)}>
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteWorkshop}
                disabled={isDeletingWorkshop}
              >
                {isDeletingWorkshop ? "جارٍ الحذف..." : "حذف نهائيًا"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {membersDialogWorkshop && (
          <MembersDialog
            workshop={membersDialogWorkshop}
            open={!!membersDialogWorkshop}
            onOpenChange={(open) => !open && setMembersDialogWorkshop(null)}
          />
        )}

        {ordersDialogWorkshop && (
          <WorkshopOrdersDialog
            workshop={ordersDialogWorkshop}
            open={!!ordersDialogWorkshop}
            onOpenChange={(open) => !open && setOrdersDialogWorkshop(null)}
          />
        )}
      </div>
    );
  };

  export default WorkshopsListTab;
