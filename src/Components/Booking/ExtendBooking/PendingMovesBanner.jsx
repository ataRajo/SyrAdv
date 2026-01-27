import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, X } from "lucide-react";

const PendingMovesBanner = ({ pendingMoves, onClearAll, onRemoveMove }) => {
  if (pendingMoves.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-l-4 border-purple-500 p-4 rounded-r-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-800/50 rounded-lg">
            <Navigation className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-purple-800 dark:text-purple-300">
              حركات النقل المعلقة ({pendingMoves.length})
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-400">
              سيتم نقل اللوحات التالية عند تأكيد التمديد:
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          إلغاء الكل
        </Button>
      </div>
      
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {pendingMoves.map((move, index) => (
          <div 
            key={index} 
            className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-lg border border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700 border-0">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{move.oldSignData.place}</span>
                  <Navigation className="w-3 h-3 mx-2 text-purple-500" />
                  <span className="font-medium text-green-600">{move.newSignData.place}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {move.oldSignData.directions} → {move.newSignData.directions}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveMove(move.oldSignId)}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingMovesBanner;