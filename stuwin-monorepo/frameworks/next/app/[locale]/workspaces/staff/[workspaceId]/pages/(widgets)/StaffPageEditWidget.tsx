"use client";
import React from 'react';

import Editor from '@/app/[locale]/workspaces/staff/[workspaceId]/ui/editor';

export function StaffPageEditWidget({ title }: { title: string }) {
    return (
        <div>
            <h1 className="text-3xl font-bold text-left my-4 px-4">
                {title}
            </h1>
            <Editor />
        </div>
    );
}
