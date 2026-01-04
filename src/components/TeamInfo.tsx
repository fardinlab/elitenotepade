import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check, X, Mail, Users } from 'lucide-react';
import { MAX_MEMBERS } from '@/types/member';

interface TeamInfoProps {
  teamName: string;
  adminEmail: string;
  memberCount: number;
  onTeamNameChange: (name: string) => void;
}

export function TeamInfo({ teamName, adminEmail, memberCount, onTeamNameChange }: TeamInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(teamName);

  const handleSave = () => {
    if (editValue.trim()) {
      onTeamNameChange(editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(teamName);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-2xl p-5 card-shadow"
    >
      {/* Team Name */}
      <div className="flex items-center gap-3 mb-4">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 bg-input rounded-lg px-3 py-2 text-lg font-display font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <button
              onClick={handleSave}
              className="p-2 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-foreground">{teamName}</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Edit team name"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Admin Email */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Mail className="w-4 h-4" />
        <span>Admin: {adminEmail}</span>
      </div>

      {/* Member Count */}
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${(memberCount / MAX_MEMBERS) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {memberCount}/{MAX_MEMBERS}
        </span>
      </div>
    </motion.div>
  );
}
