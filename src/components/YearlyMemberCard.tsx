import { motion } from 'framer-motion';
import { 
  Mail, Phone, Send, Calendar, MessageCircle, Check, X, Pencil, 
  Shield, Lock, Receipt, Copy 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Member {
  id: string;
  email: string;
  phone?: string;
  telegram?: string;
  twoFA?: string;
  password?: string;
  joinDate: string;
}

interface PaymentSummary {
  totalPaid: number;
  totalDue: number;
}

interface EditingField {
  memberId: string;
  field: string;
}

interface YearlyMemberCardProps {
  member: Member;
  index: number;
  isHighlighted: boolean;
  isOverdue: boolean;
  isRemoveMode: boolean;
  paymentSummary?: PaymentSummary;
  editingField: EditingField | null;
  editValue: string;
  memberRef: (el: HTMLDivElement | null) => void;
  onStartEditing: (memberId: string, field: string, currentValue: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onRemove: (id: string, email: string) => void;
  onNavigatePayDetails: (memberId: string) => void;
}

const YearlyMemberCard = ({
  member,
  index,
  isHighlighted,
  isOverdue,
  isRemoveMode,
  paymentSummary,
  editingField,
  editValue,
  memberRef,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange,
  onRemove,
  onNavigatePayDetails,
}: YearlyMemberCardProps) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const isEditing = (field: string) => 
    editingField?.memberId === member.id && editingField.field === field;

  const renderEditableField = (
    field: string,
    icon: React.ReactNode,
    label: string,
    value: string | undefined,
    inputType: string = 'text',
    placeholder?: string,
    isOptional?: boolean
  ) => {
    // Special handling for 2FA field - truncate long values
    const isTwoFAField = field === 'twoFA';
    
    return (
      <div className="flex items-center gap-3 group/field py-1.5">
        <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 block mb-0.5">
            {label}
            {isOptional && <span className="ml-1 text-muted-foreground/40">(Optional)</span>}
          </span>
          {isEditing(field) ? (
            <div className="flex items-center gap-2">
              <input
                type={inputType}
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                className="flex-1 text-sm bg-background/50 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
                placeholder={placeholder}
                onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
              />
              <button 
                onClick={onSaveEdit} 
                className="p-1.5 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={onCancelEdit} 
                className="p-1.5 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span 
                className={`font-medium text-foreground ${
                  isTwoFAField 
                    ? 'text-xs truncate max-w-[140px] sm:max-w-[200px]' 
                    : 'text-sm'
                }`}
                title={isTwoFAField && value ? value : undefined}
              >
                {value || '—'}
              </span>
              {isTwoFAField && value && (
                <button
                  onClick={() => copyToClipboard(value, '2FA')}
                  className="p-1 rounded-md hover:bg-muted/50 transition-colors shrink-0"
                  title="Copy 2FA"
                >
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={() => onStartEditing(member.id, field, value || '')}
                className="p-1 rounded-md hover:bg-muted/50 opacity-0 group-hover/field:opacity-100 transition-all shrink-0"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      ref={memberRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={`
        relative overflow-hidden rounded-2xl 
        bg-gradient-to-br from-card/95 to-card/80 
        backdrop-blur-xl border 
        ${isHighlighted 
          ? 'border-blue-500/60 ring-2 ring-blue-500/30 shadow-[0_0_30px_-5px_hsl(217_91%_60%/0.3)]' 
          : isOverdue 
            ? 'border-destructive/60 ring-2 ring-destructive/30 shadow-[0_0_30px_-5px_hsl(0_84%_60%/0.3)]' 
            : 'border-border/50 shadow-lg hover:shadow-xl hover:border-border/80'
        }
        ${isRemoveMode ? 'border-destructive/40' : ''}
        transition-all duration-300
      `}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative p-5">
        {/* Email Header - Primary Focus */}
        <div className="mb-4 pb-4 border-b border-border/30">
          <div className="flex items-start gap-3 group/email">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing('email') ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    className="flex-1 text-base font-semibold bg-background/50 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
                  />
                  <button 
                    onClick={onSaveEdit} 
                    className="p-2 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={onCancelEdit} 
                    className="p-2 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-base font-semibold text-foreground break-all leading-relaxed">
                    {member.email}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() => copyToClipboard(member.email, 'Email')}
                      className="p-1 rounded-md hover:bg-muted/50 transition-colors"
                      title="Copy email"
                    >
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => onStartEditing(member.id, 'email', member.email)}
                      className="p-1 rounded-md hover:bg-muted/50 opacity-0 group-hover/email:opacity-100 transition-all"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Info Fields */}
          <div className="flex-1 space-y-1">
            {renderEditableField(
              'twoFA',
              <Shield className="w-4 h-4 text-muted-foreground" />,
              '2FA',
              member.twoFA,
              'text',
              'Enter 2FA code',
              true
            )}
            {renderEditableField(
              'password',
              <Lock className="w-4 h-4 text-muted-foreground" />,
              'Password',
              member.password,
              'text',
              'Enter password',
              true
            )}
            {renderEditableField(
              'phone',
              <Phone className="w-4 h-4 text-muted-foreground" />,
              'Phone',
              member.phone,
              'tel',
              'Enter phone number'
            )}
            {renderEditableField(
              'telegram',
              <Send className="w-4 h-4 text-muted-foreground" />,
              'Telegram',
              member.telegram,
              'text',
              '@username'
            )}
            
            {/* Join Date - Special handling */}
            <div className="flex items-center gap-3 group/field py-1.5">
              <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 block mb-0.5">
                  Join Date
                </span>
                {isEditing('joinDate') ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={editValue}
                      onChange={(e) => onEditValueChange(e.target.value)}
                      className="flex-1 text-sm bg-background/50 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
                    />
                    <button 
                      onClick={onSaveEdit} 
                      className="p-1.5 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={onCancelEdit} 
                      className="p-1.5 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {format(new Date(member.joinDate), 'd MMM yyyy')}
                    </span>
                    <button
                      onClick={() => onStartEditing(member.id, 'joinDate', member.joinDate)}
                      className="p-1 rounded-md hover:bg-muted/50 opacity-0 group-hover/field:opacity-100 transition-all"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons - Vertical Stack */}
          {!isRemoveMode && (
            <div className="flex flex-col gap-2 shrink-0">
              {/* WhatsApp */}
              <button
                onClick={() => {
                  if (member.phone) {
                    const cleanPhone = member.phone.replace(/[^0-9+]/g, '');
                    window.open(`https://wa.me/${cleanPhone}`, '_blank');
                  }
                }}
                disabled={!member.phone}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  member.phone 
                    ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30 hover:scale-105' 
                    : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                }`}
                title={member.phone ? 'WhatsApp' : 'No phone number'}
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              
              {/* Telegram */}
              <button
                onClick={() => {
                  if (member.telegram) {
                    const username = member.telegram.replace('@', '');
                    window.open(`https://t.me/${username}`, '_blank');
                  }
                }}
                disabled={!member.telegram}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  member.telegram 
                    ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 hover:scale-105' 
                    : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                }`}
                title={member.telegram ? 'Telegram' : 'No Telegram username'}
              >
                <Send className="w-5 h-5" />
              </button>
              
              {/* Call */}
              <button
                onClick={() => {
                  if (member.phone) {
                    window.open(`tel:${member.phone}`, '_self');
                  }
                }}
                disabled={!member.phone}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  member.phone 
                    ? 'bg-primary/20 text-primary hover:bg-primary/30 hover:scale-105' 
                    : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                }`}
                title={member.phone ? 'Call' : 'No phone number'}
              >
                <Phone className="w-5 h-5" />
              </button>
              
              {/* Pay Details */}
              <button
                onClick={() => onNavigatePayDetails(member.id)}
                className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 hover:scale-105 flex items-center justify-center transition-all"
                title="Pay Details"
              >
                <Receipt className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Payment Summary Badges */}
        {(paymentSummary?.totalPaid || paymentSummary?.totalDue) ? (
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border/30">
            <div className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <span className="text-xs text-green-500/80 font-medium">Paid</span>
              <span className="text-sm font-bold text-green-500">৳{paymentSummary?.totalPaid || 0}</span>
            </div>
            <div className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <span className="text-xs text-orange-500/80 font-medium">Due</span>
              <span className="text-sm font-bold text-orange-500">৳{paymentSummary?.totalDue || 0}</span>
            </div>
          </div>
        ) : null}

        {/* Remove Button */}
        {isRemoveMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onRemove(member.id, member.email)}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default YearlyMemberCard;
