"use client"

/**
 * Date Range Selector Component
 * คอมโพเนนต์เลือกช่วงเวลา
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export default function DateRangeSelector({
  defaultStartDate,
  defaultEndDate
}: {
  defaultStartDate: string
  defaultEndDate: string
}) {
  const router = useRouter()
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)

  const handleApply = () => {
    router.push(`/reports/analytics?start=${startDate}&end=${endDate}`)
  }

  const setPreset = (days: number) => {
    const end = new Date().toISOString().split('T')[0]
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    setStartDate(start)
    setEndDate(end)
    router.push(`/reports/analytics?start=${start}&end=${end}`)
  }

  return (
    <div className="bg-white p-4 rounded-lg border mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <label className="text-sm font-medium">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        <Button onClick={handleApply} size="sm">
          Apply
        </Button>

        <div className="flex gap-2">
          <Button onClick={() => setPreset(7)} variant="outline" size="sm">
            Last 7 Days
          </Button>
          <Button onClick={() => setPreset(30)} variant="outline" size="sm">
            Last 30 Days
          </Button>
          <Button onClick={() => setPreset(90)} variant="outline" size="sm">
            Last 90 Days
          </Button>
          <Button onClick={() => setPreset(365)} variant="outline" size="sm">
            Last Year
          </Button>
        </div>
      </div>
    </div>
  )
}
