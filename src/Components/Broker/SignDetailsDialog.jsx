import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SignDetailsDialog = ({ sign, open, onClose, onConfirm, globalDates }) => {
  const [faceCount, setFaceCount] = useState(1);
  const [panelCount, setPanelCount] = useState(1);

  // Reset when sign changes
  useEffect(() => {
    if (open) {
      setFaceCount(1);
      setPanelCount(1);
    }
  }, [open, sign?.id]);

  if (!sign) return null;

  const maxFaces = sign.faces_number || 1;
  const maxPanels = sign.panels_number || 1;

  const handleConfirm = () => {
    onConfirm({
      ...sign,
      booking_faces: Math.min(faceCount, maxFaces),
      number_of_reserved_panels: Math.min(panelCount, maxPanels),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/20 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">تفاصيل اللوحة</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="bg-white/5 p-3 rounded-lg">
            <h4 className="font-semibold text-white">{sign.roadsign_code || `لوحة #${sign.id}`}</h4>
            <p className="text-gray-400 text-sm">{sign.place}</p>
            <p className="text-gray-500 text-xs mt-1">{sign.directions}</p>
          </div>

          <div>
            <Label className="text-gray-300 flex justify-between">
              <span>عدد الوجوه</span>
              <span className="text-xs text-gray-500">الحد الأقصى: {maxFaces}</span>
            </Label>
            <Input
              type="number"
              min="1"
              max={maxFaces}
              value={faceCount}
              onChange={(e) => setFaceCount(Math.min(parseInt(e.target.value) || 1, maxFaces))}
              className="bg-white/10 border-white/30 text-white mt-1.5"
            />
          </div>

          <div>
            <Label className="text-gray-300 flex justify-between">
              <span>عدد اللوحات</span>
              <span className="text-xs text-gray-500">الحد الأقصى: {maxPanels}</span>
            </Label>
            <Input
              type="number"
              min="1"
              max={maxPanels}
              value={panelCount}
              onChange={(e) => setPanelCount(Math.min(parseInt(e.target.value) || 1, maxPanels))}
              className="bg-white/10 border-white/30 text-white mt-1.5"
            />
          </div>

          <div className="bg-blue-500/10 p-3 rounded-lg text-sm text-blue-200">
            <p>الفترة: {globalDates.start} إلى {globalDates.end}</p>
          </div>

          <Button 
            onClick={handleConfirm} 
            className="w-full bg-blue-600 hover:bg-blue-700 h-11"
          >
            <Check className="h-4 w-4 ml-2" />
            تأكيد الإضافة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};