import { useState, useMemo } from "react";
import { useGetTemplatesModelQuery } from "../../RtkQuery/Slice/Template/TemplateApi";
import LoadingGet from "../../utils/Loading/LoadingGet/LoadingGet";
import SummariesCard from "../Summaries/SummariesCard";
import { DialogAddTemplate } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddTemplate";
import HeaderComponent from "../../utils/HeaderComponent";
import { Permissions } from "../../Static/StaticData";
import { IconSearch, IconFilter } from "@tabler/icons-react";

const TemplatesContainer = () => {
  const { data, isFetching } = useGetTemplatesModelQuery();
  const [show, setShow] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [displayTypeFilter, setDisplayTypeFilter] = useState("all"); // all, digital, physical

  const filteredData = useMemo(() => {
    if (!data) return [];
    
    return data.filter((item) => {
      const matchesName = item.model
        .toLowerCase()
        .includes(searchName.toLowerCase());
      
      const matchesDisplayType = 
        displayTypeFilter === "all" || 
        item.display_type === displayTypeFilter;
      
      return matchesName && matchesDisplayType;
    });
  }, [data, searchName, displayTypeFilter]);

  if (isFetching) {
    return (
      <div className="w-full h-full flex-col flex justify-center items-center">
        <LoadingGet />
        <p>جاري التحميل ... </p>
      </div>
    );
  }
  
  return (
    <>
      <HeaderComponent
        setShow={setShow}
        title={"النماذج"}
        titleBtn={"اضافة نموذج"}
        permission={Permissions.CreateTemplates}
      />

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-3 px-2 mb-4" dir="rtl">
        {/* Search by Name */}
        <div className="relative flex-1">
          <IconSearch 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" 
            size={20} 
          />
          <input
            type="text"
            placeholder="ابحث باسم النموذج..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        {/* Filter by Display Type */}
        <div className="relative">
          <IconFilter 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" 
            size={20} 
          />
          <select
            value={displayTypeFilter}
            onChange={(e) => setDisplayTypeFilter(e.target.value)}
            className="pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="all">كل الأنواع</option>
            <option value="digital">رقمي (Digital)</option>
            <option value="physical">فيزيائي (Physical)</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="px-2 mb-2 text-sm text-gray-500 dark:text-gray-400" dir="rtl">
        عدد النتائج: {filteredData.length}
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-2 lg:grid-cols-4 gap-4"
        dir="rtl"
      >
        {filteredData?.map((item, ind) => {
          return (
            <SummariesCard
              key={ind}
              title={item.model}
              count={item.count || 0}
              endPoint={`models/${item.model}`}
              displayType={item.display_type} // Optional: pass to show badge
            />
          );
        })}
        
        {filteredData.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">
            لا توجد نتائج مطابقة
          </div>
        )}
        
        <DialogAddTemplate show={show} handleClose={() => setShow(false)} />
      </div>
    </>
  );
};

export default TemplatesContainer;