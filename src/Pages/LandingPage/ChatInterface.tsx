// ChatInterface.tsx - COMPLETE WORKING VERSION WITH CSV MATCHING
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCcw, Loader2, AlertCircle, ChevronDown, Eye, X, MapPin, Users, DollarSign, Star, CheckCircle } from 'lucide-react';
import { Button } from '../../Components/ui/button';
import { Input } from '../../Components/ui/input';
import { ScrollArea } from '../../Components/ui/scroll-area';
import { Badge } from '../../Components/ui/badge';
import { Card } from '../../Components/ui/card';

// Import billboard matching service
import { matchBillboards, type Billboard } from '../../../src/billboardMatcher';

const AI_BASE_URL = "http://192.168.1.151:8000";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
}

interface ApiResponse {
  session: string;
  response: string;
  timestamp: string;
}

interface CampaignData {
  campaignName: string;
  duration: string;
  targetAudience: string;
  budget: string;
  city: string;
  isComplete: boolean;
}

export default function ChatInterface() {
  // States
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي لاختيار اللوحات الإعلانية. سأسألك 5 أسئلة لمساعدتك في العثور على أفضل اللوحات المناسبة لحملتك.',
      timestamp: new Date()
    },
    {
      role: 'assistant',
      content: '**السؤال الأول:** ما هو اسم الحملة الإعلانية؟',
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  const [apiStatus, setApiStatus] = useState<string>('');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  // Campaign Data State
  const [campaignData, setCampaignData] = useState<CampaignData>({
    campaignName: '',
    duration: '',
    targetAudience: '',
    budget: '',
    city: '',
    isComplete: false
  });
  
  // Question Flow State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questions = [
    { key: 'campaignName', question: '**السؤال الأول:** ما هو اسم الحملة الإعلانية؟' },
    { key: 'duration', question: '**السؤال الثاني:** ما هي المدة المطلوبة للإعلان؟ (مثال: 30 يوم، 3 شهور)' },
    { key: 'targetAudience', question: '**السؤال الثالث:** من هو الجمهور المستهدف؟ (مثال: الشباب 18-35، رجال الأعمال، عائلات)' },
    { key: 'budget', question: '**السؤال الرابع:** ما هي الميزانية المتاحة بالدولار؟ (مثال: 1000، 5000)' },
    { key: 'city', question: '**السؤال الخامس والأخير:** في أي مدينة تريد الإعلان؟ (دمشق أو حلب)' }
  ];
  
  // Billboard Results State
  const [showBillboardResults, setShowBillboardResults] = useState(false);
  const [matchingBillboards, setMatchingBillboards] = useState<Billboard[]>([]);
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle scroll
  useEffect(() => {
    const scrollElement = scrollAreaRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isScrolledUp = scrollTop + clientHeight < scrollHeight - 100;
      setShowScrollToBottom(isScrolledUp);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch function
  const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
    const fullUrl = `${AI_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };


    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;

    } catch (error: any) {
      console.error('❌ Fetch error:', error.message);
      throw error;
    }
  };

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);
    setApiStatus('');

    try {
      // If we're in question mode
      if (currentQuestionIndex < questions.length) {
        const currentQuestion = questions[currentQuestionIndex];
        
        // Update campaign data
        const updatedCampaignData = {
          ...campaignData,
          [currentQuestion.key]: userInput
        };
        
        setCampaignData(updatedCampaignData);
        
        // Move to next question or complete
        if (currentQuestionIndex < questions.length - 1) {
          const nextQuestion = questions[currentQuestionIndex + 1];
          
          const aiMessage: Message = {
            role: 'assistant',
            content: nextQuestion.question,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          
        } else {
          // All questions answered - Complete the data
          const finalCampaignData = {
            ...updatedCampaignData,
            isComplete: true
          };
          
          setCampaignData(finalCampaignData);
          
          // Show confirmation message
          const confirmationMessage: Message = {
            role: 'assistant',
            content: `✅ **تم جمع جميع المعلومات بنجاح!**\n\n**ملخص الحملة:**\n• الاسم: ${finalCampaignData.campaignName}\n• المدة: ${finalCampaignData.duration}\n• الجمهور: ${finalCampaignData.targetAudience}\n• الميزانية: ${finalCampaignData.budget} دولار\n• المدينة: ${finalCampaignData.city}\n\n🔍 **جاري البحث عن اللوحات الإعلانية المطابقة...**`,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, confirmationMessage]);
          
          // Find matching billboards
          await findMatchingBillboards(finalCampaignData);
        }
        
      } else {
        // Normal chat mode (after questions)
        const apiResponse = await callChatAPI(userInput);
        
        if (apiResponse.session && apiResponse.session !== sessionId) {
          setSessionId(apiResponse.session);
        }

        const aiMessage: Message = {
          role: 'assistant',
          content: apiResponse.response,
          timestamp: new Date(),
          data: apiResponse
        };

        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error: any) {
      console.error('❌ Error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `⚠️ عذراً، حدث خطأ: ${error.message}\n\nيرجى المحاولة مرة أخرى.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Call the Chat API (for normal chat after questions)
  const callChatAPI = async (userMessage: string): Promise<ApiResponse> => {
    setApiStatus('💬 جاري الاتصال بالذكاء الاصطناعي...');
    
    const requestData = {
      message: userMessage,
      session: sessionId
    };

    try {
      const response = await fetchAPI('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      const data: ApiResponse = await response.json();
      setApiStatus('✅ تم استلام الرد من الذكاء الاصطناعي');
      
      return data;

    } catch (error: any) {
      console.error('❌ Chat API error:', error);
      setApiStatus(`❌ خطأ في الذكاء الاصطناعي: ${error.message}`);
      
      // Fallback response
      return {
        session: sessionId,
        response: 'مرحباً! عذراً، هناك مشكلة في الاتصال. يمكنك الاستمرار في المحادثة معي.',
        timestamp: new Date().toISOString()
      };
    }
  };

  // أضف هذه الدالة
  const inspectCSVFile = async () => {
    try {
      
      const response = await fetch('/data.csv');
      const text = await response.text();
      
      
      // تحليل أول 3 أسطر
      const lines = text.split('\n');
      console.log('📋 First 3 lines of your data.csv:');
      lines.slice(0, 3).forEach((line, i) => {
        console.log(`${i + 1}: "${line}"`);
      });
      
      // إظهار في المحادثة
      const msg: Message = {
        role: 'assistant',
        content: `🔍 **فحص ملف data.csv:**\n\n\`\`\`\nسطر 1: ${lines[0]?.substring(0, 50)}...\nسطر 2: ${lines[1]?.substring(0, 50)}...\nسطر 3: ${lines[2]?.substring(0, 50)}...\n\`\`\`\n\n**إجمالي الأسطر:** ${lines.length}\n**الحجم:** ${text.length} حرف`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, msg]);
      
    } catch (error: any) {
      console.error('Inspection error:', error);
    }
  };

  const findMatchingBillboards = async (finalCampaignData: CampaignData) => {
    try {
      setIsGeneratingMatches(true);

      // Convert budget string to number
      const userData = {
        campaignName: finalCampaignData.campaignName,
        duration: finalCampaignData.duration,
        targetAudience: finalCampaignData.targetAudience,
        budget: Number(finalCampaignData.budget),
        city: finalCampaignData.city,
      };

      // Call the matcher
      const results = await matchBillboards(userData);

      // Save results in state
      setMatchingBillboards(results);
      setShowBillboardResults(true);

      // Add assistant message with summary
      const resultsMessage: Message = {
        role: 'assistant',
        content: `🎯 تم العثور على ${results.length} لوحة إعلانية مطابقة!\n\nإليك أفضل الخيارات: \n${results
          .slice(0, 3)
          .map(
            (b, i) =>
              `${i + 1}. ${b.location} (${b.city}) - التكلفة الشهرية: $${b.monthlyCost} - نسبة التطابق: ${b.matches}%`
          )
          .join('\n')}`,
        timestamp: new Date(),
        data: results,
      };

      setMessages(prev => [...prev, resultsMessage]);
    } catch (err: any) {
      console.error('❌ Error matching billboards:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: `⚠️ حدث خطأ أثناء البحث عن اللوحات: ${err.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingMatches(false);
    }
  };

  // Reset conversation
  const handleReset = () => {
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    setMessages([{
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي لاختيار اللوحات الإعلانية. سأسألك 5 أسئلة لمساعدتك في العثور على أفضل اللوحات المناسبة لحملتك.',
      timestamp: new Date()
    }, {
      role: 'assistant',
      content: '**السؤال الأول:** ما هو اسم الحملة الإعلانية؟',
      timestamp: new Date()
    }]);
    setCampaignData({
      campaignName: '',
      duration: '',
      targetAudience: '',
      budget: '',
      city: '',
      isComplete: false
    });
    setCurrentQuestionIndex(0);
    setShowBillboardResults(false);
    setMatchingBillboards([]);
    setApiStatus('');
  };

  // Test API connection
  const testApiConnection = async () => {
    setApiStatus('🔄 جاري اختبار الاتصال...');
    
    try {
      await fetchAPI('/');
      setApiStatus('✅ متصل بالخادم بنجاح!');
    } catch (error: any) {
      setApiStatus(`❌ فشل الاتصال: ${error.message}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // View billboard details
  const handleViewDetails = (billboard: Billboard) => {
    setSelectedBillboard(billboard);
    setIsDetailDialogOpen(true);
  };

  return (
  <div className="flex flex-col h-[85vh] w-full max-w-6xl mx-auto bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
    {/* Header - Fixed at top */}
    <div className="bg-gradient-to-r from-gray-900 to-black p-5 flex items-center justify-between border-b border-gray-800">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center shadow-lg border border-gray-700">
            <Bot className="w-7 h-7 text-blue-400" />
          </div>
        </div>
        <div className="flex flex-col">
          <h2 className="font-bold text-white text-xl">مساعد اللوحات الإعلانية الذكي</h2>
          <p className="text-sm text-gray-400">
            {currentQuestionIndex < questions.length 
              ? `السؤال ${currentQuestionIndex + 1} من ${questions.length}` 
              : campaignData.isComplete ? 'البحص عن اللوحات' : 'محادثة حرة'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={testApiConnection}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
          title="اختبار الاتصال"
        >
          <AlertCircle className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleReset}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
          title="محادثة جديدة"
          disabled={isLoading || isGeneratingMatches}
        >
          <RefreshCcw className="w-5 h-5" />
        </Button>
      </div>
    </div>

    {/* API Status - Fixed */}
    {apiStatus && (
      <div className={`px-5 py-2 ${
        apiStatus.includes('✅') ? 'bg-green-900/30' : 
        apiStatus.includes('❌') ? 'bg-red-900/30' : 
        'bg-yellow-900/30'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs">
          {apiStatus.includes('✅') ? (
            <span className="text-green-400">✓</span>
          ) : apiStatus.includes('❌') ? (
            <span className="text-red-400">✗</span>
          ) : (
            <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
          )}
          <span className={
            apiStatus.includes('✅') ? 'text-green-400' : 
            apiStatus.includes('❌') ? 'text-red-400' : 
            'text-yellow-400'
          }>
            {apiStatus}
          </span>
        </div>
      </div>
    )}

    {/* ==================== MAIN SCROLLABLE CONTENT AREA ==================== */}
    <div className="flex-1 overflow-y-auto"> {/* This makes EVERYTHING scroll */}
      {/* Campaign Summary */}
      {campaignData.isComplete && !showBillboardResults && (
        <div className="px-5 py-3 bg-blue-900/20 border-b border-blue-800">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-blue-700">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">اكتملت المعلومات!</h3>
                      <p className="text-sm text-gray-300">جاري البحث عن اللوحات المطابقة...</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-600 text-white">
                    {isGeneratingMatches ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : null}
                    {isGeneratingMatches ? 'جاري البحث...' : 'جاهز'}
                  </Badge>
                </div>
                
                {/* Campaign Data Summary */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(campaignData)
                    .filter(([key]) => key !== 'isComplete')
                    .map(([key, value]) => (
                      <div key={key} className="text-center p-2 bg-gray-900/50 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">
                          {key === 'campaignName' ? 'اسم الحملة' :
                           key === 'duration' ? 'المدة' :
                           key === 'targetAudience' ? 'الجمهور' :
                           key === 'budget' ? 'الميزانية' : 'المدينة'}
                        </div>
                        <div className="text-white font-medium truncate">{value || 'غير محدد'}</div>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Billboard Results Display */}
      {showBillboardResults && (
        <div className="px-5 py-4 bg-gradient-to-b from-gray-900 to-black border-b border-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">🎯 اللوحات الإعلانية المطابقة</h2>
                <p className="text-gray-400">
                  تم العثور على <span className="text-green-400 font-bold">{matchingBillboards.length}</span> لوحة مطابقة لشروط حملتك
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowBillboardResults(false)}
                className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4 ml-2" />
                إخفاء النتائج
              </Button>
            </div>
            
            {matchingBillboards.length === 0 ? (
              <Card className="bg-gray-900/50 border-gray-700">
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">لم يتم العثور على لوحات مطابقة</h3>
                  <p className="text-gray-400">حاول تعديل شروط البحث أو زيادة الميزانية للحصول على نتائج أفضل.</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {matchingBillboards.map((billboard) => (
                  <Card key={billboard.id} className="bg-gray-900/50 border-gray-700 hover:border-blue-500 transition-all">
                    <div className="p-4">
                      {/* Match Score */}
                      <div className="absolute top-3 right-3">
                        <Badge className={`${
                          billboard.matches >= 80 ? 'bg-green-900 text-green-300' :
                          billboard.matches >= 70 ? 'bg-yellow-900 text-yellow-300' :
                          'bg-blue-900 text-blue-300'
                        } font-bold`}>
                          {billboard.matches}% تطابق
                        </Badge>
                      </div>
                      
<h3 className="text-lg font-bold text-white mb-3 truncate">
  {billboard.name || `لوحة ${billboard.id}`}
</h3>                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-gray-400">الموقع</div>
                            <div className="text-white text-sm">{billboard.location}</div>
                            <div className="text-xs text-gray-500">{billboard.city}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="text-xs text-gray-400">حركة المرور</div>
                            <div className="text-white text-sm">{billboard.dailyTraffic.toLocaleString()} سيارة/يوم</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <div>
                            <div className="text-xs text-gray-400">التكلفة الشهرية</div>
                            <div className="text-white text-sm"> ${billboard.monthlyCost.toLocaleString()} 
      {billboard.monthlyCost === 1000 && (
        <span className="text-yellow-500 text-xs mr-2">⚠️</span>
      )}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <div>
                            <div className="text-xs text-gray-400">معدل المشاهدة</div>
                            <div className="text-white text-sm">{billboard.visibilityScore}/10</div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleViewDetails(billboard)}
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm py-2"
                      >
                        <Eye className="w-4 h-4 ml-2" />
                        رؤية التفاصيل
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-4 pb-20">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-green-600 text-white'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              
              <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white ml-auto rounded-tr-none'
                    : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed text-sm">
                    {msg.content}
                  </div>
                </div>
                
                <div className={`text-xs text-gray-500 mt-1 ${msg.role === 'user' ? 'text-right mr-2' : 'ml-2'}`}>
                  {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-600 text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="rounded-2xl px-4 py-3 max-w-[85%] bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm">جاري الكتابة...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {isGeneratingMatches && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-600 text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="rounded-2xl px-4 py-3 max-w-[85%] bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                    <span className="text-sm">جاري البحث عن اللوحات المطابقة...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>


    {/* Input Area - Fixed at bottom */}
    <div className="p-4 border-t border-gray-800 bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              currentQuestionIndex < questions.length 
                ? `اكتب إجابة السؤال ${currentQuestionIndex + 1}...`
                : "اكتب رسالتك هنا..."
            }
            disabled={isLoading || isGeneratingMatches}
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 rounded-xl"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || isGeneratingMatches}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 ml-2" />
                إرسال
              </>
            )}
          </Button>
        </div>
        
        {/* Progress */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                showBillboardResults ? 'bg-green-500' : 
                campaignData.isComplete ? 'bg-blue-500' : 
                currentQuestionIndex > 0 ? 'bg-yellow-500' : 
                'bg-gray-500'
              }`}></div>
              <span>
                {showBillboardResults ? 'عرض النتائج' : 
                 campaignData.isComplete ? 'اكتمل الاستبيان' : 
                 currentQuestionIndex > 0 ? `السؤال ${currentQuestionIndex + 1}/${questions.length}` : 
                 'جاري المحادثة'}
              </span>
            </div>
            
            {campaignData.campaignName && (
              <span className="text-blue-400">
                حملة: {campaignData.campaignName.substring(0, 15)}...
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {currentQuestionIndex < questions.length 
              ? `${currentQuestionIndex + 1}/${questions.length} أسئلة`
              : 'محادثة حرة'}
          </div>
        </div>
      </div>
    </div>

    {/* Billboard Detail Dialog - Keep as is */}
    {isDetailDialogOpen && selectedBillboard && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
<div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-red-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">تفاصيل اللوحة #{selectedBillboard.id}</h2>
                    <p className="text-gray-400 text-sm">معلومات كاملة عن اللوحة المختارة</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                  size="icon"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Match Score */}
              <div className="p-4 bg-gray-800/50 rounded-xl mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg text-white">نسبة التطابق مع متطلباتك</h4>
                    <p className="text-gray-400 text-sm">بناءً على المدينة، الميزانية، الجمهور المستهدف</p>
                  </div>
                  <div className={`text-3xl font-bold ${
                    selectedBillboard.matches >= 80 ? 'text-green-400' :
                    selectedBillboard.matches >= 70 ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    {selectedBillboard.matches}%
                  </div>
                </div>
              </div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Location Info */}
                <Card className="bg-gray-800/30 border-gray-700">
                  <div className="p-4">
                    <h5 className="font-bold text-white mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-400" />
                      معلومات الموقع
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-400">الموقع</div>
                        <div className="text-white font-medium">{selectedBillboard.location}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">المدينة</div>
                        <div className="text-white font-medium">{selectedBillboard.city}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">مستوى الأهمية</div>
                        <Badge className={
                          selectedBillboard.importance === 'عالية جداً' ? 'bg-red-900/50 text-red-300' :
                          selectedBillboard.importance === 'عالية' ? 'bg-orange-900/50 text-orange-300' :
                          'bg-blue-900/50 text-blue-300'
                        }>
                          {selectedBillboard.importance}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Financial Info */}
                <Card className="bg-gray-800/30 border-gray-700">
                  <div className="p-4">
                    <h5 className="font-bold text-white mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      المعلومات المالية
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-400">التكلفة الشهرية</div>
                        <div className="text-white font-medium text-xl">${selectedBillboard.monthlyCost.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">التكلفة اليومية</div>
                        <div className="text-white font-medium">${(selectedBillboard.monthlyCost / 30).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">التكلفة لكل 1000 مشاهدة</div>
                        <div className="text-white font-medium">
                          ${((selectedBillboard.monthlyCost * 1000) / (selectedBillboard.dailyTraffic * 30)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Audience & Traffic */}
                <Card className="bg-gray-800/30 border-gray-700">
                  <div className="p-4">
                    <h5 className="font-bold text-white mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      الجمهور والحركة
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-400">حركة المرور اليومية</div>
                        <div className="text-white font-medium text-xl">{selectedBillboard.dailyTraffic.toLocaleString()} سيارة</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">الحركة الشهرية</div>
                        <div className="text-white font-medium">{(selectedBillboard.dailyTraffic * 30).toLocaleString()} سيارة</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">نوع الجمهور</div>
                        <div className="text-white font-medium">{selectedBillboard.audienceType}</div>
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Quality & Performance */}
                <Card className="bg-gray-800/30 border-gray-700">
                  <div className="p-4">
                    <h5 className="font-bold text-white mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      الجودة والأداء
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-400">معدل المشاهدة</div>
                        <div className="flex items-center gap-2">
                          <div className="text-white font-medium text-xl">{selectedBillboard.visibilityScore}/10</div>
                          <div className="flex">
                            {[...Array(10)].map((_, i) => (
                              <Star 
                                key={i}
                                className={`w-3 h-3 ${
                                  i < selectedBillboard.visibilityScore 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">نوع اللوحة</div>
                        <div className="text-white font-medium">{selectedBillboard.type}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">مقاس اللوحة</div>
                        <div className="text-white font-medium">{selectedBillboard.size || '10x5 أمتار'}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <Button
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600"
                >
                  إغلاق
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  حجز هذه اللوحة
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  تحميل تقرير مفصل
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
