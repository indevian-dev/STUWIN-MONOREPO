"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { StudentPageTitleWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/(widgets)/StudentPageTitleWidget";
import { PiUpload, PiX } from "react-icons/pi";

export function StudentHomeworkUploadWidget() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [textContent, setTextContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filePreviews, setFilePreviews] = useState<
    { file: File; preview: string }[]
  >([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      newFiles.forEach((file) => {
        // Create preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFilePreviews((prev) => [
              ...prev,
              { file, preview: reader.result as string },
            ]);
          };
          reader.readAsDataURL(file);
        } else {
          setFilePreviews((prev) => [...prev, { file, preview: "" }]);
        }
      });
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!textContent.trim() && files.length === 0) {
      toast.error("Please enter text content or upload files");
      return;
    }

    try {
      setIsLoading(true);

      // First create the homework
      const createResponse = await apiCallForSpaHelper({
        url: "/api/workspaces/students/homeworks/create",
        method: "POST",
        body: {
          title: title.trim(),
          description: description.trim(),
          textContent: textContent.trim(),
        },
      });

      if (!createResponse.success) {
        throw new Error(createResponse.error || "Failed to create homework");
      }

      const homeworkId = createResponse.data?.id;
      if (!homeworkId) {
        throw new Error("No homework ID returned");
      }

      // Then upload images if any
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);

          const uploadResponse = await apiCallForSpaHelper({
            url: `/api/workspaces/students/homeworks/${homeworkId}/upload-image`,
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.success) {
            toast.warning(
              `File ${file.name} upload failed. You can upload it later.`,
            );
          }
        }
      }

      toast.success("Homework created successfully");
      router.push("/student/homeworks");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload homework";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <StudentPageTitleWidget title="Upload Homework" />

      <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter homework title"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter homework description (optional)"
              disabled={isLoading}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 resize-none"
            />
          </div>

          {/* Text Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Homework Text Content
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter your homework text (write your answers here)"
              disabled={isLoading}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 resize-vertical"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can write your homework answers directly here
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images (Optional)
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition cursor-pointer">
              <input
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
                multiple
                className="hidden"
                id="file-input"
                accept="image/*"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <PiUpload size={32} className="text-gray-400" />
                <span className="text-gray-600 font-medium">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-400">
                  PNG, JPG, GIF up to 10MB each
                </span>
              </label>
            </div>
          </div>

          {/* File List */}
          {filePreviews.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                Uploaded Images ({filePreviews.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filePreviews.map((item, index) => (
                  <div key={index} className="relative group">
                    {item.preview ? (
                      <img
                        src={item.preview}
                        alt={`Preview ${index}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500 text-center px-2">
                          {item.file.name}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isLoading}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    >
                      <PiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={
                isLoading || (!textContent.trim() && files.length === 0)
              }
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300 transition font-medium"
            >
              {isLoading ? "Saving..." : "Save Homework"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/student/homeworks")}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
