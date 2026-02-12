import { Upload, Zap, FileText } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "1",
    title: "Uploadez votre contrat",
    description: "PDF ou Word, c'est tout",
  },
  {
    icon: Zap,
    number: "2",
    title: "L'IA analyse en 30 secondes",
    description: "15 types de clauses vérifiées",
  },
  {
    icon: FileText,
    number: "3",
    title: "Obtenez votre rapport",
    description: "Score, alertes et conseils de négociation",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Comment ça marche
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Trois étapes simples pour protéger vos intérêts.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              <div className="mb-6 relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
