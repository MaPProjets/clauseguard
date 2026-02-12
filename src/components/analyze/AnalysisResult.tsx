import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, FileText, RotateCcw } from "lucide-react";
import ScoreCircle from "./ScoreCircle";
import ClauseCard from "./ClauseCard";
import type { AnalysisResult } from "@/types";

interface AnalysisResultProps {
  result: AnalysisResult;
  filename: string;
  onReset: () => void;
}

const AnalysisResultView = ({ result, filename, onReset }: AnalysisResultProps) => {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:flex-row sm:text-left">
        <ScoreCircle score={result.globalScore} />
        <div className="flex-1">
          <p className="text-lg font-semibold text-foreground">{filename}</p>
          <p className="text-sm text-muted-foreground">Analysé le {date}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Nouvelle analyse
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="mr-1.5 h-4 w-4" />
              Exporter PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Résumé
        </h3>
        <p className="leading-relaxed text-foreground">{result.summary}</p>
      </div>

      {/* Red Flags */}
      {result.redFlags.length > 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Points critiques à négocier
          </h3>
          <ul className="space-y-2">
            {result.redFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Positive Points */}
      {result.positivePoints.length > 0 && (
        <div className="rounded-xl border border-success/20 bg-success/5 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-success">
            <CheckCircle className="h-5 w-5" />
            Points positifs
          </h3>
          <ul className="space-y-2">
            {result.positivePoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Clauses */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Clauses analysées ({result.clauses.length})
        </h3>
        <div className="space-y-3">
          {result.clauses.map((clause) => (
            <ClauseCard key={clause.name} clause={clause} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultView;
