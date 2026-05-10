  import React, { useState, useEffect } from 'react'
  import { 
    useGetRoadSignsQuery 
  } from '../RtkQuery/Slice/RoadSings/RoadSingsApi'
  import { 
    useGetTemplatesByLocationQuery  // Only import what you need
  } from '../RtkQuery/Slice/Template/TemplateApi'  
  import {
    useGetCitiesQuery,
    useGetRegionsQuery
  } from '../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi'

  export default function AdminAi() {
    // State for current step and answers
    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState({
      campaign_name: '',
      start_date: '',
      end_date: '',
      city_id: '',
      region_id: '',
      template_id: '',
      is_ai: true
    })
    const [errors, setErrors] = useState({})
    const [filteredRegions, setFilteredRegions] = useState([])
    const [roadSignsData, setRoadSignsData] = useState([])
    const [isComplete, setIsComplete] = useState(false)
    const [shouldFetchRoadSigns, setShouldFetchRoadSigns] = useState(false)
    const [selectedSigns, setSelectedSigns] = useState([])
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [selectedSignForDetails, setSelectedSignForDetails] = useState(null)
    const [isTyping, setIsTyping] = useState(false)

    // Fetch hooks
    const { data: cities = [] } = useGetCitiesQuery()
    const { data: regions = [], isLoading: isLoadingRegions } = useGetRegionsQuery()
    
    // Fetch templates based on city and region - FIXED: removed refetch (typo was refatch)
    const { 
      data: templates = [], 
      isFetching: isFetchingTemplates,
      refetch: refetchTemplates  // Fixed: changed from refatch to refetch
    } = useGetTemplatesByLocationQuery(
      { 
        city_id: answers.city_id, 
        region_id: answers.region_id
      },
      { 
        skip: !answers.city_id || !answers.region_id // Only fetch when both are selected
      }
    )

    // Fetch road signs with AI results
    const { data: roadSignsResponse, error: roadSignsError, isFetching: isFetchingRoadSigns } = useGetRoadSignsQuery(
      {
        start_date: answers.start_date,
        end_date: answers.end_date,
        city_id: answers.city_id,
        region_id: answers.region_id,
        template_id: answers.template_id,
        is_ai: true
      },
      { 
        skip: !shouldFetchRoadSigns,
      }
    )

    // Filter regions when city changes
    useEffect(() => {
      if (answers.city_id && regions.length > 0) {
        const filtered = regions.filter(region => region.city_id === parseInt(answers.city_id))
        setFilteredRegions(filtered)
        // Reset region and template when city changes
        setAnswers(prev => ({
          ...prev,
          region_id: '',
          template_id: ''
        }))
      } else {
        setFilteredRegions([])
      }
    }, [answers.city_id, regions])

    // Refetch templates when region changes - FIXED: Now using correct refetchTemplates
    useEffect(() => {
      if (answers.city_id && answers.region_id) {
        refetchTemplates()
      }
    }, [answers.region_id, answers.city_id, refetchTemplates])

    // Watch for roadSigns data changes
    useEffect(() => {
      if (roadSignsResponse) {
        console.log('Road signs response:', roadSignsResponse)
        
        // Handle different response structures
        let signsArray = []
        
        if (Array.isArray(roadSignsResponse)) {
          signsArray = roadSignsResponse
        } else if (roadSignsResponse?.data && Array.isArray(roadSignsResponse.data)) {
          signsArray = roadSignsResponse.data
        } else if (roadSignsResponse?.results && Array.isArray(roadSignsResponse.results)) {
          signsArray = roadSignsResponse.results
        } else if (roadSignsResponse && typeof roadSignsResponse === 'object') {
          signsArray = [roadSignsResponse]
        }
        
        console.log('Processed signs array:', signsArray)
        setRoadSignsData(signsArray)
        setIsComplete(true)
        setShouldFetchRoadSigns(false)
      }
    }, [roadSignsResponse])

    // Watch for errors
    useEffect(() => {
      if (roadSignsError) {
        console.error('Error fetching road signs:', roadSignsError)
        setErrors({ submit: 'فشل في جلب بيانات اللوحات. الرجاء المحاولة مرة أخرى.' })
        setShouldFetchRoadSigns(false)
      }
    }, [roadSignsError])

    // Simulate AI typing
    useEffect(() => {
      if (!isComplete && currentStep < questions.length) {
        setIsTyping(true)
        const timer = setTimeout(() => {
          setIsTyping(false)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }, [currentStep, isComplete])

    // Chat bot questions in Arabic
    const questions = [
      {
        id: 'campaign',
        title: 'ما هي اسم الحملة؟',
        icon: '📋',
        field: {
          name: 'campaign_name',
          label: 'اسم الحملة',
          type: 'text',
          placeholder: 'أدخل اسم الحملة',
          validation: (value) => !value ? 'اسم الحملة مطلوب' : null
        }
      },
      {
        id: 'dates',
        title: 'أدخل تاريخ البدء مع تاريخ الانتهاء',
        icon: '📅',
        fields: [
          {
            name: 'start_date',
            label: 'تاريخ البدء',
            type: 'date',
            validation: (value) => !value ? 'تاريخ البدء مطلوب' : null
          },
          {
            name: 'end_date',
            label: 'تاريخ الانتهاء',
            type: 'date',
            validation: (value, allValues) => {
              if (!value) return 'تاريخ الانتهاء مطلوب'
              if (allValues.start_date && new Date(value) <= new Date(allValues.start_date)) {
                return 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء'
              }
              return null
            }
          }
        ]
      },
      {
        id: 'city',
        title: 'ماهي المدينة؟',
        icon: '🏙️',
        field: {
          name: 'city_id',
          label: 'المدينة',
          type: 'select',
          options: cities.map(city => ({ value: city.id, label: city.name })),
          validation: (value) => !value ? 'الرجاء اختيار المدينة' : null
        }
      },
      {
        id: 'region',
        title: 'ماهي المنطقة؟',
        icon: '📍',
        field: {
          name: 'region_id',
          label: 'المنطقة',
          type: 'select',
          options: filteredRegions.map(region => ({ value: region.id, label: region.name })),
          validation: (value) => !value ? 'الرجاء اختيار المنطقة' : null,
          disabled: !answers.city_id || isLoadingRegions
        }
      },
      {
        id: 'template',
        title: 'اختر القالب المناسب لهذه المنطقة',
        icon: '🎨',
        field: {
          name: 'template_id',
          label: 'القالب',
          type: 'select',
          options: templates.map(template => ({ 
            value: template.id, 
            label: `${template.name || template.model} - ${template.size}`
          })),
          validation: (value) => !value ? 'الرجاء اختيار القالب' : null,
          disabled: !answers.region_id || isFetchingTemplates || templates.length === 0
        }
      }
    ]

    // Handle input changes
    const handleInputChange = (name, value) => {
      setAnswers(prev => {
        const newAnswers = { ...prev, [name]: value }
        
        // Reset dependent fields
        if (name === 'city_id') {
          newAnswers.region_id = ''
          newAnswers.template_id = ''
        }
        if (name === 'region_id') {
          newAnswers.template_id = ''
        }
        
        return newAnswers
      })

      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }))
      }
    }

    // Validate current step
    const validateCurrentStep = () => {
      const currentItem = questions[currentStep]
      const newErrors = {}
      let isValid = true

      if (currentItem.fields) {
        // For steps with multiple fields
        currentItem.fields.forEach(field => {
          const error = field.validation(answers[field.name], answers)
          if (error) {
            newErrors[field.name] = error
            isValid = false
          }
        })
      } else if (currentItem.field) {
        // For steps with single field
        const error = currentItem.field.validation(answers[currentItem.field.name], answers)
        if (error) {
          newErrors[currentItem.field.name] = error
          isValid = false
        }
      }

      setErrors(newErrors)
      return isValid
    }

    // Handle next step
    const handleNext = () => {
      if (validateCurrentStep()) {
        if (currentStep < questions.length - 1) {
          setCurrentStep(prev => prev + 1)
        } else {
          handleSubmit()
        }
      }
    }

    // Handle previous step
    const handlePrevious = () => {
      if (currentStep > 0) {
        setCurrentStep(prev => prev - 1)
        setErrors({})
      }
    }

    // Handle final submission
    const handleSubmit = () => {
      console.log('🚀 Submitting with answers:', answers)
      setShouldFetchRoadSigns(true)
    }

    // Reset the form
    const handleReset = () => {
      setCurrentStep(0)
      setAnswers({
        campaign_name: '',
        start_date: '',
        end_date: '',
        city_id: '',
        region_id: '',
        template_id: '',
        is_ai: true
      })
      setErrors({})
      setRoadSignsData([])
      setIsComplete(false)
      setFilteredRegions([])
      setShouldFetchRoadSigns(false)
      setSelectedSigns([])
    }

    // Toggle sign selection
    const toggleSignSelection = (signId) => {
      setSelectedSigns(prev => {
        if (prev.includes(signId)) {
          return prev.filter(id => id !== signId)
        } else {
          return [...prev, signId]
        }
      })
    }

    // Select all signs
    const selectAllSigns = () => {
      if (selectedSigns.length === roadSignsData.length) {
        setSelectedSigns([])
      } else {
        setSelectedSigns(roadSignsData.map(sign => sign.id))
      }
    }

    // Show details modal
    const showDetails = (sign) => {
      setSelectedSignForDetails(sign)
      setShowDetailsModal(true)
    }

    // Close details modal
    const closeDetailsModal = () => {
      setShowDetailsModal(false)
      setSelectedSignForDetails(null)
    }

    // Print selected road signs as PDF
  const printSelectedSigns = () => {
    if (selectedSigns.length === 0) return

    const selectedSignsData = roadSignsData.filter(sign => selectedSigns.includes(sign.id))
    
    // Create print content
    const printContent = document.createElement('div')
    printContent.className = 'print-content'
    printContent.style.cssText = `
      direction: rtl;
      font-family: 'Cairo', Arial, sans-serif;
      padding: 30px;
      color: #000000;
      background: #ffffff;
      max-width: 1200px;
      margin: 0 auto;
    `

    // Add title with styling
    const title = document.createElement('h1')
    title.style.cssText = `
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 20px;
      text-align: center;
      color: #000000;
      border-bottom: 3px solid #000000;
      padding-bottom: 15px;
    `
    title.textContent = `📊 تقرير اللوحات المحددة - ${answers.campaign_name}`
    printContent.appendChild(title)

    // Add date and summary
    const summaryDiv = document.createElement('div')
    summaryDiv.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 15px;
      background: #f5f5f5;
      border: 2px solid #000000;
      border-radius: 10px;
      color: #000000;
    `
    
    const dateSpan = document.createElement('div')
    const dateStrong = document.createElement('strong')
    dateStrong.textContent = '📅 تاريخ التقرير: '
    dateSpan.appendChild(dateStrong)
    dateSpan.appendChild(document.createTextNode(new Date().toLocaleDateString('ar-EG')))

    const countSpan = document.createElement('div')
    const countStrong = document.createElement('strong')
    countStrong.textContent = '🔢 عدد اللوحات: '
    countSpan.appendChild(countStrong)
    countSpan.appendChild(document.createTextNode(selectedSigns.length))

    const statusSpan = document.createElement('div')
    const statusStrong = document.createElement('strong')
    statusStrong.textContent = '📋 حالة التقرير: '
    statusSpan.appendChild(statusStrong)
    statusSpan.appendChild(document.createTextNode('تقرير مفصل بالتحليلات'))

    summaryDiv.appendChild(dateSpan)
    summaryDiv.appendChild(countSpan)
    summaryDiv.appendChild(statusSpan)
    printContent.appendChild(summaryDiv)

    // Add each selected sign
    selectedSignsData.forEach((sign, index) => {
      const signDiv = document.createElement('div')
      signDiv.style.cssText = `
        margin-bottom: 30px;
        padding: 25px;
        border: 2px solid #000000;
        border-radius: 15px;
        page-break-inside: avoid;
        background: #ffffff;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      `

      // Sign header with gradient background
      const header = document.createElement('div')
      header.style.cssText = `
        background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
        margin: -25px -25px 20px -25px;
        padding: 20px 25px;
        border-radius: 15px 15px 0 0;
        border-bottom: 2px solid #000000;
      `
      
      const headerTitle = document.createElement('h2')
      headerTitle.style.cssText = `
        font-size: 20px;
        font-weight: bold;
        color: #000000;
        margin: 0;
      `
      headerTitle.textContent = `${index + 1}. ${sign.roadsign_code || `لوحة #${sign.id}`}`
      
      const headerSubtitle = document.createElement('p')
      headerSubtitle.style.cssText = `
        font-size: 14px;
        color: #333333;
        margin: 5px 0 0 0;
      `
      headerSubtitle.textContent = `${sign.city?.name} • ${sign.region?.name}`
      
      header.appendChild(headerTitle)
      header.appendChild(headerSubtitle)
      signDiv.appendChild(header)

      if (sign.ai_results) {
        // Key metrics grid
        const metricsGrid = document.createElement('div')
        metricsGrid.style.cssText = `
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        `

        const metrics = [
          { 
            label: 'المشاهدات اليومية', 
            value: sign.ai_results.daily_views_estimate?.toLocaleString() || 'N/A',
            icon: '👁️'
          },
          { 
            label: 'المشاهدات الشهرية', 
            value: sign.ai_results.monthly_views_estimate?.toLocaleString() || 'N/A',
            icon: '📈'
          },
          { 
            label: 'المركبات/اليوم', 
            value: sign.ai_results.vehicles_per_day?.toLocaleString() || 'N/A',
            icon: '🚗'
          },
          { 
            label: 'معدل المشاهدة', 
            value: sign.ai_results.view_rate_per_vehicle || 'N/A',
            icon: '📊'
          }
        ]

        metrics.forEach(metric => {
          const metricDiv = document.createElement('div')
          metricDiv.style.cssText = `
            padding: 15px;
            border: 2px solid #000000;
            text-align: center;
            background: #f9f9f9;
            border-radius: 10px;
          `
          
          // Create icon element
          const iconDiv = document.createElement('div')
          iconDiv.style.cssText = `font-size: 20px; margin-bottom: 5px;`
          iconDiv.textContent = metric.icon
          
          // Create label element
          const labelDiv = document.createElement('div')
          labelDiv.style.cssText = `font-size: 12px; font-weight: bold; margin-bottom: 5px; color: #333333;`
          labelDiv.textContent = metric.label
          
          // Create value element
          const valueDiv = document.createElement('div')
          valueDiv.style.cssText = `font-size: 16px; font-weight: 800; color: #000000;`
          valueDiv.textContent = metric.value
          
          metricDiv.appendChild(iconDiv)
          metricDiv.appendChild(labelDiv)
          metricDiv.appendChild(valueDiv)
          metricsGrid.appendChild(metricDiv)
        })

        signDiv.appendChild(metricsGrid)

        // Location and audience
        const infoGrid = document.createElement('div')
        infoGrid.style.cssText = `
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        `

        const locationDiv = document.createElement('div')
        locationDiv.style.cssText = `
          padding: 15px;
          border: 2px solid #000000;
          background: #f9f9f9;
          border-radius: 10px;
        `
        
        const locationIcon = document.createElement('div')
        locationIcon.style.cssText = `font-size: 18px; margin-bottom: 5px;`
        locationIcon.textContent = '📍'
        
        const locationLabel = document.createElement('div')
        locationLabel.style.cssText = `font-weight: bold; margin-bottom: 5px; color: #333333;`
        locationLabel.textContent = 'نوع الموقع'
        
        const locationValue = document.createElement('div')
        locationValue.style.cssText = `color: #000000;`
        locationValue.textContent = formatArabicText(sign.ai_results.location_type)
        
        locationDiv.appendChild(locationIcon)
        locationDiv.appendChild(locationLabel)
        locationDiv.appendChild(locationValue)

        const audienceDiv = document.createElement('div')
        audienceDiv.style.cssText = `
          padding: 15px;
          border: 2px solid #000000;
          background: #f9f9f9;
          border-radius: 10px;
        `
        
        const audienceIcon = document.createElement('div')
        audienceIcon.style.cssText = `font-size: 18px; margin-bottom: 5px;`
        audienceIcon.textContent = '🎯'
        
        const audienceLabel = document.createElement('div')
        audienceLabel.style.cssText = `font-weight: bold; margin-bottom: 5px; color: #333333;`
        audienceLabel.textContent = 'الجمهور المستهدف'
        
        const audienceValue = document.createElement('div')
        audienceValue.style.cssText = `color: #000000;`
        audienceValue.textContent = sign.ai_results.target_audience_text || 'N/A'
        
        audienceDiv.appendChild(audienceIcon)
        audienceDiv.appendChild(audienceLabel)
        audienceDiv.appendChild(audienceValue)

        infoGrid.appendChild(locationDiv)
        infoGrid.appendChild(audienceDiv)
        signDiv.appendChild(infoGrid)

        // Recommended ad types
        if (sign.ai_results.recommended_ad_types) {
          const recDiv = document.createElement('div')
          recDiv.style.cssText = `
            padding: 15px;
            border: 2px solid #000000;
            background: #f9f9f9;
            border-radius: 10px;
          `
          
          // Header
          const recHeader = document.createElement('div')
          recHeader.style.cssText = `display: flex; align-items: center; gap: 10px; margin-bottom: 10px;`
          
          const recIcon = document.createElement('span')
          recIcon.style.cssText = `font-size: 20px;`
          recIcon.textContent = '📢'
          
          const recTitle = document.createElement('span')
          recTitle.style.cssText = `font-weight: bold; color: #333333;`
          recTitle.textContent = 'أنواع الإعلانات الموصى بها'
          
          recHeader.appendChild(recIcon)
          recHeader.appendChild(recTitle)
          recDiv.appendChild(recHeader)
          
          // Content
          let recText = ''
          if (Array.isArray(sign.ai_results.recommended_ad_types)) {
            recText = sign.ai_results.recommended_ad_types.join(' • ')
          } else if (typeof sign.ai_results.recommended_ad_types === 'string') {
            recText = sign.ai_results.recommended_ad_types
          } else {
            recText = 'لا توجد توصيات'
          }
          
          const recContent = document.createElement('div')
          recContent.style.cssText = `color: #000000; font-size: 14px; line-height: 1.6;`
          recContent.textContent = recText
          
          recDiv.appendChild(recContent)
          signDiv.appendChild(recDiv)
        }
      }

      printContent.appendChild(signDiv)
    })

    // Add footer
    const footer = document.createElement('div')
    footer.style.cssText = `
      margin-top: 30px;
      padding-top: 20px;
      border-top: 3px solid #000000;
      text-align: center;
      font-size: 12px;
      color: #333333;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    `
    
    const createdBy = document.createElement('div')
    createdBy.textContent = 'تم الإنشاء بواسطة: المساعد الذكي'
    
    const totalCount = document.createElement('div')
    totalCount.textContent = `إجمالي اللوحات: ${selectedSigns.length}`
    
    const campaignName = document.createElement('div')
    campaignName.textContent = `حملة: ${answers.campaign_name}`
    
    footer.appendChild(createdBy)
    footer.appendChild(totalCount)
    footer.appendChild(campaignName)
    printContent.appendChild(footer)

    // Open print window and print
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>تقرير اللوحات المحددة - ${answers.campaign_name}</title>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          @media print {
            body { 
              margin: 0; 
              padding: 20px;
              background: white;
              color: black;
              font-family: 'Cairo', Arial, sans-serif;
            }
            .print-content {
              background: white;
              color: black;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 20px; background: white; color: black; font-family: 'Cairo', Arial, sans-serif;">
    `)
    
    // Append the printContent element's HTML
    printWindow.document.body.appendChild(printContent.cloneNode(true))
    
    printWindow.document.write(`
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }



    const getCityName = (cityId) => {
      const city = cities.find(c => c.id === parseInt(cityId))
      return city ? city.name : cityId
    }


    const getRegionName = (regionId) => {
      const region = regions.find(r => r.id === parseInt(regionId))
      return region ? region.name : regionId
    }

    // Format Arabic text
    const formatArabicText = (text) => {
      if (!text) return 'N/A'
      if (Array.isArray(text)) return text.join(' | ')
      if (typeof text === 'string') return text
      return JSON.stringify(text)
    }

    // Render chat message with typing animation
    const renderChatMessage = () => {
      const currentItem = questions[currentStep]
      
      return (
        <div className="space-y-6">
          {/* AI Message with typing animation */}
          <div className="flex items-start gap-4 animate-slideIn">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-700 rounded-2xl rounded-tr-none p-5 shadow-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{currentItem.icon}</span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">المساعد الذكي</span>
                </div>
                {isTyping ? (
                  <div className="flex gap-2 py-3">
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                ) : (
                  <p className="text-gray-800 dark:text-gray-100 text-lg">{currentItem.title}</p>
                )}
              </div>
            </div>
          </div>

          {/* User Response Area */}
          <div className="flex items-start gap-4 mr-16 animate-slideIn" style={{ animationDelay: '200ms' }}>
            <div className="relative order-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
            <div className="flex-1 order-1">
              <div className="bg-gray-50 dark:bg-gradient-to-r dark:from-gray-700 dark:to-gray-600 rounded-2xl rounded-tl-none p-5 shadow-xl border border-gray-200 dark:border-gray-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">أنت</span>
                </div>
                {currentItem.fields ? (
                  <div className="space-y-4">
                    {currentItem.fields.map(field => (
                      <div key={field.name} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {field.label}
                        </label>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    {renderField(currentItem.field)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Render field based on type
    const renderField = (field) => {
      if (field.type === 'select') {
        return (
          <div className="relative">
            <select
              value={answers[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              disabled={field.disabled}
              className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none ${
                errors[field.name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
              } ${field.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 dark:hover:border-blue-500'}`}
              dir="rtl"
            >
              <option value="" className="bg-white dark:bg-gray-700">
                {field.name === 'region_id' && !answers.city_id 
                  ? 'اختر المدينة أولاً' 
                  : field.name === 'template_id' && !answers.region_id
                  ? 'اختر المنطقة أولاً'
                  : field.name === 'template_id' && templates.length === 0 && answers.region_id
                  ? 'لا توجد قوالب متاحة لهذه المنطقة'
                  : `اختر ${field.label}`}
              </option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value} className="bg-white dark:bg-gray-700">
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Helper messages */}
            {field.name === 'region_id' && !answers.city_id && (
              <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                <span>👆</span> الرجاء اختيار المدينة أولاً
              </p>
            )}

            {field.name === 'region_id' && answers.city_id && filteredRegions.length === 0 && !isLoadingRegions && (
              <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                لا توجد مناطق للمدينة المحددة
              </p>
            )}

            {field.name === 'template_id' && !answers.region_id && (
              <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                <span>👆</span> الرجاء اختيار المنطقة أولاً
              </p>
            )}

            {field.name === 'template_id' && answers.region_id && isFetchingTemplates && (
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                جاري تحميل القوالب...
              </p>
            )}

            {field.name === 'template_id' && answers.region_id && !isFetchingTemplates && templates.length === 0 && (
              <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                لا توجد قوالب متاحة لهذه المنطقة
              </p>
            )}

            {errors[field.name] && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>⚠️</span> {errors[field.name]}
              </p>
            )}
          </div>
        )
      }

      return (
        <div className="relative">
          <input
            type={field.type}
            value={answers[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors[field.name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
            } hover:border-blue-400 dark:hover:border-blue-500`}
            dir="rtl"
          />
          {errors[field.name] && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <span>⚠️</span> {errors[field.name]}
            </p>
          )}
        </div>
      )
    }

    // Render AI Results as cards with checkboxes
    const renderAIResults = () => {
      if (!roadSignsData || roadSignsData.length === 0) {
        return (
          <div className="text-center py-16">
            <div className="text-8xl mb-4">🏗️</div>
            <p className="text-2xl text-gray-600 dark:text-gray-400">لا توجد لوحات مطابقة لمعايير البحث</p>
            <button
              onClick={handleReset}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-xl"
            >
              بحث جديد
            </button>
          </div>
        )
      }

      return (
        <div className="space-y-8 animate-fadeIn">
          {/* Header with campaign info and selection controls */}
          <div className="bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-600">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">📋</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    حملة: {answers.campaign_name}
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <span>🔍</span>
                  تم العثور على <span className="text-blue-600 dark:text-blue-400 font-bold mx-1">{roadSignsData.length}</span> لوحة
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={selectAllSigns}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-all transform hover:scale-105 border border-gray-300 dark:border-gray-500 flex items-center gap-2"
                >
                  <span>{selectedSigns.length === roadSignsData.length ? '🔲' : '✅'}</span>
                  {selectedSigns.length === roadSignsData.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                </button>
                {selectedSigns.length > 0 && (
                  <button
                    onClick={printSelectedSigns}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <span>📄</span>
                    طباعة PDF ({selectedSigns.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadSignsData.map((sign, index) => (
              <div 
                key={sign.id} 
                className="relative group animate-slideIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Checkbox in corner */}
                <div className="absolute top-4 right-4 z-20">
                  <label className="relative cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSigns.includes(sign.id)}
                      onChange={() => toggleSignSelection(sign.id)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-7 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 rounded-lg peer-checked:bg-blue-600 peer-checked:border-blue-400 transition-all transform peer-checked:scale-110 shadow-lg flex items-center justify-center">
                      {selectedSigns.includes(sign.id) && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </div>
                  </label>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] group-hover:border-blue-400 dark:group-hover:border-blue-500">
                  {/* Card Header with gradient */}
                  <div className="px-5 py-4 bg-gray-50 dark:bg-gradient-to-r dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate flex items-center gap-2">
                          <span className="text-blue-600 dark:text-blue-400">#{index + 1}</span>
                          {sign.roadsign_code || `لوحة #${sign.id}`}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate flex items-center gap-1 mt-1">
                          <span>📍</span>
                          {sign.city?.name} • {sign.region?.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {sign.ai_results && (
                      <>
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 p-3 rounded-xl text-center transform hover:scale-105 transition-all">
                            <div className="text-orange-500 dark:text-orange-400 text-xl mb-1">👁️</div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">مشاهدات يومية</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {sign.ai_results.daily_views_estimate?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 p-3 rounded-xl text-center transform hover:scale-105 transition-all">
                            <div className="text-green-500 dark:text-green-400 text-xl mb-1">📈</div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">مشاهدات شهرية</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {sign.ai_results.monthly_views_estimate?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Info lines */}
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <span>📍</span> الموقع:
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white truncate mr-2">
                              {formatArabicText(sign.ai_results.location_type)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <span>📊</span> الأهمية:
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatArabicText(sign.ai_results.importance_level)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <span>🚗</span> مركبات/يوم:
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {sign.ai_results.vehicles_per_day?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <button
                          onClick={() => showDetails(sign)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                        >
                          <span>🔍</span>
                          رؤية التفاصيل
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-all transform hover:scale-105 border border-gray-300 dark:border-gray-500 flex items-center gap-2"
            >
              <span>🔄</span>
              بحث جديد
            </button>
            {selectedSigns.length > 0 && (
              <button
                onClick={printSelectedSigns}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <span>📄</span>
                طباعة PDF ({selectedSigns.length})
              </button>
            )}
          </div>
        </div>
      )
    }

    // Details Modal
    const renderDetailsModal = () => {
      if (!showDetailsModal || !selectedSignForDetails) return null

      const sign = selectedSignForDetails

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200 dark:border-gray-600 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 px-6 py-4 bg-gray-50 dark:bg-gradient-to-r dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-500 rounded-t-2xl z-30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚗</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {sign.roadsign_code || `لوحة #${sign.id}`}
                  </h3>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white flex items-center justify-center transition-all transform hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
                <span>📍</span> {sign.city?.name} • {sign.region?.name} • {sign.place}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {sign.ai_results && (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl text-center transform hover:scale-105 transition-all">
                      <div className="text-orange-500 dark:text-orange-400 text-2xl mb-2">👁️</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">مشاهدات يومية</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {sign.ai_results.daily_views_estimate?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl text-center transform hover:scale-105 transition-all">
                      <div className="text-green-500 dark:text-green-400 text-2xl mb-2">📈</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">مشاهدات شهرية</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {sign.ai_results.monthly_views_estimate?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl text-center transform hover:scale-105 transition-all">
                      <div className="text-blue-500 dark:text-blue-400 text-2xl mb-2">🚗</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">مركبات/يوم</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {sign.ai_results.vehicles_per_day?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl text-center transform hover:scale-105 transition-all">
                      <div className="text-purple-500 dark:text-purple-400 text-2xl mb-2">📊</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">معدل المشاهدة</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {sign.ai_results.view_rate_per_vehicle || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl">
                        <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                          <span>📍</span> نوع الموقع
                        </h4>
                        <p className="text-gray-700 dark:text-gray-200">{formatArabicText(sign.ai_results.location_type)}</p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl">
                        <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                          <span>🎯</span> الجمهور المستهدف
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {sign.ai_results.target_audience_text?.split(',').map((item, i) => (
                            <span key={i} className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 text-xs px-3 py-1.5 rounded-full">
                              {item.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl">
                        <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-3 flex items-center gap-2">
                          <span>📊</span> مستوى الأهمية
                        </h4>
                        <p className="text-gray-700 dark:text-gray-200">{formatArabicText(sign.ai_results.importance_level)}</p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl">
                        <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                          <span>⏰</span> أفضل الأوقات
                        </h4>
                        <div className="space-y-1">
                          {sign.ai_results.best_times_text?.split('|').map((time, i) => (
                            <p key={i} className="text-sm text-gray-700 dark:text-gray-200">• {time.trim()}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl">
                        <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                          <span>📈</span> استراتيجية الإعلان
                        </h4>
                        <div className="space-y-1">
                          {sign.ai_results.advertising_strategy_text?.split('|').map((strategy, i) => (
                            <p key={i} className="text-sm text-gray-700 dark:text-gray-200">• {strategy.trim()}</p>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl">
                        <h4 className="text-sm font-semibold text-pink-600 dark:text-pink-400 mb-3 flex items-center gap-2">
                          <span>✨</span> المميزات
                        </h4>
                        <div className="space-y-1">
                          {sign.ai_results.characteristics_text?.split('|').map((char, i) => (
                            <p key={i} className="text-sm text-gray-700 dark:text-gray-200">• {char.trim()}</p>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl">
                        <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                          <span>💰</span> القيمة الإعلانية
                        </h4>
                        {sign.ai_results.advertising_value && (
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                              <p className="text-xs text-gray-500 dark:text-gray-400">يومية</p>
                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                ${sign.ai_results.advertising_value.قيمة_يومية || sign.ai_results.advertising_value.daily_value || 'N/A'}
                              </p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                              <p className="text-xs text-gray-500 dark:text-gray-400">شهرية</p>
                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                ${sign.ai_results.advertising_value.قيمة_شهرية || sign.ai_results.advertising_value.monthly_value || 'N/A'}
                              </p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                              <p className="text-xs text-gray-500 dark:text-gray-400">سنوية</p>
                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                ${sign.ai_results.advertising_value.قيمة_سنوية || sign.ai_results.advertising_value.yearly_value || 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl">
                        <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
                          <span>🏆</span> تحليل المنافسة
                        </h4>
                        {sign.ai_results.competition_analysis && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-700 dark:text-gray-200">
                              <span className="font-medium text-gray-600 dark:text-gray-300">المستوى:</span> {sign.ai_results.competition_analysis.مستوى || sign.ai_results.competition_analysis.level}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-200">
                              <span className="font-medium text-gray-600 dark:text-gray-300">اللوحات القريبة:</span> {sign.ai_results.competition_analysis.عدد_اللوحات_القريبة || sign.ai_results.competition_analysis.nearby_signs_count}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-200">
                              <span className="font-medium text-gray-600 dark:text-gray-300">التوصية:</span> {sign.ai_results.competition_analysis.توصية || sign.ai_results.competition_analysis.recommendation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recommended Ad Types */}
                  <div className="p-5 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl">
                    <h4 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 mb-3 flex items-center gap-2">
                      <span>📢</span> أنواع الإعلانات الموصى بها
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {sign.ai_results.recommended_ad_types ? (
                        Array.isArray(sign.ai_results.recommended_ad_types) ? (
                          sign.ai_results.recommended_ad_types.map((type, i) => (
                            <span key={i} className="bg-gray-100 dark:bg-gray-700 border border-cyan-500 text-cyan-700 dark:text-cyan-400 text-sm px-4 py-2 rounded-full">
                              {type}
                            </span>
                          ))
                        ) : typeof sign.ai_results.recommended_ad_types === 'string' ? (
                          sign.ai_results.recommended_ad_types.includes(',') ? (
                            sign.ai_results.recommended_ad_types.split(',').map((type, i) => (
                              <span key={i} className="bg-gray-100 dark:bg-gray-700 border border-cyan-500 text-cyan-700 dark:text-cyan-400 text-sm px-4 py-2 rounded-full">
                                {type.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="bg-gray-100 dark:bg-gray-700 border border-cyan-500 text-cyan-700 dark:text-cyan-400 text-sm px-4 py-2 rounded-full">
                              {sign.ai_results.recommended_ad_types}
                            </span>
                          )
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">لا توجد توصيات</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">لا توجد توصيات</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-600 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={closeDetailsModal}
                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-all transform hover:scale-105 border border-gray-300 dark:border-gray-500"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  toggleSignSelection(sign.id)
                  closeDetailsModal()
                }}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 ${
                  selectedSigns.includes(sign.id)
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
              >
                {selectedSigns.includes(sign.id) ? 'إلغاء التحديد' : 'تحديد اللوحة'}
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Render loading state
    const renderLoading = () => (
      <div className="text-center py-16">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-xl text-gray-700 dark:text-gray-300 mt-8">جاري جلب بيانات اللوحات...</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">قد يستغرق هذا بضع ثوانٍ</p>
      </div>
    )

    // Render error state
    const renderError = () => (
      <div className="text-center py-16">
        <div className="text-7xl mb-6 animate-bounce">⚠️</div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">خطأ في جلب البيانات</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{roadSignsError?.data?.message || 'فشل في جلب بيانات اللوحات'}</p>
        <button
          onClick={handleReset}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-xl"
        >
          ابدأ من جديد
        </button>
      </div>
    )

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200" dir="rtl">
        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          .animate-slideIn {
            animation: slideIn 0.5s ease-out forwards;
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }
        `}</style>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-2xl overflow-hidden mb-6 border border-gray-200 dark:border-gray-600">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                      </svg>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                      المساعد الذكي
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full">AI Assistant</span>
                    </h1>
                    <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                      <span>✨</span>
                      دعني أساعدك في العثور على اللوحات المناسبة لاحتياجاتك
                    </p>
                  </div>
                </div>
              
              </div>
            </div>

            {/* Progress bar */}
            {!isComplete && (
              <div className="px-8 py-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between mb-2 text-sm">
                  {questions.map((q, index) => (
                    <div
                      key={q.id}
                      className={`flex items-center gap-1 ${
                        index <= currentStep ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        index <= currentStep 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="hidden md:inline">{q.icon}</span>
                    </div>
                  ))}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-600">
            {!isComplete ? (
              <div className="space-y-8">
                {renderChatMessage()}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center gap-2 ${
                      currentStep === 0
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500'
                    }`}
                  >
                    <span>→</span>
                    السابق
                  </button>
                  
                  <button
                    onClick={handleNext}
                    disabled={shouldFetchRoadSigns}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    {currentStep === questions.length - 1 ? (
                      <>
                        <span>🔍</span>
                        بحث
                      </>
                    ) : (
                      <>
                        التالي
                        <span>←</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error Message */}
                {errors.submit && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/50 border-2 border-red-300 dark:border-red-500 rounded-xl">
                    <p className="text-sm text-red-700 dark:text-red-200 flex items-center gap-2">
                      <span>⚠️</span>
                      {errors.submit}
                    </p>
                  </div>
                )}
              </div>
            ) : isFetchingRoadSigns ? (
              renderLoading()
            ) : roadSignsError ? (
              renderError()
            ) : (
              renderAIResults()
            )}
          </div>
        </div>

        {/* Details Modal */}
        {renderDetailsModal()}
      </div>
    )
  }