'use client'

interface StudentSectionTitleWidgetProps {
  sectionTitle: string;
  description?: string;
}

export function StudentSectionTitleWidget({
  sectionTitle,
  description
}: StudentSectionTitleWidgetProps) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-gray-900">
        {sectionTitle}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-gray-600">
          {description}
        </p>
      )}
    </div>
  )
}

