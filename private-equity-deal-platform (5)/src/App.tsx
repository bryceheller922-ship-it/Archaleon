import { useSyncExternalStore, useCallback, useEffect, useState } from 'react';
import { store } from './store';
import { Onboarding } from './components/Onboarding';
import { PEDashboard } from './components/PEDashboard';
import { CompanyDashboard } from './components/CompanyDashboard';
import { SubscriptionTier } from './types';
import { Check, X } from 'lucide-react';

export function App() {
  const subscribe = useCallback((cb: () => void) => store.subscribe(cb), []);
  const getVersion = useCallback(() => store.getVersion(), []);
  useSyncExternalStore(subscribe, getVersion);

  const user = store.getUser();
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);

  // Handle Stripe payment return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const planId = urlParams.get('plan');
    const tier = urlParams.get('tier') as SubscriptionTier | null;

    if (payment === 'success' && planId && tier && user) {
      // Update subscription in store
      store.updateSubscription(tier, planId);
      setPaymentStatus('success');
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Hide success message after 5 seconds
      setTimeout(() => setPaymentStatus(null), 5000);
    } else if (payment === 'cancelled') {
      setPaymentStatus('cancelled');
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Hide cancelled message after 3 seconds
      setTimeout(() => setPaymentStatus(null), 3000);
    }
  }, [user]);

  if (!user) {
    return <Onboarding />;
  }

  return (
    <>
      {/* Payment Status Toast */}
      {paymentStatus && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in">
          {paymentStatus === 'success' ? (
            <div className="bg-emerald-900/90 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3 shadow-xl backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white">Subscription Activated!</p>
                <p className="text-sm text-emerald-400/70">Your plan has been upgraded successfully.</p>
              </div>
              <button onClick={() => setPaymentStatus(null)} className="ml-4 p-1 hover:bg-emerald-800/50 rounded-lg transition-colors">
                <X className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          ) : (
            <div className="bg-neutral-900/90 border border-neutral-700/50 rounded-xl p-4 flex items-center gap-3 shadow-xl backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                <X className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <p className="font-medium text-white">Payment Cancelled</p>
                <p className="text-sm text-neutral-400">No charges were made to your account.</p>
              </div>
              <button onClick={() => setPaymentStatus(null)} className="ml-4 p-1 hover:bg-neutral-800 rounded-lg transition-colors">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {user.role === 'pe_firm' ? <PEDashboard /> : <CompanyDashboard />}
    </>
  );
}
