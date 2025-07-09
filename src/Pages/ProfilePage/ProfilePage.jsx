import {
  useGetProfileQuery,
  useGetCompanyQuery,
} from "../../RtkQuery/Slice/Auth/AuthApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import DialogEditProfile from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditProfile";
import DialogEditCompany from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditCompany";
import { useState } from "react";
import DetailCard from "../../utils/DetailCard";
import SkeletonLoader from "../../utils/SkeletonLoader";

const ProfileInfo = () => {
  const { data: profile, isFetching: isProfileFetching } = useGetProfileQuery();
  const { data: company, isFetching: isCompanyFetching } = useGetCompanyQuery();
  const [openProfile, setOpenProfile] = useState(false);
  const [openCompany, setOpenCompany] = useState(false);

  if (isProfileFetching || isCompanyFetching) {
    return (
     <SkeletonLoader />
    );
  }

  if (!profile || !company) {
    return (
      <div className="p-4 text-center">
        لم يتم العثور على الملف الشخصي أو بيانات الشركة
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-4 md:p-6 text-right max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          الملف الشخصي للمدير
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpenProfile(true)}
            className="gap-2"
          >
            <Icon icon="mdi:pencil" className="text-lg" />
            تعديل البيانات
          </Button>
          {/* <Button variant="destructive" className="gap-2">
            <Icon icon="mdi:trash" className="text-lg" />
            حذف الحساب
          </Button> */}
        </div>
      </div>

      <div className="bg-background rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="flex flex-col items-center">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-blue-100 dark:border-blue-900">
              {profile.avatar && <AvatarImage src={profile.avatar} alt="User Avatar" />}
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-300 text-3xl text-white">
                {profile.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <Badge variant="secondary" className="mt-4 text-sm">
              رقم التعريف: {profile.id}
            </Badge>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold">
                {profile.full_name}
              </h2>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <DetailCard
                icon="mdi:email"
                title="البريد الإلكتروني"
                content={
                  <>
                    {profile.email}
                    {profile.email_verified_at ? (
                      <Badge
                        variant="outline"
                        className="mt-1 text-green-600 dark:text-green-400"
                      >
                        موثق
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="mt-1 text-yellow-600 dark:text-yellow-400"
                      >
                        غير موثق
                      </Badge>
                    )}
                  </>
                }
                colorClass="bg-blue-50 dark:bg-blue-900/20"
              />

              {/* Phone Number */}
              <DetailCard
                icon="mdi:phone"
                title="رقم الهاتف"
                content={profile.phone_number}
                colorClass="bg-green-50 dark:bg-green-900/20"
              />

              {/* Address */}
              <DetailCard
                icon="mdi:map-marker"
                title="العنوان"
                content={profile.address || "غير محدد"}
                colorClass="bg-purple-50 dark:bg-purple-900/20"
              />

              {/* Last Updated */}
              <DetailCard
                icon="mdi:calendar-sync"
                title="آخر تحديث"
                content={new Date(profile.updated_at).toLocaleDateString(
                  "ar-EG",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
                colorClass="bg-orange-50 dark:bg-orange-900/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            معلومات الشركة
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenCompany(true)}
              className="gap-2"
            >
              <Icon icon="mdi:pencil" className="text-lg" />
              تعديل البيانات
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <DetailCard
            icon="mdi:office-building"
            title="اسم الشركة"
            content={company.name}
            colorClass="bg-indigo-50 dark:bg-indigo-900/20"
          />

          {/* Commercial Registration Number */}
          <DetailCard
            icon="mdi:card-bulleted"
            title="رقم التسجيل التجاري"
            content={company.commercial_registration_number}
            colorClass="bg-teal-50 dark:bg-teal-900/20"
          />

          {/* Company Address */}
          <DetailCard
            icon="mdi:map-marker"
            title="عنوان الشركة"
            content={company.address || "غير محدد"}
            colorClass="bg-purple-50 dark:bg-purple-900/20"
          />

          {/* Company Description */}
          <DetailCard
            icon="mdi:text-box"
            title="وصف الشركة"
            content={company.description || "غير محدد"}
            colorClass="bg-orange-50 dark:bg-orange-900/20"
          />

          {/* About Us */}
          <DetailCard
            icon="mdi:information"
            title="عن الشركة"
            content={company.about_us || "غير محدد"}
            colorClass="bg-blue-50 dark:bg-blue-900/20"
          />

          {/* Contract Terms - This is a good candidate for DetailCard as well, 
              but it had custom styling for text alignment and whitespace.
              You might need to adjust DetailCard to accept custom className for content,
              or wrap the content in a span with desired styles if needed.
              For now, I'm adapting DetailCard to accept `children` for `content` prop if complex. */}
          <DetailCard
            icon="mdi:contract"
            title="شروط العقود"
            // Using children for complex content with custom styling
            content={
              <span
                style={{
                  display: "inline-block",
                  direction: "rtl",
                  textAlign: "right",
                  whiteSpace: "break-spaces",
                  // Ensure font-medium is applied if not default
                  fontWeight: 500
                }}
              >
                {company.contract_note || "غير محدد"}
              </span>
            }
            colorClass="bg-green-50 dark:bg-green-900/20"
            // You might need to add a prop to DetailCard for `col-span-1 sm:col-span-2` if this is a common pattern
            // For now, I'm assuming DetailCard handles its own grid placement or that the parent grid manages it.
            // If it needs to span multiple columns, you might pass a `className` prop to DetailCard
            // or keep the outer div structure if the styling is too complex for DetailCard's default structure.
            // For this specific example, the `col-span` was on the outer div, not the card itself.
          />
        </div>
      </div>

      <DialogEditProfile
        show={openProfile}
        handleClose={() => setOpenProfile(false)}
        initData={profile}
      />
      <DialogEditCompany
        show={openCompany}
        handleClose={() => setOpenCompany(false)}
        initData={company}
      />
    </div>
  );
};

export default ProfileInfo;