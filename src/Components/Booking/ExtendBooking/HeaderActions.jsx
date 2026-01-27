import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft } from "lucide-react";
import MoveSignDialog from "./MoveSignDialog"; // Now this import will work

const HeaderActions = ({
  booking,
  selectedRoadSigns,
  pendingMoves,
  allRoadSigns,
  isRoadSignsFetching,
  onMoveSign,
  onNavigateBack
}) => {
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [currentMoveSignId, setCurrentMoveSignId] = useState("");

  return (
    <div className="flex items-center gap-3">
      <MoveSignDialog
        isOpen={isMoveDialogOpen}
        onClose={() => {
          setIsMoveDialogOpen(false);
          setCurrentMoveSignId("");
        }}
        booking={booking}
        selectedRoadSigns={selectedRoadSigns}
        allRoadSigns={allRoadSigns}
        isRoadSignsFetching={isRoadSignsFetching}
        currentMoveSignId={currentMoveSignId}
        setCurrentMoveSignId={setCurrentMoveSignId}
        onAddMove={onMoveSign}
        pendingMoves={pendingMoves}
      />

      <Button
        variant="outline"
        onClick={() => setIsMoveDialogOpen(true)}
        className="gap-2 hover:bg-purple-50 relative"
      >
        <ArrowRightLeft className="w-4 h-4 text-blue-500" />
        تبديل لوحة
        {pendingMoves.length > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-purple-600 text-white">
            {pendingMoves.length}
          </Badge>
        )}
      </Button>

      <Button 
        variant="outline" 
        onClick={onNavigateBack}
        className="hover:bg-gray-50"
      >
        العودة للحجوزات
      </Button>
    </div>
  );
};

export default HeaderActions;