import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { 
  TrendingUp,
  DollarSign,
  Briefcase,
  Calendar,
  Users,
  Sun,
  CloudSun,
  Moon,
  Hand
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrokerNavbar } from "../../Components/Broker/BrokerNavbar";
import { useBrokerAuthentication } from "../../Hooks/useBrokerAuthentication";
import {
  useGetBrokerProfileQuery,
  useGetBrokerBookingsQuery,
  useGetBrokerPaymentsQuery,
} from "../../RtkQuery/Slice/mediatorapis/MediatorApi";

// Simple typing effect hook
function useTypingEffect(texts, speed = 100, delay = 2000) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[currentIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentText.substring(0, displayText.length + 1));
        if (displayText === currentText) {
          setTimeout(() => setIsDeleting(true), delay);
        }
      } else {
        setDisplayText(currentText.substring(0, displayText.length - 1));
        if (displayText === "") {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex, texts, speed, delay]);

  return displayText;
}

// Get greeting based on time
function getGreeting(hour) {
  if (hour < 12) {
    return {
      text: "صباح الخير",
      icon: Sun,
      color: "text-yellow-400",
      bgGradient: "from-orange-500/20 to-yellow-500/20",
      sentences: [
        "يوم جديد مليء بالفرص والإنجازات!",
        "ابدأ يومك بنشاط وحماس.",
        "نتمنى لك يوماً موفقاً مليئاً بالنجاح."
      ]
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      text: "نهارك جميل",
      icon: CloudSun,
      color: "text-blue-400",
      bgGradient: "from-blue-500/20 to-cyan-500/20",
      sentences: [
        "استمر في العمل بجد، النتائج تستحق!",
        "فترة الظهيرة وقت الإنتاج والإبداع.",
        "أملنا أن يكون يومك مليئاً بالإنجازات."
      ]
    };
  } else {
    return {
      text: "مساء الخير",
      icon: Moon,
      color: "text-purple-400",
      bgGradient: "from-purple-500/20 to-indigo-500/20",
      sentences: [
        "مساء الاسترخاء بعد يوم عمل مثمر.",
        "استعد للغد بنشاط جديد وطاقة إيجابية.",
        "نتمنى لك مساء هادئاً ونوماً مريحاً."
      ]
    };
  }
}

export function BrokerWelcome() {
  const navigate = useNavigate();
  const { getBrokerUser, isBrokerAuthenticated } = useBrokerAuthentication();
  const brokerUser = getBrokerUser();

  // Get current hour
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const greeting = useMemo(() => getGreeting(currentHour), [currentHour]);
  const GreetingIcon = greeting.icon;

  // Typing animation texts
  const typingTexts = useMemo(() => [
    greeting.text,
    ...greeting.sentences
  ], [greeting]);

  const typedText = useTypingEffect(typingTexts, 80, 2500);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isBrokerAuthenticated()) {
      navigate("/broker/login");
    }
  }, [isBrokerAuthenticated, navigate]);

  // Fetch real data from API
  const { data: profileData, isLoading: profileLoading } = useGetBrokerProfileQuery();
  const { data: bookingsData, isLoading: bookingsLoading } = useGetBrokerBookingsQuery({ limit: 5 });
  const { data: paymentsData, isLoading: paymentsLoading } = useGetBrokerPaymentsQuery({ limit: 5 });

  const statLoading = profileLoading || bookingsLoading || paymentsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <BrokerNavbar />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Animated Welcome Section */}
        <div className="mb-8">
          <Card className={cn(
            "bg-gradient-to-r border-0 text-white overflow-hidden relative",
            greeting.bgGradient
          )}>
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col items-center text-center gap-6">
                {/* Greeting Icon */}
                <div className={cn(
                  "p-4 rounded-full bg-white/10 backdrop-blur-sm",
                  "animate-pulse"
                )}>
                  <GreetingIcon className={cn("h-12 w-12 md:h-16 md:w-16", greeting.color)} />
                </div>

                {/* Animated Typing Text */}
                <div className="min-h-[120px] flex flex-col items-center justify-center gap-4">
                  <h1 className="text-3xl md:text-5xl font-bold text-white">
                    {typedText}
                    <span className="animate-pulse text-blue-400">|</span>
                  </h1>
                  
                  {/* Current sentence indicator */}
                  <div className="flex gap-2">
                    {greeting.sentences.map((_, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          typedText.includes(greeting.sentences[idx]?.substring(0, 10)) 
                            ? "bg-white w-6" 
                            : "bg-white/30"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* User Name */}
                <p className="text-white/80 text-lg md:text-xl">
                  {profileData?.user?.full_name || brokerUser?.username || "الوسيط"}
                </p>

                {/* Hand wave */}
                <Hand className="h-8 w-8 text-yellow-400 animate-bounce" />
              </div>
            </CardContent>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          </Card>
        </div>
      </main>
    </div>
  );
}