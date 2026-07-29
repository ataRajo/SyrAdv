// src/Pages/Broker/BrokerClients.jsx
import { useNavigate } from "react-router";
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  Eye,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Building2,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BrokerNavbar } from "../../Components/Broker/BrokerNavbar";
import { AddCustomerModal } from "../../Components/Broker/AddCustomerModal";
import { useBrokerCustomers } from "../../Hooks/useBrokerCustomers";

export function BrokerClients() {
  const navigate = useNavigate();
  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    itemsPerPage,
    isAddModalOpen,
    isSubmitting,
    newCustomer,
    clients,
    meta,
    isLoading,
    error,
    handleSearch,
    goToPage,
    handleItemsPerPageChange,
    handleNewCustomerInputChange,
    openAddModal,
    closeAddModal,
    addCustomer,
    getClientInitials,
    getStatusBadge,
    getPageNumbers,
  } = useBrokerCustomers();

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <BrokerNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)] p-6">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 max-w-md">
            <CardContent className="p-6 text-center">
              <p className="text-red-400 mb-4">حدث خطأ في تحميل العملاء</p>
              <Button onClick={() => window.location.reload()} className="bg-blue-600">
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <BrokerNavbar />
      
      <div className="pt-16 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">إدارة العملاء</h1>
          <p className="text-gray-300">إدارة ومتابعة جميع عملاء الوسيط</p>
        </div>

        {/* Filters */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="بحث عن عميل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 pr-10"
                  />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  بحث
                </Button>
              </form>
              
              <div className="flex gap-2">
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[120px] bg-white/10 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / صفحة</SelectItem>
                    <SelectItem value="15">15 / صفحة</SelectItem>
                    <SelectItem value="25">25 / صفحة</SelectItem>
                    <SelectItem value="50">50 / صفحة</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={openAddModal}
                >
                  <UserPlus className="h-4 w-4 ml-2" />
                  عميل جديد
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">قائمة العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 bg-white/20 mb-2" />
                      <Skeleton className="h-3 w-48 bg-white/20" />
                    </div>
                    <Skeleton className="h-8 w-20 bg-white/20" />
                  </div>
                ))}
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">لا يوجد عملاء حالياً</p>
                <Button 
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={openAddModal}
                >
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة عميل جديد
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-white/20">
                      <tr className="text-right text-gray-300">
                        <th className="pb-3 font-medium">العميل</th>
                        <th className="pb-3 font-medium">الشركة</th>
                        <th className="pb-3 font-medium">رقم الهاتف</th>
                        <th className="pb-3 font-medium">السجل التجاري</th>
                        <th className="pb-3 font-medium">العنوان</th>
                        <th className="pb-3 font-medium">المتبقي</th>
                        <th className="pb-3 font-medium">الحالة</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr key={client.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-blue-600 text-white">
                                  {getClientInitials(client)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-white font-medium">{client.full_name || client.name || client.username}</p>
                                <p className="text-gray-400 text-sm">ID: {client.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1 text-gray-300">
                              <Building2 className="h-4 w-4 text-blue-400" />
                              <span>{client.company_name || "—"}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1 text-gray-300">
                              <Phone className="h-4 w-4 text-green-400" />
                              <span dir="ltr">{client.phone_number || "—"}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1 text-gray-300">
                              <FileText className="h-4 w-4 text-yellow-400" />
                              <span>{client.commercial_registration_number || "—"}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1 text-gray-300">
                              <MapPin className="h-4 w-4 text-red-400" />
                              <span>{client.address || "—"}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1 text-gray-300">
                              <DollarSign className="h-4 w-4 text-emerald-400" />
                              <span>{client.remaining ?? 0}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge className={getStatusBadge(client.status).className}>
                              {getStatusBadge(client.status).label}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/broker/clients/${client.id}`)}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {meta.total_pages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/20">
                    <div className="text-gray-400 text-sm">
                      عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, meta.total)} من {meta.total} عميل
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                      >
                        <ChevronRight className="h-4 w-4" />
                        السابق
                      </Button>
                      
                      {getPageNumbers().map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className={cn(
                            currentPage === page
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                          )}
                        >
                          {page}
                        </Button>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === meta.total_pages}
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                      >
                        التالي
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSubmit={addCustomer}
        formData={newCustomer}
        onInputChange={handleNewCustomerInputChange}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}