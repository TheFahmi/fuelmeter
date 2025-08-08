'use client'

import { AdminGuard } from '@/contexts/admin-context'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Crown, FileText, DollarSign } from 'lucide-react'

export default function AdminTest() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Test Page</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Testing card visibility and styling
              </p>
            </div>

            {/* Test Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Test Card 1</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">123</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This should be visible
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Test Card 2</CardTitle>
                  <Crown className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">456</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This should also be visible
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Test Card 3</CardTitle>
                  <FileText className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">789</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    All text should be visible
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Test Card 4</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">999</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cards should have white background
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Test Content */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Test Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-900 dark:text-white">
                    This is a test paragraph. It should be clearly visible with proper contrast.
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    This is secondary text. It should be slightly dimmer but still readable.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-blue-900 dark:text-blue-100">
                      This is highlighted content in a colored background.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Debug Info */}
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Debug Info</h3>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>• Background should be gray-50 (light) or gray-900 (dark)</li>
                <li>• Cards should have white background with borders</li>
                <li>• Text should be clearly visible with proper contrast</li>
                <li>• Icons should have colors (blue, yellow, green)</li>
                <li>• Hover effects should work on cards</li>
              </ul>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
