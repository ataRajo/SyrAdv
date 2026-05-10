// RoadSignsExport.jsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import { showToast } from "../../utils/Notifictions/showToast";
import { BASE_URL } from "../../Api/baseUrl";


const RoadSignsExport = ({ 
  selectedRoadSigns, 
  onClearSelections, 
  onCancelMode,
  isExporting,
  setIsExporting 
}) => {
  
  const handleExportSelected = async () => {
    if (selectedRoadSigns.length === 0) {
      showToast("warning", "الرجاء اختيار لوحة واحدة على الأقل");
      return;
    }
    
    setIsExporting(true);
    
    try {
      const ids = selectedRoadSigns.map(item => item.id);
      
      const queryParams = new URLSearchParams();
      ids.forEach(id => queryParams.append('ids[]', id));
      
      const response = await fetch(`${BASE_URL}/road-signs/export-excel?${queryParams.toString()}`, {
        method: 'GET',
      });
      
      if (response.redirected) {
        const redirectResponse = await fetch(response.url, {
          method: 'GET',
        });
        
        if (!redirectResponse.ok) {
          throw new Error('Export failed');
        }
        
        const blob = await redirectResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `road_signs_export_${new Date().toISOString().slice(0, 19)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast("success", `تم تصدير ${selectedRoadSigns.length} لوحة بنجاح`);
        onClearSelections();
        onCancelMode();
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `road_signs_export_${new Date().toISOString().slice(0, 19)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToast("success", `تم تصدير ${selectedRoadSigns.length} لوحة بنجاح`);
      onClearSelections();
      onCancelMode();
      
    } catch (error) {
      console.error("Export error:", error);
      showToast("error", `حدث خطأ أثناء التصدير: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm">وضع اختيار اللوحات</h3>
        <Badge variant="outline" className="text-xs">
          تم اختيار {selectedRoadSigns.length} لوحة
        </Badge>
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={handleExportSelected}
          disabled={selectedRoadSigns.length === 0 || isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري التصدير...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              تصدير ({selectedRoadSigns.length})
            </>
          )}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onClearSelections}
          disabled={selectedRoadSigns.length === 0}
          className="flex-1"
        >
          <X className="w-4 h-4 ml-2" />
          إلغاء التحديد
        </Button>
        
        <Button
          size="sm"
          variant="destructive"
          onClick={onCancelMode}
          className="flex-1"
        >
          إلغاء
        </Button>
      </div>
      
      {selectedRoadSigns.length > 0 && (
        <div className="max-h-32 overflow-y-auto border rounded p-2">
          <p className="text-xs font-semibold mb-1">اللوحات المختارة:</p>
          {selectedRoadSigns.map(sign => (
            <div key={sign.id} className="text-xs text-gray-600 py-1 border-b last:border-0">
              {sign.name} - {sign.place || sign.coords?.join(', ') || `ID: ${sign.id}`}
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs text-gray-500 text-center">
        💡 اضغط على أي لوحة على الخريطة لتحديدها أو إلغاء تحديدها
      </p>
    </div>
  );
};

export default RoadSignsExport;