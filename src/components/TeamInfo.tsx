import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check, X, Mail, Users, Calendar } from 'lucide-react';
import { MAX_MEMBERS } from '@/types/member';
import { format } from 'date-fns';

interface TeamInfoProps {
  teamName: string;
  adminEmail: string;
  memberCount: number;
  createdAt: string;
  onTeamNameChange: (name: string) => void;
  onAdminEmailChange: (email: string) => void;
}

export function TeamInfo({ teamName, adminEmail, memberCount, createdAt, onTeamNameChange, onAdminEmailChange }: TeamInfoProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(teamName);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState(adminEmail);

  const handleSaveName = () => {
    if (editNameValue.trim()) {
      onTeamNameChange(editNameValue.trim());
      setIsEditingName(false);
    }
  };

  const handleCancelName = () => {
    setEditNameValue(teamName);
    setIsEditingName(false);
  };

  const handleSaveEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editEmailValue.trim() && emailRegex.test(editEmailValue.trim())) {
      onAdminEmailChange(editEmailValue.trim());
      setIsEditingEmail(false);
    }
  };

  const handleCancelEmail = () => {
    setEditEmailValue(adminEmail);
    setIsEditingEmail(false);
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
        {isEditingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              className="flex-1 bg-input rounded-lg px-3 py-2 text-lg font-display font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelName();
              }}
            />
            <button
              onClick={handleSaveName}
              className="p-2 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancelName}
              className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-foreground">{teamName}</h2>
            <button
              onClick={() => setIsEditingName(true)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Edit team name"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Creation Date */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Calendar className="w-4 h-4" />
        <span>Created: {format(new Date(createdAt), 'd MMMM yyyy')}</span>
      </div>

      {/* Admin Email */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        {isEditingEmail ? (
          <div className="flex items-center gap-2 flex-1">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <input
              type="email"
              value={editEmailValue}
              onChange={(e) => setEditEmailValue(e.target.value)}
              className="flex-1 bg-input rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEmail();
                if (e.key === 'Escape') handleCancelEmail();
              }}
            />
            <button
              onClick={handleSaveEmail}
              className="p-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCancelEmail}
              className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            <span>Admin: {adminEmail}</span>
            <button
              onClick={() => setIsEditingEmail(true)}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Edit admin email"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </>
        )}
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
