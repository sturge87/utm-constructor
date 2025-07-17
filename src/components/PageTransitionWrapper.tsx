"use client";
import { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const [direction, setDirection] = useState(1); // 1 = left, -1 = right

  useEffect(() => {
    if (prevPath.current) {
      if (prevPath.current === "/" && pathname === "/all-utms") {
        setDirection(1); // slide left
      } else if (prevPath.current === "/all-utms" && pathname === "/") {
        setDirection(-1); // slide right
      } else {
        setDirection(1);
      }
    }
    prevPath.current = pathname;
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 100 * direction }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 * direction }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
} 