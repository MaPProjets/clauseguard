import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Découverte",
    price: "12",
    features: [
      "3 analyses par mois",
      "Détection des 15 clauses critiques",
      "Explications en français simple",
      "Export PDF",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: "19",
    features: [
      "10 analyses par mois",
      "Tout Découverte +",
      "Suggestions de reformulation",
      "Arguments de négociation",
      "Support prioritaire",
    ],
    popular: true,
  },
  {
    name: "Illimité",
    price: "29",
    features: [
      "Analyses illimitées",
      "Tout Pro +",
      "Historique complet",
    ],
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section className="bg-card py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Tarifs simples, sans engagement
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choisissez le plan adapté à votre activité.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-background p-8 shadow-sm transition-shadow hover:shadow-md ${
                plan.popular
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <Badge variant="popular" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Populaire
                </Badge>
              )}

              <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">{plan.price}€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full"
                variant={plan.popular ? "default" : "outline"}
                size="lg"
              >
                Commencer
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Essai gratuit 7 jours, sans carte bancaire
        </p>
      </div>
    </section>
  );
};

export default Pricing;
