import { motion } from 'framer-motion';
import { Plus, Users, Calendar, ChevronRight } from 'lucide-react';
import { Team, MAX_MEMBERS } from '@/types/member';

interface TeamListProps {
  teams: Team[];
  activeTeamId: string;
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: () => void;
  showCreateButton: boolean;
}

export function TeamList({ teams, activeTeamId, onSelectTeam, onCreateTeam, showCreateButton }: TeamListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isCurrentMonth = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted-foreground">
          Your Teams ({teams.length})
        </h3>
        {showCreateButton && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateTeam}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Team
          </motion.button>
        )}
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
              onClick={() => onSelectTeam(team.id)}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                isActive
                  ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/10'
                  : 'bg-card border-border hover:border-primary/30 hover:bg-secondary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  <Users className="w-5 h-5" />
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
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
