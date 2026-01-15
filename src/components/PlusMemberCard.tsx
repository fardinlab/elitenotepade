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

  // Card classes with glassmorphism
  const getCardClasses = () => {
    const baseClasses = 'relative rounded-2xl p-4 backdrop-blur-xl border transition-all duration-300 touch-manipulation';
    const glassClasses = 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]';
    const borderClasses = 'border-white/10';
    
    if (isHighlighted) {
      return highlightColor === 'green'
        ? `${baseClasses} bg-emerald-500/20 border-2 border-emerald-500 ring-2 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]`
        : `${baseClasses} bg-blue-500/20 border-2 border-blue-500 ring-2 ring-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]`;
    }
    if (member.isPushed) {
      return `${baseClasses} ${glassClasses} ${borderClasses} grayscale opacity-60`;
    }
    return `${baseClasses} ${glassClasses} ${borderClasses} hover:border-purple-500/30 hover:shadow-[0_12px_40px_rgba(139,92,246,0.15)]`;
  };

  const EditableField = ({
    label,
    value,
    isEditing,
    editValue,
    setEditValue,
    setIsEditing,
    onSave,
    onCancel,
    type = 'text',
  }: {
    label: string;
    value: string | undefined;
    isEditing: boolean;
    editValue: string;
    setEditValue: (v: string) => void;
    setIsEditing: (v: boolean) => void;
    onSave: () => void;
    onCancel: () => void;
    type?: string;
  }) => {
    if (isEditing) {
      return (
        <div className="flex items-center gap-1.5">
          <input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 min-w-0 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onCancel();
            }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onSave}
            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            <Check className="w-3 h-3" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <X className="w-3 h-3" />
          </motion.button>
        </div>
      );
    }

    return (
      <div className="group flex items-center gap-1.5 min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-14 flex-shrink-0">{label}</span>
        {value ? (
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className="text-xs text-foreground/90 truncate flex-1" title={value}>{value}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => copyToClipboard(value, label)}
              className="p-1 rounded-md hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
            >
              <Copy className="w-3 h-3 text-muted-foreground" />
            </motion.button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/40 flex-1">—</span>
        )}
        {!isRemoveMode && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsEditing(true)}
            className="p-1 rounded-md hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          >
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </motion.button>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={getCardClasses()}
    >
      {/* Purple gradient accent line */}
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      {/* Header: Pushed Badge + Email */}
      <div className="space-y-3">
        {/* Top row: Pushed badge */}
        {!isRemoveMode && onPushedChange && (
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTogglePushed}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                member.isPushed
                  ? 'bg-muted/50 text-muted-foreground border border-muted-foreground/20'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
              }`}
            >
              {member.isPushed ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>Pushed</span>
            </motion.button>

            {isRemoveMode && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onRemove}
                className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        )}

        {/* Email - Full width, prominent */}
        {isEditingEmail ? (
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={editEmailValue}
              onChange={(e) => setEditEmailValue(e.target.value)}
              className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEmail();
                if (e.key === 'Escape') {
                  setEditEmailValue(member.email);
                  setIsEditingEmail(false);
                }
              }}
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleSaveEmail} className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Check className="w-4 h-4" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditEmailValue(member.email); setIsEditingEmail(false); }} className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        ) : (
          <div className="group flex items-center gap-2">
            <p className="text-sm font-medium text-foreground break-all leading-tight flex-1">{member.email}</p>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => copyToClipboard(member.email, 'Email')}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>
            {!isRemoveMode && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditingEmail(true)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Details - Vertical Stack */}
      <div className="mt-4 space-y-2">
        {/* E-Pass */}
        <EditableField
          label="E-Pass"
          value={member.ePass}
          isEditing={isEditingEPass}
          editValue={editEPassValue}
          setEditValue={setEditEPassValue}
          setIsEditing={setIsEditingEPass}
          onSave={handleSaveEPass}
          onCancel={() => { setEditEPassValue(member.ePass || ''); setIsEditingEPass(false); }}
        />

        {/* G-Pass */}
        <EditableField
          label="G-Pass"
          value={member.gPass}
          isEditing={isEditingGPass}
          editValue={editGPassValue}
          setEditValue={setEditGPassValue}
          setIsEditing={setIsEditingGPass}
          onSave={handleSaveGPass}
          onCancel={() => { setEditGPassValue(member.gPass || ''); setIsEditingGPass(false); }}
        />

        {/* Phone */}
        <EditableField
          label="Phone"
          value={member.phone}
          isEditing={isEditingPhone}
          editValue={editPhoneValue}
          setEditValue={setEditPhoneValue}
          setIsEditing={setIsEditingPhone}
          onSave={handleSavePhone}
          onCancel={() => { setEditPhoneValue(member.phone || ''); setIsEditingPhone(false); }}
          type="tel"
        />

        {/* Telegram */}
        {isEditingTelegram ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={editTelegramValue}
              onChange={(e) => setEditTelegramValue(e.target.value)}
              placeholder="@username"
              className="flex-1 min-w-0 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTelegram();
                if (e.key === 'Escape') { setEditTelegramValue(member.telegram || ''); setIsEditingTelegram(false); }
              }}
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleSaveTelegram} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Check className="w-3 h-3" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditTelegramValue(member.telegram || ''); setIsEditingTelegram(false); }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <X className="w-3 h-3" />
            </motion.button>
          </div>
        ) : (
          <div className="group flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-14 flex-shrink-0">Telegram</span>
            {member.telegram ? (
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <button onClick={handleTelegram} className="text-xs text-sky-400 hover:text-sky-300 transition-colors truncate">
                  {member.telegram}
                </button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => copyToClipboard(member.telegram!, 'Telegram')}
                  className="p-1 rounded-md hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </motion.button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/40 flex-1">—</span>
            )}
            {!isRemoveMode && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditingTelegram(true)}
                className="p-1 rounded-md hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </motion.button>
            )}
          </div>
        )}

        {/* Join Date */}
        <div>
          {isEditingDate ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-14 flex-shrink-0">Joined</span>
              <input
                type="date"
                value={editDateValue}
                onChange={(e) => setEditDateValue(e.target.value)}
                className="flex-1 min-w-0 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveDate();
                  if (e.key === 'Escape') { setEditDateValue(member.joinDate); setIsEditingDate(false); }
                }}
              />
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleSaveDate} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Check className="w-3 h-3" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditDateValue(member.joinDate); setIsEditingDate(false); }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                <X className="w-3 h-3" />
              </motion.button>
            </div>
          ) : (
            <div className="group flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 w-14 flex-shrink-0">Joined</span>
              {member.joinDate ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <Calendar className="w-3 h-3 text-purple-400/70" />
                  <span className="text-xs text-foreground/80">{formatDate(member.joinDate)}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground/40 flex-1">—</span>
              )}
              {!isRemoveMode && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditingDate(true)}
                  className="p-1 rounded-md hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Bottom */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* WhatsApp */}
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWhatsApp}
            disabled={!member.phone}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              member.phone
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/10'
                : 'bg-muted/20 text-muted-foreground/30 cursor-not-allowed'
            }`}
            title="WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </motion.button>

          {/* Call */}
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCall}
            disabled={!member.phone}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              member.phone
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 shadow-lg shadow-blue-500/10'
                : 'bg-muted/20 text-muted-foreground/30 cursor-not-allowed'
            }`}
            title="Call"
          >
            <Phone className="w-5 h-5" />
          </motion.button>

          {/* Telegram */}
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTelegram}
            disabled={!member.telegram}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              member.telegram
                ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 shadow-lg shadow-sky-500/10'
                : 'bg-muted/20 text-muted-foreground/30 cursor-not-allowed'
            }`}
            title="Telegram"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Delete button in remove mode */}
        {isRemoveMode && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRemove}
            className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10 transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
