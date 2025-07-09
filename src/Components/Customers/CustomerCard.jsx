import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { Button } from "@/components/ui/button";
import { Permissions } from "../../Static/StaticData";
import useCustomers from "../../hooks/useCustomers";

const CustomerCard = ({
  id,
  fullName,
  companyName,
  phone_number,
  remaining,
  createdAt,
  updatedAt,
}) => {
  const {
    handleViewDetails,
    hasPermission,
    setOpen,
    open,
    isDeleting,
    handelDelete,
  } = useCustomers({id});

  return (
    <div className="block text-right w-full group">
      <motion.div
        className="w-full"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{
          y: -5,
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }}
        whileTap={{ scale: 0.98 }}
      >
        <Card className="flex flex-col h-full p-4 bg-background rounded-xl border border-gray-100 dark:border-gray-800 transition-all duration-300 group-hover:border-primary/50 group-hover:bg-gradient-to-br group-hover:from-primary/5 group-hover:to-transparent">
          <div className="flex items-start gap-4">
            <Avatar className="w-14 h-14 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-300 text-primary-foreground font-medium">
                {fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">
                {fullName}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground truncate">
                {companyName}
              </CardDescription>
            </div>
          </div>

          <CardContent className="flex-1 p-0 pt-4 space-y-3">
            <div className="flex items-start gap-2">
              <Icon
                icon="mdi:phone"
                className="mt-0.5 text-blue-500 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-foreground truncate">
                  {phone_number}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Icon
                icon="mdi:percent"
                className="mt-0.5 text-green-500 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  المتبقي:{" "}
                  <Badge variant="outline" className="ml-1">
                    {remaining}$
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>

          <div
            style={{ flexDirection: "column" }}
            className="flex justify-between pt-3 text-xs text-muted-foreground"
          >
            <p>Joined: {new Date(createdAt).toLocaleDateString()}</p>
            <p>Last update: {new Date(updatedAt).toLocaleDateString()}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="default"
                className="w-full gap-2"
                onClick={handleViewDetails}
              >
                <Icon icon="mdi:eye-outline" className="text-lg" />
                عرض التفاصيل
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              {hasPermission(Permissions.DeleteCustomers) && (
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(true);
                  }}
                >
                  <Icon icon="mdi:trash-can-outline" className="text-lg" />
                  حذف
                </Button>
              )}
            </motion.div>
          </div>
        </Card>
        <DeleteDialog
          open={open}
          onClose={() => setOpen(false)}
          loading={isDeleting}
          onConfirm={handelDelete}
        />
      </motion.div>
    </div>
  );
};

export default CustomerCard;
