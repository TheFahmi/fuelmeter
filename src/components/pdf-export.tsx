'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Download, Calendar, BarChart3, TrendingUp, Clock } from 'lucide-react'

interface ReportConfig {
  type: 'summary' | 'detailed' | 'monthly' | 'annual'
  dateRange: {
    start: string
    end: string
  }
  includeCharts: boolean
  includeStats: boolean
  includeRecommendations: boolean
}

interface FuelRecord {
  id: string
  date: string
  fuel_type: string
  quantity: number
  price_per_liter: number
  total_cost: number
  distance_km: number
  odometer_km: number
  station: string
  created_at: string
}

export function PDFExport() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'summary',
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    includeCharts: true,
    includeStats: true,
    includeRecommendations: true
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReports, setGeneratedReports] = useState<Array<{
    id: string
    name: string
    type: string
    date: string
    size: string
  }>>([])
  const supabase = createClient()

  const generateReport = async () => {
    setIsGenerating(true)
    
    try {
      // Fetch fuel records for the selected date range
      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')
        .gte('date', reportConfig.dateRange.start)
        .lte('date', reportConfig.dateRange.end)
        .order('date', { ascending: true })

      if (!records) {
        throw new Error('No data available for the selected period')
      }

      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Calculate report statistics
      const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
      const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0)
      const totalDistance = records.reduce((sum, record) => sum + record.distance_km, 0)
      const averageEfficiency = totalQuantity > 0 ? totalDistance / totalQuantity : 0
      const averageCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0

      // Create report metadata
      const reportName = `FuelMeter_${reportConfig.type}_${reportConfig.dateRange.start}_${reportConfig.dateRange.end}.pdf`
      const reportSize = `${Math.floor(Math.random() * 500) + 100} KB`

      const newReport = {
        id: Date.now().toString(),
        name: reportName,
        type: reportConfig.type,
        date: new Date().toISOString(),
        size: reportSize
      }

      setGeneratedReports(prev => [newReport, ...prev])

      // In a real app, you would generate and download the actual PDF
      console.log('Report generated:', {
        config: reportConfig,
        stats: {
          totalCost,
          totalQuantity,
          totalDistance,
          averageEfficiency,
          averageCostPerKm,
          recordCount: records.length
        }
      })

    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadReport = (reportId: string) => {
    const report = generatedReports.find(r => r.id === reportId)
    if (!report) return

    // In a real app, you would download the actual PDF file
    console.log('Downloading report:', report.name)
    
    // Simulate download
    const link = document.createElement('a')
    link.href = '#'
    link.download = report.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const deleteReport = (reportId: string) => {
    setGeneratedReports(prev => prev.filter(r => r.id !== reportId))
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'summary': return <BarChart3 className="h-4 w-4" />
      case 'detailed': return <FileText className="h-4 w-4" />
      case 'monthly': return <Calendar className="h-4 w-4" />
      case 'annual': return <TrendingUp className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'summary': return 'Summary Report'
      case 'detailed': return 'Detailed Report'
      case 'monthly': return 'Monthly Report'
      case 'annual': return 'Annual Report'
      default: return 'Report'
    }
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <FileText className="h-5 w-5 mr-2" />
          PDF Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Generate New Report
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Type
              </label>
              <select
                value={reportConfig.type}
                onChange={(e) => setReportConfig(prev => ({ 
                  ...prev, 
                  type: e.target.value as ReportConfig['type'] 
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="summary">Summary Report</option>
                <option value="detailed">Detailed Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="annual">Annual Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Range
              </label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={reportConfig.dateRange.start}
                  onChange={(e) => setReportConfig(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={reportConfig.dateRange.end}
                  onChange={(e) => setReportConfig(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
              Report Options
            </h5>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={reportConfig.includeCharts}
                  onChange={(e) => setReportConfig(prev => ({ 
                    ...prev, 
                    includeCharts: e.target.checked 
                  }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include charts and graphs
                </span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={reportConfig.includeStats}
                  onChange={(e) => setReportConfig(prev => ({ 
                    ...prev, 
                    includeStats: e.target.checked 
                  }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include detailed statistics
                </span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={reportConfig.includeRecommendations}
                  onChange={(e) => setReportConfig(prev => ({ 
                    ...prev, 
                    includeRecommendations: e.target.checked 
                  }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include recommendations
                </span>
              </label>
            </div>
          </div>

          <Button
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>

        {/* Generated Reports */}
        {generatedReports.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Generated Reports
            </h4>
            
            <div className="space-y-3">
              {generatedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getReportTypeIcon(report.type)}
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {report.name}
                      </h5>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{getReportTypeLabel(report.type)}</span>
                        <span>{report.size}</span>
                        <span>{new Date(report.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => downloadReport(report.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deleteReport(report.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Templates */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Quick Templates
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const now = new Date()
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                setReportConfig({
                  type: 'monthly',
                  dateRange: {
                    start: startOfMonth.toISOString().split('T')[0],
                    end: now.toISOString().split('T')[0]
                  },
                  includeCharts: true,
                  includeStats: true,
                  includeRecommendations: true
                })
              }}
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              This Month
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const now = new Date()
                const startOfYear = new Date(now.getFullYear(), 0, 1)
                setReportConfig({
                  type: 'annual',
                  dateRange: {
                    start: startOfYear.toISOString().split('T')[0],
                    end: now.toISOString().split('T')[0]
                  },
                  includeCharts: true,
                  includeStats: true,
                  includeRecommendations: true
                })
              }}
              className="justify-start"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              This Year
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const now = new Date()
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                setReportConfig({
                  type: 'detailed',
                  dateRange: {
                    start: thirtyDaysAgo.toISOString().split('T')[0],
                    end: now.toISOString().split('T')[0]
                  },
                  includeCharts: true,
                  includeStats: true,
                  includeRecommendations: true
                })
              }}
              className="justify-start"
            >
              <Clock className="h-4 w-4 mr-2" />
              Last 30 Days
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const now = new Date()
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                setReportConfig({
                  type: 'summary',
                  dateRange: {
                    start: sevenDaysAgo.toISOString().split('T')[0],
                    end: now.toISOString().split('T')[0]
                  },
                  includeCharts: false,
                  includeStats: true,
                  includeRecommendations: false
                })
              }}
              className="justify-start"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Last 7 Days
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 