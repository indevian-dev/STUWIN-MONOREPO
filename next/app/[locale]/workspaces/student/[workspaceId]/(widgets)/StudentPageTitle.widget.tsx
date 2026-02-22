'use client'

interface StudentPageTitleWidgetProps {
  pageTitle: string;
}

export function StudentPageTitleWidget({ pageTitle }: StudentPageTitleWidgetProps) {
  return (
    <div className="mb-4 p-4 bg-white">
      <h1 className="text-lg font-bold text-app-bright-green">
        {pageTitle}
      </h1>
    </div>
  )
}
