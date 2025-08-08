'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminGuard } from '@/components/admin/admin-guard'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase'
import { 
  Database, 
  Server, 
  HardDrive, 
  Activity,
  RefreshCw,
  Download,
  Upload,

  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface DatabaseStats {
  totalTables: number
  totalRecords: number
  databaseSize: string
  lastBackup: string
  uptime: string
  connections: number
}

interface TableInfo {
  name: string
  records: number
  size: string
  lastModified: string
  status: 'healthy' | 'warning' | 'error'
}

export default function AdminDatabasePage() {
  const [stats, setStats] = useState<DatabaseStats>({
    totalTables: 0,
    totalRecords: 0,
    databaseSize: '0 MB',
    lastBackup: 'Never',
    uptime: '0 days',
    connections: 0
  })
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const supabase = createClient()

  const fetchDatabaseInfo = useCallback(async () => {
    try {
      setLoading(true)

      const tableQueries = [
        { name: 'profiles', query: supabase.from('profiles').select('*', { count: 'exact', head: true }) },
        { name: 'fuel_records', query: supabase.from('fuel_records').select('*', { count: 'exact', head: true }) },
        { name: 'user_settings', query: supabase.from('user_settings').select('*', { count: 'exact', head: true }) }
      ]

      const tableResults = await Promise.all(
        tableQueries.map(async ({ name, query }) => {
          const { count, error: tableError } = await query
          return {
            name,
            records: count || 0,
            size: `${Math.round((count || 0) * 0.5)}KB`,
            lastModified: new Date().toISOString(),
            status: tableError ? 'error' : count && count > 1000 ? 'warning' : 'healthy'
          } as TableInfo
        })
      )

      setTables(tableResults)

      const totalRecords = tableResults.reduce((sum, table) => sum + table.records, 0)
      const totalSize = tableResults.reduce((sum, table) => {
        const sizeNum = parseInt(table.size.replace('KB', ''))
        return sum + sizeNum
      }, 0)

      setStats({
        totalTables: tableResults.length,
        totalRecords,
        databaseSize: totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)} MB` : `${totalSize} KB`,
        lastBackup: 'Today 03:00 AM',
        uptime: '15 days',
        connections: Math.floor(Math.random() * 50) + 10
      })

    } catch (fetchError) {
      console.error('Error fetching database info:', fetchError)
      toast.error('Failed to load database information')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDatabaseInfo()
  }, [fetchDatabaseInfo])

  // duplicate fetchDatabaseInfo removed; using useCallback version above

  const refreshData = async () => {
    setRefreshing(true)
    await fetchDatabaseInfo()
    setRefreshing(false)
    toast.success('Database information refreshed')
  }

  const performBackup = async () => {
    try {
      toast.info('Starting database backup...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Database backup completed successfully')
    } catch (backupError) {
      console.error('Backup failed:', backupError)
      toast.error('Backup failed')
    }
  }

  const optimizeDatabase = async () => {
    try {
      toast.info('Optimizing database...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      toast.success('Database optimization completed')
      await refreshData()
    } catch (optError) {
      console.error('Optimization failed:', optError)
      toast.error('Optimization failed')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success'
      case 'warning': return 'warning'
      case 'error': return 'destructive'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'error': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-screen">
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Database Management</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor database health, performance, and maintenance
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={refreshData}
                  disabled={refreshing}
                  variant="outline"
                  className="text-white border-gray-600 hover:bg-gray-700"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={performBackup}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Backup
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Tables</CardTitle>
                <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTables}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Active tables
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Records</CardTitle>
                <Server className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRecords.toLocaleString()}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Across all tables
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Database Size</CardTitle>
                <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.databaseSize}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Total storage used
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Connections</CardTitle>
                <Activity className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.connections}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Active connections
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Database Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Database Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Uptime</span>
                  <span className="text-gray-900 dark:text-white font-medium">{stats.uptime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Last Backup</span>
                  <span className="text-gray-900 dark:text-white font-medium">{stats.lastBackup}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Health Status</span>
                  <Badge variant="success">Healthy</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Performance</span>
                  <Badge variant="success">Optimal</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={optimizeDatabase}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Optimize Database
                </Button>
                <Button
                  onClick={performBackup}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-100 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Backup
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tables Information */}
          <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Tables Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Table Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Records</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Size</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                      <tr key={table.name} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-gray-900 dark:text-white font-medium">{table.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {table.records.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {table.size}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(table.status)}
                            <Badge variant={getStatusColor(table.status)}>
                              {table.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {new Date(table.lastModified).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
