import { useState } from "react";
import { useGetTemplatesModelQuery } from "../../RtkQuery/Slice/Template/TemplateApi";
import LoadingGet from "../../utils/Loading/LoadingGet/LoadingGet";
import SummariesCard from "../Summaries/SummariesCard";
import { DialogAddTemplate } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddTemplate";
import HeaderComponent from "../../utils/HeaderComponent";
import { Permissions } from "../../Static/StaticData";

const TemplatesContainer = () => {
  const { data, isFetching } = useGetTemplatesModelQuery();
  const [show, setShow] = useState(false);

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

      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-2  lg:grid-cols-4 gap-4"
        dir="rtl"
      >
        {data?.map((item, ind) => {
          return (
            <SummariesCard
              key={ind}
              title={item.model}
              count={item.count || 0}
              endPoint={`models/${item.model}`}
            />
          );
        })}
        <DialogAddTemplate show={show} handleClose={() => setShow(false)} />
      </div>
    </>
  );
};

export default TemplatesContainer;
