import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Calendar, ChevronRight, Trash2, X } from 'lucide-react';
import { Team, MAX_MEMBERS } from '@/types/member';

interface TeamListProps {
  teams: Team[];
  activeTeamId: string;
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: () => void;
  onDeleteTeam: (teamId: string) => void;
}

export function TeamList({ teams, activeTeamId, onSelectTeam, onCreateTeam, onDeleteTeam }: TeamListProps) {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isCurrentMonth = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const handleDeleteClick = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation();
    setTeamToDelete(team);
  };

  const confirmDelete = () => {
    if (teamToDelete) {
      onDeleteTeam(teamToDelete.id);
      setTeamToDelete(null);
      setIsDeleteMode(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons Row */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateTeam}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Team
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsDeleteMode(!isDeleteMode)}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
            isDeleteMode 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20'
          }`}
        >
          {isDeleteMode ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Delete Team
            </>
          )}
        </motion.button>
      </div>

      {isDeleteMode && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive text-center"
        >
          Tap on a team below to delete it
        </motion.p>
      )}

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted-foreground">
          Your Teams ({teams.length})
        </h3>
      </div>

      <div className="space-y-2">
        {teams.map((team, index) => {
          const memberCount = team.members.length + 1;
          const isActive = team.id === activeTeamId;
          const isFull = memberCount >= MAX_MEMBERS;

          return (
            <motion.button
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => isDeleteMode ? handleDeleteClick(team, { stopPropagation: () => {} } as React.MouseEvent) : onSelectTeam(team.id)}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                isDeleteMode
                  ? 'bg-destructive/5 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50'
                  : isActive
                    ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/10'
                    : 'bg-card border-border hover:border-primary/30 hover:bg-secondary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDeleteMode 
                    ? 'bg-destructive/20 text-destructive' 
                    : isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-muted-foreground'
                }`}>
                  {isDeleteMode ? <Trash2 className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">{team.teamName}</h4>
                    {isCurrentMonth(team.createdAt) && (
                      <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-medium rounded">
                        NEW
                      </span>
                    )}
                    {isFull && (
                      <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-medium rounded">
                        FULL
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {memberCount}/{MAX_MEMBERS}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(team.createdAt)}
                    </span>
                  </div>
                </div>

                <ChevronRight className={`w-5 h-5 transition-colors ${
                  isDeleteMode ? 'text-destructive' : isActive ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {teamToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setTeamToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Delete Team?</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete "<span className="font-medium text-foreground">{teamToDelete.teamName}</span>"? 
                  This will remove all {teamToDelete.members.length} member{teamToDelete.members.length !== 1 ? 's' : ''}.
                </p>
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTeamToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
