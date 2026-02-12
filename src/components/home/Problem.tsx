import { Clock, Copyright, TrendingDown } from "lucide-react";

const stats = [
  {
    icon: Clock,
    value: "45%",
    label: "ont subi des retards de paiement",
  },
  {
    icon: Copyright,
    value: "38%",
    label: "ont perdu leurs droits sur leur travail",
  },
  {
    icon: TrendingDown,
    value: "2 340€",
    label: "perdus en moyenne par an",
  },
];

const Problem = () => {
  return (
    <section className="bg-card py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            76% des freelances ont déjà signé un contrat défavorable
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Ne laissez plus les clauses cachées vous coûter cher.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.value}
              className="flex flex-col items-center rounded-xl border border-border bg-background p-8 text-center shadow-sm"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
                <stat.icon className="h-7 w-7 text-destructive" />
              </div>
              <p className="text-3xl font-extrabold text-foreground">{stat.value}</p>
              <p className="mt-2 text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Problem;
