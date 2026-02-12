"use client";

import { motion } from "framer-motion";
import { FileSearch, Shield, CheckCircle } from "lucide-react";

const steps = [
  { icon: FileSearch, label: "Lecture du document..." },
  { icon: Shield, label: "Analyse des clauses..." },
  { icon: CheckCircle, label: "Génération du rapport..." },
];

const AnalysisLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8"
      >
        {/* Cercle animé */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary"
        />
        <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-foreground mb-2"
      >
        Analyse en cours...
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-8"
      >
        Notre IA examine votre contrat
      </motion.p>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.3 }}
            className="flex items-center gap-3 text-sm text-muted-foreground"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: index * 0.3
              }}
            >
              <step.icon className="w-5 h-5 text-primary" />
            </motion.div>
            {step.label}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisLoading;