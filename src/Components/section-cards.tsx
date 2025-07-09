import { Loader, Loader2 } from "lucide-react";
import { useGetSummariesQuery } from "../RtkQuery/Slice/Summaries/SummariesApi";
import LoadingGet from "../utils/Loading/LoadingGet/LoadingGet";
import SummariesCard from "./Summaries/SummariesCard";

export function SectionCards() {
  const { data: summaries, isFetching: isFetchingSummaries } =
    useGetSummariesQuery();

  if (isFetchingSummaries) {
    return (
      <div dir="ltr" className="w-full h-full flex-col flex justify-center items-center">
        <LoadingGet />
        <p> ... جاري التحميل </p> 
      </div>
    );
  }
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">

      {summaries?.map((item, ind) => {
        return (
          <SummariesCard
            key={ind}
            title={item.name}
            count={item.count || 0}
            endPoint={item.endpoint}
          />
        );
      })}
    </div>
  );
}
