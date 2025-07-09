import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { useDeleteUserMutation } from "../../RtkQuery/Slice/Users/UsersApi";
import { showToast } from "../../utils/Notifictions/showToast";
import { useAuth } from "../../Context/AuthProvider";
import { Permissions } from "../../Static/StaticData";

const UserCard = ({
  id,
  full_name,
  username,
  phone_number,
  address,
  email,
  roles,
  created_at,
  updated_at,
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [deleteUser ,{isLoading }] = useDeleteUserMutation();
  const {hasPermission} = useAuth()



  const handleDelete = async () => {
    try{
       await deleteUser(id).unwrap();
        showToast("success" , "تم حذف الموظف بنجاح")
    }catch(err){
        showToast("error" , err.data.message)
    }
    setOpen(false);
  };

  const handleViewDetails = (e) => {
    e.preventDefault();
    navigate(`/dashboard/users/${id}`);
  };

  const formattedRoles =
    roles?.map((role) => role.name).join(", ") || "No roles";

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
                {full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">
                {full_name}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground truncate">
                @{username}
              </CardDescription>
            </div>
          </div>

          <CardContent className="flex-1 p-0 pt-4 space-y-3">
            <div className="flex items-start gap-2">
              <Icon
                icon="mdi:email"
                className="mt-0.5 text-blue-500 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-foreground truncate">
                  {email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Icon
                icon="mdi:phone"
                className="mt-0.5 text-green-500 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-foreground truncate">
                  {phone_number}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Icon
                icon="mdi:account-group"
                className="mt-0.5 text-purple-500 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Roles:{" "}
                  <Badge variant="outline" className="ml-1">
                    {formattedRoles}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>

          <div
            style={{ flexDirection: "column" }}
            className="flex justify-between pt-3 text-xs text-muted-foreground"
          >
            <p>Joined: {new Date(created_at).toLocaleDateString()}</p>
            <p>Last update: {new Date(updated_at).toLocaleDateString()}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              {
                hasPermission(Permissions.ViewUsers) && (
                    <Button
                variant="default"
                className="w-full gap-2 cursor-pointer"
                onClick={handleViewDetails}
              >
                <Icon icon="mdi:eye-outline" className="text-lg" />
                التفاصيل
              </Button>
                )
              }
            
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              {
                hasPermission(Permissions.DeleteUsers) && (
                  <Button
                variant="destructive"
                className="w-full gap-2 cursor-pointer "
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(true);
                }}
              > 
                <Icon icon="mdi:trash-can-outline" className="text-lg" />
                حذف
              </Button>
                )
              }
              
            </motion.div>
          </div>
        </Card>
        <DeleteDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={handleDelete}
          loading={isLoading}
        />
      </motion.div>
    </div>
  );
};

export default UserCard;
