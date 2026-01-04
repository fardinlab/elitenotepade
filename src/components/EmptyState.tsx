import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-8 text-center card-shadow"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-400/20 flex items-center justify-center">
        <UserPlus className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
        No Members Yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        Start building your team by adding your first member using the + button below.
      </p>
    </motion.div>
  );
}
