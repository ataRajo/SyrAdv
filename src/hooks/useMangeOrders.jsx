import React, { useEffect, useState } from "react";
import {
  useGetActiveRegionsByCityMutation,
  useGetCitiesQuery,
} from "../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";
import { showToast } from "../utils/Notifictions/showToast";
import {
  useConfirmOneOrderMutation,
  useGetOrdersQuery,
} from "../RtkQuery/Slice/Orders/OrdersApi";
import { Permissions } from "../Static/StaticData";

const useMangeOrders = () => {
  const [activeTab, setActiveTab] = useState("orders");

  const [orderType, setOrderType] = useState("");
  const [cityId, setCityId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [actionDate, setActionDate] = useState("");
  const [regions, setRegions] = useState([]);

  const { data: cities, isLoading: isCitiesLoading } = useGetCitiesQuery();
  const [getActiveRegionsByCity] = useGetActiveRegionsByCityMutation();

  const queryParams = {
    ...(orderType === "both" && { type: [3] }),
    ...(orderType === "release" && { type: [1] }),
    ...(orderType === "installation" && { type: [2] }),
    ...(cityId && { city_id: cityId }),
    ...(regionId && { region_id: regionId }),
    ...(actionDate && { action_date: actionDate }),
    ...{ status: false },
  };

  const { data, isLoading, isFetching } = useGetOrdersQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const {
    data: history,
    isLoading: isLoadingHistory,
    isFetching: isFetchingHistory,
  } = useGetOrdersQuery(
    {
      status: true,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const [confirmOrder, { isLoading: iLoadingConfirm }] =
    useConfirmOneOrderMutation();

  const [openShow, setOpenShow] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isConfirmAction, setIsConfirmAction] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch regions when city changes
  useEffect(() => {
    const fetchRegions = async () => {
      if (cityId) {
        try {
          const response = await getActiveRegionsByCity(cityId).unwrap();
          setRegions(response || []);
          setRegionId(""); // Reset region when city changes
        } catch (error) {
          showToast("error", error.data.message);
        }
      } else {
        setRegions([]);
        setRegionId("");
      }
    };
    fetchRegions();
  }, [cityId, getActiveRegionsByCity]);

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setOpenEdit(true);
  };

  const handleShow = (order) => {
    setSelectedOrder(order);
    setOpenShow(true);
  };

  const handleConfirmOrUnconfirm = async () => {
    try {
      const status = isConfirmAction ? 1 : 0;
      await confirmOrder({ status, id: selectedOrder.id }).unwrap();
      showToast(
        "success",
        isConfirmAction ? "تم تأكيد الطلب بنجاح" : "تم إلغاء تأكيد الطلب بنجاح"
      );
    } catch (err) {
      showToast(
        "error",
        `حدث خطأ أثناء ${isConfirmAction ? "تأكيد" : "إلغاء تأكيد"} الطلب: ${
          err.data?.message || "خطأ غير معروف"
        }`
      );
    }
    setOpenConfirm(false);
  };

  const onConfirmOrder = (row) => {
    setSelectedOrder(row);
    setIsConfirmAction(true);
    setOpenConfirm(true);
  };

  const onUnconfirmOrder = (row) => {
    setSelectedOrder(row);
    setIsConfirmAction(false);
    setOpenConfirm(true);
  };

  const permission = {
    edit: Permissions.EditOrders,
    confirm: Permissions.EditOrders,
    unConfirm: Permissions.EditOrders,
  };

  return {
    activeTab,
    setActiveTab,
    orderType,
    setOrderType,
    cityId,
    setCityId,
    regionId,
    setRegionId,
    actionDate,
    setActionDate,
    regions,
    setRegions,
    cities,
    isCitiesLoading,
    getActiveRegionsByCity,
    data,
    isLoading,
    isFetching,
    history,
    isLoadingHistory,
    isFetchingHistory,
    confirmOrder,
    iLoadingConfirm,
    openShow,
    setOpenShow,
    openConfirm,
    setOpenConfirm,
    openEdit,
    setOpenEdit,
    isConfirmAction,
    setIsConfirmAction,
    selectedOrder,
    setSelectedOrder,
    handleEdit,
    handleShow,
    handleConfirmOrUnconfirm,
    onConfirmOrder,
    onUnconfirmOrder,
    permission,
  };
};

export default useMangeOrders;
