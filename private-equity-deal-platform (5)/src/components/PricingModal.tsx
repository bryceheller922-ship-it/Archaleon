import React, { useState } from 'react';
import { X, Check, Crown, Shield, Zap, Star, Building2, Briefcase, ExternalLink, AlertCircle, CreditCard, CheckCircle } from 'lucide-react';
import { store } from '../store';
import { PE_PLANS, COMPANY_PLANS, SubscriptionPlan, createCheckoutSession, isStripeConfigured } from '../stripe';
import { SubscriptionTier } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'pe_firm' | 'company';
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, userRole }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const plans = userRole === 'pe_firm' ? PE_PLANS : COMPANY_PLANS;
  const currentTier = store.getSubscriptionTier();
  const user = store.getUser();

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (plan.tier === 'free' || plan.tier === currentTier) return;
    if (!user) return;
    
    setLoading(plan.id);
    setCheckoutStatus('processing');
    setErrorMessage('');
    
    try {
      const result = await createCheckoutSession(plan, billingInterval, user.email, user.uid);
      
      if (result.success) {
        // If Stripe is configured, it will redirect automatically
        // If not configured (demo mode), update locally
        if (!isStripeConfigured()) {
          // Demo mode - upgrade locally
          await store.updateSubscription(plan.tier, plan.id);
          setCheckoutStatus('success');
          setTimeout(() => {
            onClose();
          }, 1500);
        }
        // If configured, the user will be redirected to Stripe
        // They'll return via the success URL and the subscription will be updated there
      } else {
        setCheckoutStatus('error');
        setErrorMessage(result.error || 'Failed to start checkout');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setCheckoutStatus('error');
      setErrorMessage('An unexpected error occurred');
    } finally {
      setLoading(null);
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'enterprise': return <Crown className="w-6 h-6" />;
      case 'pro': return <Shield className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'enterprise': return 'from-amber-500 to-yellow-600';
      case 'pro': return 'from-emerald-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (!isOpen) return null;

  // Show success state
  if (checkoutStatus === 'success') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white font-cinzel mb-4">
            UPGRADE SUCCESSFUL
          </h2>
          
          <p className="text-gray-400 mb-6">
            Your subscription has been upgraded. Enjoy your new premium features!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700 flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-3">
              {userRole === 'pe_firm' ? (
                <Briefcase className="w-7 h-7 text-emerald-400" />
              ) : (
                <Building2 className="w-7 h-7 text-emerald-400" />
              )}
              UPGRADE YOUR PLAN
            </h2>
            <p className="text-gray-400 mt-1 font-cormorant text-lg italic">
              {userRole === 'pe_firm' 
                ? 'Unlock verified status and priority access to deals'
                : 'Get featured listings and premium visibility'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Stripe Status */}
        {!isStripeConfigured() && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-900/20 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 text-sm font-medium">Demo Mode Active</p>
              <p className="text-amber-400/70 text-sm">
                Stripe Price IDs not configured. Upgrades will be applied locally for demonstration.
                To enable real payments, add your Stripe Price IDs in src/stripe.ts
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {checkoutStatus === 'error' && errorMessage && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-red-900/20 border border-red-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-medium">Checkout Error</p>
              <p className="text-red-400/70 text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center py-6">
          <div className="bg-neutral-800 rounded-full p-1 flex gap-1">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingInterval === 'month'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                billingInterval === 'year'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6 grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.tier === currentTier;
            const price = billingInterval === 'year' 
              ? plan.yearlyPrice 
              : plan.price;
            const isPopular = plan.tier === 'pro';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border ${
                  isPopular 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-neutral-700 bg-neutral-800/50'
                } p-6 flex flex-col`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Plan Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${getTierColor(plan.tier)}`}>
                    {getTierIcon(plan.tier)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-cinzel">{plan.name}</h3>
                    <p className="text-gray-400 text-sm capitalize">{plan.tier} Plan</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      ${price.toLocaleString()}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-400">
                        /{billingInterval === 'year' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {plan.price === 0 && (
                    <p className="text-gray-400 text-sm mt-1">Free forever</p>
                  )}
                  {billingInterval === 'year' && plan.price > 0 && (
                    <p className="text-emerald-400 text-sm mt-1">
                      ${Math.round(plan.yearlyPrice / 12)}/month billed annually
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        plan.tier === 'enterprise' 
                          ? 'text-amber-400' 
                          : plan.tier === 'pro' 
                            ? 'text-emerald-400' 
                            : 'text-gray-400'
                      }`} />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrentPlan || loading === plan.id}
                  className={`w-full py-3 px-4 rounded-xl font-cinzel font-semibold tracking-wide transition-all flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-neutral-700 text-gray-400 cursor-not-allowed'
                      : plan.tier === 'enterprise'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:from-amber-400 hover:to-yellow-500'
                        : plan.tier === 'pro'
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-400 hover:to-green-500'
                          : 'bg-neutral-700 text-white hover:bg-neutral-600'
                  } ${loading === plan.id ? 'opacity-50' : ''}`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Downgrade'
                  ) : (
                    <>
                      {isStripeConfigured() ? 'Subscribe Now' : 'Upgrade Now'}
                      {isStripeConfigured() && <ExternalLink className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-700 text-center">
          <p className="text-gray-400 text-sm">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className="text-gray-500 text-xs mt-2 flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4" />
            Secure payments powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
};
