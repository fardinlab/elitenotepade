import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, X, Mail, Phone, Send, Calendar, UserPlus, MessageCircle, Check, AlertCircle, Pencil, Shield, Lock, Receipt, DollarSign } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

const YearlyTeamMembers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { teamId } = useParams<{ teamId: string }>();
  const highlightMemberId = (location.state as { highlightMemberId?: string })?.highlightMemberId;
  const [highlightedMemberId, setHighlightedMemberId] = useState<string | null>(null);
  const memberRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const {
    activeTeam,
    sortedTeams,
    isLoaded,
    setActiveTeam,
    updateTeamName,
    addMember,
    removeMember,
    updateMemberPayment,
    updateMemberPendingAmount,
    updateMemberEmail,
    updateMemberPhone,
    updateMemberTelegram,
    updateMemberTwoFA,
    updateMemberPassword,
    updateMemberDate,
  } = useSupabaseData();

  const { user } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; email: string } | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ memberId: string; type: 'paid' | 'due' } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [memberPaymentSummaries, setMemberPaymentSummaries] = useState<Record<string, { totalPaid: number; totalDue: number }>>({});
  const [memberCurrentMonthPaid, setMemberCurrentMonthPaid] = useState<Record<string, boolean>>({});
  
  // Inline editing state
  const [editingField, setEditingField] = useState<{ memberId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Form state for add member
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [twoFA, setTwoFA] = useState('');
  const [password, setPassword] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  // Sync active team with URL
  useEffect(() => {
    if (teamId && activeTeam?.id !== teamId) {
      const targetTeam = sortedTeams.find(t => t.id === teamId);
      if (targetTeam) {
        setActiveTeam(teamId);
      }
    }
  }, [teamId, activeTeam?.id, sortedTeams, setActiveTeam]);

  const team = sortedTeams.find(t => t.id === teamId) || activeTeam;

  // Fetch payment summaries and current month payment status for all members in the team
  const fetchPaymentSummaries = useCallback(async () => {
    if (!user || !team) return;

    const memberIds = team.members.map(m => m.id);
    if (memberIds.length === 0) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Fetch payments and member total_amounts in parallel
    const [paymentsResult, membersResult, currentMonthPaymentsResult] = await Promise.all([
      supabase
        .from('member_payments')
        .select('member_id, status, amount')
        .eq('user_id', user.id)
        .in('member_id', memberIds),
      supabase
        .from('members')
        .select('id, total_amount')
        .eq('user_id', user.id)
        .in('id', memberIds),
      supabase
        .from('member_payments')
        .select('member_id, status')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .in('member_id', memberIds)
    ]);

    if (paymentsResult.error) {
      console.error('Error fetching payment summaries:', paymentsResult.error);
      return;
    }

    const payments = paymentsResult.data || [];
    const membersData = membersResult.data || [];
    const currentMonthPayments = currentMonthPaymentsResult.data || [];

    // Create a map of member total_amounts
    const totalAmounts: Record<string, number> = {};
    membersData.forEach(m => {
      totalAmounts[m.id] = m.total_amount || 0;
    });

    // Calculate total paid for each member
    const paidSums: Record<string, number> = {};
    memberIds.forEach(id => {
      paidSums[id] = 0;
    });

    payments.forEach(p => {
      if (p.status === 'paid') {
        paidSums[p.member_id] = (paidSums[p.member_id] || 0) + (p.amount || 0);
      }
    });

    // Calculate due as total_amount - totalPaid for each member
    const summaries: Record<string, { totalPaid: number; totalDue: number }> = {};
    memberIds.forEach(id => {
      const totalPaid = paidSums[id] || 0;
      const totalAmount = totalAmounts[id] || 0;
      summaries[id] = {
        totalPaid,
        totalDue: Math.max(0, totalAmount - totalPaid)
      };
    });

    setMemberPaymentSummaries(summaries);

    // Build current month paid status map
    const currentMonthPaidMap: Record<string, boolean> = {};
    memberIds.forEach(id => {
      currentMonthPaidMap[id] = false;
    });
    currentMonthPayments.forEach(p => {
      if (p.status === 'paid') {
        currentMonthPaidMap[p.member_id] = true;
      }
    });
    setMemberCurrentMonthPaid(currentMonthPaidMap);
  }, [user, team]);

  useEffect(() => {
    if (team && team.members.length > 0) {
      fetchPaymentSummaries();
    }
  }, [team, fetchPaymentSummaries]);

  // Check if a member should be red highlighted (current month not paid AND join date day has passed or is today)
  const isMemberOverdue = useCallback((member: { id: string; joinDate: string }) => {
    const now = new Date();
    const currentDay = now.getDate();
    const joinDateDay = new Date(member.joinDate).getDate();
    const isPaid = memberCurrentMonthPaid[member.id] || false;
    
    // Red indicator if: current month is NOT paid AND current day >= join date day
    return !isPaid && currentDay >= joinDateDay;
  }, [memberCurrentMonthPaid]);

  // Handle scroll and highlight for searched member
  useEffect(() => {
    if (highlightMemberId && team) {
      setHighlightedMemberId(highlightMemberId);
      
      setTimeout(() => {
        const memberElement = memberRefs.current[highlightMemberId];
        if (memberElement) {
          memberElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      const timer = setTimeout(() => {
        setHighlightedMemberId(null);
      }, 3000);

      window.history.replaceState({}, document.title);

      return () => clearTimeout(timer);
    }
  }, [highlightMemberId, team]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[+]?[\d\s\-()]{7,}$/;
    return re.test(phone);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; phone?: string } = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (phone && !validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await addMember(
      {
        email,
        phone: phone.trim() || '',
        telegram: telegram.trim() || undefined,
        twoFA: twoFA.trim() || undefined,
        password: password.trim() || undefined,
        joinDate,
      },
      teamId
    );

    if (result.ok) {
      toast.success('Member added successfully!');
      setEmail('');
      setPhone('');
      setTelegram('');
      setTwoFA('');
      setPassword('');
      setJoinDate(new Date().toISOString().split('T')[0]);
      setErrors({});
      setIsAddModalOpen(false);
    } else {
      // show the *real* Supabase error so we can fix it
      toast.error(result.error || 'Failed to add member');
      if (result.code) toast.error(`Code: ${result.code}`);
    }
  };

  const handleRemoveMember = (id: string, email: string) => {
    setDeleteConfirm({ id, email });
  };

  const confirmRemove = async () => {
    if (deleteConfirm) {
      await removeMember(deleteConfirm.id);
      toast.success('Member removed');
      setDeleteConfirm(null);
      if (team && team.members.length === 1) {
        setIsRemoveMode(false);
      }
    }
  };

  const handleCloseModal = () => {
    setEmail('');
    setPhone('');
    setTelegram('');
    setTwoFA('');
    setPassword('');
    setErrors({});
    setIsAddModalOpen(false);
  };

  const startEditing = (memberId: string, field: string, currentValue: string) => {
    setEditingField({ memberId, field });
    setEditValue(currentValue);
  };

  const saveEdit = async () => {
    if (!editingField) return;
    
    const { memberId, field } = editingField;
    
    switch (field) {
      case 'email':
        await updateMemberEmail(memberId, editValue);
        break;
      case 'phone':
        await updateMemberPhone(memberId, editValue);
        break;
      case 'telegram':
        await updateMemberTelegram(memberId, editValue);
        break;
      case 'twoFA':
        await updateMemberTwoFA(memberId, editValue);
        break;
      case 'password':
        await updateMemberPassword(memberId, editValue);
        break;
      case 'joinDate':
        await updateMemberDate(memberId, editValue);
        break;
    }
    
    toast.success('Updated successfully!');
    setEditingField(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  if (!isLoaded || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] pb-28" style={{ paddingBottom: 'max(7rem, calc(7rem + env(safe-area-inset-bottom)))' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="container mx-auto flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors touch-manipulation active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold text-foreground truncate">{team.teamName}</h1>
              <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-500 text-[10px] font-medium rounded">
                YEARLY
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{team.members.length} Members • Unlimited</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Team Name Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 card-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">{team.teamName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Created: {format(new Date(team.createdAt), 'd MMMM yyyy')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{team.members.length}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            Team Members ({team.members.length})
          </h3>

          {team.members.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No members yet</h3>
              <p className="text-sm text-muted-foreground">
                Click the + button to add your first member
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {team.members.map((member, index) => {
                  const isOverdue = isMemberOverdue(member);
                  return (
                  <motion.div
                    key={member.id}
                    ref={(el) => { memberRefs.current[member.id] = el; }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.03 }}
                    className={`glass-card rounded-xl p-4 card-shadow transition-all ${
                      highlightedMemberId === member.id 
                        ? 'ring-2 ring-blue-500 bg-blue-500/20' 
                        : isOverdue 
                          ? 'ring-2 ring-destructive bg-destructive/20' 
                          : ''
                    } ${isRemoveMode ? 'border-destructive/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5 group/card">
                        {/* Email */}
                        <div className="flex items-center gap-2 group/field">
                          <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">Email:</span>
                          {editingField?.memberId === member.id && editingField.field === 'email' ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="email"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 text-sm bg-input rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                              />
                              <button onClick={saveEdit} className="p-1 text-green-500 hover:bg-green-500/20 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-destructive hover:bg-destructive/20 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-medium text-foreground break-all">{member.email}</span>
                              <button
                                onClick={() => startEditing(member.id, 'email', member.email)}
                                className="p-1 rounded hover:bg-secondary opacity-0 group-hover/field:opacity-100 transition-opacity"
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* 2FA */}
                        <div className="flex items-center gap-2 group/field">
                          <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">2FA:</span>
                          {editingField?.memberId === member.id && editingField.field === 'twoFA' ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 text-xs bg-input rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                              />
                              <button onClick={saveEdit} className="p-1 text-green-500 hover:bg-green-500/20 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-destructive hover:bg-destructive/20 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs text-muted-foreground">{member.twoFA || '—'}</span>
                              <span className="text-[10px] text-muted-foreground/50">(Optional)</span>
                              <button
                                onClick={() => startEditing(member.id, 'twoFA', member.twoFA || '')}
                                className="p-1 rounded hover:bg-secondary opacity-0 group-hover/field:opacity-100 transition-opacity"
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Password */}
                        <div className="flex items-center gap-2 group/field">
                          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">Password:</span>
                          {editingField?.memberId === member.id && editingField.field === 'password' ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 text-xs bg-input rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                              />
                              <button onClick={saveEdit} className="p-1 text-green-500 hover:bg-green-500/20 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-destructive hover:bg-destructive/20 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs text-muted-foreground">{member.password || '—'}</span>
                              <span className="text-[10px] text-muted-foreground/50">(Optional)</span>
                              <button
                                onClick={() => startEditing(member.id, 'password', member.password || '')}
                                className="p-1 rounded hover:bg-secondary opacity-0 group-hover/field:opacity-100 transition-opacity"
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-2 group/field">
                          <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">Phone:</span>
                          {editingField?.memberId === member.id && editingField.field === 'phone' ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="tel"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 text-xs bg-input rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                              />
                              <button onClick={saveEdit} className="p-1 text-green-500 hover:bg-green-500/20 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-destructive hover:bg-destructive/20 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs text-muted-foreground">{member.phone || '—'}</span>
                              <button
                                onClick={() => startEditing(member.id, 'phone', member.phone || '')}
                                className="p-1 rounded hover:bg-secondary opacity-0 group-hover/field:opacity-100 transition-opacity"
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Telegram */}
                        <div className="flex items-center gap-2 group/field">
                          <Send className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">Telegram:</span>
                          {editingField?.memberId === member.id && editingField.field === 'telegram' ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 text-xs bg-input rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                                placeholder="@username"
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                              />
                              <button onClick={saveEdit} className="p-1 text-green-500 hover:bg-green-500/20 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-destructive hover:bg-destructive/20 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs text-muted-foreground">{member.telegram || '—'}</span>
                              <button
                                onClick={() => startEditing(member.id, 'telegram', member.telegram || '')}
                                className="p-1 rounded hover:bg-secondary opacity-0 group-hover/field:opacity-100 transition-opacity"
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Join Date */}
                        <div className="flex items-center gap-2 group/field">
                          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">Join Date:</span>
                          {editingField?.memberId === member.id && editingField.field === 'joinDate' ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 text-xs bg-input rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                              />
                              <button onClick={saveEdit} className="p-1 text-green-500 hover:bg-green-500/20 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-destructive hover:bg-destructive/20 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(member.joinDate), 'd MMM yyyy')}
                              </span>
                              <button
                                onClick={() => startEditing(member.id, 'joinDate', member.joinDate)}
                                className="p-1 rounded hover:bg-secondary opacity-0 group-hover/field:opacity-100 transition-opacity"
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Payment Summary from Pay Details */}
                        {(memberPaymentSummaries[member.id]?.totalPaid > 0 || memberPaymentSummaries[member.id]?.totalDue > 0) && (
                          <div className="flex items-center gap-3 pt-1">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-muted-foreground">Paid:</span>
                              <span className="text-xs font-medium text-green-500">৳{memberPaymentSummaries[member.id]?.totalPaid || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-orange-500" />
                              <span className="text-xs text-muted-foreground">Due:</span>
                              <span className="text-xs font-medium text-orange-500">৳{memberPaymentSummaries[member.id]?.totalDue || 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      {!isRemoveMode ? (
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {/* WhatsApp Button */}
                          <button
                            onClick={() => {
                              if (member.phone) {
                                const cleanPhone = member.phone.replace(/[^0-9+]/g, '');
                                window.open(`https://wa.me/${cleanPhone}`, '_blank');
                              }
                            }}
                            disabled={!member.phone}
                            className={`p-2 rounded-lg transition-colors ${
                              member.phone 
                                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                                : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                            }`}
                            title={member.phone ? 'WhatsApp' : 'No phone number'}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          
                          {/* Telegram Button */}
                          <button
                            onClick={() => {
                              if (member.telegram) {
                                const username = member.telegram.replace('@', '');
                                window.open(`https://t.me/${username}`, '_blank');
                              }
                            }}
                            disabled={!member.telegram}
                            className={`p-2 rounded-lg transition-colors ${
                              member.telegram 
                                ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30' 
                                : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                            }`}
                            title={member.telegram ? 'Telegram' : 'No Telegram username'}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          
                          {/* Call Button */}
                          <button
                            onClick={() => {
                              if (member.phone) {
                                window.open(`tel:${member.phone}`, '_self');
                              }
                            }}
                            disabled={!member.phone}
                            className={`p-2 rounded-lg transition-colors ${
                              member.phone 
                                ? 'bg-primary/20 text-primary hover:bg-primary/30' 
                                : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                            }`}
                            title={member.phone ? 'Call' : 'No phone number'}
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          
                          {/* Pay Details Button */}
                          <button
                            onClick={() => navigate(`/member-pay-details/${member.id}`)}
                            className="p-2 rounded-lg bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 transition-colors"
                            title="Pay Details"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          onClick={() => handleRemoveMember(member.id, member.email)}
                          className="ml-3 p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Action Controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-2 card-shadow flex items-center gap-2"
        >
          <button
            onClick={() => setIsRemoveMode(!isRemoveMode)}
            className={`p-4 rounded-xl transition-all duration-300 active:scale-95 touch-manipulation ${
              isRemoveMode
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-secondary hover:bg-secondary/80 text-foreground'
            }`}
            aria-label="Toggle remove mode"
          >
            {isRemoveMode ? <X className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
          </button>

          <div className="w-px h-8 bg-border" />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-4 rounded-xl bg-gradient-to-r from-cyan-500 to-primary text-primary-foreground hover:opacity-90 transition-opacity glow-shadow active:scale-95 touch-manipulation"
            aria-label="Add member"
          >
            <Plus className="w-6 h-6" />
          </button>
        </motion.div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 bottom-4 top-auto sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 max-w-md mx-auto glass-card rounded-2xl p-4 sm:p-6 z-50 card-shadow max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20">
                    <UserPlus className="w-5 h-5 text-cyan-500" />
                  </div>
                  <h2 className="font-display text-lg sm:text-xl font-bold">Add Member</h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="customer@example.com"
                    className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                    <Shield className="w-4 h-4" />
                    2FA
                    <span className="text-xs text-muted-foreground/60">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={twoFA}
                    onChange={(e) => setTwoFA(e.target.value)}
                    placeholder="2FA code or backup"
                    className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                    <Lock className="w-4 h-4" />
                    Password
                    <span className="text-xs text-muted-foreground/60">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Account password"
                    className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                    <Phone className="w-4 h-4" />
                    Phone
                    <span className="text-xs text-muted-foreground/60">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="+1234567890"
                    className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                    <Send className="w-4 h-4" />
                    Telegram
                    <span className="text-xs text-muted-foreground/60">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="@username"
                    className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                    <Calendar className="w-4 h-4" />
                    Join Date
                  </label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity glow-shadow"
                >
                  Add Member
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto glass-card rounded-2xl p-6 z-50 card-shadow"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Remove Member?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to remove <span className="font-medium text-foreground">{deleteConfirm.email}</span>?
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemove}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => {
                setPaymentModal(null);
                setPaymentAmount('');
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 bottom-4 top-auto sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 max-w-sm mx-auto glass-card rounded-2xl p-6 z-50 card-shadow"
            >
              <div className="text-center space-y-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                  paymentModal.type === 'paid' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                }`}>
                  {paymentModal.type === 'paid' ? (
                    <Check className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  )}
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {paymentModal.type === 'paid' ? 'Mark as Paid' : 'Set Due Amount'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {paymentModal.type === 'paid' 
                    ? 'Enter the amount received from this member' 
                    : 'Enter the pending due amount'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Amount (৳)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount..."
                    autoFocus
                    className={`w-full bg-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                      paymentModal.type === 'paid' ? 'focus:ring-green-500' : 'focus:ring-yellow-500'
                    }`}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPaymentModal(null);
                      setPaymentAmount('');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const amount = parseFloat(paymentAmount) || 0;
                      if (paymentModal.type === 'paid') {
                        await updateMemberPayment(paymentModal.memberId, true, amount);
                        toast.success(`Payment of ৳${amount} recorded!`);
                      } else {
                        await updateMemberPendingAmount(paymentModal.memberId, amount);
                        toast.success(`Due amount of ৳${amount} set!`);
                      }
                      setPaymentModal(null);
                      setPaymentAmount('');
                    }}
                    className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
                      paymentModal.type === 'paid'
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    }`}
                  >
                    {paymentModal.type === 'paid' ? 'Mark Paid' : 'Set Due'}
                  </button>
                </div>

                {paymentModal.type === 'paid' && (
                  <button
                    onClick={async () => {
                      await updateMemberPayment(paymentModal.memberId, false);
                      toast.success('Payment status cleared');
                      setPaymentModal(null);
                      setPaymentAmount('');
                    }}
                    className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear payment status
                  </button>
                )}

                {paymentModal.type === 'due' && (
                  <button
                    onClick={async () => {
                      await updateMemberPendingAmount(paymentModal.memberId, 0);
                      toast.success('Due amount cleared');
                      setPaymentModal(null);
                      setPaymentAmount('');
                    }}
                    className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear due amount
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default YearlyTeamMembers;