// ChatInterface.tsx - UPDATED FOR NEW API RESPONSE STRUCTURE
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCcw, Loader2, AlertCircle, ChevronDown, FileText, Download, CheckCircle, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// External AI API URL
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
  // New structure doesn't have these fields:
  // customer_data?: Record<string, any>;
  // mode?: string;
  // data_collection_complete?: boolean;
  // recommendations?: any[];
  // summary?: any;
}

interface ReportResponse {
  status: string;
  message: string;
  session_id: string;
  timestamp: string;
  reports_summary: {
    total_reports: number;
    report_types: string[];
    total_size_bytes: number;
    total_size_human: string;
  };
  reports: {
    docx: {
      filename: string;
      file_path: string;
      download_url: string;
      size_bytes: number;
      size_human: string;
      type: string;
    };
    pdf: {
      filename: string;
      file_path: string;
      download_url: string;
      size_bytes: number;
      size_human: string;
      type: string;
    };
    pdf_from_docx: {
      filename: string;
      file_path: string;
      download_url: string;
      size_bytes: number;
      size_human: string;
      type: string;
    };
  };
  download_links: {
    docx: string;
    pdf: string;
    pdf_from_docx: string;
  };
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي للوحات الإعلانية. ما اسمك؟',
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  const [apiStatus, setApiStatus] = useState<string>('');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reportsData, setReportsData] = useState<ReportResponse | null>(null);
  const [showReports, setShowReports] = useState(false);
  const [generatingReports, setGeneratingReports] = useState(false);
  const [customerData, setCustomerData] = useState<Record<string, any>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle scroll events
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

  // Simple fetch function
  const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
    const fullUrl = `${AI_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    console.log(`📤 Request to: ${fullUrl}`);

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

  // Extract customer data from conversation
  const extractCustomerData = (userMessage: string, aiResponse: string) => {
    // Simple pattern matching for customer data
    const patterns = {
      name: /اسمي\s+(.+)|اسمي\s+(.+)$/i,
      phone: /(\d{10,15})|رقم\s+(.+)/i,
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      location: /(القاهرة|الجيزة|الاسكندرية|المنصورة|طنطا|الشرقية|الدلتا)/i,
      campaign_type: /(حملة جديدة|تحليل حملة|حملة موجودة)/i
    };

    const newData: Record<string, any> = {};

    // Check user message
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = userMessage.match(pattern as RegExp);
      if (match && match[1]) {
        newData[key] = match[1].trim();
      }
    }

    // Check AI response for confirmation
    if (aiResponse.includes('تم') || aiResponse.includes('حفظ') || aiResponse.includes('تأكيد')) {
      // Extract confirmed data from AI response
      const confirmedMatch = aiResponse.match(/اسم[:\s]+(.+?)\.|رقم[:\s]+(.+?)\./);
      if (confirmedMatch) {
        if (confirmedMatch[1]) newData.name = confirmedMatch[1].trim();
        if (confirmedMatch[2]) newData.phone = confirmedMatch[2].trim();
      }
    }

    return newData;
  };

  // Check if we have enough data to show confirmation
  const checkDataCompletion = () => {
    // Show confirmation when we have at least name and one other piece of info
    const hasName = customerData.name && customerData.name.length > 0;
    const hasPhone = customerData.phone && customerData.phone.length > 0;
    const hasEmail = customerData.email && customerData.email.length > 0;
    const hasCampaignType = customerData.campaign_type && customerData.campaign_type.length > 0;
    
    const hasEnoughData = hasName && (hasPhone || hasEmail || hasCampaignType);
    
    if (hasEnoughData && !showConfirmation && !showReports) {
      setShowConfirmation(true);
    }
    
    return hasEnoughData;
  };

  // Call the Chat API
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
      console.log('✅ Chat API response:', data);
      setApiStatus('✅ تم استلام الرد من الذكاء الاصطناعي');
      
      // Extract customer data from conversation
      const extractedData = extractCustomerData(userMessage, data.response);
      if (Object.keys(extractedData).length > 0) {
        const updatedData = { ...customerData, ...extractedData };
        setCustomerData(updatedData);
        
        // Check if we have enough data for confirmation
        setTimeout(() => {
          checkDataCompletion();
        }, 500);
      }
      
      return data;

    } catch (error: any) {
      console.error('❌ Chat API error:', error);
      setApiStatus(`❌ خطأ في الذكاء الاصطناعي: ${error.message}`);
      
      // Fallback response
      return {
        session: sessionId,
        response: 'مرحباً! عذراً، هناك مشكلة في الاتصال. يرجى المحاولة مرة أخرى.',
        timestamp: new Date().toISOString()
      };
    }
  };

  // Call the Generate Reports API
  const generateReports = async () => {
    setGeneratingReports(true);
    setApiStatus('📄 جاري إنشاء التقارير...');
    
    const requestData = {
      session_id: sessionId,
      customer_data: customerData // Send collected data to backend
    };

    try {
      const response = await fetchAPI('/api/generate-reports', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      const data: ReportResponse = await response.json();
      console.log('✅ Reports API response:', data);
      
      if (data.status === 'success') {
        setApiStatus('✅ تم إنشاء التقارير بنجاح!');
        setReportsData(data);
        setShowReports(true);
        setShowConfirmation(false);
        
        // Add a message about successful report generation
        const reportMessage: Message = {
          role: 'assistant',
          content: `✅ **تم إنشاء التقارير بنجاح!**\n\n📊 **ملخص التقارير:**\n• عدد التقارير: ${data.reports_summary.total_reports}\n• أنواع التقارير: ${data.reports_summary.report_types.join(', ')}\n• الحجم الإجمالي: ${data.reports_summary.total_size_human}\n\n⬇️ يمكنك تحميل التقارير من الأسفل.`,
          timestamp: new Date(),
          data: data
        };
        
        setMessages(prev => [...prev, reportMessage]);
      } else {
        setApiStatus('❌ فشل في إنشاء التقارير');
      }
      
      return data;

    } catch (error: any) {
      console.error('❌ Reports API error:', error);
      setApiStatus(`❌ خطأ في إنشاء التقارير: ${error.message}`);
      
      // Show error message
      const errorMessage: Message = {
        role: 'assistant',
        content: `⚠️ **عذراً، حدث خطأ في إنشاء التقارير:**\n${error.message}\n\nيرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return null;
      
    } finally {
      setGeneratingReports(false);
    }
  };

  // Handle confirmation button click
  const handleConfirmation = async () => {
    await generateReports();
  };

  // Handle downloading a file
  const handleDownload = (url: string, filename: string) => {
    // Replace localhost:8000 with the actual API base URL
    const correctedUrl = url.replace('http://localhost:8000', AI_BASE_URL);
    
    console.log('📥 Downloading:', correctedUrl);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = correctedUrl;
    link.download = filename;
    link.target = '_blank'; // Open in new tab for PDF/DOCX files
    
    // Add to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      const apiResponse = await callChatAPI(userInput);

      // Update session ID if changed
      if (apiResponse.session && apiResponse.session !== sessionId) {
        setSessionId(apiResponse.session);
      }

      // Create AI message
      const aiMessage: Message = {
        role: 'assistant',
        content: apiResponse.response,
        timestamp: new Date(),
        data: apiResponse
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      console.error('❌ General error:', error);
      
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

  // Reset conversation
  const handleReset = () => {
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    setMessages([{
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي للوحات الإعلانية. ما اسمك؟',
      timestamp: new Date()
    }]);
    setApiStatus('');
    setShowConfirmation(false);
    setShowReports(false);
    setReportsData(null);
    setCustomerData({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  // Format customer data for display
  const formatCustomerData = () => {
    return Object.entries(customerData)
      .filter(([_, value]) => value && value.toString().trim().length > 0)
      .map(([key, value]) => ({
        key,
        value: value.toString().trim(),
        label: {
          name: 'الاسم',
          phone: 'رقم الهاتف',
          email: 'البريد الإلكتروني',
          location: 'الموقع',
          campaign_type: 'نوع الحملة'
        }[key] || key
      }));
  };

  return (
    <div className="flex flex-col h-[85vh] w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black p-5 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center shadow-lg border border-gray-700">
              <Bot className="w-7 h-7 text-blue-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-white text-xl">مساعد اللوحات الإعلانية الذكي</h2>
            <p className="text-sm text-gray-400">API متصل: {AI_BASE_URL}</p>
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
            disabled={isLoading || generatingReports}
          >
            <RefreshCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* API Status */}
      {apiStatus && (
        <div className={`px-5 py-2 ${
          apiStatus.includes('✅') ? 'bg-green-900/30' : 
          apiStatus.includes('❌') ? 'bg-red-900/30' : 
          'bg-yellow-900/30'
        }`}>
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs">
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

      {/* Confirmation Button (when data collection is complete) */}
      {showConfirmation && formatCustomerData().length >= 2 && (
        <div className="px-5 py-3 bg-blue-900/30 border-b border-blue-800">
          <div className="max-w-3xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">هل أنت متأكد من المعلومات المدخلة؟</h3>
                      <p className="text-sm text-gray-300">تم جمع معلوماتك بنجاح. اضغط على الزر لإنشاء التقارير.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleConfirmation}
                    disabled={generatingReports}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2"
                  >
                    {generatingReports ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        تأكيد المعلومات وإنشاء التقارير
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Show customer data summary */}
                <div className="mt-4 pt-4 border-t border-blue-800">
                  <h4 className="text-sm font-medium text-blue-300 mb-2">المعلومات المجمعة:</h4>
                  <div className="flex flex-wrap gap-2">
                    {formatCustomerData().map((item) => (
                      <Badge key={item.key} className="bg-blue-800/50 text-blue-200 border-blue-700">
                        {item.label}: {item.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Reports Display */}
      {showReports && reportsData && (
        <div className="px-5 py-3 bg-green-900/20 border-b border-green-800">
          <div className="max-w-3xl mx-auto">
            <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">تم إنشاء التقارير بنجاح! ✅</h3>
                      <p className="text-sm text-gray-300">يمكنك تحميل التقارير الآن.</p>
                    </div>
                  </div>
                  <Badge className="bg-green-800 text-green-200">
                    {reportsData.reports_summary.total_reports} تقرير
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* DOCX Report */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <File className="w-5 h-5 text-blue-400" />
                          <span className="font-medium text-white">تقرير DOCX</span>
                        </div>
                        <Badge className="bg-blue-800/50 text-blue-200 text-xs">
                          {reportsData.reports.docx.size_human}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">مستند Word قابل للتعديل</p>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => handleDownload(
                            reportsData.download_links.docx.replace('http://localhost:8000', AI_BASE_URL),
                            reportsData.reports.docx.filename
                          )}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          تحميل DOCX
                        </Button>
                        <Button 
                          onClick={() => window.open(
                            reportsData.download_links.docx.replace('http://localhost:8000', AI_BASE_URL),
                            '_blank'
                          )}
                          variant="outline"
                          className="w-full border-blue-600 text-blue-400 hover:bg-blue-900/30 text-xs"
                          size="sm"
                        >
                          فتح في نافذة جديدة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* PDF Report */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <File className="w-5 h-5 text-red-400" />
                          <span className="font-medium text-white">تقرير PDF</span>
                        </div>
                        <Badge className="bg-red-800/50 text-red-200 text-xs">
                          {reportsData.reports.pdf.size_human}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">مستند PDF عالي الجودة</p>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => handleDownload(
                            reportsData.download_links.pdf.replace('http://localhost:8000', AI_BASE_URL),
                            reportsData.reports.pdf.filename
                          )}
                          className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          تحميل PDF
                        </Button>
                        <Button 
                          onClick={() => window.open(
                            reportsData.download_links.pdf.replace('http://localhost:8000', AI_BASE_URL),
                            '_blank'
                          )}
                          variant="outline"
                          className="w-full border-red-600 text-red-400 hover:bg-red-900/30 text-xs"
                          size="sm"
                        >
                          فتح في نافذة جديدة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* PDF from DOCX Report */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <File className="w-5 h-5 text-purple-400" />
                          <span className="font-medium text-white">تقرير PDF (من DOCX)</span>
                        </div>
                        <Badge className="bg-purple-800/50 text-purple-200 text-xs">
                          {reportsData.reports.pdf_from_docx.size_human}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">نسخة PDF من مستند Word</p>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => handleDownload(
                            reportsData.download_links.pdf_from_docx.replace('http://localhost:8000', AI_BASE_URL),
                            reportsData.reports.pdf_from_docx.filename
                          )}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          تحميل PDF
                        </Button>
                        <Button 
                          onClick={() => window.open(
                            reportsData.download_links.pdf_from_docx.replace('http://localhost:8000', AI_BASE_URL),
                            '_blank'
                          )}
                          variant="outline"
                          className="w-full border-purple-600 text-purple-400 hover:bg-purple-900/30 text-xs"
                          size="sm"
                        >
                          فتح في نافذة جديدة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary */}
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">عدد التقارير</span>
                      <span className="font-bold text-lg text-white">{reportsData.reports_summary.total_reports}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">أنواع التقارير</span>
                      <span className="font-bold text-lg text-emerald-400">
                        {reportsData.reports_summary.report_types.length}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">الحجم الإجمالي</span>
                      <span className="font-bold text-lg text-blue-400">
                        {reportsData.reports_summary.total_size_human}
                      </span>
                    </div>
                  </div>
                  
                  {/* Customer Data Summary */}
                  {formatCustomerData().length > 0 && (
                    <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                      <div className="text-xs text-gray-400 mb-2">البيانات المستخدمة:</div>
                      <div className="flex flex-wrap gap-2">
                        {formatCustomerData().map((item) => (
                          <Badge key={item.key} className="bg-gray-700 text-gray-300 text-xs">
                            {item.label}: {item.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="relative flex-1 overflow-hidden">
        <ScrollArea 
          ref={scrollAreaRef}
          className="h-full p-4 md:p-6"
        >
          <div className="max-w-3xl mx-auto space-y-4 pb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-green-600 text-white'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                
                <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className="mb-1">
                    <span className="font-semibold text-sm text-gray-300">
                      {msg.role === 'user' ? 'أنت' : 'المساعد الذكي'}
                    </span>
                    <span className="text-xs text-gray-500 mr-2">
                      {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white ml-auto rounded-tr-none'
                      : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                    
                    {/* Display extracted data if available */}
                    {formatCustomerData().length > 0 && idx === messages.length - 1 && msg.role === 'assistant' && (
                      <div className="mt-3 pt-3 border-t border-gray-700 text-xs">
                        <div className="text-gray-400 mb-1">المعلومات المجمعة:</div>
                        <div className="flex flex-wrap gap-2">
                          {formatCustomerData().map((item) => (
                            <Badge key={item.key} className="bg-gray-700 text-gray-300">
                              {item.label}: {item.value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-green-600 text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="mb-1">
                    <span className="font-semibold text-sm text-gray-300">المساعد الذكي</span>
                  </div>
                  <div className="rounded-2xl px-4 py-3 max-w-[85%] bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-sm">جاري الكتابة...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Scroll to Bottom Button */}
        {showScrollToBottom && (
          <Button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-6 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 shadow-lg z-10"
            size="icon"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Input Area */}
      <div className="p-5 border-t border-gray-800 bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا..."
              disabled={isLoading || generatingReports}
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 rounded-xl"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || generatingReports}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 ml-2" />
                  إرسال
                </>
              )}
            </Button>
          </div>
          
          {/* Session Info */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  showReports ? 'bg-green-500' : 
                  showConfirmation ? 'bg-yellow-500' : 
                  'bg-blue-500'
                }`}></div>
                <span>
                  {showReports ? 'التقارير جاهزة' : 
                   showConfirmation ? 'بانتظار التأكيد' : 
                   'جاري المحادثة'}
                </span>
              </div>
              {formatCustomerData().length > 0 && (
                <span className="text-blue-400">
                  {formatCustomerData().length} معلومة
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span>ID: {sessionId.substring(0, 8)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}