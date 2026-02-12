import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Pricing from "@/components/home/Pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const Subscription = () => {
  // Mock: user has a Pro subscription
  const hasSubscription = true;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-10">
          <h1 className="mb-8 text-2xl font-bold text-foreground md:text-3xl">Abonnement</h1>

          {hasSubscription ? (
            <div className="mx-auto max-w-lg">
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Votre abonnement</h2>
                  <Badge variant="default">Pro</Badge>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Prochaine facturation</span>
                    <span className="text-sm font-medium text-foreground">8 mars 2026</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Analyses utilisées</span>
                      <span className="text-sm font-medium text-foreground">3 / 10 ce mois</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Montant mensuel</span>
                    <span className="text-sm font-medium text-foreground">19€ / mois</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <Button variant="outline" className="w-full">Changer de plan</Button>
                  <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
                    Annuler l'abonnement
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Pricing />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Subscription;
