"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FileUpload from "@/components/analyze/FileUpload";
import AnalysisLoading from "@/components/analyze/AnalysisLoading";
import AnalysisResultView from "@/components/analyze/AnalysisResult";
import { useAnalysis } from "@/hooks/useAnalysis";
import { PageTransition } from "@/components/ui/page-transition";
import { SlideUp } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Quota {
  plan: string;
  limit: number;
  used: number;
  remaining: number;
  canAnalyze: boolean;
  trialExpired: boolean;
}

export default function Analyze() {
  const { analyzeFile, reset, isUploading, isAnalyzing, result, error, filename } = useAnalysis();
  const [quota, setQuota] = useState<Quota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const isLoading = isUploading || isAnalyzing;

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await fetch('/api/quota');
        const data = await response.json();
        if (data.success) {
          setQuota(data.quota);
        }
      } catch (err) {
        console.error('Erreur quota:', err);
      } finally {
        setQuotaLoading(false);
      }
    };

    fetchQuota();
  }, [result]); // Rafraîchir après une analyse

  const handleAnalyze = (file: File) => {
    if (quota && !quota.canAnalyze) {
      return; // Bloqué par le quota
    }
    analyzeFile(file);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PageTransition>
        <main className="flex-1">
          <div className="container mx-auto px-4 py-12">
            {/* Quota Warning */}
            {!quotaLoading && quota && !quota.canAnalyze && !result && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 mx-auto max-w-2xl"
              >
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    {quota.trialExpired 
                      ? "Votre essai gratuit a expiré"
                      : "Quota d'analyses atteint"
                    }
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {quota.trialExpired
                      ? "Passez à un abonnement pour continuer à analyser vos contrats."
                      : `Vous avez utilisé vos ${quota.limit} analyses du mois. Passez à un plan supérieur pour continuer.`
                    }
                  </p>
                  <Link href="/subscription">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Voir les abonnements
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Quota Badge */}
            {!quotaLoading && quota && quota.canAnalyze && !isLoading && !result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-4"
              >
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {quota.limit === -1 
                    ? "Analyses illimitées"
                    : `${quota.remaining} analyse${quota.remaining > 1 ? 's' : ''} restante${quota.remaining > 1 ? 's' : ''}`
                  }
                </span>
              </motion.div>
            )}

            {!isLoading && !result && quota?.canAnalyze && (
              <SlideUp>
                <div className="mb-10 text-center">
                  <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                    Analysez votre contrat
                  </h1>
                  <p className="mt-3 text-lg text-muted-foreground">
                    Uploadez un contrat et obtenez un rapport détaillé en quelques secondes.
                  </p>
                </div>
                <FileUpload onFileSelected={handleAnalyze} error={error} />
              </SlideUp>
            )}

            {isLoading && <AnalysisLoading />}

            {result && (
              <SlideUp>
                <AnalysisResultView result={result} filename={filename} onReset={reset} />
              </SlideUp>
            )}
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}