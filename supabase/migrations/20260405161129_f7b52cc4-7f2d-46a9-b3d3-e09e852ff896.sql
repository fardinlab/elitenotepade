
-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_name TEXT NOT NULL,
  admin_email TEXT NOT NULL DEFAULT '',
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_backup TIMESTAMP WITH TIME ZONE,
  is_yearly BOOLEAN DEFAULT false,
  is_plus BOOLEAN DEFAULT false
);

-- Create members table
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  telegram TEXT,
  two_fa TEXT,
  twofa TEXT,
  twofa_secret TEXT,
  otp_secret TEXT,
  password TEXT,
  e_pass TEXT,
  g_pass TEXT,
  join_date TEXT NOT NULL DEFAULT '',
  is_paid BOOLEAN DEFAULT false,
  paid_amount NUMERIC DEFAULT 0,
  pending_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  subscriptions TEXT[] DEFAULT '{}',
  is_pushed BOOLEAN DEFAULT false,
  active_team_id UUID,
  is_usdt BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member_payments table
CREATE TABLE public.member_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_payments ENABLE ROW LEVEL SECURITY;

-- Teams RLS policies
CREATE POLICY "Users can view own teams" ON public.teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own teams" ON public.teams FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own teams" ON public.teams FOR DELETE USING (auth.uid() = user_id);

-- Members RLS policies
CREATE POLICY "Users can view own members" ON public.members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own members" ON public.members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own members" ON public.members FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own members" ON public.members FOR DELETE USING (auth.uid() = user_id);

-- Member payments RLS policies
CREATE POLICY "Users can view own payments" ON public.member_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.member_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON public.member_payments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own payments" ON public.member_payments FOR DELETE USING (auth.uid() = user_id);
