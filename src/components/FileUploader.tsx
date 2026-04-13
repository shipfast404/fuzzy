'use client';

import { useCallback, useState, useRef } from 'react';

interface FileUploaderProps {
  label: string;
  onFileSelected: (file: File) => void;
  fileName?: string;
  accept?: string;
}

export function FileUploader({
  label,
  onFileSelected,
  fileName,
  accept = '.xlsx,.xls',
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : fileName
          ? 'border-green-300 bg-green-50'
          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {fileName ? (
        <div>
          <div className="text-green-600 text-lg mb-1">&#10003;</div>
          <p className="text-sm font-medium text-gray-700">{fileName}</p>
          <p className="text-xs text-gray-400 mt-1">Cliquer pour changer de fichier</p>
        </div>
      ) : (
        <div>
          <div className="text-gray-400 text-2xl mb-2">&#8593;</div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-400 mt-1">
            Glisser-déposer ou cliquer pour sélectionner (.xlsx, .xls)
          </p>
        </div>
      )}
    </div>
  );
}
