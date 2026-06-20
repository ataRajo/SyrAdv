import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const RoadSignFilters = ({ 
  cities, 
  regions, 
  filters, 
  onFilterChange,
  disabled = false 
}) => {
  // Use "all" instead of empty string for "all cities/regions"
  const cityValue = filters.city_id || "all";
  const regionValue = filters.region_id || "all";

  const handleCityChange = (value) => {
    onFilterChange("city_id", value === "all" ? "" : value);
  };

  const handleRegionChange = (value) => {
    onFilterChange("region_id", value === "all" ? "" : value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="text-gray-300 mb-1.5 block">المدينة</Label>
        <Select
          value={cityValue}
          onValueChange={handleCityChange}
          disabled={disabled}
        >
          <SelectTrigger className="bg-white/10 border-white/30 text-white">
            <SelectValue placeholder="جميع المدن" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المدن</SelectItem>
            {cities.map(city => (
              <SelectItem key={city.id} value={city.id.toString()}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-gray-300 mb-1.5 block">المنطقة</Label>
        <Select
          value={regionValue}
          onValueChange={handleRegionChange}
          disabled={disabled || regions.length === 0}
        >
          <SelectTrigger className="bg-white/10 border-white/30 text-white">
            <SelectValue placeholder="جميع المناطق" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المناطق</SelectItem>
            {regions.map(region => (
              <SelectItem key={region.id} value={region.id.toString()}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};