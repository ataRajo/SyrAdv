// src/Pages/Broker/CitiesRegions.jsx
import { useState } from "react";
import { 
  MapPin, 
  Building2, 
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCitiesWithRegionsQuery } from "../../RtkQuery/Slice/mediatorapis/MediatorApi";

export function CitiesRegions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCities, setExpandedCities] = useState({});
  const { data: cities = [], isLoading, error } = useGetCitiesWithRegionsQuery();

  const toggleCityExpand = (cityId) => {
    setExpandedCities(prev => ({
      ...prev,
      [cityId]: !prev[cityId]
    }));
  };

  const filteredCities = cities.filter(city => {
    if (!searchTerm) return true;
    const matchesCity = city.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = city.regions?.some(region => 
      region.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesCity || matchesRegion;
  });

  const totalCities = cities.length;
  const totalRegions = cities.reduce((sum, city) => sum + (city.regions?.length || 0), 0);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="text-center text-white">
          <p className="text-red-400">حدث خطأ في تحميل المدن والمناطق</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">المدن والمناطق</h1>
          <p className="text-gray-300">إدارة المدن والمناطق المتاحة للخدمة</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-100 text-sm">إجمالي المدن</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 bg-white/20 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold">{totalCities}</p>
                  )}
                </div>
                <Building2 className="h-12 w-12 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-purple-100 text-sm">إجمالي المناطق</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 bg-white/20 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold">{totalRegions}</p>
                  )}
                </div>
                <MapPin className="h-12 w-12 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="بحث عن مدينة أو منطقة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cities List */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            [1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-32 bg-white/20" />
                    <Skeleton className="h-5 w-16 bg-white/20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredCities.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-12 text-center">
                <p className="text-gray-400 text-lg">لا توجد نتائج مطابقة للبحث</p>
              </CardContent>
            </Card>
          ) : (
            filteredCities.map((city) => (
              <Card key={city.id} className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
                <CardContent className="p-0">
                  {/* City Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleCityExpand(city.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-400" />
                        <div>
                          <h3 className="text-white font-semibold text-lg">{city.name}</h3>
                          <p className="text-gray-400 text-sm">
                            {city.regions?.length || 0} منطقة
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600">نشط</Badge>
                        {expandedCities[city.id] ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Regions List (Expandable) */}
                  {expandedCities[city.id] && city.regions?.length > 0 && (
                    <div className="border-t border-white/20 p-4 bg-black/20">
                      <h4 className="text-gray-300 font-medium mb-3">المناطق التابعة للمدينة:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {city.regions.map((region) => (
                          <div
                            key={region.id}
                            className="flex items-center gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <MapPin className="h-4 w-4 text-purple-400" />
                            <span className="text-white">{region.name}</span>
                            {region.is_active === 1 && (
                              <Badge className="bg-green-600 text-xs ml-auto">نشط</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {expandedCities[city.id] && (!city.regions || city.regions.length === 0) && (
                    <div className="border-t border-white/20 p-4 bg-black/20">
                      <p className="text-gray-400 text-center">لا توجد مناطق تابعة لهذه المدينة</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Footer */}
        {!isLoading && filteredCities.length > 0 && (
          <div className="mt-6 text-center text-gray-400 text-sm">
            عرض {filteredCities.length} من {totalCities} مدينة
          </div>
        )}
      </div>
    </div>
  );
}