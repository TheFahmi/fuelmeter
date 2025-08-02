'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BurgerMenu } from '@/components/ui/menu'
import { ThemeWrapper } from '@/components/ui/theme-wrapper'
import { User, ArrowLeft, Save, Download, Upload, Trash2, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  email: string
  displayName: string
  vehicleType: string
  fuelCapacity: number
  monthlyBudget: number
  currency: string
  lastServiceDate: string
  serviceIntervalDays: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    email: '',
    displayName: '',
    vehicleType: '',
    fuelCapacity: 0,
    monthlyBudget: 0,
    currency: 'IDR',
    lastServiceDate: '',
    serviceIntervalDays: 90
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile from user_settings or create default
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .single()

      // Handle case where settings don't exist or columns are missing
      if (settingsError) {
        console.log('Settings not found or columns missing, using defaults')
              setProfile({
        email: user.email || '',
        displayName: '',
        vehicleType: '',
        fuelCapacity: 0,
        monthlyBudget: 0,
        currency: 'IDR',
        lastServiceDate: '',
        serviceIntervalDays: 90
      })
      } else {
        setProfile({
          email: user.email || '',
          displayName: settings?.display_name || '',
          vehicleType: settings?.vehicle_type || '',
          fuelCapacity: settings?.fuel_capacity || 0,
          monthlyBudget: settings?.monthly_budget || 0,
          currency: settings?.currency || 'IDR',
          lastServiceDate: settings?.last_service_date || '',
          serviceIntervalDays: settings?.service_interval_days || 90
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      // Set default profile on error
      setProfile({
        email: '',
        displayName: '',
        vehicleType: '',
        fuelCapacity: 0,
        monthlyBudget: 0,
        currency: 'IDR',
        lastServiceDate: '',
        serviceIntervalDays: 90
      })
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // First try to update existing settings
      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({
          display_name: profile.displayName,
          vehicle_type: profile.vehicleType,
          fuel_capacity: profile.fuelCapacity,
          monthly_budget: profile.monthlyBudget,
          currency: profile.currency
        }, {
          onConflict: 'user_id'
        })

      if (updateError) {
        console.log('Update failed, trying insert:', updateError)
        
        // If update fails, try to insert with only basic columns
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            display_name: profile.displayName,
            vehicle_type: profile.vehicleType,
            fuel_capacity: profile.fuelCapacity,
            monthly_budget: profile.monthlyBudget,
            currency: profile.currency
          })

        if (insertError) throw insertError
      }

      setSuccess('Profil berhasil disimpan!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: unknown) {
      console.error('Save profile error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan profil'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const exportData = async () => {
    try {
      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: false })

      if (!records) return

      // Convert to CSV
      const headers = ['Date', 'Fuel Type', 'Quantity (L)', 'Price/L', 'Total Cost', 'Odometer (km)', 'Distance (km)', 'Cost/km']
      const csvContent = [
        headers.join(','),
        ...records.map(record => [
          record.date,
          record.fuel_type,
          record.quantity,
          record.price_per_liter,
          record.total_cost,
          record.odometer_km || 0,
          record.distance_km || 0,
          record.cost_per_km || 0
        ].join(','))
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fuel-records-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      setSuccess('Data berhasil diexport!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Gagal export data')
    }
  }

  const clearAllData = async () => {
    if (!confirm('⚠️ PERINGATAN: Ini akan menghapus SEMUA data bahan bakar Anda. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?')) {
      return
    }

    if (!confirm('Konfirmasi sekali lagi: Hapus SEMUA data bahan bakar?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('fuel_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

      if (error) throw error

      setSuccess('Semua data berhasil dihapus')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      setError('Gagal menghapus data')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat profil...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeWrapper>
      {({ isDarkMode, toggleDarkMode }) => (
        <div className="bg-gray-50 dark:bg-gray-900 flex-1">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <Link href="/dashboard" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Profil</h1>
                </div>
                <BurgerMenu isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-6">
              {/* Profile Settings */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Pengaturan Profil</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Kelola informasi akun dan preferensi Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveProfile} className="space-y-4">
                    <Input
                      label="Email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-gray-100 dark:bg-gray-700"
                    />
                    
                    <Input
                      label="Nama Tampilan"
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                      placeholder="Masukkan nama tampilan"
                    />
                    
                    <Input
                      label="Jenis Kendaraan"
                      type="text"
                      value={profile.vehicleType}
                      onChange={(e) => setProfile({...profile, vehicleType: e.target.value})}
                      placeholder="Contoh: Honda Civic, Toyota Avanza"
                    />
                    
                    <Input
                      label="Kapasitas Tangki (Liter)"
                      type="number"
                      min="0"
                      step="0.1"
                      value={profile.fuelCapacity}
                      onChange={(e) => setProfile({...profile, fuelCapacity: parseFloat(e.target.value) || 0})}
                      placeholder="Contoh: 45"
                    />
                    
                    <Input
                      label="Budget Bulanan (Rp)"
                      type="number"
                      min="0"
                      value={profile.monthlyBudget}
                      onChange={(e) => setProfile({...profile, monthlyBudget: parseInt(e.target.value) || 0})}
                      placeholder="Contoh: 500000"
                    />

                    <Input
                      label="Tanggal Servis Terakhir"
                      type="date"
                      value={profile.lastServiceDate}
                      onChange={(e) => setProfile({...profile, lastServiceDate: e.target.value})}
                    />

                    <Input
                      label="Interval Servis (Hari)"
                      type="number"
                      min="30"
                      max="365"
                      value={profile.serviceIntervalDays}
                      onChange={(e) => setProfile({...profile, serviceIntervalDays: parseInt(e.target.value) || 90})}
                      placeholder="Contoh: 90"
                    />

                    {error && (
                      <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        {success}
                      </div>
                    )}

                    <Button type="submit" disabled={saving} className="w-full">
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Simpan Profil
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Kelola Data</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Export, backup, atau hapus data bahan bakar Anda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={exportData} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data ke CSV
                  </Button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h4>
                    <Button 
                      onClick={clearAllData}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Semua Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      )}
    </ThemeWrapper>
  )
} 