import React, { useState, useEffect } from "react";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  Loader2, 
  Calendar, 
  DollarSign, 
  Package,
  TrendingUp,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../../Api/baseUrl";

const PrintPrice = () => {
  const [printTypes, setPrintTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [formData, setFormData] = useState({
    type: "",
    price: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });

  // Format date to YYYY/MM/DD
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "غير محدد";
    }
  };

  // Get token from localStorage
  const getAuthToken = () => {
    try {
      const raw = localStorage.getItem("SuperAdminInfo");
      const info = raw ? JSON.parse(raw) : null;
      const token = info?.user?.token || info?.token || null;
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  const createAxiosInstance = () => {
    const token = getAuthToken();
    const instance = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error("Unauthorized! Token might be invalid or expired");
        }
        return Promise.reject(error);
      }
    );
    
    return instance;
  };

  // Fetch print types on component mount
  useEffect(() => {
    fetchPrintTypes();
  }, []);

  const fetchPrintTypes = async () => {
    try {
      setLoading(true);
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get("/printings");
      
      setPrintTypes(response.data || []);
      setError("");
    } catch (err) {
      console.error("❌ API Error Details:", err);
      
      if (err.response?.status === 401) {
        setError("يرجى تسجيل الدخول مرة أخرى (خطأ 401)");
      } else if (err.response?.status === 403) {
        setError("غير مصرح لك بالوصول إلى صفحة أسعار الطباعة (خطأ 403)");
      } else if (err.response?.status === 404) {
        setError("لم يتم العثور على واجهة برمجة التطبيقات (404)");
      } else {
        setError(`فشل في تحميل أنواع الطباعة: ${err.message}`);
      }
      setPrintTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData({
        type: type.type || "",
        price: type.price || "",
      });
    } else {
      setEditingType(null);
      setFormData({
        type: "",
        price: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingType(null);
    setFormData({ type: "", price: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const axiosInstance = createAxiosInstance();
      
      if (editingType) {
        await axiosInstance.put(`/printings/${editingType.id}`, {
          type: formData.type,
          price: formData.price,
        });
        showSnackbar("تم تحديث نوع الطباعة بنجاح", "success");
      } else {
        await axiosInstance.post("/printings", {
          type: formData.type,
          price: formData.price,
        });
        showSnackbar("تم إضافة نوع الطباعة بنجاح", "success");
      }
      fetchPrintTypes();
      handleCloseDialog();
    } catch (err) {
      console.error("Error saving data:", err);
      const errorMessage = err.response?.data?.message || "حدث خطأ أثناء حفظ البيانات";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف نوع الطباعة هذا؟")) {
      try {
        const axiosInstance = createAxiosInstance();
        await axiosInstance.delete(`/printings/${id}`);
        showSnackbar("تم حذف نوع الطباعة بنجاح", "success");
        fetchPrintTypes();
      } catch (err) {
        console.error("Error deleting:", err);
        const errorMessage = err.response?.data?.message || "حدث خطأ أثناء الحذف";
        showSnackbar(errorMessage, "error");
      }
    }
  };

  const showSnackbar = (message, type) => {
    setSnackbar({
      open: true,
      message,
      type,
    });
    
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, open: false }));
    }, 3000);
  };

  const filteredTypes = printTypes.filter(type => 
    type.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.price?.toString().includes(searchTerm)
  );

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTypes = [...filteredTypes].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Calculate statistics
  const totalItems = printTypes.length;
  const totalValue = printTypes.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const averagePrice = totalItems > 0 ? (totalValue / totalItems).toFixed(2) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-6 h-6 text-white dark:text-gray-800" />
          </div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
          جار تحميل بيانات أسعار الطباعة...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-200">
      {/* Header with Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-800/30 p-6 mb-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                إدارة أسعار الطباعة
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
              قم بإدارة وتنظيم أنواع وأسعار مواد الطباعة بسهولة
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 min-w-[140px] border border-blue-200 dark:border-blue-800/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">الأنواع</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalItems}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
                <div className="flex items-center justify-between">
                  <div>
                    
                  </div>
              </div>
            </div>
            
            <button
              onClick={() => handleOpenDialog()}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] font-medium whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة نوع جديد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-800/30 p-4 md:p-6 mb-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن نوع طباعة أو سعر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredTypes.length} من {printTypes.length} نوع
            </span>
            <button
              onClick={() => handleSort('price')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors duration-200"
            >
              <Filter className="w-4 h-4" />
              <span>ترتيب بالسعر</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800/50 rounded-2xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-lg mt-0.5">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">حدث خطأ</h3>
              <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
              <button
                onClick={fetchPrintTypes}
                className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-700/50 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-800/30 overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  #
                </th>
                <th 
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-2 justify-end">
                    <Package className="w-4 h-4" />
                    <span>نوع الطباعة</span>
                    {sortConfig.key === 'type' && (
                      <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-2 justify-end">
                    <DollarSign className="w-4 h-4" />
                    <span>السعر</span>
                    {sortConfig.key === 'price' && (
                      <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2 justify-end">
                    <Calendar className="w-4 h-4" />
                    تاريخ الإضافة
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {sortedTypes.length > 0 ? (
                sortedTypes.map((type, index) => (
                  <tr 
                    key={type.id || index} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-400 rounded-xl font-bold border border-blue-200 dark:border-blue-800/50">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/30 dark:to-blue-700/30 rounded-xl">
                          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {type.type || "غير معروف"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            معرف: #{type.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800/30 dark:to-green-700/30 rounded-xl">
                          <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {parseFloat(type.price || 0).toLocaleString()}
                            </p>

                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">سعر الوحدة</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800/30 dark:to-purple-700/30 rounded-xl">
                          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(type.created_at)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">تاريخ الإضافة</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleOpenDialog(type)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-800/30 dark:to-blue-700/30 text-blue-700 dark:text-blue-400 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-700/50 dark:hover:to-blue-600/50 rounded-lg transition-all duration-200 border border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 hover:scale-[1.02] active:scale-[0.98]"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="text-sm font-medium hidden md:inline">تعديل</span>
                        </button>
                        
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="p-5 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl">
                        <Package className="w-14 h-14 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {searchTerm ? "لم يتم العثور على نتائج" : "لا توجد أنواع طباعة مضافة"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md">
                          {searchTerm 
                            ? `لا توجد نتائج تطابق "${searchTerm}"`
                            : "ابدأ بإضافة أول نوع طباعة باستخدام زر 'إضافة نوع جديد'"
                          }
                        </p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="mt-4 px-4 py-2 bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-700/50 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            مسح البحث
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Modal */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            {/* Dialog Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  {editingType ? (
                    <Pencil className="w-6 h-6 text-white" />
                  ) : (
                    <Plus className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingType ? "تعديل نوع الطباعة" : "إضافة نوع طباعة جديد"}
                  </h2>
                  <p className="text-white/90 text-sm mt-1">
                    {editingType ? "قم بتحديث بيانات نوع الطباعة" : "أدخل بيانات نوع الطباعة الجديد"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Dialog Content */}
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      نوع الطباعة *
                    </div>
                  </label>
                  <input
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    required
                    placeholder="أدخل نوع الطباعة (مثال: FLEX, PVC, Sticker)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      السعر (ليرة سورية) *
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                    />                    
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={handleCloseDialog}
                  className="flex items-center gap-2 px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium"
                >
                  <X className="w-4 h-4" />
                  <span>إلغاء</span>
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingType ? "تحديث" : "إضافة"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {snackbar.open && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-xl shadow-2xl transform transition-all duration-300 animate-slideUp ${
          snackbar.type === "success" 
            ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50" 
            : "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              snackbar.type === "success" 
                ? "bg-green-100 dark:bg-green-800/50" 
                : "bg-red-100 dark:bg-red-800/50"
            }`}>
              {snackbar.type === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <span className="font-medium">{snackbar.message}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PrintPrice;