/**
 * Analytics Test Page
 * หน้าทดสอบการวิเคราะห์
 *
 * Use this to debug analytics functions
 */

import { getTranslations } from "next-intl/server"
import { getTopCustomers } from "./actions"

export default async function AnalyticsTestPage() {
  const t = await getTranslations("Analytics")

  let error = null
  let data = null

  try {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    data = await getTopCustomers(startDate, endDate, 10)
  } catch (e: any) {
    error = e.message
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Analytics Debug Test</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Top Customers Result:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <div className="mt-4 bg-blue-100 p-4 rounded">
        <h3 className="font-bold">Debug Info:</h3>
        <p>Data is array: {Array.isArray(data) ? 'Yes' : 'No'}</p>
        <p>Data length: {data?.length || 0}</p>
        <p>Has error: {error ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}
