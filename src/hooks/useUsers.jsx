import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useDeleteUserMutation, useGetActivitiesQuery, useGetUsersQuery, useShowOneUsersQuery } from '../RtkQuery/Slice/Users/UsersApi';
import { useAuth } from '../Context/AuthProvider';
import { showToast } from '../utils/Notifictions/showToast';

const useUsers = () => {
  const { id } = useParams();
  const { data: user, isFetching } = useShowOneUsersQuery(id);
  const { data: activities, isFetching: isFetchingActivities } =
    useGetActivitiesQuery(id);
  const [open, setOpen] = useState(false);
  const [openActivities, setOpenActivities] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const navigate = useNavigate();
  const [deleteUser, { isLoading }] = useDeleteUserMutation();
  const { data: users,  isSuccess , isFetching:isFetchingUsers } = useGetUsersQuery();
  
  const { hasPermission } = useAuth();

  // Handles user deletion
  const handleDelete = useCallback(async () => {
    try {
      await deleteUser(id).unwrap();
      navigate("/dashboard/users");
    } catch (error) {
      console.error("Failed to delete user:", error);
      showToast("error" , error.data.message)
    } finally {
      setOpenDel(false);
    }
  }, [deleteUser, id, navigate]); 

  return {
    id,
    user,
    isFetching,
    activities,
    isFetchingActivities,
    open,
    setOpen,
    openActivities,
    setOpenActivities,
    openDel,
    setOpenDel,
    navigate,
    deleteUser,
    isLoading,
    hasPermission,
    handleDelete,
    users ,
    isSuccess ,
    isFetchingUsers
  };
};

export default useUsers;