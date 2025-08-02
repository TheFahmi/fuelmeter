'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { FileText, Download, Calendar, BarChart3, DollarSign, TrendingUp, Clock } from 'lucide-react'

interface ExportOptions {
  reportType: 'summary' | 'detailed' | 'monthly' | 'annual'
  dateRange: 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'custom'
  startDate?: string
  endDate?: string
  includeCharts: boolean
  includeStats: boolean
}

interface ReportData {
  summary: {
    totalRecords: number
    totalCost: number
    totalDistance: number
    averageEfficiency: number
    averageCostPerKm: number
  }
  records: any[]
  monthlyData: any[]
  stats: any
}

export function PDFExport() {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    reportType: 'summary',
    dateRange: 'last_month',
    includeCharts: true,
    includeStats: true
  })
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const supabase = createClient()

  const generatePDF = async () => {
    setGenerating(true)
    
    try {
      // Get data based on options
      const data = await getReportData(exportOptions)
      
      // Generate PDF content
      const pdfContent = generatePDFContent(data, exportOptions)
      
      // Create and download PDF
      await downloadPDF(pdfContent, `fuelmeter-report-${exportOptions.reportType}-${new Date().toISOString().split('T')[0]}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setGenerating(false)
    }
  }

  const getReportData = async (options: ExportOptions): Promise<ReportData> => {
    const { startDate, endDate } = getDateRange(options.dateRange, options.startDate, options.endDate)
    
    const { data: records } = await supabase
      .from('fuel_records')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (!records || records.length === 0) {
      return {
        summary: {
          totalRecords: 0,
          totalCost: 0,
          totalDistance: 0,
          averageEfficiency: 0,
          averageCostPerKm: 0
        },
        records: [],
        monthlyData: [],
        stats: {}
      }
    }

    // Calculate summary
    const totalRecords = records.length
    const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
    const totalDistance = records.reduce((sum, record) => sum + record.distance_km, 0)
    const totalFuel = records.reduce((sum, record) => sum + record.quantity, 0)
    const averageEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0
    const averageCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0

    // Calculate monthly data
    const monthlyData = calculateMonthlyData(records)

    // Calculate additional stats
    const stats = calculateStats(records)

    return {
      summary: {
        totalRecords,
        totalCost,
        totalDistance,
        averageEfficiency,
        averageCostPerKm
      },
      records,
      monthlyData,
      stats
    }
  }

  const getDateRange = (range: string, customStart?: string, customEnd?: string) => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (range) {
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'last_3_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        endDate = now
        break
      case 'last_6_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        endDate = now
        break
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        endDate = now
        break
      case 'custom':
        startDate = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = customEnd ? new Date(customEnd) : now
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = now
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const calculateMonthlyData = (records: any[]) => {
    const monthlyMap = new Map()
    
    records.forEach(record => {
      const month = record.date.substring(0, 7) // YYYY-MM
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          month,
          totalCost: 0,
          totalDistance: 0,
          totalFuel: 0,
          recordCount: 0
        })
      }
      
      const monthData = monthlyMap.get(month)
      monthData.totalCost += record.total_cost
      monthData.totalDistance += record.distance_km
      monthData.totalFuel += record.quantity
      monthData.recordCount += 1
    })
    
    return Array.from(monthlyMap.values())
  }

  const calculateStats = (records: any[]) => {
    const fuelTypes = new Map()
    const avgPriceByMonth = new Map()
    
    records.forEach(record => {
      // Fuel type stats
      if (!fuelTypes.has(record.fuel_type)) {
        fuelTypes.set(record.fuel_type, { total: 0, cost: 0 })
      }
      const fuelData = fuelTypes.get(record.fuel_type)
      fuelData.total += record.quantity
      fuelData.cost += record.total_cost
      
      // Average price by month
      const month = record.date.substring(0, 7)
      if (!avgPriceByMonth.has(month)) {
        avgPriceByMonth.set(month, { total: 0, count: 0 })
      }
      const priceData = avgPriceByMonth.get(month)
      priceData.total += record.price_per_liter
      priceData.count += 1
    })
    
    return {
      fuelTypes: Object.fromEntries(fuelTypes),
      avgPriceByMonth: Object.fromEntries(avgPriceByMonth)
    }
  }

  const generatePDFContent = (data: ReportData, options: ExportOptions) => {
    const { startDate, endDate } = getDateRange(options.dateRange, options.startDate, options.endDate)
    
    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FuelMeter Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .summary-item { background: #f8f9fa; padding: 15px; border-radius: 8px; }
          .summary-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .summary-label { color: #6b7280; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f8f9fa; }
          .section { margin: 30px 0; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FuelMeter Report</h1>
          <p>Report Type: ${options.reportType.toUpperCase()}</p>
          <p>Period: ${startDate} to ${endDate}</p>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
        </div>
    `

    // Summary Section
    content += `
        <div class="section">
          <div class="section-title">Summary</div>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-value">${data.summary.totalRecords}</div>
              <div class="summary-label">Total Records</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">Rp ${data.summary.totalCost.toLocaleString()}</div>
              <div class="summary-label">Total Cost</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${data.summary.totalDistance.toFixed(0)} km</div>
              <div class="summary-label">Total Distance</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${data.summary.averageEfficiency.toFixed(1)} km/L</div>
              <div class="summary-label">Average Efficiency</div>
            </div>
          </div>
        </div>
    `

    // Monthly Data Section
    if (options.includeStats && data.monthlyData.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">Monthly Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Records</th>
                <th>Total Cost</th>
                <th>Total Distance</th>
                <th>Total Fuel</th>
                <th>Efficiency</th>
              </tr>
            </thead>
            <tbody>
      `
      
      data.monthlyData.forEach(month => {
        const efficiency = month.totalFuel > 0 ? month.totalDistance / month.totalFuel : 0
        content += `
          <tr>
            <td>${month.month}</td>
            <td>${month.recordCount}</td>
            <td>Rp ${month.totalCost.toLocaleString()}</td>
            <td>${month.totalDistance.toFixed(0)} km</td>
            <td>${month.totalFuel.toFixed(1)} L</td>
            <td>${efficiency.toFixed(1)} km/L</td>
          </tr>
        `
      })
      
      content += `
            </tbody>
          </table>
        </div>
      `
    }

    // Detailed Records Section
    if (options.reportType === 'detailed' && data.records.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">Detailed Records</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Fuel Type</th>
                <th>Quantity</th>
                <th>Price/L</th>
                <th>Total Cost</th>
                <th>Distance</th>
                <th>Cost/km</th>
              </tr>
            </thead>
            <tbody>
      `
      
      data.records.slice(0, 50).forEach(record => { // Limit to 50 records for PDF
        content += `
          <tr>
            <td>${record.date}</td>
            <td>${record.fuel_type}</td>
            <td>${record.quantity} L</td>
            <td>Rp ${record.price_per_liter.toLocaleString()}</td>
            <td>Rp ${record.total_cost.toLocaleString()}</td>
            <td>${record.distance_km} km</td>
            <td>Rp ${record.cost_per_km?.toFixed(0) || '-'}</td>
          </tr>
        `
      })
      
      content += `
            </tbody>
          </table>
        </div>
      `
    }

    content += `
      </body>
      </html>
    `

    return content
  }

  const downloadPDF = async (content: string, filename: string) => {
    // In a real implementation, you would use a PDF library like jsPDF or html2pdf
    // For now, we'll create a downloadable HTML file
    const blob = new Blob([content], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.replace('.pdf', '.html')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <FileText className="h-5 w-5 mr-2" />
          Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Report Type
          </label>
          <select
            value={exportOptions.reportType}
            onChange={(e) => setExportOptions({...exportOptions, reportType: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          >
            <option value="summary">Summary Report</option>
            <option value="detailed">Detailed Report</option>
            <option value="monthly">Monthly Report</option>
            <option value="annual">Annual Report</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range
          </label>
          <select
            value={exportOptions.dateRange}
            onChange={(e) => setExportOptions({...exportOptions, dateRange: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          >
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="last_year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {exportOptions.dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={exportOptions.startDate || ''}
                onChange={(e) => setExportOptions({...exportOptions, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={exportOptions.endDate || ''}
                onChange={(e) => setExportOptions({...exportOptions, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeStats"
              checked={exportOptions.includeStats}
              onChange={(e) => setExportOptions({...exportOptions, includeStats: e.target.checked})}
              className="rounded border-gray-300"
            />
            <label htmlFor="includeStats" className="text-sm text-gray-700 dark:text-gray-300">
              Include Statistics & Charts
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generatePDF}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate & Download Report
            </>
          )}
        </Button>

        {/* Report Types Info */}
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-3 w-3" />
            <span><strong>Summary:</strong> Key metrics and overview</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-3 w-3" />
            <span><strong>Detailed:</strong> All records with full data</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-3 w-3" />
            <span><strong>Monthly:</strong> Monthly breakdown and trends</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-3 w-3" />
            <span><strong>Annual:</strong> Yearly summary and analysis</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 