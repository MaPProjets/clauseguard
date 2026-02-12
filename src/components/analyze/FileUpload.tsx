"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  error?: string | null;
}

const FileUpload = ({ onFileSelected, error }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.docx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileSelected(file);
    };
    input.click();
  }, [onFileSelected]);

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        animate={isDragging ? { scale: 1.02, borderColor: "hsl(var(--primary))" } : {}}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        }`}
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
        >
          <motion.div
            animate={isDragging ? { y: [0, -5, 0] } : {}}
            transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
          >
            <Upload className="h-8 w-8 text-primary" />
          </motion.div>
        </motion.div>
        <p className="text-xl font-semibold text-foreground">
          Glissez votre contrat ici
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          ou cliquez pour sélectionner (PDF, DOCX — max 5 MB)
        </p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;