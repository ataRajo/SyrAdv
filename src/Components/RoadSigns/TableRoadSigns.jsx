import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useDeleteRoadSignMutation } from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import HeaderComponent from "../../utils/HeaderComponent";
import { DialogAddRoadSign } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddRoadSign";
import { DialogEditRoadSign } from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditRoadSign";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { RoadSignColumns } from "../../utils/Tables/ColumnsTable/RoadSignColumns";
import { RoadSignFields } from "../../utils/Dialogs/Data/Show/RoadSignFieldsShow";
import DialogShow from "../../utils/Dialogs/DialogShow/DialogShow";
import useGetRoadSignsByFilter from "../../hooks/useGetRoadSignsByFilter";
import RoadSignsPdf from "./RoadSignsPdf";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useParams } from "react-router";
import { Permissions } from "../../Static/StaticData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMoveBookingMutation } from "../../RtkQuery/Slice/Booking/BookingApi";
import CustomerSearchSelect from "../Common/CustomerSearchSelect";
import { Search, ChevronDown, Loader2, X, Calendar, CalendarOff, ArrowRightLeft } from "lucide-react";

// ---- small debounce hook (kept local, no external deps) ----
function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const TableRoadSigns = ({ isLoading }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [open, setOpen] = useState(false);
  const [openShow, setOpenShow] = useState(false);
  const [openExchange, setOpenExchange] = useState(false);
  const [selectedRoadSign, setSelectedRoadSign] = useState(null);
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("all");
  const [customerPage, setCustomerPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [directionSearch, setDirectionSearch] = useState("");
  const [showDirectionDropdown, setShowDirectionDropdown] = useState(false);

  const [deleteRoadSign, { isLoading: isDeleting }] = useDeleteRoadSignMutation();
  const [moveBooking, { isLoading: isMoving }] = useMoveBookingMutation();

  // debounce the text that actually drives the network request,
  // so typing stays instant and we don't fire a request per keystroke
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 350);

  // فلتر العميل عبر CustomerSearchSelect (بحث من الخادم + تمرير لا نهائي) -
  // نحتفظ فقط بالزبون المختار لعرض اسمه.
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
  const isCustomersLoading = false;

  const {
    cityId,
    regionId,
    roadSigns,
    isRoadSignsFetching,
    isError,
    cities,
    isCitiesLoading,
    regions,
    isRegionsLoading,
    setModel,
    handleCityChange,
    handleRegionChange,
    direction,
    setDirection,
    customerId,
    setCustomerId,
  } = useGetRoadSignsByFilter();

  const filteredRegions = useMemo(() => {
    if (!regions) return [];
    if (!regionSearch.trim()) return regions;

    const searchTerm = regionSearch.toLowerCase();
    return regions.filter((region) => region.name.toLowerCase().includes(searchTerm));
  }, [regions, regionSearch]);

  useEffect(() => {
    setModel(id);
  }, [id]);

  const isRegionSelectionInternal = useRef(false);

  // reset direction when region changes
  useEffect(() => {
    setDirection("");
    setDirectionSearch("");
    setShowDirectionDropdown(false);
  }, [regionId, setDirection]);

  // ---- single pass: region-filtered road signs ----
  // reused for direction extraction, booked/unbooked counts, and the final table data
  const regionFilteredRoadSigns = useMemo(() => {
    if (!roadSigns || !Array.isArray(roadSigns)) return [];
    if (!regionId) return roadSigns;
    return roadSigns.filter((rs) => String(rs.region_id) === String(regionId));
  }, [roadSigns, regionId]);

  const realDirectionsInRegion = useMemo(() => {
    if (regionFilteredRoadSigns.length === 0) return [];

    const directionMap = new Map();
    for (const rs of regionFilteredRoadSigns) {
      const val = rs.directions;
      if (val && typeof val === "string" && val.trim() !== "") {
        const trimmed = val.trim();
        if (!directionMap.has(trimmed)) {
          directionMap.set(trimmed, { value: trimmed, label: trimmed });
        }
      }
    }
    return Array.from(directionMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [regionFilteredRoadSigns]);

  const allRealDirections = useMemo(() => {
    if (!regionId) {
      return [{ value: "", label: "اختر منطقة أولاً", type: "placeholder" }];
    }

    if (isRoadSignsFetching) {
      return [{ value: "", label: "جاري تحميل اللوحات والاتجاهات...", type: "loading" }];
    }

    if (regionFilteredRoadSigns.length === 0) {
      return [{ value: "", label: "لا توجد لوحات في هذه المنطقة", type: "empty" }];
    }

    if (realDirectionsInRegion.length === 0) {
      return [{ value: "", label: "لا توجد اتجاهات محددة في هذه المنطقة", type: "no-directions" }];
    }

    return [
      { value: "", label: "كل الاتجاهات", type: "all" },
      ...realDirectionsInRegion.map((dir) => ({ ...dir, type: "real" })),
    ];
  }, [regionId, isRoadSignsFetching, regionFilteredRoadSigns, realDirectionsInRegion]);

  const filteredDirections = useMemo(() => {
    if (!directionSearch.trim()) return allRealDirections;

    const searchTerm = directionSearch.toLowerCase();
    return allRealDirections.filter(
      (option) =>
        option.label.toLowerCase().includes(searchTerm) ||
        option.value.toLowerCase().includes(searchTerm)
    );
  }, [directionSearch, allRealDirections]);

  // ---- customers: no setState inside useMemo anymore ----
  const allCustomers = useMemo(
    () => [
      { id: "", full_name: "جميع العملاء", company_name: "" },
      ...(selectedCustomerObj ? [selectedCustomerObj] : []),
    ],
    [selectedCustomerObj]
  );

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return allCustomers;

    const searchTerm = customerSearch.toLowerCase();
    return allCustomers.filter((customer) => {
      const fullName = customer.full_name?.toLowerCase() || "";
      const companyName = customer.company_name?.toLowerCase() || "";
      const userName = customer.username?.toLowerCase() || "";
      const name = customer.name?.toLowerCase() || "";

      return (
        fullName.includes(searchTerm) ||
        companyName.includes(searchTerm) ||
        userName.includes(searchTerm) ||
        name.includes(searchTerm) ||
        customer.id.toString().includes(searchTerm)
      );
    });
  }, [customerSearch, allCustomers]);

  // ---- single pass filtering: region -> direction -> customer ----
  const baseFilteredRoadSigns = useMemo(() => {
    let result = regionFilteredRoadSigns;

    if (direction && direction.trim() !== "") {
      const d = direction.trim();
      result = result.filter((rs) => rs.directions && rs.directions.toString().trim() === d);
    }

    if (customerId && customerId !== "") {
      result = result.filter(
        (rs) =>
          Array.isArray(rs.bookings) &&
          rs.bookings.some((b) => String(b.customer_id) === String(customerId))
      );
    }

    return result;
  }, [regionFilteredRoadSigns, direction, customerId]);

  const filteredRoadSigns = useMemo(() => {
    if (activeTab === "booked") return baseFilteredRoadSigns.filter((rs) => rs.is_booked === true);
    if (activeTab === "unbooked") return baseFilteredRoadSigns.filter((rs) => rs.is_booked === false);
    return baseFilteredRoadSigns;
  }, [baseFilteredRoadSigns, activeTab]);

  const { bookedCount, unbookedCount } = useMemo(() => {
    let booked = 0;
    let unbooked = 0;
    for (const rs of baseFilteredRoadSigns) {
      if (rs.is_booked === true) booked++;
      else if (rs.is_booked === false) unbooked++;
    }
    return { bookedCount: booked, unbookedCount: unbooked };
  }, [baseFilteredRoadSigns]);

  // ---- event handlers ----
  const handleEdit = useCallback((roadSign) => {
    setSelectedRoadSign(roadSign);
    setOpenEdit(true);
  }, []);

  const handleDelete = useCallback((roadSign) => {
    setSelectedRoadSign(roadSign);
    setOpenDelete(true);
  }, []);

  const handleShow = useCallback((roadSign) => {
    setSelectedRoadSign(roadSign);
    setOpenShow(true);
  }, []);

  const handleRoadSignAction = useCallback((roadSign) => {
    console.log("Road Sign action triggered:", roadSign);
  }, []);

  const handleExchange = useCallback((roadSign) => {
    setSelectedRoadSign(roadSign);
    setOpenExchange(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (selectedRoadSign) {
      try {
        await deleteRoadSign(selectedRoadSign.id).unwrap();
        setOpenDelete(false);
        setSelectedRoadSign(null);
      } catch (error) {
        console.error("Failed to delete road sign:", error);
      }
    }
  };

  const handleDirectionSelect = useCallback(
    (value) => {
      setDirection(value);
      setDirectionSearch(value || "");
      setShowDirectionDropdown(false);
    },
    [setDirection]
  );

  const handleCustomerSelect = useCallback(
    (value) => {
      setCustomerId(value);

      const selectedCustomer = allCustomers.find((c) => c.id == value);
      if (selectedCustomer) {
        const displayName =
          selectedCustomer.full_name ||
          selectedCustomer.name ||
          selectedCustomer.username ||
          `العميل #${selectedCustomer.id}`;
        setCustomerSearch(displayName);
      } else {
        setCustomerSearch("جميع العملاء");
      }

      setShowCustomerDropdown(false);
    },
    [setCustomerId, allCustomers]
  );

  const handleClearRegion = useCallback(() => {
    isRegionSelectionInternal.current = true;
    setRegionSearch("");
    handleRegionChange({ target: { value: "" } });
    setTimeout(() => {
      isRegionSelectionInternal.current = false;
    }, 100);
  }, [handleRegionChange]);

  const handleResetFilters = useCallback(() => {
    handleCityChange({ target: { value: "" } });
    handleRegionChange({ target: { value: "" } });
    setCustomerId("");
    setDirection("");
    setDirectionSearch("");
    setCustomerSearch("");
    setRegionSearch("");
    setCustomerPage(1);
    setShowDirectionDropdown(false);
    setShowCustomerDropdown(false);
    setShowRegionDropdown(false);
    setActiveTab("all");
  }, [handleCityChange, handleRegionChange, setCustomerId, setDirection]);

  useEffect(() => {
    if (!isRegionSelectionInternal.current) {
      if (regionId && regions) {
        const selectedRegion = regions.find((r) => String(r.id) === String(regionId));
        if (selectedRegion) {
          setRegionSearch(selectedRegion.name);
        }
      } else if (!regionId) {
        setRegionSearch("");
      }
    }
  }, [regionId, regions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".direction-dropdown-container")) {
        setShowDirectionDropdown(false);
      }
      if (!event.target.closest(".customer-dropdown-container")) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const permissions = useMemo(
    () => ({
      delete: Permissions.DeleteRoadSigns,
      show: Permissions.ViewRegions,
      edit: Permissions.EditRoadSigns,
      exchange: Permissions.EditRoadSigns,
    }),
    []
  );

  const getSelectedCustomerName = useCallback(() => {
    if (!customerId || customerId === "") return "جميع العملاء";

    const selectedCustomer = allCustomers.find((c) => c.id == customerId);
    if (!selectedCustomer) return `العميل #${customerId}`;

    return (
      selectedCustomer.full_name ||
      selectedCustomer.name ||
      selectedCustomer.username ||
      `العميل #${customerId}`
    );
  }, [customerId, allCustomers]);

  const getSelectedRegionName = useCallback(() => {
    if (!regionId) return "";
    const region = regions?.find((r) => r.id == regionId);
    return region?.name || "";
  }, [regionId, regions]);

  return (
    <div dir="rtl" className="p-4 sm:p-6 w-full mx-auto space-y-6 overflow-x-auto">
      {isError && <div className="text-center p-4 text-red-500">حدث خطأ أثناء جلب البيانات</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div>
          <Label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            المدينة
          </Label>
          <select
            id="city"
            value={cityId || ""}
            onChange={handleCityChange}
            disabled={isCitiesLoading}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">اختر مدينة</option>
            {isCitiesLoading && <option>جاري تحميل المدن ...</option>}
            {cities?.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            المنطقة
          </Label>

          <div className="relative">
            <Input
              type="text"
              value={regionSearch || (regionId ? getSelectedRegionName() : "")}
              onChange={(e) => {
                setRegionSearch(e.target.value);
                setShowRegionDropdown(true);
              }}
              onFocus={() => {
                if (cityId) {
                  setShowRegionDropdown(true);
                } else {
                  alert("⚠️ الرجاء اختيار مدينة أولاً");
                }
              }}
              placeholder={cityId ? "ابحث عن منطقة..." : "اختر مدينة أولاً"}
              className={`w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                !cityId ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : ""
              }`}
              disabled={!cityId || isRegionsLoading}
            />

            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {isRegionsLoading ? (
                <span className="text-gray-400 animate-pulse">...</span>
              ) : (
                <ChevronDown
                  className={`w-4 h-4 ${
                    cityId ? "text-gray-400 cursor-pointer" : "text-gray-300 cursor-not-allowed"
                  }`}
                  onClick={() => cityId && setShowRegionDropdown(!showRegionDropdown)}
                />
              )}
            </div>

            {regionSearch && cityId && (
              <button
                type="button"
                onClick={handleClearRegion}
                className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showRegionDropdown && cityId && filteredRegions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredRegions.map((region) => (
                <div
                  key={region.id}
                  className={`px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm ${
                    regionId == region.id ? "bg-blue-50 dark:bg-blue-900/30" : ""
                  }`}
                  onClick={() => {
                    isRegionSelectionInternal.current = true;
                    handleRegionChange({ target: { value: String(region.id) } });
                    setRegionSearch(region.name);
                    setShowRegionDropdown(false);
                    setTimeout(() => {
                      isRegionSelectionInternal.current = false;
                    }, 100);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span>{region.name}</span>
                    {regionId == region.id && <span className="text-blue-500">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="customer-dropdown-container relative">
          <Label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
            العميل
          </Label>

          <CustomerSearchSelect
            value={customerId || ""}
            onChange={(id, customer) => {
              setSelectedCustomerObj(customer || null);
              setCustomerId(id || "");
            }}
            selectedCustomer={selectedCustomerObj}
            allowAll
            allValue=""
            allLabel="جميع العملاء"
          />
        </div>

        <div className="direction-dropdown-container relative">
          <Label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-1">
            الاتجاه
          </Label>

          <div className="relative">
            <div className="relative">
              <Input
                type="text"
                value={directionSearch}
                onChange={(e) => {
                  setDirectionSearch(e.target.value);
                  if (!showDirectionDropdown) setShowDirectionDropdown(true);
                }}
                onFocus={() => {
                  if (regionId) {
                    setShowDirectionDropdown(true);
                  } else {
                    alert("⚠️ الرجاء اختيار منطقة أولاً لعرض الاتجاهات");
                  }
                }}
                placeholder={regionId ? "ابحث في اتجاهات المنطقة..." : "اختر منطقة أولاً"}
                className={`w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                  !regionId ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : ""
                }`}
                disabled={!regionId || isRoadSignsFetching}
              />

              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {isRoadSignsFetching ? (
                  <span className="text-gray-400 animate-pulse">...</span>
                ) : (
                  <ChevronDown
                    className={`w-4 h-4 ${
                      regionId ? "text-gray-400 cursor-pointer" : "text-gray-300 cursor-not-allowed"
                    }`}
                    onClick={() => regionId && setShowDirectionDropdown(!showDirectionDropdown)}
                  />
                )}
              </div>

              {directionSearch && regionId && (
                <button
                  type="button"
                  onClick={() => {
                    setDirectionSearch("");
                    setDirection("");
                  }}
                  className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {showDirectionDropdown && regionId && filteredDirections.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredDirections.map((option, index) => (
                  <div
                    key={index}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      direction === option.value ? "bg-blue-50 dark:bg-blue-900/30" : ""
                    } ${
                      option.value === "" ? "border-b border-gray-200 dark:border-gray-700 font-semibold" : ""
                    }`}
                    onClick={() => {
                      if (option.type === "real" || option.type === "all") {
                        handleDirectionSelect(option.value);
                      } else if (option.type === "placeholder") {
                        alert("⚠️ اختر منطقة أولاً");
                      }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className={option.value === "" ? "font-semibold" : ""}>{option.label}</span>
                      {direction === option.value && <span className="text-blue-500">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="w-full mb-5 border-gray-300 hover:bg-gray-100 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            مسح الفلاتر
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              جميع اللوحات
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">
                {filteredRoadSigns.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="booked" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              محجوزة
              <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                {bookedCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="unbooked" className="flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-blue-600" />
              غير محجوزة
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                {unbookedCount}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {(direction || customerId || regionId || activeTab !== "all") && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">فلاتر نشطة:</span>

            {activeTab !== "all" && (
              <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-800 px-3 py-1.5 rounded">
                <span className="text-sm text-purple-700 dark:text-purple-400">
                  {activeTab === "booked" ? "محجوزة فقط" : "غير محجوزة فقط"}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className="text-purple-500 hover:text-purple-700 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {direction && (
              <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-800 px-3 py-1.5 rounded">
                <span className="text-sm text-blue-700 dark:text-blue-400">الاتجاه: {direction}</span>
                <button
                  type="button"
                  onClick={() => {
                    setDirection("");
                    setDirectionSearch("");
                  }}
                  className="text-blue-500 hover:text-blue-700 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {customerId && customerId !== "" && (
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-800 px-3 py-1.5 rounded">
                <span className="text-sm text-green-700 dark:text-green-400">
                  العميل: {getSelectedCustomerName()}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerId("");
                    setCustomerSearch("");
                  }}
                  className="text-green-500 hover:text-green-700 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {regionId && (
              <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-800 px-3 py-1.5 rounded">
                <span className="text-sm text-orange-700 dark:text-orange-400">
                  المنطقة: {getSelectedRegionName()}
                </span>
                <button
                  type="button"
                  onClick={handleClearRegion}
                  className="text-orange-500 hover:text-orange-700 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <HeaderComponent
        title={"اللوحات الطرقية"}
        titleBtn={"إضافة لوحة"}
        setShow={setOpen}
        permission={Permissions.CreateRoadSigns}
      />

      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">عدد اللوحات المصفاة:</span> {filteredRoadSigns?.length || 0}
            <span className="mr-4 ml-4">
              <span className="font-medium"> | المحجوزة:</span>
              <span className="text-green-600 dark:text-green-400 mx-1">{bookedCount}</span>
            </span>
            <span className="mr-4">
              <span className="font-medium"> | غير المحجوزة:</span>
              <span className="text-blue-600 dark:text-blue-400 mx-1">{unbookedCount}</span>
            </span>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            إجمالي اللوحات: {roadSigns?.length || 0}
          </div>
        </div>
      </div>

      <DynamicTable
        data={filteredRoadSigns}
        columns={RoadSignColumns}
        isLoading={isRoadSignsFetching}
        onEdit={handleEdit}
        onRoadSignAction={handleRoadSignAction}
        onDelete={handleDelete}
        onShow={handleShow}
        onExchange={handleExchange}
        permissions={permissions}
        hideDeleteIcon={false}
      />

      <ExchangeDialog
        open={openExchange}
        onClose={() => setOpenExchange(false)}
        roadSign={selectedRoadSign}
        onMoveBooking={moveBooking}
        roadSigns={roadSigns}
        isMoving={isMoving}
      />

      <DialogEditRoadSign show={openEdit} handleClose={() => setOpenEdit(false)} initData={selectedRoadSign} />

      <DialogAddRoadSign show={open} handleClose={() => setOpen(false)} />

      <DeleteDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />

      <DialogShow
        show={openShow}
        handleClose={() => {
          setOpenShow(false);
          setSelectedRoadSign(null);
        }}
        data={selectedRoadSign}
        fields={RoadSignFields}
        loading={isLoading}
      />
    </div>
  );
};

const ExchangeDialog = ({ open, onClose, roadSign, roadSigns, onMoveBooking, isMoving }) => {
  const [selectedTargetSign, setSelectedTargetSign] = useState("");
  const [availableTargetSigns, setAvailableTargetSigns] = useState([]);

  const hasActiveBookings = useMemo(() => {
    return roadSign?.bookings && roadSign.bookings.some((booking) => booking.status === 1);
  }, [roadSign]);

  const firstActiveBooking = useMemo(() => {
    return roadSign?.bookings?.find((booking) => booking.status === 1);
  }, [roadSign]);

  useEffect(() => {
    if (open && roadSign && roadSigns) {
      const compatibleSigns = roadSigns.filter((sign) => {
        if (sign.id === roadSign.id) return false;

        const hasBookings =
          sign.bookings && Array.isArray(sign.bookings) && sign.bookings.some((b) => b.status === 1);

        const hasPivotBookings = sign.pivot && sign.pivot.booking_faces && sign.pivot.booking_faces > 0;

        if (hasBookings || hasPivotBookings) {
          return false;
        }

        return true;
      });

      setAvailableTargetSigns(compatibleSigns);
      setSelectedTargetSign("");
    }
  }, [open, roadSign, roadSigns]);

  const handleExchange = async () => {
    if (!selectedTargetSign || !firstActiveBooking) {
      alert("يرجى اختيار لوحة جديدة للتبديل");
      return;
    }

    try {
      await onMoveBooking({
        booking_id: firstActiveBooking.id,
        old_roadsign_id: roadSign.id,
        new_roadsign_id: selectedTargetSign,
      }).unwrap();

      alert("تم تبديل الموقع بنجاح!");
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Exchange failed:", error);
      alert("فشل تبديل الموقع: " + (error.data?.message || "حدث خطأ"));
    }
  };

  if (!roadSign) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            تبديل موقع اللوحة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">معلومات اللوحة الحالية</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoField label="اسم اللوحة" value={roadSign.name || `اللوحة #${roadSign.id}`} />
              <InfoField label="كود اللوحة" value={roadSign.roadsign_code || "غير محدد"} />
              <InfoField label="المدينة" value={roadSign.city?.name || "غير محدد"} />
              <InfoField label="المنطقة" value={roadSign.region?.name || "غير محدد"} />
              <InfoField label="القالب" value={roadSign.template?.model || "غير محدد"} />
              <InfoField
                label="الأبعاد"
                value={roadSign.width && roadSign.height ? `${roadSign.width} × ${roadSign.height}` : "غير محدد"}
              />
              <InfoField
                label="الاتجاه"
                value={roadSign.directions || roadSign.direction || roadSign.direction_code || "غير محدد"}
              />
              <InfoField
                label="الحجوزات النشطة"
                value={
                  <span className={`font-semibold ${hasActiveBookings ? "text-green-600" : "text-red-600"}`}>
                    {roadSign.bookings?.filter((b) => b.status === 1).length || 0}
                  </span>
                }
              />
            </div>
          </div>

          {!hasActiveBookings ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold">
                    هذه اللوحة غير مؤهلة للتبديل
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    اللوحة يجب أن تحتوي على حجوزات نشطة
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm text-green-800 dark:text-green-300 font-semibold">اللوحة مؤهلة للتبديل</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    يوجد {roadSign.bookings.filter((b) => b.status === 1).length} حجز نشط
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasActiveBookings && availableTargetSigns.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                اختر اللوحة البديلة:
              </label>
              <select
                value={selectedTargetSign}
                onChange={(e) => setSelectedTargetSign(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- اختر لوحة بديلة --</option>
                {availableTargetSigns.map((sign) => (
                  <option key={sign.id} value={sign.id}>
                    كود: {sign.roadsign_code || `RS-${sign.id}`} | المدينة: {sign.city?.name || "غير محدد"} | المنطقة:{" "}
                    {sign.region?.name || "غير محدد"} | القالب: {sign.template?.model || "غير محدد"} | الأبعاد:{" "}
                    {sign.width && sign.height ? `${sign.width} × ${sign.height}` : "غير محدد"} | الاتجاه:{" "}
                    {sign.directions || sign.direction || sign.direction_code || "غير محدد"}
                  </option>
                ))}
              </select>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                متاح {availableTargetSigns.length} لوحة غير محجوزة
              </div>

              {selectedTargetSign && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    <span className="font-semibold">اللوحة المختارة:</span>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                      {(() => {
                        const selected = availableTargetSigns.find((s) => s.id == selectedTargetSign);
                        if (!selected) return null;

                        return (
                          <>
                            <div>الكود: {selected.roadsign_code || `RS-${selected.id}`}</div>
                            <div>المدينة: {selected.city?.name || "غير محدد"}</div>
                            <div>المنطقة: {selected.region?.name || "غير محدد"}</div>
                            <div>القالب: {selected.template?.model || "غير محدد"}</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasActiveBookings && availableTargetSigns.length === 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">⚠️ لا توجد لوحات غير محجوزة متاحة للتبديل</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isMoving} className="flex-1">
            إلغاء
          </Button>
          <Button
            onClick={handleExchange}
            disabled={!hasActiveBookings || !selectedTargetSign || isMoving || availableTargetSigns.length === 0}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {isMoving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⟳</span>
                جاري التبديل...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                تبديل اللوحة
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InfoField = ({ label, value }) => (
  <div>
    <span className="font-medium text-gray-600 dark:text-gray-400">{label}:</span>
    <span className="text-gray-800 dark:text-white mr-2">{value}</span>
  </div>
);

export default TableRoadSigns;