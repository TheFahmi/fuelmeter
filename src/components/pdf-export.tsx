'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Calendar, BarChart3, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import jsPDF from 'jspdf'
import { usePremiumFeature } from '@/contexts/premium-context'
import { UpgradeModal } from '@/components/premium/upgrade-modal'
import { PremiumFeatureBadge } from '@/components/premium/premium-badge'

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
  downloadUrl?: string
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
  station?: string
  created_at: string
}

export function PDFExport() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'summary',
    dateRange: 'last_month',
    includeCharts: true,
    includeStats: true
  })
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [generating, setGenerating] = useState(false)
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const supabase = createClient()
  const { hasAccess: hasUnlimitedReports } = usePremiumFeature('unlimited_reports')

  const fetchFuelRecords = useCallback(async () => {
    try {
      const { data: records, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setFuelRecords(records || [])
    } catch (error) {
      console.error('Error fetching fuel records:', error)
    }
  }, [supabase])

  // Fetch fuel records from Supabase
  useEffect(() => {
    fetchFuelRecords()
  }, [fetchFuelRecords])

  // Filter records based on date range
  const getFilteredRecords = (records: FuelRecord[], dateRange: string) => {
    const now = new Date()
    const startDate = new Date()

    switch (dateRange) {
      case 'last_month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'last_3_months':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'last_6_months':
        startDate.setMonth(now.getMonth() - 6)
        break
      case 'last_year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all_time':
        return records
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    return records.filter(record => new Date(record.date) >= startDate)
  }

  // Calculate statistics from records
  const calculateStats = (records: FuelRecord[]) => {
    if (records.length === 0) {
      return {
        totalRecords: 0,
        totalCost: 0,
        averagePrice: 0,
        totalQuantity: 0,
        totalDistance: 0,
        averageCostPerKm: 0,
        averageConsumption: 0
      }
    }

    const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
    const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0)
    const totalDistance = records.reduce((sum, record) => sum + record.distance_km, 0)
    const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
    const averageCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0
    const averageConsumption = totalDistance > 0 ? (totalQuantity / totalDistance) * 100 : 0

    return {
      totalRecords: records.length,
      totalCost,
      averagePrice,
      totalQuantity,
      totalDistance,
      averageCostPerKm,
      averageConsumption
    }
  }

  // Get monthly data for charts
  const getMonthlyData = (records: FuelRecord[]) => {
    const monthlyMap = new Map<string, { cost: number, quantity: number }>()

    records.forEach(record => {
      const date = new Date(record.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const existing = monthlyMap.get(monthKey) || { cost: 0, quantity: 0 }

      monthlyMap.set(monthKey, {
        cost: existing.cost + record.total_cost,
        quantity: existing.quantity + record.quantity
      })
    })

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month: month.substring(5), // Just MM
        cost: data.cost,
        quantity: data.quantity
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
  }



  // Generate PDF report
  const generatePDF = (records: FuelRecord[], config: ReportConfig) => {
    const doc = new jsPDF()
    const filteredRecords = getFilteredRecords(records, config.dateRange)
    const stats = calculateStats(filteredRecords)

    // Header with colors
    doc.setFillColor(59, 130, 246) // Blue background
    doc.rect(0, 0, 210, 30, 'F')

    doc.setTextColor(255, 255, 255) // White text
    doc.setFontSize(20)
    doc.text('Fuel Consumption Report', 20, 20)

    doc.setTextColor(0, 0, 0) // Black text
    doc.setFontSize(12)
    doc.text(`Report Type: ${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Report`, 20, 40)
    doc.text(`Date Range: ${config.dateRange.replace('_', ' ').toUpperCase()}`, 20, 50)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 20, 60)

    let yPosition = 75

    // Statistics Section with colors
    if (config.includeStats) {
      // Section header with background
      doc.setFillColor(240, 249, 255) // Light blue background
      doc.rect(15, yPosition - 5, 180, 20, 'F')

      doc.setTextColor(59, 130, 246) // Blue text
      doc.setFontSize(16)
      doc.text('Summary Statistics', 20, yPosition + 5)
      yPosition += 25

      doc.setTextColor(0, 0, 0) // Black text
      doc.setFontSize(10)
      const statsData = [
        ['Total Records', stats.totalRecords.toString()],
        ['Total Cost', `Rp ${stats.totalCost.toLocaleString('id-ID')}`],
        ['Total Quantity', `${stats.totalQuantity.toFixed(2)} L`],
        ['Total Distance', `${stats.totalDistance.toFixed(2)} km`],
        ['Average Price/Liter', `Rp ${stats.averagePrice.toLocaleString('id-ID')}`],
        ['Average Cost/km', `Rp ${stats.averageCostPerKm.toLocaleString('id-ID')}`],
        ['Average Consumption', `${stats.averageConsumption.toFixed(2)} L/100km`]
      ]

      // Colored table
      statsData.forEach((row, index) => {
        const y = yPosition + (index * 10)

        // Alternating row colors
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251) // Light gray
          doc.rect(15, y - 3, 180, 8, 'F')
        }

        doc.setTextColor(75, 85, 99) // Gray text for labels
        doc.text(`${row[0]}:`, 20, y)
        doc.setTextColor(17, 24, 39) // Dark text for values
        doc.text(row[1], 120, y)
      })

      yPosition += statsData.length * 10 + 20
    }

    // Add chart if enabled
    if (config.includeCharts && filteredRecords.length > 0) {
      // Chart section header
      doc.setFillColor(240, 249, 255)
      doc.rect(15, yPosition - 5, 180, 20, 'F')

      doc.setTextColor(59, 130, 246)
      doc.setFontSize(16)
      doc.text('Fuel Cost Trend', 20, yPosition + 5)
      yPosition += 25

      // Create simple chart representation
      const monthlyData = getMonthlyData(filteredRecords)
      if (monthlyData.length > 0) {
        // Draw simple bar chart
        const chartWidth = 160
        const chartHeight = 60
        const barWidth = chartWidth / monthlyData.length
        const maxValue = Math.max(...monthlyData.map(d => d.cost))

        monthlyData.forEach((data, index) => {
          const barHeight = (data.cost / maxValue) * chartHeight
          const x = 20 + (index * barWidth)
          const y = yPosition + chartHeight - barHeight

          // Draw bar with color
          doc.setFillColor(59, 130, 246)
          doc.rect(x, y, barWidth - 2, barHeight, 'F')

          // Add label
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(8)
          doc.text(data.month, x, yPosition + chartHeight + 10)
        })

        yPosition += chartHeight + 25
      }
    }

    // Detailed Records Section
    if (config.type === 'detailed' && filteredRecords.length > 0) {
      doc.setFontSize(16)
      doc.text('Detailed Records', 20, yPosition)
      yPosition += 15

      doc.setFontSize(8)

      // Table headers
      doc.text('Date', 20, yPosition)
      doc.text('Fuel Type', 50, yPosition)
      doc.text('Quantity', 80, yPosition)
      doc.text('Price/L', 110, yPosition)
      doc.text('Total Cost', 140, yPosition)
      doc.text('Distance', 170, yPosition)
      yPosition += 10

      // Table data
      filteredRecords.slice(0, 20).forEach((record, index) => { // Limit to 20 records to fit on page
        const y = yPosition + (index * 8)
        if (y > 280) return // Stop if we're near the bottom of the page

        doc.text(new Date(record.date).toLocaleDateString('id-ID'), 20, y)
        doc.text(record.fuel_type, 50, y)
        doc.text(`${record.quantity.toFixed(1)}L`, 80, y)
        doc.text(`Rp ${record.price_per_liter.toLocaleString('id-ID')}`, 110, y)
        doc.text(`Rp ${record.total_cost.toLocaleString('id-ID')}`, 140, y)
        doc.text(`${record.distance_km.toFixed(1)}km`, 170, y)
      })
    }

    return doc
  }

  const handleGenerateReport = async () => {
    // Check if user has unlimited reports or if this is within free limit
    if (!hasUnlimitedReports && generatedReports.length >= 3) {
      setShowUpgradeModal(true)
      return
    }

    setGenerating(true)

    try {
      // Generate PDF
      const pdf = generatePDF(fuelRecords, reportConfig)
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        name: `Fuel Report - ${new Date().toLocaleDateString('id-ID')}`,
        type: reportConfig.type === 'summary' ? 'Summary Report' :
              reportConfig.type === 'detailed' ? 'Detailed Report' :
              reportConfig.type === 'monthly' ? 'Monthly Report' : 'Annual Report',
        dateRange: reportConfig.dateRange === 'last_month' ? 'Last Month' :
                  reportConfig.dateRange === 'last_3_months' ? 'Last 3 Months' :
                  reportConfig.dateRange === 'last_6_months' ? 'Last 6 Months' :
                  reportConfig.dateRange === 'last_year' ? 'Last Year' : 'All Time',
        generatedAt: new Date().toLocaleString('id-ID'),
        size: `${(pdfBlob.size / (1024 * 1024)).toFixed(1)} MB`,
        downloadUrl: pdfUrl
      }

      setGeneratedReports(prev => [newReport, ...prev])
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000) // Hide success message after 3 seconds
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadReport = (reportId: string) => {
    const report = generatedReports.find(r => r.id === reportId)
    if (report && report.downloadUrl) {
      // Create download link
      const link = document.createElement('a')
      link.href = report.downloadUrl
      link.download = `${report.name}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      alert('Report file not found. Please regenerate the report.')
    }
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
    <>
      <Card className="dark:bg-gray-800 dark:border-gray-700 w-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white text-lg">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="truncate">PDF Export Reports</span>
          </div>
          {!hasUnlimitedReports && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {generatedReports.length}/3 free reports
              </span>
              <PremiumFeatureBadge />
            </div>
          )}
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
            disabled={generating || fuelRecords.length === 0}
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

          {fuelRecords.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              No fuel records found. Add some fuel records first to generate reports.
            </p>
          )}

          {showSuccess && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300 text-center">
                ✅ PDF report generated successfully! Check the &quot;Generated Reports&quot; section below.
              </p>
            </div>
          )}
        </div>

        {/* Generated Reports */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Generated Reports</h4>
          
          {generatedReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No reports generated yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Generate your first PDF report using the form above
              </p>
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Unlimited PDF Reports"
      />
    </>
  )
}