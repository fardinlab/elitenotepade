import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Calendar, ChevronDown, ChevronRight, Trash2, X, Check } from 'lucide-react';
import { Team, MAX_MEMBERS, SubscriptionType, SUBSCRIPTION_CONFIG } from '@/types/member';

interface TeamListProps {
  teams: Team[];
  activeTeamId: string;
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: (teamName: string, logo?: SubscriptionType) => void;
  onDeleteTeam: (teamId: string) => void;
}

const LOGO_ICONS: Record<SubscriptionType, string> = {
  chatgpt: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
  gemini: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg',
  perplexity: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/perplexity-ai-icon.png',
  youtube: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
  canva: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg',
};

export function TeamList({ teams, activeTeamId, onSelectTeam, onCreateTeam, onDeleteTeam }: TeamListProps) {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedLogo, setSelectedLogo] = useState<SubscriptionType | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

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

  const handleCreateClick = () => {
    setNewTeamName('');
    setSelectedLogo(null);
    setShowCreateModal(true);
  };

  const confirmCreate = () => {
    const trimmedName = newTeamName.trim();
    if (trimmedName && trimmedName.length <= 50) {
      onCreateTeam(trimmedName, selectedLogo || undefined);
      setShowCreateModal(false);
      setNewTeamName('');
      setSelectedLogo(null);
    }
  };

  const handleTeamClick = (team: Team) => {
    if (isDeleteMode) {
      handleDeleteClick(team, { stopPropagation: () => {} } as React.MouseEvent);
    } else {
      if (expandedTeamId === team.id) {
        setExpandedTeamId(null);
      } else {
        setExpandedTeamId(team.id);
        onSelectTeam(team.id);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons Row */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateClick}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors touch-manipulation active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create New Team
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsDeleteMode(!isDeleteMode)}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors touch-manipulation active:scale-95 ${
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
          const isExpanded = expandedTeamId === team.id;
          const isFull = memberCount >= MAX_MEMBERS;

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl border transition-all overflow-hidden ${
                isDeleteMode
                  ? 'bg-destructive/5 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50'
                  : isExpanded
                    ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/10'
                    : 'bg-card border-border hover:border-primary/30 hover:bg-secondary/30'
              }`}
            >
              <button
                onClick={() => handleTeamClick(team)}
                className="w-full p-4 text-left touch-manipulation"
              >
                <div className="flex items-center gap-3">
                  {/* Team Logo/Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${
                    isDeleteMode 
                      ? 'bg-destructive/20 text-destructive' 
                      : team.logo
                        ? 'bg-white'
                        : isExpanded 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-muted-foreground'
                  }`}>
                    {isDeleteMode ? (
                      <Trash2 className="w-5 h-5" />
                    ) : team.logo ? (
                      <img 
                        src={LOGO_ICONS[team.logo]} 
                        alt={SUBSCRIPTION_CONFIG[team.logo].name}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
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

                  {isExpanded ? (
                    <ChevronDown className={`w-5 h-5 transition-colors ${
                      isDeleteMode ? 'text-destructive' : 'text-primary'
                    }`} />
                  ) : (
                    <ChevronRight className={`w-5 h-5 transition-colors ${
                      isDeleteMode ? 'text-destructive' : 'text-muted-foreground'
                    }`} />
                  )}
                </div>
              </button>

              {/* Expanded Member List */}
              <AnimatePresence>
                {isExpanded && !isDeleteMode && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
                      {/* Admin */}
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">A</span>
                        </div>
                        <span className="text-foreground truncate">{team.adminEmail}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">Admin</span>
                      </div>
                      
                      {/* Members */}
                      {team.members.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-8">No members yet</p>
                      ) : (
                        team.members.map((member, mIndex) => (
                          <div key={member.id} className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                              <span className="text-[10px] font-medium text-muted-foreground">{mIndex + 1}</span>
                            </div>
                            <span className="text-foreground truncate flex-1">{member.email}</span>
                            {member.subscriptions && member.subscriptions.length > 0 && (
                              <div className="flex gap-1">
                                {member.subscriptions.map(sub => (
                                  <img 
                                    key={sub}
                                    src={LOGO_ICONS[sub]}
                                    alt={SUBSCRIPTION_CONFIG[sub].name}
                                    className="w-4 h-4 object-contain"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
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
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors touch-manipulation active:scale-95"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors touch-manipulation active:scale-95"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Create New Team</h3>
                <p className="text-sm text-muted-foreground">
                  Enter a name and select a logo for your team
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value.slice(0, 50))}
                    placeholder="Enter team name..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTeamName.trim()) {
                        confirmCreate();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {newTeamName.length}/50
                  </p>
                </div>

                {/* Logo Selection */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Select Team Logo (Optional)</p>
                  <div className="grid grid-cols-5 gap-2">
                    {(Object.keys(SUBSCRIPTION_CONFIG) as SubscriptionType[]).map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedLogo(selectedLogo === type ? null : type)}
                        className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all touch-manipulation ${
                          selectedLogo === type
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'bg-secondary border border-border hover:border-primary/50'
                        }`}
                      >
                        <img 
                          src={LOGO_ICONS[type]} 
                          alt={SUBSCRIPTION_CONFIG[type].name}
                          className="w-6 h-6 object-contain"
                        />
                        {selectedLogo === type && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  {selectedLogo && (
                    <p className="text-xs text-primary text-center">
                      {SUBSCRIPTION_CONFIG[selectedLogo].name} selected
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors touch-manipulation active:scale-95"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmCreate}
                  disabled={!newTeamName.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                >
                  Create
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}