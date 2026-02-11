"use client";

import React, {
  useState,
  useEffect
} from 'react';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import { uploadFile } from '@/lib/utils/upload/FileUploadHelper';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
import Image
  from 'next/image';

interface Subject {
  id: number;
  title: string;
  title_ru: string;
  title_en: string;
  description: string;
  description_en: string;
  description_ru: string;
  icon: string;
  price: number;
}

interface StaffSubjectIconUploadWidgetProps {
  subject: Subject;
  setType: React.Dispatch<React.SetStateAction<Subject>>;
}

export function StaffSubjectIconUploadWidget({ subject, setType }: StaffSubjectIconUploadWidgetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Initialize preview with existing icon
  useEffect(() => {
    if (subject?.icon) {
      setIconPreview(subject.icon);
    }
  }, [subject?.icon]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    try {
      setSelectedFile(file);
      setIconPreview(URL.createObjectURL(file));
    } catch (error) {
      ConsoleLogger.error('Error processing file:', error);
      toast.error('Failed to process the selected file.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Get presigned URL from API
      ConsoleLogger.log('🔗 Getting presigned URL for subject icon...');
      const signedUrlData = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/workspaces/staff/subjects/media/upload/${subject.id}`,
      });

      ConsoleLogger.log('✅ Presigned URL response:', signedUrlData);

      if (!signedUrlData.data?.uploadURL || !signedUrlData.data?.fileName) {
        throw new Error('Invalid presigned URL response from server');
      }

      // Step 2: Upload file to S3 using the utility function
      ConsoleLogger.log('⬆️ Starting S3 upload...');
      const uploadResult = await uploadFile({
        file: selectedFile,
        fileName: signedUrlData.data.fileName,
        presignedUrl: signedUrlData.data.uploadURL,
        setProgress: (progressValue) => {
          setProgress(progressValue);
        }
      });

      ConsoleLogger.log('✅ Upload completed, result:', uploadResult);

      // Step 3: Update subject icon in database
      ConsoleLogger.log('📝 Updating subject icon in database...');
      const updateResponse = await apiCallForSpaHelper({
        method: 'PUT',
        url: `/api/workspaces/staff/subjects/update/${subject.id}`,
        body: { icon: signedUrlData.data.fileName }
      });

      if (updateResponse.status !== 200) {
        throw new Error('Failed to update subject icon in database');
      }

      // Step 4: Update local state
      setIconPreview(signedUrlData.data.fileName);
      setType(prev => ({ ...prev, icon: signedUrlData.data.fileName }));

      toast.success('Icon uploaded successfully!');
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('iconFileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      ConsoleLogger.error('❌ Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload icon.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const getIconUrl = (iconFileName: string | null): string | null => {
    if (!iconFileName) return null;
    // Construct the full S3 URL for the icon
    return `${process.env.NEXT_PUBLIC_S3_PREFIX}/subjects/${subject.id}/${iconFileName}`;
  };

  return (
    <div className="w-full mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Subject Icon
      </label>

      {/* Icon Preview */}
      <div className="flex justify-center mb-4">
        {iconPreview ? (
          <div className="relative">
            <Image
              src={selectedFile ? iconPreview : (getIconUrl(iconPreview) || '/pg.webp')}
              alt="Subject Icon Preview"
              width={100}
              height={100}
              style={{ objectFit: "contain" }}
              className="border border-gray-300 rounded-lg p-2 bg-white"
              onError={(e) => {
                ConsoleLogger.error('Failed to load icon preview');
                // Fallback to placeholder if icon fails to load
                const target = e.target as HTMLImageElement;
                target.src = '/pg.webp'; // You might want to adjust this path
              }}
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-white text-xs text-center">
                  <div>Uploading...</div>
                  <div>{Math.round(progress)}%</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* File Input */}
      <div className="space-y-3">
        <input
          id="iconFileInput"
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={uploading}
        />

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${!selectedFile || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
        >
          {uploading ? `Uploading... ${Math.round(progress)}%` : 'Upload Icon'}
        </button>
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

