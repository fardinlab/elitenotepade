import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, DollarSign, Check, AlertCircle, Pencil, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MemberPayment {
  id: string;
  member_id: string;
  user_id: string;
  year: number;
  month: number;
  status: 'paid' | 'due';
  amount: number;
}

interface MemberData {
  id: string;
  email: string;
  phone: string;
  total_amount: number | null;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MemberPayDetails = () => {
  const navigate = useNavigate();
  const { memberId } = useParams<{ memberId: string }>();
  const { user } = useAuth();
  
  const [member, setMember] = useState<MemberData | null>(null);
  const [payments, setPayments] = useState<MemberPayment[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editingTotalAmount, setEditingTotalAmount] = useState(false);
  const [totalAmountValue, setTotalAmountValue] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const fetchMember = useCallback(async () => {
    if (!user || !memberId) return;

    const { data, error } = await supabase
      .from('members')
      .select('id, email, phone, total_amount')
      .eq('id', memberId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching member:', error);
      toast.error('Failed to load member');
      return;
    }

    if (!data) {
      toast.error('Member not found');
      navigate(-1);
      return;
    }

    setMember(data);
    setTotalAmountValue(data.total_amount?.toString() || '0');
  }, [user, memberId, navigate]);

  const fetchPayments = useCallback(async () => {
    if (!user || !memberId) return;

    const { data, error } = await supabase
      .from('member_payments')
      .select('*')
      .eq('member_id', memberId)
      .eq('user_id', user.id)
      .eq('year', selectedYear);

    if (error) {
      console.error('Error fetching payments:', error);
      return;
    }

    setPayments(data || []);
  }, [user, memberId, selectedYear]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchMember();
      await fetchPayments();
      setLoading(false);
    };
    loadData();
  }, [fetchMember, fetchPayments]);

  const getPaymentForMonth = (month: number) => {
    return payments.find(p => p.month === month);
  };

  const handlePaymentClick = async (month: number, status: 'paid' | 'due') => {
    if (!user || !memberId || !member) return;

    const existingPayment = getPaymentForMonth(month);
    const defaultAmount = member.total_amount ? member.total_amount / 12 : 0;
    
    if (!existingPayment) {
      setEditingMonth(month);
      setEditAmount(Math.round(defaultAmount).toString());
      return;
    }

    // Toggle status if same button clicked
    if (existingPayment.status === status) {
      // Remove payment
      const { error } = await supabase
        .from('member_payments')
        .delete()
        .eq('id', existingPayment.id);

      if (error) {
        console.error('Error removing payment:', error);
        toast.error('Failed to remove payment');
        return;
      }

      setPayments(prev => prev.filter(p => p.id !== existingPayment.id));
      toast.success('Payment removed');
    } else {
      // Update status
      const { error } = await supabase
        .from('member_payments')
        .update({ status })
        .eq('id', existingPayment.id);

      if (error) {
        console.error('Error updating payment:', error);
        toast.error('Failed to update payment');
        return;
      }

      setPayments(prev => prev.map(p => p.id === existingPayment.id ? { ...p, status } : p));
      toast.success(`Marked as ${status}`);
    }
  };

  const saveMonthPayment = async (status: 'paid' | 'due') => {
    if (!user || !memberId || editingMonth === null) return;

    const amount = parseFloat(editAmount) || 0;

    const { data, error } = await supabase
      .from('member_payments')
      .upsert({
        member_id: memberId,
        user_id: user.id,
        year: selectedYear,
        month: editingMonth,
        status,
        amount,
      }, {
        onConflict: 'member_id,year,month'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving payment:', error);
      toast.error('Failed to save payment');
      return;
    }

    setPayments(prev => {
      const existing = prev.findIndex(p => p.month === editingMonth);
      if (existing >= 0) {
        const newPayments = [...prev];
        newPayments[existing] = data;
        return newPayments;
      }
      return [...prev, data];
    });

    toast.success(`Marked as ${status}`);
    setEditingMonth(null);
    setEditAmount('');
  };

  const saveTotalAmount = async () => {
    if (!user || !memberId) return;

    const amount = parseFloat(totalAmountValue) || 0;

    const { error } = await supabase
      .from('members')
      .update({ total_amount: amount })
      .eq('id', memberId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating total amount:', error);
      toast.error('Failed to update total amount');
      return;
    }

    setMember(prev => prev ? { ...prev, total_amount: amount } : null);
    setEditingTotalAmount(false);
    toast.success('Total amount updated');
  };

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDue = payments
    .filter(p => p.status === 'due')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Member not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="container mx-auto flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-foreground truncate">Pay Details</h1>
            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Member Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 card-shadow space-y-3"
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Email:</span>
            <span className="text-sm font-medium text-foreground break-all">{member.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Phone:</span>
            <span className="text-sm font-medium text-foreground">{member.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-2 group">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Amount:</span>
            {editingTotalAmount ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={totalAmountValue}
                  onChange={(e) => setTotalAmountValue(e.target.value)}
                  className="w-24 text-sm bg-input rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button onClick={saveTotalAmount} className="p-1 text-green-500 hover:bg-green-500/20 rounded">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setEditingTotalAmount(false)} className="p-1 text-destructive hover:bg-destructive/20 rounded">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-bold text-primary">৳{member.total_amount || 0}</span>
                <button
                  onClick={() => {
                    setTotalAmountValue((member.total_amount || 0).toString());
                    setEditingTotalAmount(true);
                  }}
                  className="p-1 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Year Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Year:</span>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Monthly Payments */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 card-shadow"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Monthly Paid Details</h3>
          <div className="space-y-3">
            {MONTHS.map((monthName, index) => {
              const month = index + 1;
              const payment = getPaymentForMonth(month);
              const isEditing = editingMonth === month;

              return (
                <div key={month} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm font-medium text-foreground w-24">{monthName}</span>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-20 text-xs bg-input rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <button
                        onClick={() => saveMonthPayment('paid')}
                        className="px-2 py-1 text-xs bg-green-500/20 text-green-500 rounded hover:bg-green-500/30"
                      >
                        Paid
                      </button>
                      <button
                        onClick={() => saveMonthPayment('due')}
                        className="px-2 py-1 text-xs bg-orange-500/20 text-orange-500 rounded hover:bg-orange-500/30"
                      >
                        Due
                      </button>
                      <button
                        onClick={() => { setEditingMonth(null); setEditAmount(''); }}
                        className="p-1 text-muted-foreground hover:bg-secondary rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {payment && (
                        <span className="text-xs text-muted-foreground mr-2">৳{payment.amount}</span>
                      )}
                      <button
                        onClick={() => {
                          if (!payment) {
                            handlePaymentClick(month, 'paid');
                          } else {
                            handlePaymentClick(month, 'paid');
                          }
                        }}
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                          payment?.status === 'paid'
                            ? 'bg-green-500 text-white'
                            : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        Paid
                      </button>
                      <button
                        onClick={() => {
                          if (!payment) {
                            setEditingMonth(month);
                            const defaultAmount = member?.total_amount ? member.total_amount / 12 : 0;
                            setEditAmount(Math.round(defaultAmount).toString());
                          } else {
                            handlePaymentClick(month, 'due');
                          }
                        }}
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                          payment?.status === 'due'
                            ? 'bg-orange-500 text-white'
                            : 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30'
                        }`}
                      >
                        <AlertCircle className="w-3 h-3" />
                        Due
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5 card-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Total Paid:</span>
            <span className="text-lg font-bold text-green-500">৳{totalPaid}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Due:</span>
            <span className="text-lg font-bold text-orange-500">৳{Math.max(0, totalDue)}</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default MemberPayDetails;
