#!/usr/bin/env python3
"""
ClauseGuard Project Snapshot Generator
======================================
Ce script génère un fichier Markdown contenant tous les fichiers du projet.
À utiliser pour mettre à jour la mémoire projet de Claude.

Usage:
    python generate-project-snapshot.py

Le fichier CLAUSEGUARD-SNAPSHOT.md sera généré dans le même dossier.
"""

import os
from datetime import datetime
from pathlib import Path

# Configuration
PROJECT_ROOT = "."  # Dossier courant (lance le script depuis la racine du projet)
OUTPUT_FILE = "CLAUSEGUARD-SNAPSHOT.md"

# Dossiers à ignorer
IGNORE_DIRS = {
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "dist",
    "build",
    ".turbo",
    "__pycache__",
    ".cache",
    "coverage",
}

# Fichiers à ignorer
IGNORE_FILES = {
    ".DS_Store",
    "Thumbs.db",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    ".env.local",  # Sécurité : ne pas inclure les secrets
    ".env",
    ".gitignore",
}

# Extensions à inclure (fichiers de code uniquement)
INCLUDE_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".css",
    ".md",
    ".sql",
    ".env.example",
}

# Fichiers spécifiques à toujours inclure (même sans extension matchée)
ALWAYS_INCLUDE = {
    "middleware.ts",
    "next.config.ts",
    "next.config.js",
    "tailwind.config.js",
    "tailwind.config.ts",
    "postcss.config.js",
    "postcss.config.mjs",
    "tsconfig.json",
    "package.json",
    ".env.example",
}


def get_language(filename: str) -> str:
    """Retourne le langage pour le bloc de code Markdown."""
    ext_map = {
        ".ts": "typescript",
        ".tsx": "tsx",
        ".js": "javascript",
        ".jsx": "jsx",
        ".json": "json",
        ".css": "css",
        ".md": "markdown",
        ".sql": "sql",
        ".env": "env",
        ".env.example": "env",
    }
    ext = Path(filename).suffix.lower()
    return ext_map.get(ext, "")


def should_include_file(filepath: Path) -> bool:
    """Détermine si un fichier doit être inclus."""
    filename = filepath.name
    
    # Ignorer certains fichiers
    if filename in IGNORE_FILES:
        return False
    
    # Toujours inclure certains fichiers
    if filename in ALWAYS_INCLUDE:
        return True
    
    # Vérifier l'extension
    ext = filepath.suffix.lower()
    return ext in INCLUDE_EXTENSIONS


def should_include_dir(dirpath: Path) -> bool:
    """Détermine si un dossier doit être parcouru."""
    return dirpath.name not in IGNORE_DIRS


def get_project_structure(root: Path) -> list:
    """Retourne la structure arborescente du projet."""
    structure = []
    
    for item in sorted(root.iterdir()):
        if item.is_dir():
            if should_include_dir(item):
                structure.append(f"├── {item.name}/")
                # Récursif simplifié (2 niveaux max pour la structure)
                try:
                    for subitem in sorted(item.iterdir()):
                        if subitem.is_dir() and should_include_dir(subitem):
                            structure.append(f"│   ├── {subitem.name}/")
                        elif subitem.is_file() and should_include_file(subitem):
                            structure.append(f"│   ├── {subitem.name}")
                except PermissionError:
                    pass
        elif item.is_file() and should_include_file(item):
            structure.append(f"├── {item.name}")
    
    return structure


def collect_files(root: Path) -> list:
    """Collecte tous les fichiers à inclure."""
    files = []
    
    for dirpath, dirnames, filenames in os.walk(root):
        # Filtrer les dossiers à ignorer
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
        
        for filename in sorted(filenames):
            filepath = Path(dirpath) / filename
            if should_include_file(filepath):
                files.append(filepath)
    
    return files


def read_file_content(filepath: Path) -> str:
    """Lit le contenu d'un fichier."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"# Erreur de lecture: {e}"


def generate_markdown(root: Path) -> str:
    """Génère le contenu Markdown complet."""
    
    lines = []
    
    # En-tête
    lines.append("# ClauseGuard - Project Snapshot")
    lines.append("")
    lines.append(f"> **Généré le** : {datetime.now().strftime('%d/%m/%Y à %H:%M')}")
    lines.append("> **Usage** : Copier ce fichier dans la mémoire projet Claude")
    lines.append("")
    lines.append("---")
    lines.append("")
    
    # Contexte projet
    lines.append("## 📋 Contexte Projet")
    lines.append("")
    lines.append("**ClauseGuard** - SaaS d'analyse de contrats par IA pour freelances/TPE francophones.")
    lines.append("")
    lines.append("### Stack")
    lines.append("- Frontend : Next.js 16 + TypeScript + Tailwind CSS v3 + shadcn/ui + Framer Motion")
    lines.append("- Backend : API Routes Next.js")
    lines.append("- IA : Claude API (Sonnet)")
    lines.append("- Auth & DB : Supabase")
    lines.append("- Paiement : Stripe")
    lines.append("- Hébergement : Vercel")
    lines.append("")
    lines.append("### Pricing")
    lines.append("- Découverte : 12€/mois (3 analyses)")
    lines.append("- Pro : 19€/mois (10 analyses)")
    lines.append("- Illimité : 29€/mois")
    lines.append("")
    lines.append("---")
    lines.append("")
    
    # Structure du projet
    lines.append("## 📁 Structure du projet")
    lines.append("")
    lines.append("```")
    lines.append("clauseguard/")
    for item in get_project_structure(root):
        lines.append(item)
    lines.append("```")
    lines.append("")
    lines.append("---")
    lines.append("")
    
    # Variables d'environnement (template)
    lines.append("## 🔐 Variables d'environnement (.env.local)")
    lines.append("")
    lines.append("```env")
    lines.append("# Supabase")
    lines.append("NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co")
    lines.append("NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx")
    lines.append("SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx")
    lines.append("")
    lines.append("# Anthropic")
    lines.append("ANTHROPIC_API_KEY=sk-ant-xxxxx")
    lines.append("")
    lines.append("# Stripe")
    lines.append("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx")
    lines.append("STRIPE_SECRET_KEY=sk_test_xxxxx")
    lines.append("STRIPE_WEBHOOK_SECRET=whsec_xxxxx")
    lines.append("STRIPE_PRICE_DISCOVERY=price_xxxxx")
    lines.append("STRIPE_PRICE_PRO=price_xxxxx")
    lines.append("STRIPE_PRICE_UNLIMITED=price_xxxxx")
    lines.append("")
    lines.append("# App")
    lines.append("NEXT_PUBLIC_APP_URL=http://localhost:3000")
    lines.append("```")
    lines.append("")
    lines.append("---")
    lines.append("")
    
    # Contenu des fichiers
    lines.append("## 📄 Fichiers du projet")
    lines.append("")
    
    files = collect_files(root)
    
    for filepath in files:
        relative_path = filepath.relative_to(root)
        language = get_language(filepath.name)
        content = read_file_content(filepath)
        
        lines.append(f"### {relative_path}")
        lines.append("")
        lines.append(f"```{language}")
        lines.append(content)
        lines.append("```")
        lines.append("")
    
    # Footer
    lines.append("---")
    lines.append("")
    lines.append("## ✅ Fonctionnalités implémentées")
    lines.append("")
    lines.append("- [x] Upload PDF/DOCX")
    lines.append("- [x] Extraction de texte (unpdf + mammoth)")
    lines.append("- [x] Analyse Claude API (15 types de clauses)")
    lines.append("- [x] Authentification Supabase")
    lines.append("- [x] Sauvegarde analyses en DB")
    lines.append("- [x] Dashboard avec historique")
    lines.append("- [x] Page détail analyse")
    lines.append("- [x] Animations Framer Motion")
    lines.append("- [x] Routes protégées (middleware)")
    lines.append("- [x] Quotas par plan")
    lines.append("- [x] Stripe Checkout")
    lines.append("")
    lines.append("## 🔧 À faire")
    lines.append("")
    lines.append("- [ ] Webhook Stripe (production)")
    lines.append("- [ ] Export PDF du rapport")
    lines.append("- [ ] Déploiement Vercel")
    lines.append("- [ ] Tests beta")
    lines.append("")
    
    return "\n".join(lines)


def main():
    root = Path(PROJECT_ROOT).resolve()
    
    print(f"📂 Scanning project: {root}")
    print(f"📝 Generating snapshot...")
    
    markdown = generate_markdown(root)
    
    output_path = root / OUTPUT_FILE
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(markdown)
    
    # Stats
    files = collect_files(root)
    print(f"✅ Snapshot generated: {output_path}")
    print(f"   - {len(files)} files included")
    print(f"   - {len(markdown)} characters")
    print("")
    print("💡 Copie le contenu de ce fichier dans la mémoire projet Claude !")


if __name__ == "__main__":
    main()