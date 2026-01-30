"use client";
import React from 'react';

interface PublicScreenTitleTileProps {
  screenTitle: string;
}

export function PublicScreenTitleTile({ screenTitle }: PublicScreenTitleTileProps) {
  return (
    <>
      <h1 className="text-center w-full flex flex-wrap justify-center relative pt-32  md:pt-40 px-10 md:px-20 pb-4 bg-white text-3xl md:text-4xl lg:text-5xl font-bold">
        {screenTitle}
      </h1>
      <div className=' h-1 md:h-1 bg-sky-500 w-full' />

    </>

  );
}
