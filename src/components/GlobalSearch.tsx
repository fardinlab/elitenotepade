import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Users } from 'lucide-react';
import { Team, Member } from '@/types/member';

interface SearchResult {
  team: Team;
  member: Member;
  isAdmin: boolean;
}

interface GlobalSearchProps {
  onSearch: (query: string) => SearchResult[];
  onSelectTeam: (teamId: string, memberId?: string) => void;
}

export function GlobalSearch({ onSearch, onSelectTeam }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      const searchResults = onSearch(value);
      setResults(searchResults);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelectResult = (teamId: string, memberId: string) => {
    onSelectTeam(teamId, memberId);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by email or phone..."
          className="w-full pl-10 pr-10 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
          >
            {results.map((result, index) => (
              <button
                key={`${result.team.id}-${result.member.id}-${index}`}
                onClick={() => handleSelectResult(result.team.id, result.member.id)}
                className="w-full px-4 py-3 hover:bg-secondary/50 active:bg-secondary/70 transition-colors text-left border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {result.member.email}
                      {result.isAdmin && (
                        <span className="ml-2 text-xs text-primary">(Admin)</span>
                      )}
                    </p>
                    {result.member.phone && (
                      <p className="text-xs text-muted-foreground">{result.member.phone}</p>
                    )}
                    <p className="text-xs text-primary font-medium mt-0.5">
                      Team: {result.team.teamName} →
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {isOpen && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 p-4 text-center"
          >
            <p className="text-sm text-muted-foreground">No results found</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
