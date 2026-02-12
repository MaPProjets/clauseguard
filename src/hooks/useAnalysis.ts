import { useState, useCallback } from "react";
import type { AnalysisResult } from "@/types";

export function useAnalysis() {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");

  const analyzeFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setFilename(file.name);

    // Validation côté client
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
      setError("Format non supporté. Veuillez utiliser un fichier PDF ou DOCX.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 5 MB).");
      return;
    }

    // Déterminer le type de fichier
    const fileType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx';

    try {
      // Étape 1 : Upload du fichier
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || "Erreur lors de l'upload");
      }

      setIsUploading(false);

      // Étape 2 : Analyse du contrat
      setIsAnalyzing(true);

      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: uploadData.text,
          filename: file.name,
          fileType: fileType,
        }),
      });

      const analyzeData = await analyzeResponse.json();

      if (!analyzeResponse.ok || !analyzeData.success) {
        throw new Error(analyzeData.error || "Erreur lors de l'analyse");
      }

      setIsAnalyzing(false);

      // Transformer le résultat pour matcher le format attendu par le frontend
      const transformedResult: AnalysisResult = {
        globalScore: analyzeData.analysis.globalScore,
        summary: analyzeData.analysis.summary,
        clauses: analyzeData.analysis.clauses.map((clause: any) => ({
          name: clause.type,
          status: clause.riskLevel,
          shortDescription: clause.found ? "Clause trouvée" : "Clause absente",
          originalText: clause.originalText,
          explanation: clause.explanation,
          recommendation: clause.recommendation,
          suggestedRewrite: clause.suggestedRewrite,
        })),
        redFlags: analyzeData.analysis.redFlags,
        positivePoints: analyzeData.analysis.positivePoints,
      };

      setResult(transformedResult);

    } catch (err) {
      setIsUploading(false);
      setIsAnalyzing(false);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setFilename("");
    setIsUploading(false);
    setIsAnalyzing(false);
  }, []);

  return {
    analyzeFile,
    reset,
    isUploading,
    isAnalyzing,
    result,
    error,
    filename,
  };
}