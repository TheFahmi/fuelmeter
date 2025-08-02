'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Upload, FileText, Check, X, RotateCcw } from 'lucide-react'

interface ReceiptData {
  date: string
  fuelType: string
  quantity: number
  pricePerLiter: number
  totalCost: number
  station: string
}

export function ReceiptScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<ReceiptData | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
      setIsScanning(true)
      
      // Simulate OCR processing
      setTimeout(() => {
        simulateOCRScan(file)
      }, 2000)
    }
    reader.readAsDataURL(file)
  }

  const simulateOCRScan = (file: File) => {
    // Simulate OCR processing with realistic data
    const mockData: ReceiptData = {
      date: new Date().toISOString().split('T')[0],
      fuelType: Math.random() > 0.5 ? 'Pertalite' : 'Pertamax',
      quantity: Math.round((Math.random() * 20 + 10) * 100) / 100, // 10-30L
      pricePerLiter: Math.round((Math.random() * 2000 + 8000) / 100) * 100, // 8000-10000
      totalCost: 0,
      station: ['Pertamina', 'Shell', 'BP', 'Total'][Math.floor(Math.random() * 4)]
    }
    
    mockData.totalCost = mockData.quantity * mockData.pricePerLiter
    const mockConfidence = Math.round((Math.random() * 30 + 70)) // 70-100%

    setScannedData(mockData)
    setConfidence(mockConfidence)
    setIsScanning(false)
  }

  const handleRetake = () => {
    setPreviewImage(null)
    setScannedData(null)
    setConfidence(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConfirm = () => {
    // Here you would typically save the data to your form
    console.log('Confirmed receipt data:', scannedData)
    // You can emit an event or use a callback to pass data to parent
  }

  const handleEdit = (field: keyof ReceiptData, value: string | number) => {
    if (!scannedData) return
    
    const updatedData = { ...scannedData, [field]: value }
    if (field === 'quantity' || field === 'pricePerLiter') {
      updatedData.totalCost = updatedData.quantity * updatedData.pricePerLiter
    }
    setScannedData(updatedData)
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return 'text-green-600 dark:text-green-400'
    if (conf >= 80) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <Camera className="h-5 w-5 mr-2" />
          Receipt Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!previewImage ? (
          /* Upload Section */
          <div className="text-center">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
              <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Scan Receipt
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Upload foto struk BBM untuk auto-extract data
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Choose Photo
              </Button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Supports JPG, PNG, HEIC up to 10MB
              </p>
            </div>
          </div>
        ) : (
          /* Scanning/Results Section */
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative">
              <img
                src={previewImage}
                alt="Receipt preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={handleRetake}
                className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {isScanning ? (
              /* Scanning State */
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Scanning Receipt...
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Extracting data from your receipt
                </p>
              </div>
            ) : scannedData ? (
              /* Results State */
              <div className="space-y-4">
                {/* Confidence Score */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Scan Complete
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${getConfidenceColor(confidence)}`}>
                    {confidence}% Confidence
                  </span>
                </div>

                {/* Extracted Data */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Extracted Data
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Date
                      </label>
                      <Input
                        type="date"
                        value={scannedData.date}
                        onChange={(e) => handleEdit('date', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Station
                      </label>
                      <Input
                        value={scannedData.station}
                        onChange={(e) => handleEdit('station', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Fuel Type
                      </label>
                      <select
                        value={scannedData.fuelType}
                        onChange={(e) => handleEdit('fuelType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                      >
                        <option value="Pertalite">Pertalite</option>
                        <option value="Pertamax">Pertamax</option>
                        <option value="Pertamax Turbo">Pertamax Turbo</option>
                        <option value="Solar">Solar</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Quantity (L)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={scannedData.quantity}
                        onChange={(e) => handleEdit('quantity', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Price per Liter (Rp)
                      </label>
                      <Input
                        type="number"
                        value={scannedData.pricePerLiter}
                        onChange={(e) => handleEdit('pricePerLiter', parseInt(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Total Cost (Rp)
                      </label>
                      <Input
                        type="number"
                        value={scannedData.totalCost}
                        readOnly
                        className="text-sm bg-gray-50 dark:bg-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleRetake}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Use This Data
                  </Button>
                </div>

                {/* Tips */}
                <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="font-medium mb-1">💡 Tips for better scanning:</p>
                  <ul className="space-y-1">
                    <li>• Pastikan struk terang dan jelas</li>
                    <li>• Hindari bayangan dan refleksi</li>
                    <li>• Pastikan semua angka terlihat</li>
                    <li>• Periksa data yang diextract sebelum konfirmasi</li>
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 