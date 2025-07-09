import { useState } from "react";
import { useGetRoadSignsModelQuery } from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import LoadingGet from "../../utils/Loading/LoadingGet/LoadingGet";
import SummariesCard from "../Summaries/SummariesCard";
import HeaderComponent from "../../utils/HeaderComponent";
import { DialogAddRoadSign } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddRoadSign";
import { Permissions } from "../../Static/StaticData";

const RoadSignsContainer = () => {
  const { data, isFetching } = useGetRoadSignsModelQuery();
  const [open, setOpen] = useState(false);

  if (isFetching) {
    return (
      <div className="w-full h-full flex-col flex justify-center items-center">
        <LoadingGet />
        <p>جاري التحميل ... </p>
      </div>
    );
  }

  return (
    <div dir="rtl">
     <HeaderComponent
          title={"اللوحات الطرقية"}
          titleBtn={"إضافة لوحة"}
          setShow={setOpen}
          permission={Permissions.CreateRoadSigns}
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
              endPoint={`road_signs/${item.model}`}
              facesNumber={item.faces_number || 0}
            />
          );
        })}
        <DialogAddRoadSign show={open} handleClose={() => setOpen(false)} />
      </div>
    </div>
  );
};

export default RoadSignsContainer;
