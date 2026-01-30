'use client'

interface StaffPageTitleTileProps {
  pageTitle: string;
}

export function StaffPageTitleTile({ pageTitle }: StaffPageTitleTileProps) {
  return (
    <div className="mb-4 p-4 bg-white">
      <h1 className="text-lg font-bold text-brand">
        {pageTitle}
      </h1>
    </div>
  );
}
