"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface WorkspaceHeaderProps {
  label: string;
  title: string;
  description?: string;
}

/**
 * Consistent workspace header — editorial label, display title, and
 * optional description. Used at the top of every workspace.
 */
export function WorkspaceHeader({ label, title, description }: WorkspaceHeaderProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mb-12 grid gap-6 border-b border-border pb-10 pt-10 lg:grid-cols-[0.36fr_0.64fr]"
    >
      <motion.div variants={staggerItem}>
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-accent-amber">
          {label}
        </p>
      </motion.div>
      <motion.div variants={staggerItem}>
        <h1 className="font-display text-4xl leading-tight text-ivory sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
            {description}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
