import { MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const RoadSignCard = ({ sign, onSelect, showAddButton = true }) => {
  const isBooked = sign.is_booked;
  
  return (
    <div 
      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
      onClick={() => onSelect?.(sign)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold truncate">
            {sign.roadsign_code || `لوحة #${sign.id}`}
          </h4>
          <p className="text-gray-400 text-sm mt-1 truncate">
            {sign.place} - {sign.city?.name}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            {sign.directions}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="bg-blue-600/80 text-white">
              {sign.template?.model}
            </Badge>
            <Badge variant="secondary" className="bg-purple-600/80 text-white">
              {sign.template?.size}
            </Badge>
            {isBooked ? (
              <Badge variant="destructive">محجوز</Badge>
            ) : (
              <Badge className="bg-green-600">متاح</Badge>
            )}
          </div>
          
          <div className="mt-2 text-xs text-gray-400">
            الوجوه: {sign.faces_number} | اللوحات: {sign.panels_number}
          </div>
        </div>
        
        {showAddButton && (
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 shrink-0 mr-2"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(sign);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const SelectedRoadSignCard = ({ sign, index, onRemove, onUpdate }) => {
  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0">
          <h4 className="text-white font-semibold truncate">
            {sign.roadsign_code || `لوحة #${sign.road_sign_id}`}
          </h4>
          <p className="text-gray-400 text-sm truncate">{sign.place}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant="secondary" className="bg-blue-600/80 text-white text-xs">
              {sign.template?.model}
            </Badge>
            <Badge variant="secondary" className="bg-purple-600/80 text-white text-xs">
              {sign.template?.size}
            </Badge>
          </div>
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onRemove(index)}
          className="shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-400 text-xs block mb-1">عدد الوجوه</Label>
          <Input
            type="number"
            min="1"
            max={sign.faces_number || 99}
            value={sign.booking_faces}
            onChange={(e) => onUpdate(index, "booking_faces", e.target.value)}
            className="bg-white/10 border-white/30 text-white h-8"
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs block mb-1">عدد اللوحات</Label>
          <Input
            type="number"
            min="1"
            max={sign.panels_number || 99}
            value={sign.number_of_reserved_panels}
            onChange={(e) => onUpdate(index, "number_of_reserved_panels", e.target.value)}
            className="bg-white/10 border-white/30 text-white h-8"
          />
        </div>
      </div>
    </div>
  );
};