import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Calculator, User, Phone, Building, Calendar } from "lucide-react";
import { showToast } from "../../utils/Notifictions/showToast";
import { BASE_URL } from "../../Api/baseUrl";
import { useBrokerAuthentication } from "../../Hooks/useBrokerAuthentication";
import axios from "axios";

export function CalculateAmountHistory() {
  const { brokerId } = useParams();
  const navigate = useNavigate();
  const { getBrokerToken } = useBrokerAuthentication();
  const [loading, setLoading] = useState(true);
  const [calculateAmounts, setCalculateAmounts] = useState([]);
  const [brokerInfo, setBrokerInfo] = useState(null);

  useEffect(() => {
    fetchCalculateAmountHistory();
  }, [brokerId]);

  const fetchCalculateAmountHistory = async () => {
    setLoading(true);
    try {
      const token = getBrokerToken();
      const response = await axios.get(
        `${BASE_URL}/api/broker/calculate-amount-history/${brokerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data?.status && response.data?.data?.calculate_booking_amount) {
        setCalculateAmounts(response.data.data.calculate_booking_amount);
        setBrokerInfo(response.data.data);
      } else {
        setCalculateAmounts([]);
      }
    } catch (error) {
      console.error("Error fetching calculate amount history:", error);
      showToast("error", "فشل في تحميل بيانات سجل الحسابات");
      setCalculateAmounts([]);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            رجوع
          </Button>
          <h1 className="text-2xl font-bold text-white">سجل عمليات حساب السعر</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Calculator className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm">إجمالي العمليات</p>
                  <p className="text-white text-2xl font-bold">{calculateAmounts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calculate Amount List */}
        {calculateAmounts.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-8 text-center">
              <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">لا توجد عمليات حساب</h3>
              <p className="text-gray-400">لم يقم هذا الوسيط بأي عملية حساب سعر بعد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {calculateAmounts.map((item, index) => (
              <Card
                key={item.id}
                className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white">
                        عملية #{index + 1}
                      </Badge>
                      <Badge variant="outline" className="border-white/30 text-white">
                        ID: {item.id}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(item.created_at)}</span>
                      <span>الساعة {formatTime(item.created_at)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Activity Type */}
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">نوع النشاط</p>
                      <p className="text-white font-medium">
                        {item.activity_type === "calculate_booking_amount"
                          ? "حساب سعر الحجز"
                          : item.activity_type}
                      </p>
                    </div>

                    {/* Product Type */}
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">نوع المنتج</p>
                      <p className="text-white font-medium">
                        {item.activity_data?.product_type === 1
                          ? "محلي"
                          : item.activity_data?.product_type === 2
                          ? "اجنبي"
                          : item.activity_data?.product_type === 3
                          ? "محلي اجنبي"
                          : "—"}
                      </p>
                    </div>

                    {/* Roadsigns */}
                    <div className="bg-white/5 rounded-lg p-3 md:col-span-2">
                      <p className="text-gray-400 text-xs mb-2">اللوحات المختارة</p>
                      <div className="space-y-2">
                        {item.activity_data?.roadsigns?.map((sign, idx) => (
                          <div
                            key={idx}
                            className="border-b border-white/10 last:border-0 pb-2 last:pb-0"
                          >
                            <div className="flex flex-wrap justify-between gap-2">
                              <span className="text-white">
                                اللوحة #{sign.road_sign_id}
                              </span>
                              <span className="text-gray-300 text-sm">
                                {sign.start_date} → {sign.end_date}
                              </span>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-gray-400">
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
                          <p className="text-green-400 text-xs mb-2 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            بيانات العميل
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {item.customer_informations?.customer_informations?.username && (
                              <div>
                                <p className="text-gray-400 text-xs">الاسم</p>
                                <p className="text-white text-sm">
                                  {item.customer_informations.customer_informations.username}
                                </p>
                              </div>
                            )}
                            {item.customer_informations?.customer_informations?.phone_number && (
                              <div>
                                <p className="text-gray-400 text-xs">الهاتف</p>
                                <p className="text-white text-sm">
                                  {item.customer_informations.customer_informations.phone_number}
                                </p>
                              </div>
                            )}
                            {item.customer_informations?.customer_informations?.company_name && (
                              <div>
                                <p className="text-gray-400 text-xs">الشركة</p>
                                <p className="text-white text-sm">
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
    </div>
  );
}