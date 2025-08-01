'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Fuel } from 'lucide-react'

interface InitialOdometerModalProps {
  isOpen: boolean
  onSave: (initialOdometer: number) => void
  onSkip: () => void
}

export function InitialOdometerModal({ isOpen, onSave, onSkip }: InitialOdometerModalProps) {
  const [odometer, setOdometer] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    const odometerValue = parseFloat(odometer)
    
    if (!odometer || isNaN(odometerValue) || odometerValue < 0) {
      setError('Masukkan odometer yang valid')
      return
    }

    setError('')
    onSave(odometerValue)
  }

  const handleSkip = () => {
    setOdometer('')
    setError('')
    onSkip()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      title="Odometer Awal"
      showCloseButton={false}
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Fuel className="h-6 w-6 text-blue-600" />
        </div>
        
        <p className="text-gray-600 mb-6">
          Untuk perhitungan jarak tempuh yang akurat, mohon masukkan odometer awal kendaraan Anda.
        </p>

        <div className="mb-6">
          <Input
            label="Odometer Awal (km)"
            type="number"
            step="0.1"
            min="0"
            placeholder="0.0"
            value={odometer}
            onChange={(e) => {
              setOdometer(e.target.value)
              if (error) setError('')
            }}
            error={error}
          />
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
          >
            Lewati
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={!odometer}
          >
            Simpan
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Anda dapat mengubah odometer awal nanti di pengaturan.
        </p>
      </div>
    </Modal>
  )
} 