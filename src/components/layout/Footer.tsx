import { Shield } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-foreground">ClauseGuard</span>
          </Link>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
  <a href="mailto:contact@clauseguard.fr" className="hover:text-foreground">Contact</a>
</nav>

          <p className="text-sm text-muted-foreground">
            Fait avec ❤️ pour les freelances français
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;