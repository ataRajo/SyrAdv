import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import RoadSignInfo from './RoadSignInfo';
import RoadsignHistory from './RoadsignHistory';
import StatisticalCharts from './StatisticalCharts';

const RoadSignStats = () => {
  const [roadSign, setRoadSign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roadSignId, setRoadSignId] = useState(null);

  // Get road sign ID from window location
  useEffect(() => {
    const getRoadSignIdFromURL = () => {
      const path = window.location.pathname;
      const parts = path.split('/');
      console.log('URL Parts:', parts); // Debug log
      
      // Extract ID from URL like /dashboard/road_signs/796/stats
      const roadSignsIndex = parts.indexOf('road_signs');
      if (roadSignsIndex !== -1 && parts.length > roadSignsIndex + 1) {
        const id = parts[roadSignsIndex + 1];
        console.log('Extracted RoadSign ID:', id); // Debug log
        return id;
      }
      return null;
    };

    const roadSignId = getRoadSignIdFromURL();
    console.log('Final RoadSign ID:', roadSignId); // Debug log
    
    if (roadSignId) {
      setRoadSignId(roadSignId);
    } else {
      console.error('Could not extract roadSignId from URL');
      setLoading(false);
    }
  }, []);

  const handleBack = () => {
    window.history.back();
  };

  if (loading && !roadSignId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري تحميل...</div>
      </div>
    );
  }

  if (!roadSignId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">خطأ: لم يتم العثور على معرف اللوحة</div>
        <Button onClick={handleBack} className="mt-4">
          العودة
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            العودة
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📊 إحصائيات اللوحة الطرقية #{roadSignId}
          </h1>
        </div>

        {/* Pass roadSignId to all child components */}
        <RoadSignInfo roadSignId={roadSignId} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <RoadsignHistory roadSignId={roadSignId} />
          <StatisticalCharts roadSignId={roadSignId} />
        </div>
      </div>
    </motion.div>
  );
};

export default RoadSignStats;