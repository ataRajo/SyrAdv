import React, { useState } from 'react'
import { DynamicTable } from '../../utils/Tables/DynamicTable'
import HeaderComponent from '../../utils/HeaderComponent'
import { BrokersCustomerColumns } from '../../utils/Tables/ColumnsTable/BrokersColumns'
import { useGetBrokersActivitiesQuery } from '../../RtkQuery/Slice/Brokers/BrokersApi'
import { useGetRoadSignByIdQuery } from '../../RtkQuery/Slice/RoadSings/RoadSingsApi'
import { useNavigate, useParams } from 'react-router'
import { BookingColumns } from '../../utils/Tables/ColumnsTable/BookingColumns'
import { Permissions } from '../../Static/StaticData'
import { Loader } from 'lucide-react'
import { PaymentsColumns } from '../../utils/Tables/ColumnsTable/PaymentsColumns'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, Calendar, User, X, MapPin, Ruler, Eye } from "lucide-react"

const BrokerInfo = () => {
    const { id } = useParams()
    const { data: brokersActivitiesQuery, isFetching, isLoading } = useGetBrokersActivitiesQuery(id);
    const navigate = useNavigate()

    // Modal state
    const [selectedRoadSignId, setSelectedRoadSignId] = useState(null);
    const { data: roadSignData, isLoading: isRoadSignLoading } = useGetRoadSignByIdQuery(selectedRoadSignId, {
        skip: !selectedRoadSignId,
    });

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleDateString("ar-SY", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleTimeString("ar-SY", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const calculateAmounts = brokersActivitiesQuery?.data?.calculate_booking_amount || [];

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col justify-center items-center">
                <Loader />
                <p>جاري التحميل ...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 relative">
                   {/* Road Sign Modal */}
            {selectedRoadSignId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-500" />
                                لوحة #{selectedRoadSignId}
                            </h2>
                            <button
                                onClick={() => setSelectedRoadSignId(null)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            {isRoadSignLoading ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                                    <p className="text-gray-500 dark:text-gray-400">جاري تحميل بيانات اللوحة...</p>
                                </div>
                            ) : (
                                <div>
                                  

                                    {roadSignData ? (
                                        <div className="space-y-4">
                                            {/* Try different data paths */}
                                            {(() => {
                                                const sign = roadSignData.data || roadSignData;
                                                return (
                                                    <div className="space-y-4">
                                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                            {sign.roadsign_code || `لوحة #${sign.id}`}
                                                        </h3>
                                                        
                                                        {sign.image && (
                                                            <img 
                                                                src={sign.image} 
                                                                alt={sign.roadsign_code}
                                                                className="w-full h-48 object-cover rounded-xl"
                                                            />
                                                        )}

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                                                <p className="text-gray-500 text-xs">المدينة</p>
                                                                <p className="text-gray-900 dark:text-white font-medium">{sign.city?.name || "—"}</p>
                                                            </div>
                                                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                                                <p className="text-gray-500 text-xs">المنطقة</p>
                                                                <p className="text-gray-900 dark:text-white font-medium">{sign.region?.name || "—"}</p>
                                                            </div>
                                                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 md:col-span-2">
                                                                <p className="text-gray-500 text-xs">المكان</p>
                                                                <p className="text-gray-900 dark:text-white font-medium">{sign.place || "—"}</p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                                                <p className="text-blue-600 text-xs">اللوحات</p>
                                                                <p className="text-gray-900 dark:text-white font-bold">{sign.panels_number}</p>
                                                            </div>
                                                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                                                <p className="text-blue-600 text-xs">الوجوه</p>
                                                                <p className="text-gray-900 dark:text-white font-bold">{sign.faces_number}</p>
                                                            </div>
                                                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                                                <p className="text-blue-600 text-xs">النموذج</p>
                                                                <p className="text-gray-900 dark:text-white font-bold">{sign.template?.model || "—"}</p>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => {
                                                                setSelectedRoadSignId(null);
                                                                navigate(`/dashboard/road_signs/${selectedRoadSignId}`);
                                                            }}
                                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium"
                                                        >
                                                            عرض الصفحة الكاملة
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500">لا توجد بيانات</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}



            <HeaderComponent title={"الزبائن "} />
            <DynamicTable
                data={brokersActivitiesQuery?.data?.customers || []}
                columns={BrokersCustomerColumns}
                isLoading={isFetching}
                onShow={(row) => navigate(`/dashboard/customers/${row.id}`)}
                permissions={{ show: Permissions.ViewBookings }}
            />

            <HeaderComponent title={"المدفوعات "} />
            <DynamicTable
                data={brokersActivitiesQuery?.data?.payments || []}
                columns={PaymentsColumns}
            />

            <HeaderComponent title={"الحجوزات "} />
            <DynamicTable
                data={brokersActivitiesQuery?.data?.bookings || []}
                columns={BookingColumns}
                isLoading={isFetching}
                onShow={(row) => navigate(`/dashboard/booking/${row.id}`)}
                permissions={{ show: Permissions.ViewBookings }}
            />

            {/* Calculate Amount History Section */}
            <HeaderComponent title={"سجل عمليات حساب السعر"} />
            
            {calculateAmounts.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 dark:bg-gray-800/50 dark:border-gray-700">
                    <CardContent className="p-8 text-center">
                        <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-2">لا توجد عمليات حساب</h3>
                        <p className="text-gray-500 dark:text-gray-400">لم يقم هذا الوسيط بأي عملية حساب سعر بعد</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {calculateAmounts.map((item, index) => (
                        <Card
                            key={item.id}
                            className="bg-white/10 backdrop-blur-lg border-white/20 dark:bg-gray-800/50 dark:border-gray-700 hover:bg-white/15 dark:hover:bg-gray-800/70 transition-all duration-300"
                        >
                            <CardHeader className="pb-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-blue-600 text-white">
                                            عملية #{index + 1}
                                        </Badge>
                                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                            ID: {item.id}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                        <Calendar className="h-4 w-4" />
                                        <span>{formatDate(item.created_at)}</span>
                                        <span>الساعة {formatTime(item.created_at)}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Activity Type */}
                                    <div className="bg-gray-100/50 dark:bg-white/5 rounded-lg p-3">
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">نوع النشاط</p>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {item.activity_type === "calculate_booking_amount"
                                                ? "حساب سعر الحجز"
                                                : item.activity_type}
                                        </p>
                                    </div>

                                    {/* Product Type */}
                                    <div className="bg-gray-100/50 dark:bg-white/5 rounded-lg p-3">
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">نوع المنتج</p>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {item.activity_data?.product_type === 1
                                                ? "محلي"
                                                : item.activity_data?.product_type === 2
                                                ? "اجنبي"
                                                : item.activity_data?.product_type === 3
                                                ? "محلي اجنبي"
                                                : "—"}
                                        </p>
                                    </div>

                                    {/* Roadsigns - with clickable IDs */}
                                    <div className="bg-gray-100/50 dark:bg-white/5 rounded-lg p-3 md:col-span-2">
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">اللوحات المختارة</p>
                                        <div className="space-y-2">
                                            {item.activity_data?.roadsigns?.map((sign, idx) => (
                                                <div
                                                    key={idx}
                                                    className="border-b border-gray-200 dark:border-white/10 last:border-0 pb-2 last:pb-0"
                                                >
                                                    <div className="flex flex-wrap justify-between gap-2 items-center">
                                                       <button
    onClick={() => setSelectedRoadSignId(sign.road_sign_id)}
    className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
>
    اللوحة #{sign.road_sign_id}
</button>
                                                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                                                            {sign.start_date} → {sign.end_date}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <span>عدد الوجوه: {sign.booking_faces}</span>
                                                        <span>عدد اللوحات: {sign.number_of_reserved_panels}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Customer Information (if exists) */}
                                    {item.customer_informations &&
                                        Object.keys(item.customer_informations).length > 0 && (
                                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 md:col-span-2">
                                                <p className="text-green-600 dark:text-green-400 text-xs mb-2 flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    بيانات العميل
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    {item.customer_informations?.customer_informations?.username && (
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400 text-xs">الاسم</p>
                                                            <p className="text-gray-900 dark:text-white text-sm">
                                                                {item.customer_informations.customer_informations.username}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {item.customer_informations?.customer_informations?.phone_number && (
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400 text-xs">الهاتف</p>
                                                            <p className="text-gray-900 dark:text-white text-sm">
                                                                {item.customer_informations.customer_informations.phone_number}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {item.customer_informations?.customer_informations?.company_name && (
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400 text-xs">الشركة</p>
                                                            <p className="text-gray-900 dark:text-white text-sm">
                                                                {item.customer_informations.customer_informations.company_name}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default BrokerInfo