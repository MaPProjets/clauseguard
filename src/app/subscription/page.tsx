"use client";

import { Suspense } from "react";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Sparkles, Zap, Crown, Loader2, CheckCircle, XCircle } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const plans = [
  {
    key: "discovery",
    name: "Découverte",
    price: 12,
    analyses: 3,
    icon: Zap,
    features: [
      "3 analyses par mois",
      "Détection des 15 clauses critiques",
      "Explications en français simple",
      "Export PDF",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 19,
    analyses: 10,
    icon: Sparkles,
    popular: true,
    features: [
      "10 analyses par mois",
      "Tout Découverte +",
      "Suggestions de reformulation",
      "Arguments de négociation",
      "Support prioritaire",
    ],
  },
  {
    key: "unlimited",
    name: "Illimité",
    price: 29,
    analyses: -1,
    icon: Crown,
    features: [
      "Analyses illimitées",
      "Tout Pro +",
      "Historique complet",
      "API access (bientôt)",
    ],
  },
];

// Messages de succès personnalisés par plan
const successMessages: Record<string, { title: string; description: string }> = {
  discovery: {
    title: "Déployé.",
    description: "Votre plan Découverte est actif.",
  },
  pro: {
    title: "Vous êtes sur Pro ! ✨",
    description: "10 analyses par mois et toutes les fonctionnalités avancées. Vos contrats sont entre de bonnes mains.",
  },
  unlimited: {
    title: "Illimité activé.",
    description: "Plus aucune limite. Analysez tous vos contrats.",
  },
};

interface Profile {
  analyses_count: number;
  subscription_plan: string;
  trial_ends_at: string;
}

function getQuotaLimit(plan: string) {
  switch (plan) {
    case 'discovery': return 3;
    case 'pro': return 10;
    case 'unlimited': return -1;
    default: return 1;
  }
}

function SubscriptionContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const planKey = searchParams.get('plan') || 'discovery';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/quota');
        const data = await response.json();
        if (data.success) {
          setProfile({
            analyses_count: data.quota.used,
            subscription_plan: data.quota.plan,
            trial_ends_at: data.quota.trialEndsAt,
          });
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, success]);

  const handleSubscribe = async (planKey: string) => {
    setCheckoutLoading(planKey);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Erreur lors de la création du paiement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du paiement');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const hasActiveSubscription = profile && 
    profile.subscription_plan !== 'free' && 
    profile.subscription_plan !== null;

  const currentPlan = plans.find(p => p.key === profile?.subscription_plan);
  const quotaLimit = getQuotaLimit(profile?.subscription_plan || 'free');
  const quotaUsed = profile?.analyses_count || 0;
  const quotaPercent = quotaLimit === -1 ? 0 : (quotaUsed / quotaLimit) * 100;

  if (loading) {
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PageTransition>
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-2xl font-bold text-foreground md:text-3xl"
            >
              Abonnement
            </motion.h1>

            {/* Success Message - personnalisé par plan */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 rounded-xl border border-green-500/20 bg-green-500/5 p-6 flex items-center gap-4"
              >
                <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-foreground">
                    {successMessages[planKey]?.title || "Paiement réussi !"}
                  </h2>
                  <p className="text-muted-foreground">
                    {successMessages[planKey]?.description || "Votre abonnement est maintenant actif."}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Cancel Message */}
            {canceled && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 rounded-xl border border-orange-500/20 bg-orange-500/5 p-6 flex items-center gap-4"
              >
                <XCircle className="h-8 w-8 text-orange-500 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-foreground">Paiement annulé</h2>
                  <p className="text-muted-foreground">Vous pouvez réessayer quand vous le souhaitez.</p>
                </div>
              </motion.div>
            )}

            {hasActiveSubscription ? (
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Current Plan Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-2xl border border-border bg-card p-8 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Votre abonnement</h2>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <Badge className="bg-primary text-primary-foreground">
                        {currentPlan && <currentPlan.icon className="w-3 h-3 mr-1" />}
                        {currentPlan?.name || profile?.subscription_plan}
                      </Badge>
                    </motion.div>
                  </div>

                  <div className="space-y-5">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Analyses utilisées</span>
                        <span className="text-sm font-medium text-foreground">
                          {quotaLimit === -1 
                            ? `${quotaUsed} (illimité)`
                            : `${quotaUsed} / ${quotaLimit} ce mois`
                          }
                        </span>
                      </div>
                      {quotaLimit !== -1 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                          style={{ originX: 0 }}
                        >
                          <Progress value={quotaPercent} className="h-2" />
                        </motion.div>
                      )}
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-muted-foreground">Montant mensuel</span>
                      <span className="text-sm font-medium text-foreground">{currentPlan?.price}€ / mois</span>
                    </motion.div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 flex flex-col gap-3"
                  >
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
                      Annuler l'abonnement
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="rounded-2xl border border-border bg-card p-8 shadow-sm"
                >
                  <h2 className="text-xl font-semibold text-foreground mb-6">Avantages de votre plan</h2>
                  <ul className="space-y-4">
                    {currentPlan?.features.map((feature, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </motion.div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            ) : (
              /* Pricing Cards */
              <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.key}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className={`relative rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-lg ${
                      plan.popular 
                        ? "border-primary bg-primary/5" 
                        : "border-border bg-card"
                    }`}
                  >
                    {plan.popular && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2"
                      >
                        <Badge className="bg-primary text-primary-foreground">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Populaire
                        </Badge>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
                    >
                      <plan.icon className="h-6 w-6 text-primary" />
                    </motion.div>

                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">{plan.price}€</span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature, fIndex) => (
                        <motion.li
                          key={fIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 + fIndex * 0.05 }}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>

                    <motion.div 
                      className="mt-8"
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        className="w-full" 
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan.key)}
                        disabled={checkoutLoading !== null}
                      >
                        {checkoutLoading === plan.key ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          "Commencer"
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Footer note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 text-center text-sm text-muted-foreground"
            >
              Paiement sécurisé par Stripe. Annulez à tout moment.
            </motion.p>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}

export default function Subscription() {
  return (
    <Suspense>
      <SubscriptionContent />
    </Suspense>
  );
}
