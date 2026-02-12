"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface Clause {
  id: string;
  name: string;
  status: "critique" | "attention" | "ok" | "absent";
  short_description: string;
  original_text: string | null;
  explanation: string;
  recommendation: string;
  suggested_rewrite: string | null;
}

interface Analysis {
  id: string;
  filename: string;
  file_type: string;
  global_score: number;
  summary: string;
  red_flags: string[];
  positive_points: string[];
  created_at: string;
}

function getScoreColor(score: number) {
  if (score > 70) return "text-green-500";
  if (score > 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreBg(score: number) {
  if (score > 70) return "bg-green-500";
  if (score > 40) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreLabel(score: number) {
  if (score > 70) return "Contrat favorable";
  if (score > 40) return "À négocier";
  return "Contrat à risque";
}

function getStatusColor(status: string) {
  switch (status) {
    case "critique": return "bg-red-500/10 text-red-500 border-red-500/20";
    case "attention": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "ok": return "bg-green-500/10 text-green-500 border-green-500/20";
    case "absent": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "critique": return "Critique";
    case "attention": return "Attention";
    case "ok": return "OK";
    case "absent": return "Absent";
    default: return status;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ClauseCard({ clause, index }: { clause: Clause; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (clause.suggested_rewrite) {
      await navigator.clipboard.writeText(clause.suggested_rewrite);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(clause.status)}`}>
            {getStatusLabel(clause.status)}
          </span>
          <span className="font-medium text-foreground">{clause.name}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              {clause.original_text && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Texte original</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg italic text-foreground">
                    "{clause.original_text}"
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Explication</p>
                <p className="text-sm text-foreground">{clause.explanation}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Recommandation</p>
                <p className="text-sm text-foreground">{clause.recommendation}</p>
              </div>

              {clause.suggested_rewrite && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Reformulation suggérée</p>
                  <div className="relative">
                    <p className="text-sm bg-primary/5 border border-primary/20 p-3 rounded-lg text-foreground pr-12">
                      {clause.suggested_rewrite}
                    </p>
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 p-2 hover:bg-primary/10 rounded-md transition-colors"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AnalysisDetail() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/analyses/${params.id}`);
        const data = await response.json();
        
        if (data.success) {
          setAnalysis(data.analysis);
          setClauses(data.clauses);
        } else {
          setError(data.error || 'Analyse non trouvée');
        }
      } catch (err) {
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    if (user && params.id) {
      fetchAnalysis();
    }
  }, [user, params.id]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">{error || 'Analyse non trouvée'}</p>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au dashboard
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PageTransition>
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au dashboard
                </Button>
              </Link>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">{analysis.filename}</h1>
                  </div>
                  <p className="text-muted-foreground">{formatDate(analysis.created_at)}</p>
                </div>

                <Link href="/analyze">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Nouvelle analyse
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>

            {/* Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 mb-8"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-muted"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      className={getScoreColor(analysis.global_score).replace('text-', 'text-')}
                      strokeDasharray={`${(analysis.global_score / 100) * 352} 352`}
                      initial={{ strokeDasharray: "0 352" }}
                      animate={{ strokeDasharray: `${(analysis.global_score / 100) * 352} 352` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-3xl font-bold ${getScoreColor(analysis.global_score)}`}>
                      {analysis.global_score}
                    </span>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <p className={`text-xl font-semibold ${getScoreColor(analysis.global_score)}`}>
                    {getScoreLabel(analysis.global_score)}
                  </p>
                  <p className="text-muted-foreground mt-2">{analysis.summary}</p>
                </div>
              </div>
            </motion.div>

            {/* Red Flags & Positive Points */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {analysis.red_flags && analysis.red_flags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl border border-red-500/20 bg-red-500/5 p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h2 className="font-semibold text-foreground">Points critiques</h2>
                  </div>
                  <ul className="space-y-2">
                    {analysis.red_flags.map((flag, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <span className="text-red-500 mt-1">•</span>
                        {flag}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {analysis.positive_points && analysis.positive_points.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl border border-green-500/20 bg-green-500/5 p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h2 className="font-semibold text-foreground">Points positifs</h2>
                  </div>
                  <ul className="space-y-2">
                    {analysis.positive_points.map((point, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <span className="text-green-500 mt-1">•</span>
                        {point}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            {/* Clauses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Analyse détaillée des clauses
              </h2>
              <div className="space-y-3">
                {clauses.map((clause, index) => (
                  <ClauseCard key={clause.id} clause={clause} index={index} />
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}