'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Shield, CheckCircle, AlertCircle, User, Crown } from 'lucide-react'
import { toast } from 'sonner'

export default function SetupRolePage() {
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)
  const [currentRole, setCurrentRole] = useState<string>('')
  const [newRole, setNewRole] = useState<string>('')
  const supabase = createClient()

  const checkCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        toast.error('Please login first')
        return
      }

      setCurrentUser({ id: user.id, email: user.email || '' })

      // Check current role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role || 'user'
      setCurrentRole(role)
      setNewRole(role)
      
      toast.success(`Current role: ${role}`)
    } catch (error) {
      console.error('Error checking user:', error)
      toast.error('Error checking user')
    }
  }

  const updateRole = async () => {
    if (!currentUser || !newRole) {
      toast.error('Please select a role')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', currentUser.id)

      if (updateError) {
        throw updateError
      }

      setCurrentRole(newRole)
      toast.success(`Successfully updated role to: ${newRole}`)
      
    } catch (error: unknown) {
      console.error('Error updating role:', error)
      toast.error(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-5 w-5 text-red-400" />
      case 'moderator':
        return <Shield className="h-5 w-5 text-yellow-400" />
      case 'premium_user':
        return <Crown className="h-5 w-5 text-purple-400" />
      default:
        return <User className="h-5 w-5 text-blue-400" />
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full system access and management capabilities'
      case 'moderator':
        return 'Limited admin access for content moderation'
      case 'premium_user':
        return 'Premium features and enhanced functionality'
      case 'user':
        return 'Standard user access'
      default:
        return 'Unknown role'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-white">Role Management</CardTitle>
          <p className="text-gray-400 text-sm">
            Check and update user roles
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Check Current User */}
          <div className="space-y-2">
            <Button 
              onClick={checkCurrentUser}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              <User className="h-4 w-4 mr-2" />
              Check Current User
            </Button>
            
            {currentUser && (
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Email:</span>
                  <span className="text-sm text-white">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-300">Current Role:</span>
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(currentRole)}
                    <span className="text-sm text-white capitalize">{currentRole}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Role Selection */}
          {currentUser && (
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Select New Role:</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">👤 User</option>
                <option value="premium_user">👑 Premium User</option>
                <option value="moderator">🛡️ Moderator</option>
                <option value="admin">🔒 Admin</option>
              </select>

              {newRole && (
                <p className="text-xs text-gray-400">
                  {getRoleDescription(newRole)}
                </p>
              )}
            </div>
          )}

          {/* Update Role Button */}
          {currentUser && newRole !== currentRole && (
            <Button 
              onClick={updateRole}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Update Role to {newRole}
            </Button>
          )}

          {/* Admin Access Button */}
          {currentRole === 'admin' || currentRole === 'moderator' ? (
            <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-green-400 font-medium">Admin Access Granted</span>
              </div>
              <Button 
                onClick={() => window.location.href = '/admin'}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to Admin Panel
              </Button>
            </div>
          ) : (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-400 font-medium">No Admin Access</span>
              </div>
              <p className="text-red-300 text-xs mt-1">
                You need admin or moderator role to access admin panel
              </p>
            </div>
          )}

          {/* Manual Setup Instructions */}
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
