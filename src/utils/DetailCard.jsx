// components/ui/DetailCard.jsx (أو components/ui/DetailCard.tsx)
import { Icon } from "@iconify/react";

const DetailCard = ({ icon, title, content, colorClass }) => {
  return (
    <div className={`${colorClass} p-4 rounded-lg border`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 ${colorClass.replace("-50", "-100").replace("-900/20", "-800")} rounded-full`}>
          <Icon icon={icon} className={`${colorClass.replace("bg-", "text-").replace("-50", "-600").replace("-900/20", "-300")} text-xl`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {Array.isArray(content) ? (
            content.map((item, index) => (
              <p key={index} className="font-medium">
                {item}
              </p>
            ))
          ) : (
            <p className="font-medium">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailCard;