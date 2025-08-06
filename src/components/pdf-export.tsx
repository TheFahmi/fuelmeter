'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Calendar, BarChart3, TrendingUp } from 'lucide-react'

interface ReportConfig {
  type: 'summary' | 'detailed' | 'monthly' | 'annual'
  dateRange: 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'all_time'
  includeCharts: boolean
  includeStats: boolean
}

interface GeneratedReport {
  id: string
  name: string
  type: string
  dateRange: string
  generatedAt: string
  size: string
}

export function PDFExport() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'summary',
    dateRange: 'last_month',
    includeCharts: true,
    includeStats: true
  })
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([
    {
      id: '1',
      name: 'Fuel Report - December 2024',
      type: 'Monthly Summary',
      dateRange: 'Dec 1-31, 2024',
      generatedAt: '2024-12-15 10:30',
      size: '2.3 MB'
    },
    {
      id: '2',
      name: 'Annual Fuel Analysis 2024',
      type: 'Annual Report',
      dateRange: 'Jan 1 - Dec 31, 2024',
      generatedAt: '2024-12-01 09:15',
      size: '8.7 MB'
    }
  ])
  const [generating, setGenerating] = useState(false)

  const handleGenerateReport = async () => {
    setGenerating(true)
    
    // Simulate report generation
    setTimeout(() => {
      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        name: `Fuel Report - ${new Date().toLocaleDateString()}`,
        type: reportConfig.type === 'summary' ? 'Summary Report' :
              reportConfig.type === 'detailed' ? 'Detailed Report' :
              reportConfig.type === 'monthly' ? 'Monthly Report' : 'Annual Report',
        dateRange: reportConfig.dateRange === 'last_month' ? 'Last Month' :
                  reportConfig.dateRange === 'last_3_months' ? 'Last 3 Months' :
                  reportConfig.dateRange === 'last_6_months' ? 'Last 6 Months' :
                  reportConfig.dateRange === 'last_year' ? 'Last Year' : 'All Time',
        generatedAt: new Date().toLocaleString(),
        size: `${(Math.random() * 10 + 1).toFixed(1)} MB`
      }
      
      setGeneratedReports(prev => [newReport, ...prev])
      setGenerating(false)
    }, 2000)
  }

  const handleDownloadReport = (reportId: string) => {
    // Simulate download
    console.log('Downloading report:', reportId)
    alert('Report download started! (This is a simulation)')
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'Summary Report':
        return <BarChart3 className="h-4 w-4" />
      case 'Detailed Report':
        return <FileText className="h-4 w-4" />
      case 'Monthly Report':
        return <Calendar className="h-4 w-4" />
      case 'Annual Report':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 w-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-gray-900 dark:text-white text-lg">
          <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
          <span className="truncate">PDF Export Reports</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-4 sm:px-6">
        {/* Report Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Generate New Report</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Type
              </label>
              <select
                value={reportConfig.type}
                onChange={(e) => setReportConfig(prev => ({ ...prev, type: e.target.value as ReportConfig['type'] }))}
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
              <select
                value={reportConfig.dateRange}
                onChange={(e) => setReportConfig(prev => ({ ...prev, dateRange: e.target.value as ReportConfig['dateRange'] }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="last_year">Last Year</option>
                <option value="all_time">All Time</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={reportConfig.includeCharts}
                onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include Charts</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={reportConfig.includeStats}
                onChange={(e) => setReportConfig(prev => ({ ...prev, includeStats: e.target.checked }))}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include Statistics</span>
            </label>
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF Report
              </>
            )}
          </Button>
        </div>

        {/* Generated Reports */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Generated Reports</h4>
          
          {generatedReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No reports generated yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {generatedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3 sm:space-y-0"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                      {getReportTypeIcon(report.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white truncate">{report.name}</h5>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="truncate">{report.type}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">{report.dateRange}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="whitespace-nowrap">{report.size}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        Generated: {report.generatedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <Button
                      onClick={() => handleDownloadReport(report.id)}
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Features */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">📊 Report Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900 dark:text-white">Summary Report</h5>
              <ul className="space-y-1 pl-2">
                <li>• Key statistics overview</li>
                <li>• Monthly spending trends</li>
                <li>• Fuel efficiency metrics</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900 dark:text-white">Detailed Report</h5>
              <ul className="space-y-1 pl-2">
                <li>• Complete transaction history</li>
                <li>• Detailed cost analysis</li>
                <li>• Performance comparisons</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 