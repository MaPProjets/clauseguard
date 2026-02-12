"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, AlertTriangle, Eye, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

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

interface Profile {
  analyses_count: number;
  subscription_plan: string;
  trial_ends_at: string;
}

function getScoreBadgeVariant(score: number) {
  if (score > 70) return "ok" as const;
  if (score > 40) return "attention" as const;
  return "critique" as const;
}

function getScoreColor(score: number) {
  if (score > 70) return "text-green-500";
  if (score > 40) return "text-orange-500";
  return "text-red-500";
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getQuotaLimit(plan: string) {
  switch (plan) {
    case 'discovery': return 3;
    case 'pro': return 10;
    case 'unlimited': return -1;
    default: return 1;
  }
}

export default function Dashboard() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const response = await fetch('/api/analyses');
        const data = await response.json();
        
        if (data.success) {
          setAnalyses(data.analyses);
          setProfile(data.profile);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAnalyses();
    }
  }, [user]);

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

  const hasAnalyses = analyses.length > 0;
  const avgScore = hasAnalyses 
    ? Math.round(analyses.reduce((acc, a) => acc + a.global_score, 0) / analyses.length)
    : 0;
  const totalRedFlags = analyses.reduce((acc, a) => acc + (a.red_flags?.length || 0), 0);
  
  const quotaLimit = getQuotaLimit(profile?.subscription_plan || 'free');
  const quotaUsed = profile?.analyses_count || 0;
  const quotaText = quotaLimit === -1 
    ? `${quotaUsed} analyses (illimité)`
    : `${quotaUsed}/${quotaLimit} analyses ce mois`;

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
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
            >
              <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">Mes analyses</h1>
                <p className="text-muted-foreground mt-1">{quotaText}</p>
              </div>
              <Link href="/analyze">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Nouvelle analyse
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Stats Cards */}
            {hasAnalyses && (
              <div className="grid gap-4 sm:grid-cols-3 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total analyses</p>
                      <p className="text-2xl font-bold text-foreground">{analyses.length}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Score moyen</p>
                      <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}/100</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Red flags détectés</p>
                      <p className="text-2xl font-bold text-foreground">{totalRedFlags}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Empty State */}
            {!hasAnalyses ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
                >
                  <FileText className="h-8 w-8 text-primary" />
                </motion.div>
                <h2 className="text-xl font-semibold text-foreground">Aucune analyse pour le moment</h2>
                <p className="mt-2 text-muted-foreground">Commencez par analyser votre premier contrat.</p>
                <Link href="/analyze" className="mt-6">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg">Analyser mon premier contrat</Button>
                  </motion.div>
                </Link>
              </motion.div>
            ) : (
              /* Analyses Grid */
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {analyses.map((analysis, index) => (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant={getScoreBadgeVariant(analysis.global_score)}>
                        Score : {analysis.global_score}/100
                      </Badge>
                      {analysis.red_flags && analysis.red_flags.length > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="flex items-center gap-1 text-xs text-destructive"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {analysis.red_flags.length}
                        </motion.span>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground truncate">{analysis.filename}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{formatDate(analysis.created_at)}</p>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link href={`/dashboard/${analysis.id}`} className="block mt-4">
                         <Button variant="outline" size="sm" className="w-full">
                            <Eye className="mr-1.5 h-4 w-4" />
                            Voir le détail
                           </Button>
                        </Link>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}