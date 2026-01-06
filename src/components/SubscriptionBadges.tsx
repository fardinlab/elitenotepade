import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check } from 'lucide-react';
import { SubscriptionType, SUBSCRIPTION_CONFIG } from '@/types/member';

interface SubscriptionBadgesProps {
  subscriptions: SubscriptionType[];
  onUpdate: (subscriptions: SubscriptionType[]) => void;
  isEditable?: boolean;
}

const SubscriptionIcon = ({ type, size = 16 }: { type: SubscriptionType; size?: number }) => {
  const config = SUBSCRIPTION_CONFIG[type];
  
  const icons: Record<SubscriptionType, JSX.Element> = {
    chatgpt: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={config.color}>
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4046-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
      </svg>
    ),
    gemini: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 24C12 24 12 12 24 12C12 12 12 0 12 0C12 0 12 12 0 12C12 12 12 24 12 24Z" fill="url(#gemini-gradient)"/>
        <defs>
          <linearGradient id="gemini-gradient" x1="0" y1="12" x2="24" y2="12">
            <stop stopColor="#4285F4"/>
            <stop offset="1" stopColor="#8AB4F8"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    perplexity: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={config.color}>
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.08 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z"/>
      </svg>
    ),
    canva: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={config.color}>
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 17.787c-.401.227-.867.34-1.393.34-.733 0-1.373-.24-1.92-.72-.547-.48-.94-1.147-1.18-2-.24-.853-.36-1.847-.36-2.98 0-1.16.133-2.173.4-3.04.267-.867.68-1.533 1.24-2 .56-.467 1.267-.7 2.12-.7.467 0 .887.067 1.26.2.373.133.693.32.96.56.267.24.48.52.64.84.16.32.24.667.24 1.04 0 .587-.14 1.08-.42 1.48-.28.4-.667.6-1.16.6-.32 0-.573-.093-.76-.28-.187-.187-.28-.44-.28-.76 0-.24.053-.453.16-.64.107-.187.267-.36.48-.52-.16-.187-.347-.32-.56-.4-.213-.08-.453-.12-.72-.12-.507 0-.92.173-1.24.52-.32.347-.56.827-.72 1.44-.16.613-.24 1.32-.24 2.12 0 1.013.12 1.873.36 2.58.24.707.573 1.24 1 1.6.427.36.92.54 1.48.54.453 0 .847-.107 1.18-.32.333-.213.6-.513.8-.9l.36.32c-.267.533-.627.947-1.08 1.24z"/>
      </svg>
    ),
  };
  
  return icons[type];
};

export function SubscriptionBadges({ subscriptions, onUpdate, isEditable = true }: SubscriptionBadgesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<SubscriptionType[]>(subscriptions);

  const allTypes: SubscriptionType[] = ['chatgpt', 'gemini', 'perplexity', 'canva'];

  const handleToggle = (type: SubscriptionType) => {
    setSelected(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSave = () => {
    onUpdate(selected);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelected(subscriptions);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="flex flex-wrap items-center gap-2 mt-1"
      >
        {allTypes.map(type => (
          <button
            key={type}
            onClick={() => handleToggle(type)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all touch-manipulation ${
              selected.includes(type)
                ? 'bg-primary/20 ring-1 ring-primary/50'
                : 'bg-muted/30 hover:bg-muted/50'
            }`}
          >
            <SubscriptionIcon type={type} size={14} />
            <span className="text-foreground/80">{SUBSCRIPTION_CONFIG[type].name}</span>
          </button>
        ))}
        <button
          onClick={handleSave}
          className="p-1.5 rounded-full bg-success/20 text-success hover:bg-success/30 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      <AnimatePresence mode="popLayout">
        {subscriptions.map(type => (
          <motion.div
            key={type}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center justify-center w-5 h-5 rounded-full bg-background/50 shadow-sm"
            title={SUBSCRIPTION_CONFIG[type].name}
          >
            <SubscriptionIcon type={type} size={14} />
          </motion.div>
        ))}
      </AnimatePresence>
      {isEditable && (
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center justify-center w-5 h-5 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors touch-manipulation"
          title="Edit subscriptions"
        >
          <Plus className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}