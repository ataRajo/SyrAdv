import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import { useAuth } from "../../Context/AuthProvider";
import { Permissions } from "../../Static/StaticData";
import { useWorkshops } from "../../hooks/useWorkshops";
import { useMyWorkshopOrders } from "../../hooks/useMyWorkshopOrders";
import WorkshopsListTab from "./WorkshopsListTab";
import AssignOrdersTab from "./AssignOrdersTab";
import ReassignOrdersTab from "./ReassignOrdersTab";
import ActivityFeedTab from "./ActivityFeedTab";
import WeeklyReportTab from "./WeeklyReportTab";
import MyOrdersTab from "./MyOrdersTab";
import MyAchievementsTab from "./MyAchievementsTab";
import MaintenanceHoldsTab from "./MaintenanceHoldsTab";

/**
 * نقطة الدخول الوحيدة لنظام الورشات - المحتوى يختلف حسب من يفتحها، ثلاث
 * طبقات صلاحيات مستقلة (يمكن الجمع بينها):
 *
 * - مسؤول الإدارة (view-orders): تبويبات إدارية كاملة - بث الإنجاز الحي
 *   (لكل الورشات)، إدارة الورشات (CRUD)، إسناد لورشة كاملة، تقرير أسبوعي.
 * - مدير الورشة (manage-workshop-team، دور 'workshop_manager'): يرى فقط
 *   تبويب "أوامري" (طلبات ورشته اليومية) وتبويب "سجل نشاط الورشة" المُقيَّد
 *   تلقائيًا بورشته وحدها - طلب صريح: أُزيلت "إسناد لعامل" نهائيًا (كانت
 *   هنا سابقًا)، ولا يرى "إنجازي" (تلك خاصة بعامل بلا صلاحيات إدارية).
 * - عامل الورشة (view-workshop-orders، دور 'workshop' أو 'workshop_manager'
 *   أيضًا - مدير الورشة يملك صلاحيات العامل تلقائيًا فوق صلاحياته): تبويبا
 *   "أوامري"/"إنجازي" - "إنجازي" فقط لمن ليس مديرًا (راجع isManager أدناه).
 *
 * من لا يملك أيًا من الثلاث: لن يصل هنا عمليًا (رابط القائمة الجانبية
 * مخفي)، لكن معالجة دفاعية هنا أيضًا.
 */
const WorkshopsPanel = () => {
  const { hasPermission, hasRole, user } = useAuth();
  const isSupervisor = hasPermission(Permissions.ViewOrders);
  const isManager = hasPermission(Permissions.ManageWorkshopTeam);
  const isWorker = hasPermission(Permissions.ViewWorkshopOrders);
  const canSeeActivityFeed = isSupervisor || isManager;
  // تبويب "الصيانة" - صلاحية مستقلة manage-maintenance-holds (طلب صريح:
  // "صلاحية جديدة تخص الصيانة") أو super admin. المرتبط بورشة يرى ورشته
  // فقط، ومن بلا ورشة يرى كل الورشات (نفس فحص الباك-إند).
  const isSuperAdminUser = typeof hasRole === "function" && hasRole("super admin");
  const canManageMaintenance = isSuperAdminUser || hasPermission(Permissions.ManageMaintenanceHolds);
  const maintenanceUnrestricted = isSuperAdminUser || (canManageMaintenance && !user?.workshop_id);

  // الـ hooks تُستدعى دائمًا بلا شرط (قاعدة React) - كل واحد منها لا
  // يُنفِّذ فعليًا إلا إذا استُهلكت بياناته في التبويبات المعروضة أدناه.
  const workshops = useWorkshops();
  const myWorkshop = useMyWorkshopOrders();

  if (!isSupervisor && !isManager && !isWorker && !canManageMaintenance) {
    return (
      <div className="p-6 text-center text-muted-foreground" dir="rtl">
        <Icon icon="mdi:lock-outline" className="w-10 h-10 mx-auto mb-2" />
        ليس لديك صلاحية الوصول لهذه الصفحة.
      </div>
    );
  }

  const reassignmentCount = workshops.reassignmentOrders?.length ?? 0;

  // "إنجازي" خاصة بعامل بلا صلاحيات إدارية - مدير الورشة لا يراها (طلب
  // صريح: يظهر له فقط "الطلبات" و"سجل نشاط الورشة"). نظير Flutter تمامًا
  // (isWorker && !isManager في workshops_panel_view.dart).
  const showAchievements = isWorker && !isManager;

  const tabCount =
    (isWorker ? 1 : 0) +
    (showAchievements ? 1 : 0) +
    (canSeeActivityFeed ? 1 : 0) +
    (isSupervisor ? 4 : 0) +
    (canManageMaintenance ? 1 : 0);
  const defaultTab = isSupervisor ? "activity-feed" : isWorker ? "my-orders" : "maintenance";

  return (
    <div className="space-y-4 p-4 sm:p-6" dir="rtl">
      <h2 className="text-xl font-bold">
        {isSupervisor
          ? "إدارة الورشات"
          : isManager
          ? "إدارة فريق ورشتي"
          : isWorker
          ? "ورشتي"
          : "صيانة الورشات"}
      </h2>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList
          className="grid w-full gap-1 bg-card rounded-lg border border-border h-auto"
          style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
        >
          {isWorker && (
            <>
              <TabsTrigger value="my-orders" className="text-xs md:text-sm font-medium">
                أوامري
              </TabsTrigger>
              {showAchievements && (
                <TabsTrigger value="my-achievements" className="text-xs md:text-sm font-medium">
                  إنجازي
                </TabsTrigger>
              )}
            </>
          )}
          {canSeeActivityFeed && (
            <TabsTrigger value="activity-feed" className="text-xs md:text-sm font-medium">
              بث الإنجاز الحي
            </TabsTrigger>
          )}
          {isSupervisor && (
            <>
              <TabsTrigger value="workshops" className="text-xs md:text-sm font-medium">
                الورشات
              </TabsTrigger>
              <TabsTrigger value="assign" className="text-xs md:text-sm font-medium">
                إسناد لورشة
              </TabsTrigger>
              <TabsTrigger value="reassign" className="text-xs md:text-sm font-medium">
                إعادة إسناد متأخرة
                {reassignmentCount > 0 && (
                  <span className="mr-1 inline-flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-amber-600 rounded-full">
                    {reassignmentCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="weekly-report" className="text-xs md:text-sm font-medium">
                تقرير المكافآت الأسبوعي
              </TabsTrigger>
            </>
          )}
          {canManageMaintenance && (
            <TabsTrigger value="maintenance" className="text-xs md:text-sm font-medium">
              الصيانة
            </TabsTrigger>
          )}
        </TabsList>

        {isWorker && (
          <>
            <TabsContent value="my-orders" className="mt-4">
              <MyOrdersTab myWorkshop={myWorkshop} />
            </TabsContent>
            {showAchievements && (
              <TabsContent value="my-achievements" className="mt-4">
                <MyAchievementsTab myWorkshop={myWorkshop} />
              </TabsContent>
            )}
          </>
        )}

        {canSeeActivityFeed && (
          <TabsContent value="activity-feed" className="mt-4">
            <ActivityFeedTab workshops={workshops} lockedToOwnWorkshop={!isSupervisor} />
          </TabsContent>
        )}

        {isSupervisor && (
          <>
            <TabsContent value="workshops" className="mt-4">
              <WorkshopsListTab workshops={workshops} />
            </TabsContent>
            <TabsContent value="assign" className="mt-4">
              <AssignOrdersTab workshops={workshops} />
            </TabsContent>
            <TabsContent value="reassign" className="mt-4">
              <ReassignOrdersTab workshops={workshops} />
            </TabsContent>
            <TabsContent value="weekly-report" className="mt-4">
              <WeeklyReportTab workshops={workshops} />
            </TabsContent>
          </>
        )}

        {canManageMaintenance && (
          <TabsContent value="maintenance" className="mt-4">
            <MaintenanceHoldsTab unrestricted={maintenanceUnrestricted} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default WorkshopsPanel;
