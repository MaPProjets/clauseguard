import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Lightbulb, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClauseAnalysis } from "@/types";

interface ClauseCardProps {
  clause: ClauseAnalysis;
}

const statusLabels = {
  critique: "Critique",
  attention: "Attention",
  ok: "OK",
  absent: "Absent",
};

const ClauseCard = ({ clause }: ClauseCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <Badge variant={clause.status}>{statusLabels[clause.status]}</Badge>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{clause.name}</p>
          <p className="text-sm text-muted-foreground">{clause.shortDescription}</p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {clause.originalText && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm italic text-muted-foreground">
                "{clause.originalText}"
              </p>
            </div>
          )}

          <div>
            <p className="text-sm leading-relaxed text-foreground">
              {clause.explanation}
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-primary/5 p-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">{clause.recommendation}</p>
          </div>

          {clause.suggestedRewrite && (
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reformulation suggérée
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(clause.suggestedRewrite!)}
                  className="h-8 gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-foreground">{clause.suggestedRewrite}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClauseCard;
