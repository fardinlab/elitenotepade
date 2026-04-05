import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, Phone, Calendar, Send, Key, Lock } from 'lucide-react';

interface AddPlusMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: { 
    email: string; 
    ePass?: string;
    gPass?: string;
    phone?: string; 
    telegram?: string; 
    joinDate: string 
  }) => boolean | Promise<boolean>;
}

export function AddPlusMemberModal({ isOpen, onClose, onAdd }: AddPlusMemberModalProps) {
  const [email, setEmail] = useState('');
  const [ePass, setEPass] = useState('');
  const [gPass, setGPass] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string } = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const success = await onAdd({ 
      email, 
      ePass: ePass.trim() || undefined,
      gPass: gPass.trim() || undefined,
      phone: phone.trim() || undefined, 
      telegram: telegram.trim() || undefined,
      joinDate 
    });
    if (success) {
      setEmail('');
      setEPass('');
      setGPass('');
      setPhone('');
      setTelegram('');
      setJoinDate(new Date().toISOString().split('T')[0]);
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setEmail('');
    setEPass('');
    setGPass('');
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
                <div className="p-2 rounded-xl bg-purple-500/20">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold">Add Member</h2>
                  <span className="text-xs text-purple-400">Plus Team</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Email - Required */}
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
                  className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              {/* E-Pass */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                  <Key className="w-4 h-4" />
                  E-Pass
                </label>
                <input
                  type="text"
                  value={ePass}
                  onChange={(e) => setEPass(e.target.value)}
                  placeholder="Email password"
                  className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* G-Pass */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                  <Lock className="w-4 h-4" />
                  G-Pass
                </label>
                <input
                  type="text"
                  value={gPass}
                  onChange={(e) => setGPass(e.target.value)}
                  placeholder="Google password"
                  className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Telegram */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                  <Send className="w-4 h-4" />
                  Telegram Username
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Join Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                  <Calendar className="w-4 h-4" />
                  Join Date
                </label>
                <input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full bg-input rounded-xl px-4 py-2.5 sm:py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-400 text-white font-semibold hover:opacity-90 transition-opacity"
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
