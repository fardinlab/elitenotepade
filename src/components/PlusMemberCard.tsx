import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Trash2, Calendar, Pencil, Check, X, Send, Copy, Pause, Play } from 'lucide-react';
import { Member } from '@/types/member';
import { toast } from 'sonner';

interface PlusMemberCardProps {
  member: Member;
  index: number;
  isRemoveMode: boolean;
  isHighlighted?: boolean;
  highlightColor?: 'blue' | 'green';
  onRemove: () => void;
  onDateChange: (id: string, date: string) => void;
  onEmailChange: (id: string, email: string) => void;
  onPhoneChange: (id: string, phone: string) => void;
  onTelegramChange: (id: string, telegram: string) => void;
  onEPassChange: (id: string, ePass: string) => void;
  onGPassChange: (id: string, gPass: string) => void;
  onPushedChange?: (id: string, isPushed: boolean) => void;
}

export function PlusMemberCard({ 
  member, 
  index, 
  isRemoveMode,
  isHighlighted = false,
  highlightColor = 'blue',
  onRemove, 
  onDateChange,
  onEmailChange,
  onPhoneChange,
  onTelegramChange,
  onEPassChange,
  onGPassChange,
  onPushedChange
}: PlusMemberCardProps) {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editDateValue, setEditDateValue] = useState(member.joinDate);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState(member.email);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState(member.phone || '');
  const [isEditingTelegram, setIsEditingTelegram] = useState(false);
  const [editTelegramValue, setEditTelegramValue] = useState(member.telegram || '');
  const [isEditingEPass, setIsEditingEPass] = useState(false);
  const [editEPassValue, setEditEPassValue] = useState(member.ePass || '');
  const [isEditingGPass, setIsEditingGPass] = useState(false);
  const [editGPassValue, setEditGPassValue] = useState(member.gPass || '');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleWhatsApp = () => {
    if (member.phone) {
      const phone = member.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  const handleCall = () => {
    if (member.phone) {
      window.location.href = `tel:${member.phone}`;
    }
  };

  const handleTelegram = () => {
    if (member.telegram) {
      const username = member.telegram.replace('@', '');
      window.open(`https://t.me/${username}`, '_blank');
    }
  };

  const handleTogglePushed = () => {
    if (onPushedChange) {
      onPushedChange(member.id, !member.isPushed);
    }
  };

  // Save handlers
  const handleSaveDate = () => {
    if (editDateValue) {
      onDateChange(member.id, editDateValue);
      setIsEditingDate(false);
    }
  };

  const handleSaveEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editEmailValue.trim() && emailRegex.test(editEmailValue.trim())) {
      onEmailChange(member.id, editEmailValue.trim());
      setIsEditingEmail(false);
    }
  };

  const handleSavePhone = () => {
    onPhoneChange(member.id, editPhoneValue.trim());
    setIsEditingPhone(false);
  };

  const handleSaveTelegram = () => {
    onTelegramChange(member.id, editTelegramValue.trim());
    setIsEditingTelegram(false);
  };

  const handleSaveEPass = () => {
    onEPassChange(member.id, editEPassValue.trim());
    setIsEditingEPass(false);
  };

  const handleSaveGPass = () => {
    onGPassChange(member.id, editGPassValue.trim());
    setIsEditingGPass(false);
  };

  // Card classes
  const getCardClasses = () => {
    if (isHighlighted) {
      return highlightColor === 'green'
        ? 'bg-emerald-500/20 border-2 border-emerald-500 ring-2 ring-emerald-500/50'
        : 'bg-blue-500/20 border-2 border-blue-500 ring-2 ring-blue-500/50';
    }
    if (member.isPushed) {
      return 'glass-card hover:border-primary/30 grayscale opacity-70';
    }
    return 'glass-card hover:border-primary/30';
  };

  const renderEditableField = (
    label: string,
    value: string | undefined,
    isEditing: boolean,
    editValue: string,
    setEditValue: (v: string) => void,
    setIsEditing: (v: boolean) => void,
    onSave: () => void,
    placeholder?: string
  ) => {
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{label}:</span>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-input rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') {
                setEditValue(value || '');
                setIsEditing(false);
              }
            }}
          />
          <button
            onClick={onSave}
            className="p-1 rounded bg-success/20 text-success hover:bg-success/30 transition-colors"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setEditValue(value || '');
              setIsEditing(false);
            }}
            className="p-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 group">
        <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{label}:</span>
        {value ? (
          <>
            <span className="text-xs text-foreground break-all flex-1">{value}</span>
            <button
              onClick={() => copyToClipboard(value, label)}
              className="p-1 rounded-lg hover:bg-secondary transition-all flex-shrink-0"
            >
              <Copy className="w-3 h-3 text-muted-foreground" />
            </button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground/50 flex-1">—</span>
        )}
        {!isRemoveMode && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all flex-shrink-0"
          >
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl p-4 card-shadow transition-all duration-300 touch-manipulation ${getCardClasses()}`}
    >
      {/* Pushed Control */}
      {!isRemoveMode && onPushedChange && (
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border/50">
          <button
            onClick={handleTogglePushed}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
              member.isPushed
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            {member.isPushed ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>Pushed</span>
          </button>
        </div>
      )}

      <div className="space-y-2">
        {/* Email - Required */}
        {isEditingEmail ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Email:</span>
            <input
              type="email"
              value={editEmailValue}
              onChange={(e) => setEditEmailValue(e.target.value)}
              className="flex-1 bg-input rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEmail();
                if (e.key === 'Escape') {
                  setEditEmailValue(member.email);
                  setIsEditingEmail(false);
                }
              }}
            />
            <button
              onClick={handleSaveEmail}
              className="p-1 rounded bg-success/20 text-success hover:bg-success/30 transition-colors"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setEditEmailValue(member.email);
                setIsEditingEmail(false);
              }}
              className="p-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Email:</span>
            <span className="text-xs font-medium text-foreground break-all flex-1">{member.email}</span>
            <button
              onClick={() => copyToClipboard(member.email, 'Email')}
              className="p-1 rounded-lg hover:bg-secondary transition-all flex-shrink-0"
            >
              <Copy className="w-3 h-3 text-muted-foreground" />
            </button>
            {!isRemoveMode && (
              <button
                onClick={() => setIsEditingEmail(true)}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all flex-shrink-0"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* E-Pass - Optional */}
        {renderEditableField(
          'E-Pass',
          member.ePass,
          isEditingEPass,
          editEPassValue,
          setEditEPassValue,
          setIsEditingEPass,
          handleSaveEPass
        )}

        {/* G-Pass - Optional */}
        {renderEditableField(
          'G-Pass',
          member.gPass,
          isEditingGPass,
          editGPassValue,
          setEditGPassValue,
          setIsEditingGPass,
          handleSaveGPass
        )}

        {/* Phone - Optional */}
        {renderEditableField(
          'Phone',
          member.phone,
          isEditingPhone,
          editPhoneValue,
          setEditPhoneValue,
          setIsEditingPhone,
          handleSavePhone
        )}

        {/* Telegram - Optional */}
        {isEditingTelegram ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Telegram:</span>
            <input
              type="text"
              value={editTelegramValue}
              onChange={(e) => setEditTelegramValue(e.target.value)}
              placeholder="@username"
              className="flex-1 bg-input rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTelegram();
                if (e.key === 'Escape') {
                  setEditTelegramValue(member.telegram || '');
                  setIsEditingTelegram(false);
                }
              }}
            />
            <button
              onClick={handleSaveTelegram}
              className="p-1 rounded bg-success/20 text-success hover:bg-success/30 transition-colors"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setEditTelegramValue(member.telegram || '');
                setIsEditingTelegram(false);
              }}
              className="p-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Telegram:</span>
            {member.telegram ? (
              <>
                <button
                  onClick={handleTelegram}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors flex-1 text-left"
                >
                  {member.telegram}
                </button>
                <button
                  onClick={() => copyToClipboard(member.telegram!, 'Telegram')}
                  className="p-1 rounded-lg hover:bg-secondary transition-all flex-shrink-0"
                >
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground/50 flex-1">—</span>
            )}
            {!isRemoveMode && (
              <button
                onClick={() => setIsEditingTelegram(true)}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all flex-shrink-0"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Join Date - Optional */}
        {isEditingDate ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Join Date:</span>
            <input
              type="date"
              value={editDateValue}
              onChange={(e) => setEditDateValue(e.target.value)}
              className="flex-1 bg-input rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveDate();
                if (e.key === 'Escape') {
                  setEditDateValue(member.joinDate);
                  setIsEditingDate(false);
                }
              }}
            />
            <button
              onClick={handleSaveDate}
              className="p-1 rounded bg-success/20 text-success hover:bg-success/30 transition-colors"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setEditDateValue(member.joinDate);
                setIsEditingDate(false);
              }}
              className="p-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Join Date:</span>
            {member.joinDate ? (
              <span className="text-xs text-foreground flex-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(member.joinDate)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50 flex-1">—</span>
            )}
            {!isRemoveMode && (
              <button
                onClick={() => setIsEditingDate(true)}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all flex-shrink-0"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          {member.phone && (
            <>
              <button
                onClick={handleWhatsApp}
                className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                title="WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
              <button
                onClick={handleCall}
                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                title="Call"
              >
                <Phone className="w-4 h-4" />
              </button>
            </>
          )}
          {member.telegram && (
            <button
              onClick={handleTelegram}
              className="p-2 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors"
              title="Telegram"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {isRemoveMode && (
          <button
            onClick={onRemove}
            className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
