import { useState, useRef, useEffect } from 'react';
import { store } from '../store';
import { UserRole } from '../types';
import {
  Building2, Briefcase, ArrowRight, ArrowLeft, Shield,
  MessageSquare, Globe, MapPin, Users, DollarSign, Target,
  BarChart3, Calendar, CheckCircle, Award, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Phone
} from 'lucide-react';
import { TridentLogo } from './TridentLogo';

type OnboardingStep = 'welcome' | 'auth_choice' | 'signin' | 'forgot_password' | 'role' |
  'pe_name' | 'pe_experience' | 'pe_focus' | 'pe_details' | 'pe_review' |
  'co_name' | 'co_details' | 'co_financials' | 'co_selling' | 'co_review';

type ContactMethod = 'email' | 'phone';

const INDUSTRIES = [
  'SaaS / Technology', 'Healthcare / AI', 'FinTech', 'Manufacturing',
  'E-Commerce', 'Cybersecurity', 'EdTech', 'Food & Beverage',
  'Real Estate Tech', 'Clean Energy', 'Logistics', 'Media & Entertainment',
  'Biotech', 'Consumer Goods', 'B2B Services', 'Other'
];

const EXPERIENCE_LEVELS = [
  { value: '1-3', label: '1–3 Years', desc: 'Emerging firm, newer to PE acquisitions' },
  { value: '3-7', label: '3–7 Years', desc: 'Growing firm with multiple deals completed' },
  { value: '7-15', label: '7–15 Years', desc: 'Established firm with deep deal experience' },
  { value: '15+', label: '15+ Years', desc: 'Veteran firm with extensive track record' },
];

const SELLING_REASONS = [
  'Retirement / Succession Planning',
  'Seeking Growth Capital',
  'Strategic Partnership',
  'Founder Moving On',
  'Market Timing',
  'Debt / Financial Restructuring',
  'Other',
];

// Common locations for typeahead
const LOCATIONS = [
  // US Cities
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
  'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
  'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Boston, MA',
  'Nashville, TN', 'Detroit, MI', 'Portland, OR', 'Memphis, TN', 'Oklahoma City, OK',
  'Las Vegas, NV', 'Louisville, KY', 'Baltimore, MD', 'Milwaukee, WI', 'Albuquerque, NM',
  'Tucson, AZ', 'Fresno, CA', 'Sacramento, CA', 'Atlanta, GA', 'Miami, FL',
  'Raleigh, NC', 'Omaha, NE', 'Minneapolis, MN', 'Cleveland, OH', 'Tampa, FL',
  'Pittsburgh, PA', 'Cincinnati, OH', 'St. Louis, MO', 'Orlando, FL', 'Kansas City, MO',
  'Silicon Valley, CA', 'Palo Alto, CA', 'Mountain View, CA', 'Menlo Park, CA', 'Cupertino, CA',
  'Redwood City, CA', 'Sunnyvale, CA', 'Santa Clara, CA', 'Fremont, CA', 'Oakland, CA',
  'Berkeley, CA', 'Irvine, CA', 'Newport Beach, CA', 'Santa Monica, CA', 'Beverly Hills, CA',
  'Pasadena, CA', 'Long Beach, CA', 'Anaheim, CA', 'San Mateo, CA', 'Burlingame, CA',
  'Greenwich, CT', 'Stamford, CT', 'Hartford, CT', 'New Haven, CT', 'Westport, CT',
  'Jersey City, NJ', 'Hoboken, NJ', 'Newark, NJ', 'Princeton, NJ', 'Morristown, NJ',
  'Cambridge, MA', 'Brookline, MA', 'Newton, MA', 'Quincy, MA', 'Worcester, MA',
  'Arlington, VA', 'Alexandria, VA', 'McLean, VA', 'Tysons Corner, VA', 'Reston, VA',
  'Bethesda, MD', 'Chevy Chase, MD', 'Rockville, MD', 'Silver Spring, MD', 'Columbia, MD',
  'Scottsdale, AZ', 'Tempe, AZ', 'Mesa, AZ', 'Chandler, AZ', 'Gilbert, AZ',
  'Plano, TX', 'Irving, TX', 'Frisco, TX', 'McKinney, TX', 'Richardson, TX',
  'Bellevue, WA', 'Redmond, WA', 'Kirkland, WA', 'Tacoma, WA', 'Spokane, WA',
  'Boulder, CO', 'Aurora, CO', 'Lakewood, CO', 'Fort Collins, CO', 'Colorado Springs, CO',
  // International Cities
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK', 'Glasgow, UK',
  'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Calgary, Canada', 'Ottawa, Canada',
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia', 'Adelaide, Australia',
  'Singapore', 'Hong Kong', 'Tokyo, Japan', 'Shanghai, China', 'Beijing, China',
  'Mumbai, India', 'Bangalore, India', 'New Delhi, India', 'Hyderabad, India', 'Chennai, India',
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Tel Aviv, Israel', 'Berlin, Germany', 'Munich, Germany',
  'Frankfurt, Germany', 'Paris, France', 'Lyon, France', 'Amsterdam, Netherlands', 'Zurich, Switzerland',
  'Geneva, Switzerland', 'Stockholm, Sweden', 'Copenhagen, Denmark', 'Oslo, Norway', 'Helsinki, Finland',
  'Dublin, Ireland', 'Madrid, Spain', 'Barcelona, Spain', 'Milan, Italy', 'Rome, Italy',
  'Brussels, Belgium', 'Vienna, Austria', 'Prague, Czech Republic', 'Warsaw, Poland', 'Lisbon, Portugal',
  'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Mexico City, Mexico', 'Buenos Aires, Argentina', 'Santiago, Chile',
  'Johannesburg, South Africa', 'Cape Town, South Africa', 'Lagos, Nigeria', 'Nairobi, Kenya', 'Cairo, Egypt',
];

export function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [role, setRole] = useState<UserRole | null>(null);
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Contact method choice
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPhone, setSignInPhone] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInContactMethod, setSignInContactMethod] = useState<ContactMethod>('email');

  // Forgot password fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  // Shared fields
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // PE Firm fields
  const [peName, setPeName] = useState('');
  const [peEmail, setPeEmail] = useState('');
  const [pePhone, setPePhone] = useState('');
  const [peWebsite, setPeWebsite] = useState('');
  const [peLocation, setPeLocation] = useState('');
  const [peExperience, setPeExperience] = useState('');
  const [peAum, setPeAum] = useState('');
  const [pePortfolioSize, setPePortfolioSize] = useState('');
  const [peFocus, setPeFocus] = useState<string[]>([]);
  const [peDealMin, setPeDealMin] = useState('');
  const [peDealMax, setPeDealMax] = useState('');
  const [peDescription, setPeDescription] = useState('');

  // Company fields
  const [coName, setCoName] = useState('');
  const [coEmail, setCoEmail] = useState('');
  const [coPhone, setCoPhone] = useState('');
  const [coIndustry, setCoIndustry] = useState('');
  const [coLocation, setCoLocation] = useState('');
  const [coFounded, setCoFounded] = useState('');
  const [coEmployees, setCoEmployees] = useState('');
  const [coRevenue, setCoRevenue] = useState('');
  const [coDescription, setCoDescription] = useState('');
  const [coReason, setCoReason] = useState('');
  const [coWebsite, setCoWebsite] = useState('');

  const toggleFocus = (ind: string) => {
    setPeFocus(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (value: string, setter: (v: string) => void) => {
    setter(formatPhoneNumber(value));
  };

  // Check if contact info is valid
  const hasValidContact = (email: string, phone: string, method: ContactMethod) => {
    if (method === 'email') {
      return email.trim().length > 0 && email.includes('@');
    } else {
      const numbers = phone.replace(/\D/g, '');
      return numbers.length >= 10;
    }
  };

  // Get the email to use for auth (generate fake email for phone users)
  const getAuthEmail = (email: string, phone: string, method: ContactMethod) => {
    if (method === 'email') {
      return email.trim();
    } else {
      // Create a unique email from phone number for Firebase Auth
      const numbers = phone.replace(/\D/g, '');
      return `${numbers}@archaleon-phone.com`;
    }
  };

  const handleSignIn = async () => {
    setAuthError('');
    setSubmitting(true);
    const authEmail = getAuthEmail(signInEmail, signInPhone, signInContactMethod);
    const result = await store.signIn(authEmail, signInPassword);
    setSubmitting(false);
    if (!result.success) {
      setAuthError(result.error || 'Sign in failed.');
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address.');
      return;
    }
    setResetError('');
    setResetLoading(true);
    const result = await store.resetPassword(resetEmail.trim());
    setResetLoading(false);
    if (result.success) {
      setResetSent(true);
    } else {
      setResetError(result.error || 'Failed to send reset email.');
    }
  };

  const handlePeSubmit = async () => {
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setAuthError('');
    setSubmitting(true);
    const authEmail = getAuthEmail(peEmail, pePhone, contactMethod);
    const result = await store.signUp(authEmail, password, 'pe_firm', peName.trim(), {
      avatar: '🏛️',
      email: peEmail.trim() || undefined,
      phone: pePhone || undefined,
      contactMethod,
      website: peWebsite.trim(),
      location: peLocation.trim(),
      yearsExperience: peExperience,
      aum: peAum,
      portfolioSize: pePortfolioSize,
      investmentFocus: peFocus,
      dealSizeMin: peDealMin,
      dealSizeMax: peDealMax,
      description: peDescription.trim(),
    });
    setSubmitting(false);
    if (!result.success) {
      setAuthError(result.error || 'Sign up failed.');
    }
  };

  const handleCoSubmit = async () => {
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setAuthError('');
    setSubmitting(true);
    const authEmail = getAuthEmail(coEmail, coPhone, contactMethod);
    const result = await store.signUp(authEmail, password, 'company', coName.trim(), {
      avatar: '🏢',
      email: coEmail.trim() || undefined,
      phone: coPhone || undefined,
      contactMethod,
      website: coWebsite.trim(),
      industry: coIndustry,
      companyLocation: coLocation.trim(),
      founded: coFounded,
      employees: coEmployees,
      revenue: coRevenue,
      description: coDescription.trim(),
      reasonForSelling: coReason,
    });
    setSubmitting(false);
    if (!result.success) {
      setAuthError(result.error || 'Sign up failed.');
    }
  };

  const peSteps: OnboardingStep[] = ['pe_name', 'pe_experience', 'pe_focus', 'pe_details', 'pe_review'];
  const coSteps: OnboardingStep[] = ['co_name', 'co_details', 'co_financials', 'co_selling', 'co_review'];
  const currentSteps = role === 'pe_firm' ? peSteps : coSteps;
  const currentStepIndex = currentSteps.indexOf(step);
  const totalSteps = currentSteps.length;

  const goBack = () => {
    setAuthError('');
    if (currentStepIndex > 0) {
      setStep(currentSteps[currentStepIndex - 1]);
    } else {
      setStep('role');
    }
  };

  // Check if PE name step is valid
  const isPeNameValid = () => {
    return peName.trim().length > 0 && 
           hasValidContact(peEmail, pePhone, contactMethod) && 
           password.length >= 6 && 
           password === confirmPassword;
  };

  // Check if Company name step is valid
  const isCoNameValid = () => {
    return coName.trim().length > 0 && 
           hasValidContact(coEmail, coPhone, contactMethod) && 
           password.length >= 6 && 
           password === confirmPassword;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] grain-overlay flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg glow-green-sm">
          <TridentLogo className="w-5 h-5 text-emerald-100" />
        </div>
        <span className="font-roman text-xl text-white tracking-wider">ARCHALEON</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        {/* WELCOME */}
        {step === 'welcome' && (
          <div className="max-w-4xl w-full">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-900/20 border border-emerald-700/30 text-emerald-400 text-sm font-medium mb-8">
                <Shield className="w-4 h-4" />
                <span className="font-inter">Exclusive Private Equity Platform</span>
              </div>
              <h1 className="font-roman text-4xl md:text-6xl text-white mb-6 leading-tight tracking-wide">
                WHERE LEGACY MEETS<br />
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent">OPPORTUNITY</span>
              </h1>
              <p className="font-serif-body text-neutral-400 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed italic">
                A distinguished marketplace connecting discerning private equity firms with exceptional companies poised for transformation.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mb-14">
              <div className="flex items-center gap-3 text-neutral-400 text-sm">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/20 border border-emerald-800/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="font-inter">Confidential & Secure</span>
              </div>
              <div className="flex items-center gap-3 text-neutral-400 text-sm">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/20 border border-emerald-800/30 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="font-inter">Direct Negotiations</span>
              </div>
              <div className="flex items-center gap-3 text-neutral-400 text-sm">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/20 border border-emerald-800/30 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="font-inter">Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-3 text-neutral-400 text-sm">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/20 border border-emerald-800/30 flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="font-inter">Curated Deal Flow</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setStep('auth_choice')}
                className="px-10 py-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-roman text-lg tracking-wider shadow-2xl glow-green flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                ENTER
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-10 flex justify-center">
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-emerald-700/50 to-transparent" />
            </div>
            <p className="text-center text-neutral-600 text-xs mt-4 font-inter tracking-wider uppercase">
              Est. MMXXIV — Acquisitions & Private Equity
            </p>
          </div>
        )}

        {/* AUTH CHOICE */}
        {step === 'auth_choice' && (
          <div className="max-w-md w-full">
            <button onClick={() => setStep('welcome')} className="text-neutral-500 hover:text-white mb-6 text-sm flex items-center gap-1 transition-colors font-inter">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center mx-auto mb-5 shadow-lg glow-green-sm">
                <TridentLogo className="w-8 h-8 text-emerald-200" />
              </div>
              <h2 className="font-roman text-3xl text-white mb-3 tracking-wide">ARCHALEON</h2>
              <p className="text-neutral-400 font-serif-body text-lg italic">Welcome to the platform</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { setAuthError(''); setStep('signin'); }}
                className="w-full p-5 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-emerald-700/40 hover:bg-neutral-900/80 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-900/30 border border-emerald-800/30 flex items-center justify-center group-hover:bg-emerald-900/50 transition-colors">
                      <Lock className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-roman text-white tracking-wide">SIGN IN</h3>
                      <p className="text-neutral-500 text-sm font-inter">Access your existing account</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-emerald-500 transition-colors" />
                </div>
              </button>

              <button
                onClick={() => { setAuthError(''); setStep('role'); }}
                className="w-full p-5 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-emerald-700/40 hover:bg-neutral-900/80 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-900/30 border border-emerald-800/30 flex items-center justify-center group-hover:bg-emerald-900/50 transition-colors">
                      <Users className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-roman text-white tracking-wide">CREATE ACCOUNT</h3>
                      <p className="text-neutral-500 text-sm font-inter">Join as a PE firm or company</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-emerald-500 transition-colors" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* SIGN IN */}
        {step === 'signin' && (
          <div className="max-w-md w-full">
            <button onClick={() => { setAuthError(''); setStep('auth_choice'); }} className="text-neutral-500 hover:text-white mb-6 text-sm flex items-center gap-1 transition-colors font-inter">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="p-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center mb-5 shadow-lg glow-green-sm">
                <Lock className="w-6 h-6 text-emerald-200" />
              </div>
              <h2 className="font-roman text-2xl text-white mb-1 tracking-wide">SIGN IN</h2>
              <p className="text-neutral-500 text-sm mb-6 font-inter">Welcome back. Enter your credentials.</p>

              {authError && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800/30 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm font-inter">{authError}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Contact Method Toggle */}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Sign in with</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSignInContactMethod('email')}
                      className={`p-3 rounded-xl border text-sm font-inter font-medium transition-all flex items-center justify-center gap-2 ${
                        signInContactMethod === 'email'
                          ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400 ring-1 ring-emerald-600/30'
                          : 'border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:border-neutral-700'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignInContactMethod('phone')}
                      className={`p-3 rounded-xl border text-sm font-inter font-medium transition-all flex items-center justify-center gap-2 ${
                        signInContactMethod === 'phone'
                          ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400 ring-1 ring-emerald-600/30'
                          : 'border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:border-neutral-700'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      Phone
                    </button>
                  </div>
                </div>

                {signInContactMethod === 'email' ? (
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                      <input
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="your@email.com"
                        autoFocus
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all font-inter"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                      <input
                        type="tel"
                        value={signInPhone}
                        onChange={(e) => handlePhoneChange(e.target.value, setSignInPhone)}
                        placeholder="(555) 123-4567"
                        autoFocus
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all font-inter"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      onKeyDown={(e) => e.key === 'Enter' && !submitting && handleSignIn()}
                      className="w-full pl-10 pr-12 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all font-inter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* FORGOT PASSWORD BUTTON */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(signInEmail);
                      setResetSent(false);
                      setResetError('');
                      setStep('forgot_password');
                    }}
                    className="text-emerald-500 hover:text-emerald-400 text-sm font-inter hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  onClick={handleSignIn}
                  disabled={!hasValidContact(signInEmail, signInPhone, signInContactMethod) || !signInPassword.trim() || submitting}
                  className={`w-full py-3.5 rounded-xl font-roman tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
                    hasValidContact(signInEmail, signInPhone, signInContactMethod) && signInPassword.trim() && !submitting
                      ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white shadow-lg glow-green-sm'
                      : 'bg-neutral-800 cursor-not-allowed opacity-50 text-neutral-500'
                  }`}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {submitting ? 'SIGNING IN...' : 'SIGN IN'}
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-neutral-600 text-sm font-inter">
                  Don&apos;t have an account?{' '}
                  <button onClick={() => { setAuthError(''); setStep('role'); }} className="text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
                    Create one
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD */}
        {step === 'forgot_password' && (
          <div className="max-w-md w-full">
            <button onClick={() => { setResetError(''); setStep('signin'); }} className="text-neutral-500 hover:text-white mb-6 text-sm flex items-center gap-1 transition-colors font-inter">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>

            <div className="p-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
              {!resetSent ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center mb-5 shadow-lg glow-green-sm">
                    <Mail className="w-6 h-6 text-emerald-200" />
                  </div>
                  <h2 className="font-roman text-2xl text-white mb-1 tracking-wide">RESET PASSWORD</h2>
                  <p className="text-neutral-500 text-sm mb-6 font-inter">Enter your email and we'll send you a reset link.</p>

                  {resetError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800/30 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-red-400 text-sm font-inter">{resetError}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="your@email.com"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && !resetLoading && handleForgotPassword()}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all font-inter"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleForgotPassword}
                      disabled={!resetEmail.trim() || resetLoading}
                      className={`w-full py-3.5 rounded-xl font-roman tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
                        resetEmail.trim() && !resetLoading
                          ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white shadow-lg glow-green-sm'
                          : 'bg-neutral-800 cursor-not-allowed opacity-50 text-neutral-500'
                      }`}
                    >
                      {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      {resetLoading ? 'SENDING...' : 'SEND RESET LINK'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="font-roman text-2xl text-white mb-2 tracking-wide">CHECK YOUR EMAIL</h2>
                  <p className="text-neutral-500 text-sm mb-6 font-inter">
                    We've sent a password reset link to<br />
                    <span className="text-emerald-400 font-medium">{resetEmail}</span>
                  </p>
                  <p className="text-neutral-600 text-xs mb-6 font-inter">
                    Didn't receive it? Check your spam folder or try again.
                  </p>
                  <button
                    onClick={() => setStep('signin')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-roman tracking-wider text-sm shadow-lg glow-green-sm transition-all"
                  >
                    BACK TO SIGN IN
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROLE SELECTION */}
        {step === 'role' && (
          <div className="max-w-3xl w-full">
            <button onClick={() => setStep('auth_choice')} className="text-neutral-500 hover:text-white mb-6 text-sm flex items-center gap-1 transition-colors font-inter">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="text-center mb-10">
              <h2 className="font-roman text-3xl md:text-4xl text-white mb-3 tracking-wide">SELECT YOUR ROLE</h2>
              <p className="text-neutral-400 font-serif-body text-lg italic">Choose how you wish to engage with the platform</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => { setRole('pe_firm'); setContactMethod('email'); setStep('pe_name'); }}
                className="group p-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm hover:border-emerald-700/40 hover:bg-neutral-900/80 transition-all duration-300 text-left"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center mb-5 shadow-lg glow-green-sm group-hover:scale-110 transition-all">
                  <Briefcase className="w-8 h-8 text-emerald-200" />
                </div>
                <h3 className="font-roman text-xl text-white mb-2 tracking-wide">PRIVATE EQUITY FIRM</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-5 font-inter">
                  Browse curated listings, submit offers, and negotiate directly with companies seeking acquisition.
                </p>
                <ul className="space-y-2 text-sm text-neutral-500 mb-5 font-inter">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Access curated deal flow</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Submit offers & negotiate</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Direct messaging with sellers</li>
                </ul>
                <div className="flex items-center gap-2 text-emerald-500 text-sm font-roman tracking-wider group-hover:gap-3 transition-all">
                  <span>CONTINUE</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              <button
                onClick={() => { setRole('company'); setContactMethod('email'); setStep('co_name'); }}
                className="group p-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm hover:border-emerald-700/40 hover:bg-neutral-900/80 transition-all duration-300 text-left"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center mb-5 shadow-lg glow-green-sm group-hover:scale-110 transition-all">
                  <Building2 className="w-8 h-8 text-emerald-200" />
                </div>
                <h3 className="font-roman text-xl text-white mb-2 tracking-wide">COMPANY / SELLER</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-5 font-inter">
                  List your company, track engagement, and connect with qualified buyers seeking strategic acquisitions.
                </p>
                <ul className="space-y-2 text-sm text-neutral-500 mb-5 font-inter">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> List your business for sale</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Track listing performance</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Negotiate with qualified buyers</li>
                </ul>
                <div className="flex items-center gap-2 text-emerald-500 text-sm font-roman tracking-wider group-hover:gap-3 transition-all">
                  <span>CONTINUE</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-neutral-600 text-sm font-inter">
                Already have an account?{' '}
                <button onClick={() => { setAuthError(''); setStep('signin'); }} className="text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
                  Sign in
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ====== PE FIRM ONBOARDING ====== */}

        {step === 'pe_name' && (
          <StepWrapper step={1} total={totalSteps} title="YOUR FIRM" subtitle="Provide your credentials and contact information" icon={<Briefcase className="w-7 h-7 text-emerald-200" />} onBack={goBack} onNext={() => setStep('pe_experience')} canNext={isPeNameValid()} nextLabel="CONTINUE" error={authError}>
            <div className="space-y-4">
              <InputField label="Firm Name *" value={peName} onChange={setPeName} placeholder="e.g. Archaleon Capital Partners" icon={<Briefcase className="w-4 h-4" />} autoFocus />

              {/* Contact Method Toggle */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Contact Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContactMethod('email')}
                    className={`p-3 rounded-xl border text-sm font-inter font-medium transition-all flex items-center justify-center gap-2 ${
                      contactMethod === 'email'
                        ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400 ring-1 ring-emerald-600/30'
                        : 'border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactMethod('phone')}
                    className={`p-3 rounded-xl border text-sm font-inter font-medium transition-all flex items-center justify-center gap-2 ${
                      contactMethod === 'phone'
                        ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400 ring-1 ring-emerald-600/30'
                        : 'border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Phone
                  </button>
                </div>
                <p className="text-xs text-neutral-600 mt-2 font-inter">Choose how you'd like to be contacted. You only need to provide one.</p>
              </div>

              {contactMethod === 'email' ? (
                <InputField label="Email Address *" value={peEmail} onChange={setPeEmail} placeholder="contact@yourfirm.com" type="email" icon={<Mail className="w-4 h-4" />} />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input
                      type="tel"
                      value={pePhone}
                      onChange={(e) => handlePhoneChange(e.target.value, setPePhone)}
                      placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all font-inter"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="w-full pl-10 pr-10 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-inter" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-inter" />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-red-400 text-xs mt-1 font-inter">Passwords do not match</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Website" value={peWebsite} onChange={setPeWebsite} placeholder="www.yourfirm.com" icon={<Globe className="w-4 h-4" />} />
                <TypeaheadInput label="Headquarters" value={peLocation} onChange={setPeLocation} placeholder="New York, NY" icon={<MapPin className="w-4 h-4" />} suggestions={LOCATIONS} />
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 'pe_experience' && (
          <StepWrapper step={2} total={totalSteps} title="EXPERIENCE" subtitle="Help us understand your firm's track record" icon={<Award className="w-7 h-7 text-emerald-200" />} onBack={goBack} onNext={() => setStep('pe_focus')} canNext={peExperience.length > 0} nextLabel="CONTINUE">
            <div className="space-y-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <button key={level.value} onClick={() => setPeExperience(level.value)} className={`w-full p-4 rounded-xl border text-left transition-all ${peExperience === level.value ? 'border-emerald-600/50 bg-emerald-900/20 ring-1 ring-emerald-600/30' : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700 hover:bg-neutral-900/60'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-roman text-white text-sm tracking-wide">{level.label}</p>
                      <p className="text-neutral-500 text-xs mt-0.5 font-inter">{level.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${peExperience === level.value ? 'border-emerald-500 bg-emerald-500' : 'border-neutral-700'}`}>
                      {peExperience === level.value && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-5">
              <InputField label="Assets Under Management" value={peAum} onChange={setPeAum} placeholder="e.g. $2.5B" icon={<DollarSign className="w-4 h-4" />} />
              <InputField label="Portfolio Companies" value={pePortfolioSize} onChange={setPePortfolioSize} placeholder="e.g. 12" icon={<BarChart3 className="w-4 h-4" />} />
            </div>
          </StepWrapper>
        )}

        {step === 'pe_focus' && (
          <StepWrapper step={3} total={totalSteps} title="INVESTMENT FOCUS" subtitle="Select the industries that align with your thesis" icon={<Target className="w-7 h-7 text-emerald-200" />} onBack={goBack} onNext={() => setStep('pe_details')} canNext={peFocus.length > 0} nextLabel="CONTINUE">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INDUSTRIES.map((ind) => (
                <button key={ind} onClick={() => toggleFocus(ind)} className={`px-3 py-2.5 rounded-xl border text-sm font-inter font-medium transition-all ${peFocus.includes(ind) ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400 ring-1 ring-emerald-600/30' : 'border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'}`}>
                  {ind}
                </button>
              ))}
            </div>
            {peFocus.length > 0 && <p className="text-xs text-emerald-500 mt-3 font-inter">{peFocus.length} industries selected</p>}
          </StepWrapper>
        )}

        {step === 'pe_details' && (
          <StepWrapper step={4} total={totalSteps} title="DEAL PREFERENCES" subtitle="Define your ideal deal parameters" icon={<DollarSign className="w-7 h-7 text-emerald-200" />} onBack={goBack} onNext={() => setStep('pe_review')} canNext={true} nextLabel="REVIEW PROFILE">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Target Deal Size Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1 font-inter">Minimum</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                      <input type="text" value={peDealMin} onChange={(e) => setPeDealMin(e.target.value)} placeholder="e.g. 500,000 or 1" className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-inter" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1 font-inter">Maximum</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                      <input type="text" value={peDealMax} onChange={(e) => setPeDealMax(e.target.value)} placeholder="e.g. 50,000,000" className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-inter" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-neutral-600 mt-2 font-inter">Enter any dollar amount — there is no minimum requirement.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">About Your Firm <span className="text-neutral-600">(optional)</span></label>
                <textarea value={peDescription} onChange={(e) => setPeDescription(e.target.value)} rows={4} placeholder="Describe your investment thesis, value-add approach, and what distinguishes your firm..." className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none font-inter" />
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 'pe_review' && (
          <StepWrapper step={5} total={totalSteps} title="REVIEW" subtitle="Confirm your profile before entering the platform" icon={<CheckCircle className="w-7 h-7 text-emerald-200" />} onBack={goBack} onNext={handlePeSubmit} canNext={!submitting} nextLabel={submitting ? 'CREATING ACCOUNT...' : 'ENTER PLATFORM'} isLast error={authError} loading={submitting}>
            <div className="space-y-4">
              <div className="bg-neutral-900/40 rounded-xl p-5 border border-neutral-800/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-2xl shadow-lg glow-green-sm">🏛️</div>
                  <div>
                    <h3 className="font-roman text-lg text-white tracking-wide">{peName}</h3>
                    <p className="text-emerald-500 text-sm font-inter">Private Equity Firm</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {contactMethod === 'email' && peEmail && <ReviewItem label="Email" value={peEmail} />}
                  {contactMethod === 'phone' && pePhone && <ReviewItem label="Phone" value={pePhone} />}
                  {peLocation && <ReviewItem label="Location" value={peLocation} />}
                  {peWebsite && <ReviewItem label="Website" value={peWebsite} />}
                  {peExperience && <ReviewItem label="Experience" value={`${peExperience} years`} />}
                  {peAum && <ReviewItem label="AUM" value={peAum} />}
                  {pePortfolioSize && <ReviewItem label="Portfolio" value={`${pePortfolioSize} companies`} />}
                  {peDealMin && <ReviewItem label="Min Deal" value={`$${peDealMin}`} />}
                  {peDealMax && <ReviewItem label="Max Deal" value={`$${peDealMax}`} />}
                </div>
                {peFocus.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-neutral-800/50">
                    <p className="text-xs text-neutral-600 mb-2 font-inter">Investment Focus</p>
                    <div className="flex flex-wrap gap-1.5">
                      {peFocus.map(f => (<span key={f} className="px-2.5 py-1 rounded-full bg-emerald-900/20 text-emerald-500 text-xs border border-emerald-800/30 font-inter">{f}</span>))}
                    </div>
                  </div>
                )}
                {peDescription && (
                  <div className="mt-4 pt-3 border-t border-neutral-800/50">
                    <p className="text-xs text-neutral-600 mb-1 font-inter">About</p>
                    <p className="text-neutral-300 text-sm font-inter">{peDescription}</p>
                  </div>
                )}
              </div>
            </div>
          </StepWrapper>
        )}

        {/* ====== COMPANY ONBOARDING ====== */}

        {step === 'co_name' && (
          <StepWrapper step={1} total={totalSteps} title="YOUR COMPANY" subtitle="Provide your company credentials" icon={<Building2 className="w-7 h-7 text-emerald-200" />} onBack={goBack} onNext={() => setStep('co_details')} canNext={isCoNameValid()} nextLabel="CONTINUE" error={authError}>
            <div className="space-y-4">
              <InputField label="Company Name *" value={coName} onChange={setCoName} placeholder="e.g. Meridian Solutions" icon={<Building2 className="w-4 h-4" />} autoFocus />
              
              {/* Contact Method Toggle */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Contact Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContactMethod('email')}
                    className={`p-3 rounded-xl border text-sm font-inter font-medium transition-all flex items-center justify-center gap-2 ${
                      contactMethod === 'email'
                        ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400 ring-1 ring-emerald-600/30'
                        : 'border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactMethod('phone')}
                    className={`p-3 rounded-xl border text-sm font-inter font-medium transition-all flex items-center justify-center gap-2 ${
                      contactMethod === 'phone'
                        ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400 ring-1 ring-emerald-600/30'
                        : 'border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Phone
                  </button>
                </div>
                <p className="text-xs text-neutral-600 mt-2 font-inter">Choose how you'd like to be contacted. You only need to provide one.</p>
              </div>

              {contactMethod === 'email' ? (
                <InputField label="Email Address *" value={coEmail} onChange={setCoEmail} placeholder="contact@yourcompany.com" type="email" icon={<Mail className="w-4 h-4" />} />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input
                      type="tel"
                      value={coPhone}
                      onChange={(e) => handlePhoneChange(e.target.value, setCoPhone)}
                      placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all font-inter"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="w-full pl-10 pr-10 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-inter" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-inter" />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-red-400 text-xs mt-1 font-inter">Passwords do not match</p>
                  )}
                </div>
              </div>
              <InputField label="Website" value={coWebsite} onChange={setCoWebsite} placeholder="www.yourcompany.com" icon={<Globe className="w-4 h-4" />} />
            </div>
          </StepWrapper>
        )}

        {step === 'co_details' && (
          <StepWrapper step={2} total={totalSteps} title="COMPANY DETAILS" subtitle="Help prospective buyers understand your business" icon={<BarChart3 className="w-7 h-7 text-emerald-200" />} onBack={goBack} onNext={() => setStep('co_financials')} canNext={coIndustry.length > 0} nextLabel="CONTINUE">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Industry *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button key={ind} onClick={() => setCoIndustry(ind)} className={`px-3 py-2.5 rounded-xl border text-sm font-inter font-medium transition-all ${coIndustry === ind ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400 ring-1 ring-emerald-600/30' : 'border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'}`}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <TypeaheadInput label="Location" value={coLocation} onChange={setCoLocation} placeholder="San Francisco, CA" icon={<MapPin className="w-4 h-4" />} suggestions={LOCATIONS} />
                <InputField label="Year Founded" value={coFounded} onChange={setCoFounded} placeholder="e.g. 2018" icon={<Calendar className="w-4 h-4" />} />
              </div>
              <InputField label="Number of Employees" value={coEmployees} onChange={setCoEmployees} placeholder="e.g. 85" icon={<Users className="w-4 h-4" />} />
            </div>
          </StepWrapper>
        )}

        {step === 'co_financials' && (
          <StepWrapper step={3} total={totalSteps} title="FINANCIALS" subtitle="This information attracts serious, qualified buyers" icon={<DollarSign className="w-7 h-7 text-emerald-200" />} onBack={goBack} onNext={() => setStep('co_selling')} canNext={true} nextLabel="CONTINUE">
            <div className="space-y-4">
              <InputField label="Annual Revenue" value={coRevenue} onChange={setCoRevenue} placeholder="e.g. $12M" icon={<DollarSign className="w-4 h-4" />} />
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Company Description</label>
                <textarea value={coDescription} onChange={(e) => setCoDescription(e.target.value)} rows={4} placeholder="Describe your company's operations, market position, competitive advantages, and growth potential..." className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none font-inter" />
              </div>
              <div className="bg-neutral-900/30 rounded-xl p-4 border border-neutral-800/50">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-neutral-300 font-inter">Your data is strictly confidential</p>
                    <p className="text-xs text-neutral-600 mt-0.5 font-inter">Financial details are disclosed only to verified PE firms who express formal interest.</p>
                  </div>
                </div>
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 'co_selling' && (
          <StepWrapper step={4} total={totalSteps} title="MOTIVATION" subtitle="Understanding your objectives helps match you with the right acquirer" icon={<Target className="w-7 h-7 text-emerald-200" />} onBack={goBack} onNext={() => setStep('co_review')} canNext={true} nextLabel="REVIEW PROFILE">
            <div className="space-y-3">
              {SELLING_REASONS.map((reason) => (
                <button key={reason} onClick={() => setCoReason(reason)} className={`w-full p-4 rounded-xl border text-left transition-all ${coReason === reason ? 'border-emerald-600/50 bg-emerald-900/20 ring-1 ring-emerald-600/30' : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700 hover:bg-neutral-900/60'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-inter font-medium text-white">{reason}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${coReason === reason ? 'border-emerald-500 bg-emerald-500' : 'border-neutral-700'}`}>
                      {coReason === reason && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 'co_review' && (
          <StepWrapper step={5} total={totalSteps} title="REVIEW" subtitle="Confirm your profile before entering the platform" icon={<CheckCircle className="w-7 h-7 text-emerald-200" />} onBack={goBack} onNext={handleCoSubmit} canNext={!submitting} nextLabel={submitting ? 'CREATING ACCOUNT...' : 'ENTER PLATFORM'} isLast error={authError} loading={submitting}>
            <div className="space-y-4">
              <div className="bg-neutral-900/40 rounded-xl p-5 border border-neutral-800/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-2xl shadow-lg glow-green-sm">🏢</div>
                  <div>
                    <h3 className="font-roman text-lg text-white tracking-wide">{coName}</h3>
                    <p className="text-emerald-500 text-sm font-inter">{coIndustry || 'Company / Seller'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {contactMethod === 'email' && coEmail && <ReviewItem label="Email" value={coEmail} />}
                  {contactMethod === 'phone' && coPhone && <ReviewItem label="Phone" value={coPhone} />}
                  {coLocation && <ReviewItem label="Location" value={coLocation} />}
                  {coWebsite && <ReviewItem label="Website" value={coWebsite} />}
                  {coFounded && <ReviewItem label="Founded" value={coFounded} />}
                  {coEmployees && <ReviewItem label="Employees" value={coEmployees} />}
                  {coRevenue && <ReviewItem label="Revenue" value={coRevenue} />}
                </div>
                {coReason && (
                  <div className="mt-4 pt-3 border-t border-neutral-800/50">
                    <p className="text-xs text-neutral-600 mb-1 font-inter">Reason for Selling</p>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-900/20 text-emerald-500 text-xs border border-emerald-800/30 font-inter">{coReason}</span>
                  </div>
                )}
                {coDescription && (
                  <div className="mt-4 pt-3 border-t border-neutral-800/50">
                    <p className="text-xs text-neutral-600 mb-1 font-inter">Description</p>
                    <p className="text-neutral-300 text-sm font-inter">{coDescription}</p>
                  </div>
                )}
              </div>
              <div className="bg-emerald-900/10 rounded-xl p-4 border border-emerald-800/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-neutral-300 font-inter">What happens next?</p>
                    <p className="text-xs text-neutral-600 mt-0.5 font-inter">You&apos;ll be directed to your dashboard where you can create your first listing and begin receiving inquiries from qualified PE firms.</p>
                  </div>
                </div>
              </div>
            </div>
          </StepWrapper>
        )}
      </div>
    </div>
  );
}

// ==== Reusable sub-components ====

function StepWrapper({ step, total, title, subtitle, icon, onBack, onNext, canNext, nextLabel, children, isLast, error, loading }: {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  nextLabel: string;
  children: React.ReactNode;
  isLast?: boolean;
  error?: string;
  loading?: boolean;
}) {
  return (
    <div className="max-w-xl w-full">
      <button onClick={onBack} className="text-neutral-500 hover:text-white mb-5 text-sm flex items-center gap-1 transition-colors font-inter">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-neutral-900">
            <div className={`h-full rounded-full transition-all duration-500 ${i < step ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : ''}`} style={{ width: i < step ? '100%' : '0%' }} />
          </div>
        ))}
        <span className="text-xs text-neutral-600 ml-1 shrink-0 font-inter">{step}/{total}</span>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center mb-4 shadow-lg glow-green-sm">
          {icon}
        </div>
        <h2 className="font-roman text-2xl text-white mb-1 tracking-wide">{title}</h2>
        <p className="text-neutral-500 text-sm mb-6 font-inter">{subtitle}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm font-inter">{error}</p>
          </div>
        )}

        {children}

        <button
          onClick={onNext}
          disabled={!canNext || loading}
          className={`w-full mt-6 py-3.5 rounded-xl font-roman tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
            canNext && !loading
              ? `bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white shadow-lg glow-green-sm ${isLast && !loading ? 'animate-pulse' : ''}`
              : 'bg-neutral-800 cursor-not-allowed opacity-50 text-neutral-500'
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', icon, autoFocus }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">{label}</label>
      <div className="relative">
        {icon && (<div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">{icon}</div>)}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all font-inter`} />
      </div>
    </div>
  );
}

function TypeaheadInput({ label, value, onChange, placeholder, icon, suggestions }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
  suggestions: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length > 0) {
      const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); // Limit to 8 suggestions
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-neutral-400 mb-1.5 font-inter">{label}</label>
      <div className="relative">
        {icon && (<div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">{icon}</div>)}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all font-inter`}
        />
      </div>
      
      {/* Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-3 text-left text-sm text-neutral-300 hover:bg-emerald-900/30 hover:text-emerald-400 transition-colors font-inter flex items-center gap-2 border-b border-neutral-800/50 last:border-b-0"
            >
              <MapPin className="w-3.5 h-3.5 text-neutral-600" />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-600 font-inter">{label}</p>
      <p className="text-neutral-200 font-medium text-sm truncate font-inter">{value}</p>
    </div>
  );
}
