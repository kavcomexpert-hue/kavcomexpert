"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

export const motionEase = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
} & Pick<HTMLMotionProps<"div">, "id">;

export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
  id,
}: RevealProps) {
  const Component = motion[as];

  return (
    <Component
      id={id}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.5, ease: motionEase, delay }}
    >
      {children}
    </Component>
  );
}

type HeroRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function HeroReveal({ children, className, delay = 0 }: HeroRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: motionEase, delay }}
    >
      {children}
    </motion.div>
  );
}
