'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminGuard } from '@/components/admin/admin-guard'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/contexts/toast-context'
import {
  Search,
  FileText,
  Fuel,
  DollarSign,
  Trash2,
  Download
} from 'lucide-react'

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
  user_id: string
  profiles: {
    email: string
    full_name: string
  }
}

export default function AdminRecords() {
  const [records, setRecords] = useState<FuelRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [stationFilter, setStationFilter] = useState('')
  const supabase = createClient()
  const { success, error: showError } = useToast()

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      const { data: recordsData, error: recordsError } = await supabase
        .from('fuel_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (recordsError) throw recordsError

      const recordsWithProfiles = await Promise.all(
        (recordsData || []).map(async (record) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', record.user_id)
            .single()

          return {
            ...record,
            profiles: profile || { email: 'Unknown', full_name: 'Unknown' }
          }
        })
      )

      setRecords(recordsWithProfiles)
    } catch (error) {
      console.error('Error fetching records:', error)
      showError('Error', 'Failed to load fuel records')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const filterRecords = useCallback(() => {
    let filtered = records

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.fuel_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (dateFilter) {
      filtered = filtered.filter(record => 
        record.date.startsWith(dateFilter)
      )
    }

    if (stationFilter) {
      filtered = filtered.filter(record => 
        record.station.toLowerCase().includes(stationFilter.toLowerCase())
      )
    }

    setFilteredRecords(filtered)
  }, [records, searchTerm, dateFilter, stationFilter])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  useEffect(() => {
    filterRecords()
  }, [filterRecords])

  const fetchRecords = async () => {
    try {
      setLoading(true)

      // First get fuel records
      const { data: recordsData, error: recordsError } = await supabase
        .from('fuel_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000) // Limit for performance

      if (recordsError) throw recordsError

      // Then get profiles data and merge
      const recordsWithProfiles = await Promise.all(
        (recordsData || []).map(async (record) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', record.user_id)
            .single()

          return {
            ...record,
            profiles: profile || { email: 'Unknown', full_name: 'Unknown' }
          }
        })
      )

      setRecords(recordsWithProfiles)
    } catch (error) {
      console.error('Error fetching records:', error)
      showError('Error', 'Failed to load fuel records')
    } finally {
      setLoading(false)
    }
  }

  const filterRecords = () => {
    let filtered = records

    // Filter by search term (user email or station)
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.fuel_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(record => 
        record.date.startsWith(dateFilter)
      )
    }

    // Filter by station
    if (stationFilter) {
      filtered = filtered.filter(record => 
        record.station.toLowerCase().includes(stationFilter.toLowerCase())
      )
    }

    setFilteredRecords(filtered)
  }

  const deleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this fuel record?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('fuel_records')
        .delete()
        .eq('id', recordId)

      if (error) throw error

      success('Record Deleted', 'Fuel record has been successfully deleted')
      fetchRecords() // Refresh the list
    } catch (error) {
      console.error('Error deleting record:', error)
      showError('Error', 'Failed to delete fuel record')
    }
  }

  const exportRecords = () => {
    // Create CSV content
    const headers = ['Date', 'User Email', 'Station', 'Fuel Type', 'Quantity (L)', 'Price/L', 'Total Cost', 'Distance (km)', 'Odometer (km)']
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.date,
        record.profiles.email,
        record.station,
        record.fuel_type,
        record.quantity,
        record.price_per_liter,
        record.total_cost,
        record.distance_km,
        record.odometer_km
      ].join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fuel_records_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    success('Export Complete', 'Fuel records have been exported to CSV')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get unique stations for filter
  const uniqueStations = [...new Set(records.map(r => r.station))].sort()

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </AdminLayout>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fuel Records Management</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor and manage all fuel records across the platform
                </p>
              </div>
              <Button onClick={exportRecords} className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Records</CardTitle>
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{records.length.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Fuel</CardTitle>
                <Fuel className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {records.reduce((sum, r) => sum + r.quantity, 0).toLocaleString()} L
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(records.reduce((sum, r) => sum + r.total_cost, 0))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Avg. Price/L</CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(
                    records.length > 0
                      ? records.reduce((sum, r) => sum + r.price_per_liter, 0) / records.length
                      : 0
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by user, station, or fuel type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <Input
                    type="date"
                    placeholder="Filter by date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
                <div>
                  <select
                    value={stationFilter}
                    onChange={(e) => setStationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Stations</option>
                    {uniqueStations.map(station => (
                      <option key={station} value={station}>{station}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('')
                      setDateFilter('')
                      setStationFilter('')
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Fuel Records ({filteredRecords.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Station</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Fuel Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Quantity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Price/L</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatDate(record.date)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {record.profiles.full_name || record.profiles.email}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {record.profiles.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {record.station}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {record.fuel_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {record.quantity.toFixed(2)} L
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatCurrency(record.price_per_liter)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(record.total_cost)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteRecord(record.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredRecords.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No fuel records found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
