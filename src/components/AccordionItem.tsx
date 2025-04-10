import type React from "react";
import { motion } from "framer-motion";
interface AccordionItemProps {
  isOpen: boolean;
  children: React.ReactNode;
}
const accordionVariants = {
  open: { height: "auto", opacity: 1, transition: { duration: 0.3 } },
  collapsed: { height: 0, opacity: 0, transition: { duration: 0.3 } },
};
export function AccordionItem({ isOpen, children }: AccordionItemProps) {
  return (
    <motion.div
      initial={isOpen ? "open" : "collapsed"}
      animate={isOpen ? "open" : "collapsed"}
      variants={accordionVariants}
      style={{ overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}
