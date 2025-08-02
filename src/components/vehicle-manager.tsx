'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Car, Plus, Edit, Trash2 } from 'lucide-react'

interface Vehicle {
  id: string
  name: string
  type: string
  fuel_capacity: number
  last_service_date?: string
  service_interval_days: number
  is_primary: boolean
  created_at: string
}

export function VehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    fuel_capacity: 0,
    last_service_date: '',
    service_interval_days: 90
  })
  const supabase = createClient()

  const loadVehicles = useCallback(async () => {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.log('No vehicles table or error:', error)
        setVehicles([])
      } else {
        setVehicles(vehicles || [])
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingVehicle) {
        // Update existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update({
            name: formData.name,
            type: formData.type,
            fuel_capacity: formData.fuel_capacity,
            last_service_date: formData.last_service_date || null,
            service_interval_days: formData.service_interval_days
          })
          .eq('id', editingVehicle.id)

        if (error) throw error
      } else {
        // Add new vehicle
        const { error } = await supabase
          .from('vehicles')
          .insert({
            name: formData.name,
            type: formData.type,
            fuel_capacity: formData.fuel_capacity,
            last_service_date: formData.last_service_date || null,
            service_interval_days: formData.service_interval_days,
            is_primary: vehicles.length === 0 // First vehicle is primary
          })

        if (error) throw error
      }

      // Reset form and reload
      resetForm()
      loadVehicles()
    } catch (error) {
      console.error('Error saving vehicle:', error)
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      name: vehicle.name,
      type: vehicle.type,
      fuel_capacity: vehicle.fuel_capacity,
      last_service_date: vehicle.last_service_date || '',
      service_interval_days: vehicle.service_interval_days
    })
    setShowAddForm(true)
  }

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)

      if (error) throw error
      loadVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
    }
  }

  const handleSetPrimary = async (vehicleId: string) => {
    try {
      // First, unset all vehicles as primary
      await supabase
        .from('vehicles')
        .update({ is_primary: false })

      // Then set the selected vehicle as primary
      const { error } = await supabase
        .from('vehicles')
        .update({ is_primary: true })
        .eq('id', vehicleId)

      if (error) throw error
      loadVehicles()
    } catch (error) {
      console.error('Error setting primary vehicle:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      fuel_capacity: 0,
      last_service_date: '',
      service_interval_days: 90
    })
    setEditingVehicle(null)
    setShowAddForm(false)
  }

  const getDaysUntilService = (vehicle: Vehicle) => {
    if (!vehicle.last_service_date) return null
    
    const lastService = new Date(vehicle.last_service_date)
    const nextService = new Date(lastService.getTime() + (vehicle.service_interval_days * 24 * 60 * 60 * 1000))
    const today = new Date()
    const diffDays = Math.floor((nextService.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  if (loading) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
          <div className="flex items-center">
            <Car className="h-5 w-5 mr-2" />
            Vehicle Manager
          </div>
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm ? (
          /* Add/Edit Form */
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vehicle Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Honda Civic, Toyota Avanza"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vehicle Type
                  </label>
                  <Input
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    placeholder="e.g., Sedan, SUV, MPV"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fuel Capacity (L)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.fuel_capacity}
                    onChange={(e) => setFormData({...formData, fuel_capacity: parseFloat(e.target.value) || 0})}
                    placeholder="e.g., 45"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Service Date
                  </label>
                  <Input
                    type="date"
                    value={formData.last_service_date}
                    onChange={(e) => setFormData({...formData, last_service_date: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service Interval (Days)
                  </label>
                  <Input
                    type="number"
                    value={formData.service_interval_days}
                    onChange={(e) => setFormData({...formData, service_interval_days: parseInt(e.target.value) || 90})}
                    placeholder="e.g., 90"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* Vehicles List */
          <div className="space-y-4">
            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Vehicles Added
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Add your first vehicle to start tracking fuel consumption
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Vehicle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((vehicle) => {
                  const daysUntilService = getDaysUntilService(vehicle)
                  const isOverdue = daysUntilService !== null && daysUntilService < 0
                  const isDueSoon = daysUntilService !== null && daysUntilService <= 7 && daysUntilService >= 0
                  
                  return (
                    <div
                      key={vehicle.id}
                      className={`p-4 rounded-lg border ${
                        vehicle.is_primary 
                          ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {vehicle.name}
                            </h4>
                            {vehicle.is_primary && (
                              <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                                Primary
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Type:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{vehicle.type}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{vehicle.fuel_capacity}L</p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Service:</span>
                              <p className={`font-medium ${
                                isOverdue ? 'text-red-600 dark:text-red-400' :
                                isDueSoon ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-gray-900 dark:text-white'
                              }`}>
                                {daysUntilService === null ? 'Not set' :
                                 isOverdue ? `${Math.abs(daysUntilService)} days overdue` :
                                 isDueSoon ? `${daysUntilService} days left` :
                                 `${daysUntilService} days left`}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!vehicle.is_primary && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetPrimary(vehicle.id)}
                            >
                              Set Primary
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(vehicle)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(vehicle.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 