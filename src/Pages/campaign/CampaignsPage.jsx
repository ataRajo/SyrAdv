import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Loader2,
  ChevronUp,
  ChevronDown,
  FileText,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useGetBookingQuery,
} from "../../RtkQuery/Slice/Booking/BookingApi";
import { CreateSimilarCampaign } from "../../components/Campaign/CreateSimilarCampaign";
import axios from "axios";
import { BASE_URL } from "../../Api/baseUrl";

export default function CampaignsPage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("start_date");
  const [sortDirection, setSortDirection] = useState("desc");
const [printTypes, setPrintTypes] = useState([]);
const [loadingPrintTypes, setLoadingPrintTypes] = useState(false);


useEffect(() => {
  const fetchPrintTypes = async () => {
    try {
      setLoadingPrintTypes(true);
      const token = localStorage.getItem("SuperAdminInfo");
      const parsedToken = token ? JSON.parse(token) : null;
      const authToken = parsedToken?.user?.token || parsedToken?.token;

      const response = await axios.get(`${BASE_URL}/printings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });

      setPrintTypes(response.data || []);
    } catch (error) {
      console.error("Error fetching print types:", error);
    } finally {
      setLoadingPrintTypes(false);
    }
  };

  fetchPrintTypes();
}, []);


  // Fetch data with pagination
  const { 
    data: response, 
    isLoading, 
    isFetching,
    refetch 
  } = useGetBookingQuery({ 
    page: currentPage, 
    per_page: perPage 
  });

  // Extract data from response
  const campaigns = response?.data || [];
  const pagination = response?.pagination || {};
  const totalItems = pagination?.total || 0;
  const totalPages = pagination?.last_page || 1;
  const currentPageFromApi = pagination?.current_page || 1;

  // Sync current page with API response
  useEffect(() => {
    if (currentPageFromApi !== currentPage) {
      setCurrentPage(currentPageFromApi);
    }
  }, [currentPageFromApi, currentPage]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort current page data
  const sortedData = useMemo(() => {
    if (!campaigns.length) return [];

    const sorted = [...campaigns].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "start_date" || sortField === "end_date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortField === "customer.company_name") {
        aVal = a.customer?.company_name || a.customer?.full_name || "";
        bVal = b.customer?.company_name || b.customer?.full_name || "";
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [campaigns, sortField, sortDirection]);

  // Filter data by search term
  const filteredData = useMemo(() => {
    if (!sortedData.length) return [];
    
    if (!searchTerm.trim()) return sortedData;
    
    return sortedData.filter(booking => {
      const companyName = booking.customer?.company_name || booking.customer?.full_name || "";
      return companyName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [sortedData, searchTerm]);

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const goToLastPage = () => {
    if (currentPage !== totalPages) {
      setCurrentPage(totalPages);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy");
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortDirection === "asc" ? 
      <ChevronUp className="h-3 w-3" /> : 
      <ChevronDown className="h-3 w-3" />;
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleOpenMap = (campaignId) => {
    const mapLink = `https://tsyr.addresses.sy/public-map/${campaignId}`;
    window.open(mapLink, "_blank");
  };

  if (isLoading && !campaigns.length) {
    return (
      <div className="flex justify-center items-center h-96 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600 dark:text-amber-400" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 rtl dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الحملات</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          إدارة جميع الحملات الإعلانية - إجمالي: {totalItems} حملة
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="البحث باسم الشركة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            تم العثور على {filteredData.length} نتيجة في الصفحة الحالية
          </p>
        )}
      </div>

      {/* Loading overlay */}
      {isFetching && (
        <div className="fixed inset-0 bg-black/20 z-10 flex items-center justify-center pointer-events-none">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th 
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort("customer.company_name")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">اسم الشركة</span>
                    <SortIcon field="customer.company_name" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort("start_date")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">من تاريخ</span>
                    <SortIcon field="start_date" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort("end_date")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">إلى تاريخ</span>
                    <SortIcon field="end_date" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">العمليات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((campaign, index) => (
                <tr 
                  key={campaign.id}
                  className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {campaign.customer?.company_name || campaign.customer?.full_name || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(campaign.start_date)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(campaign.end_date)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenMap(campaign.id)}
                        className="gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Eye className="h-3 w-3" />
                        عرض الخريطة
                      </Button>
                      <CreateSimilarCampaign 
                      booking={campaign} 
                    printTypes={printTypes}
                    loadingPrintTypes={loadingPrintTypes}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? "لا توجد نتائج مطابقة للبحث" : "لا توجد حملات حالياً"}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">عرض:</span>
                <select
                  value={perPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-300">من {totalItems}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="flex gap-1 mx-1">
                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`min-w-[32px] h-8 px-2 rounded-md text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-amber-600 text-white'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                صفحة {currentPage} من {totalPages}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}