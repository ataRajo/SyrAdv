import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router";
import { motion } from "framer-motion";

const SummariesCard = ({
  title,
  count,
  subTitle,
  endPoint,
  imageUrl,
  facesNumber,
}) => {
  return (
    <Link to={`/dashboard/${endPoint}`} className="block w-full">
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Card className="flex items-center  justify-center p-4 space-x-4 dark:dark rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex-shrink-0 m-0 w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <Badge className="uppercase dark:dark text-xs font-semibold">
                  {title.charAt(0)}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex-1 text-center">
            <p className="text-sm text-gray-500">{title}</p>
            <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-500 tabular-nums">
              {count}
            </h3>
            {subTitle && (
              <p className="mt-1 text-xs text-gray-400">{subTitle}</p>
            )}
            {facesNumber && (
              <p className="mt-1 text-xs text-gray-400">
                عدد الأوجه :<span>{facesNumber} </span>
              </p>
            )}
          </div>
        </Card>
      </motion.div>
    </Link>
  );
};

export default SummariesCard;
