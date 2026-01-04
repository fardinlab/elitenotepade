import { motion } from 'framer-motion';
import { Phone, Trash2, Calendar } from 'lucide-react';
import { Member } from '@/types/member';

interface MemberCardProps {
  member: Member;
  index: number;
  isRemoveMode: boolean;
  onRemove: () => void;
}

export function MemberCard({ member, index, isRemoveMode, onRemove }: MemberCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleWhatsApp = () => {
    const phone = member.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${member.phone}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-xl p-4 card-shadow hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{member.email}</p>
          <p className="text-sm text-muted-foreground truncate">{member.phone}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(member.joinDate)}</span>
          </div>

          {isRemoveMode ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={onRemove}
              className="p-2.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
              aria-label="Delete member"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          ) : (
            <>
              <button
                onClick={handleWhatsApp}
                className="p-2.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
              <button
                onClick={handleCall}
                className="p-2.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                aria-label="Call"
              >
                <Phone className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile date display */}
      <div className="sm:hidden flex items-center gap-1 text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
        <Calendar className="w-3 h-3" />
        <span>Joined {formatDate(member.joinDate)}</span>
      </div>
    </motion.div>
  );
}
