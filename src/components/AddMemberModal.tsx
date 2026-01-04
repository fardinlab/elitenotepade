import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, Phone, Calendar, Send } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: { email: string; phone: string; telegram?: string; joinDate: string }) => boolean;
}

export function AddMemberModal({ isOpen, onClose, onAdd }: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[+]?[\d\s\-()]{7,}$/;
    return re.test(phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; phone?: string } = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const success = onAdd({ 
      email, 
      phone, 
      telegram: telegram.trim() || undefined,
      joinDate 
    });
    if (success) {
      setEmail('');
      setPhone('');
      setTelegram('');
      setJoinDate(new Date().toISOString().split('T')[0]);
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setEmail('');
    setPhone('');
    setTelegram('');
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 bottom-4 top-auto sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 max-w-md mx-auto glass-card rounded-2xl p-4 sm:p-6 z-50 card-shadow max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold">Add Member</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="customer@example.com"
                  className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="+1234567890"
                  className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                  <Send className="w-4 h-4" />
                  Telegram Username
                  <span className="text-xs text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                  <Calendar className="w-4 h-4" />
                  Join Date
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="flex-1 bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setJoinDate(new Date().toISOString().split('T')[0])}
                    className="px-3 py-2.5 sm:py-3 rounded-xl bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-colors whitespace-nowrap"
                  >
                    Added Now
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground font-semibold hover:opacity-90 transition-opacity glow-shadow"
              >
                Add Member
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
