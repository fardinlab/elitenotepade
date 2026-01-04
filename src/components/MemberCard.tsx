import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Trash2, Calendar, Pencil, Check, X, Send, DollarSign } from 'lucide-react';
import { Member } from '@/types/member';

interface MemberCardProps {
  member: Member;
  index: number;
  isRemoveMode: boolean;
  onRemove: () => void;
  onDateChange: (id: string, date: string) => void;
  onEmailChange: (id: string, email: string) => void;
  onTelegramChange: (id: string, telegram: string) => void;
  onPaymentChange: (id: string, isPaid: boolean, paidAmount?: number) => void;
}

export function MemberCard({ 
  member, 
  index, 
  isRemoveMode, 
  onRemove, 
  onDateChange,
  onEmailChange,
  onTelegramChange,
  onPaymentChange
}: MemberCardProps) {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editDateValue, setEditDateValue] = useState(member.joinDate);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState(member.email);
  const [isEditingTelegram, setIsEditingTelegram] = useState(false);
  const [editTelegramValue, setEditTelegramValue] = useState(member.telegram || '');
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [editPaidAmount, setEditPaidAmount] = useState(member.paidAmount?.toString() || '');

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

  const handleTelegram = () => {
    if (member.telegram) {
      const username = member.telegram.replace('@', '');
      window.open(`https://t.me/${username}`, '_blank');
    }
  };

  const handleSaveDate = () => {
    if (editDateValue) {
      onDateChange(member.id, editDateValue);
      setIsEditingDate(false);
    }
  };

  const handleCancelDate = () => {
    setEditDateValue(member.joinDate);
    setIsEditingDate(false);
  };

  const handleSaveEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editEmailValue.trim() && emailRegex.test(editEmailValue.trim())) {
      onEmailChange(member.id, editEmailValue.trim());
      setIsEditingEmail(false);
    }
  };

  const handleCancelEmail = () => {
    setEditEmailValue(member.email);
    setIsEditingEmail(false);
  };

  const handleSaveTelegram = () => {
    onTelegramChange(member.id, editTelegramValue.trim());
    setIsEditingTelegram(false);
  };

  const handleCancelTelegram = () => {
    setEditTelegramValue(member.telegram || '');
    setIsEditingTelegram(false);
  };

  const handleSavePayment = (isPaid: boolean) => {
    const amount = parseFloat(editPaidAmount) || 0;
    onPaymentChange(member.id, isPaid, isPaid ? amount : undefined);
    setIsEditingPayment(false);
  };

  const handleCancelPayment = () => {
    setEditPaidAmount(member.paidAmount?.toString() || '');
    setIsEditingPayment(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-xl p-4 card-shadow hover:border-primary/30 transition-all duration-300 touch-manipulation"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Email - Editable */}
          {isEditingEmail ? (
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={editEmailValue}
                onChange={(e) => setEditEmailValue(e.target.value)}
                className="flex-1 bg-input rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
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
            <div className="flex items-center gap-2 group">
              <p className="font-medium text-foreground truncate">{member.email}</p>
              {!isRemoveMode && (
                <button
                  onClick={() => setIsEditingEmail(true)}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                  aria-label="Edit email"
                >
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground truncate">{member.phone}</p>

          {/* Telegram - Editable */}
          {isEditingTelegram ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTelegramValue}
                onChange={(e) => setEditTelegramValue(e.target.value)}
                placeholder="@username"
                className="flex-1 bg-input rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTelegram();
                  if (e.key === 'Escape') handleCancelTelegram();
                }}
              />
              <button
                onClick={handleSaveTelegram}
                className="p-1 rounded bg-success/20 text-success hover:bg-success/30 transition-colors"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={handleCancelTelegram}
                className="p-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              {member.telegram ? (
                <button
                  onClick={handleTelegram}
                  className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>{member.telegram}</span>
                </button>
              ) : (
                <span className="text-xs text-muted-foreground/50">No Telegram</span>
              )}
              {!isRemoveMode && (
                <button
                  onClick={() => setIsEditingTelegram(true)}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                  aria-label="Edit telegram"
                >
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          {/* Payment Status */}
          {isEditingPayment ? (
            <div className="flex items-center gap-2 flex-wrap">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <input
                type="number"
                value={editPaidAmount}
                onChange={(e) => setEditPaidAmount(e.target.value)}
                placeholder="Amount"
                className="w-20 bg-input rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                min="0"
                step="0.01"
              />
              <button
                onClick={() => handleSavePayment(true)}
                className="px-2 py-1 rounded text-xs bg-success/20 text-success hover:bg-success/30 transition-colors"
              >
                Paid
              </button>
              <button
                onClick={() => handleSavePayment(false)}
                className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
              >
                Unpaid
              </button>
              <button
                onClick={handleCancelPayment}
                className="p-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              {member.isPaid ? (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
                  <DollarSign className="w-3 h-3" />
                  Paid {member.paidAmount ? `৳${member.paidAmount}` : ''}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  <DollarSign className="w-3 h-3" />
                  Unpaid
                </span>
              )}
              {!isRemoveMode && (
                <button
                  onClick={() => setIsEditingPayment(true)}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                  aria-label="Edit payment status"
                >
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            {isEditingDate ? (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={editDateValue}
                  onChange={(e) => setEditDateValue(e.target.value)}
                  className="bg-input rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <button
                  onClick={handleSaveDate}
                  className="p-1 rounded bg-success/20 text-success hover:bg-success/30 transition-colors"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancelDate}
                  className="p-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <Calendar className="w-3 h-3" />
                <span>{formatDate(member.joinDate)}</span>
                {!isRemoveMode && (
                  <button
                    onClick={() => setIsEditingDate(true)}
                    className="p-1 rounded hover:bg-secondary transition-colors"
                    aria-label="Edit date"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </>
            )}
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
                className="p-2.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors active:scale-95 touch-manipulation"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
              <button
                onClick={handleTelegram}
                disabled={!member.telegram}
                className={`p-2.5 rounded-lg transition-colors active:scale-95 touch-manipulation ${
                  member.telegram 
                    ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' 
                    : 'bg-muted/20 text-muted-foreground/40 cursor-not-allowed'
                }`}
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={handleCall}
                className="p-2.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors active:scale-95 touch-manipulation"
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
        {isEditingDate ? (
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-3 h-3" />
            <input
              type="date"
              value={editDateValue}
              onChange={(e) => setEditDateValue(e.target.value)}
              className="flex-1 bg-input rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <button
              onClick={handleSaveDate}
              className="p-1 rounded bg-success/20 text-success hover:bg-success/30 transition-colors"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={handleCancelDate}
              className="p-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <Calendar className="w-3 h-3" />
            <span>Joined {formatDate(member.joinDate)}</span>
            {!isRemoveMode && (
              <button
                onClick={() => setIsEditingDate(true)}
                className="p-1 rounded hover:bg-secondary transition-colors ml-auto"
                aria-label="Edit date"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
