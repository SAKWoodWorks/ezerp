"use client"

interface BarcodeScannerProps {
  onScanSuccess: (code: string) => void
  title?: string
  description?: string
}

export default function BarcodeScanner({
  onScanSuccess,
  title = "Barcode Scanner",
  description = "Scan a barcode to continue"
}: BarcodeScannerProps) {
  // Placeholder implementation - in a real app this would use a camera/scanner library
  const handleMockScan = () => {
    // Simulate scanning a barcode - you can replace this with actual scanner integration
    const mockBarcode = "1234567890"
    onScanSuccess(mockBarcode)
  }

  return (
    <div className="p-6 border border-dashed border-gray-300 rounded-lg text-center space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      <div className="bg-gray-50 p-8 rounded-lg">
        <div className="text-gray-400 text-6xl mb-4">📷</div>
        <p className="text-gray-500 mb-4">Camera scanner placeholder</p>
        <button
          onClick={handleMockScan}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Simulate Scan (Test: 1234567890)
        </button>
      </div>

      <p className="text-xs text-gray-400">
        In production, this would integrate with html5-qrcode or similar camera scanner library
      </p>
    </div>
  )
}
