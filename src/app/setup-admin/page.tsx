'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, CheckCircle, AlertCircle, User } from 'lucide-react'
import { toast } from 'sonner'

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  const checkCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        toast.error('Please login first')
        return
      }

      setCurrentUser({ id: user.id, email: user.email || '' })

      // Check if already admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsAdmin(profile?.role === 'admin' || profile?.role === 'moderator')
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  const setupAdmin = async () => {
    if (!currentUser) {
      toast.error('Please check current user first')
      return
    }

    setLoading(true)
    try {
      // Make current user admin using role system
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', currentUser.id)

      if (updateError) {
        throw updateError
      }

      setIsAdmin(true)
      toast.success('Successfully set up admin access!')

    } catch (error: unknown) {
      console.error('Error setting up admin:', error)
      toast.error(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-white">Admin Setup</CardTitle>
          <p className="text-gray-400 text-sm">
            Set up the first admin user for FuelMeter
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentUser ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-400">
                <User className="h-4 w-4" />
                <span>Check current user status</span>
              </div>
              <Button 
                onClick={checkCurrentUser}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Check Current User
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-blue-400" />
                  <span className="text-white font-medium">Current User</span>
                </div>
                <p className="text-gray-400 text-sm">{currentUser.email}</p>
                <p className="text-gray-400 text-xs">ID: {currentUser.id}</p>
              </div>

              {isAdmin ? (
                <div className="bg-green-900/20 border border-green-700 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">Admin Access Active</span>
                  </div>
                  <p className="text-green-300 text-sm mt-1">
                    You can now access the admin panel at /admin
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/admin'}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Go to Admin Panel
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-yellow-900/20 border border-yellow-700 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">No Admin Access</span>
                    </div>
                    <p className="text-yellow-300 text-sm mt-1">
                      Click below to grant admin access to this user
                    </p>
                  </div>
                  
                  <Button 
                    onClick={setupAdmin}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? 'Setting up...' : 'Grant Admin Access'}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-white font-medium mb-2">Manual Setup</h3>
            <p className="text-gray-400 text-xs mb-2">
              If automatic setup fails, run this SQL in Supabase:
            </p>
            <div className="bg-gray-900 p-2 rounded text-xs text-gray-300 font-mono">
              UPDATE profiles SET role = &apos;admin&apos; WHERE email = &apos;your-email@example.com&apos;;
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
