"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export default function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const t = useTranslations("CustomersPage.pagination")

  // Calculate showing range
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)

  // Generate page numbers to show (5 pages around current)
  const getPageNumbers = () => {
    const pages: number[] = []
    const maxPagesToShow = 5
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        {t("showing", {
          start: startIndex,
          end: endIndex,
          total: totalCount,
        })}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium hidden sm:inline">
            {t("show")}:
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label={t("previous")}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">{t("previous")}</span>
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                aria-label={t("goToPage", { number: pageNum })}
                className="w-9 h-9"
              >
                {pageNum}
              </Button>
            ))}
          </div>

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label={t("next")}
          >
            <span className="hidden sm:inline mr-1">{t("next")}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}