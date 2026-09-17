"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";

const MAX_DIMENSION = 640;
const JPEG_QUALITY = 0.82;

// Resizes/compresses the image in the browser before it's stored as a data
// URL, so a phone photo doesn't blow up the (mock, file-based) database.
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotoUpload({
  value,
  onChange,
  label = "Photo",
  helperText = "JPG or PNG, up to 8MB.",
  error,
}: {
  value: string | undefined;
  onChange: (dataUrl: string) => void;
  label?: string;
  helperText?: string;
  error?: string;
}) {
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    setLocalError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLocalError("Image is too large (max 8MB)");
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
    } catch {
      setLocalError("Could not process that image. Try another one.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
        <span className="text-violet-600">
          <Camera size={16} />
        </span>
        {label}
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-violet-500 bg-violet-50"
            : value
            ? "border-transparent p-0"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        {processing ? (
          <div className="py-6 flex flex-col items-center gap-2 text-violet-600">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-xs font-medium">Processing photo...</span>
          </div>
        ) : value ? (
          <div className="relative w-full group">
            <img
              src={value}
              alt="Attached"
              className="w-full max-h-56 object-cover rounded-xl border border-gray-200"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/75 text-white !rounded-full !p-1.5 flex items-center justify-center"
              aria-label="Remove photo"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className="w-11 h-11 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center">
              <ImagePlus size={20} />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Click to upload or drag a photo here
            </p>
            <p className="text-xs text-gray-400">{helperText}</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {(localError || error) && (
        <p className="text-red-500 text-xs mt-1.5">{localError || error}</p>
      )}
    </div>
  );
}
