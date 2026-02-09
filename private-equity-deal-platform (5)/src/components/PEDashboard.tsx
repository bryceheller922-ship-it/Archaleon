import { useState, useSyncExternalStore, useCallback, useEffect } from 'react';
import { store } from '../store';
import { Listing } from '../types';
import {
  Search, LogOut, LayoutDashboard, MessageSquare,
  Eye, DollarSign, MapPin, Users, Calendar, Send, X, ArrowRight, Filter, ChevronDown,
  Building2, Briefcase, Shield, Star, Crown, Sparkles
} from 'lucide-react';
import { TridentLogo } from './TridentLogo';
import { ChatPanel } from './ChatPanel';
import { PricingModal } from './PricingModal';
import { formatCurrency } from '../utils/format';

type Tab = 'listings' | 'inquiries' | 'messages';

export function PEDashboard() {
  const subscribe = useCallback((cb: () => void) => store.subscribe(cb), []);
  const getVersion = useCallback(() => store.getVersion(), []);
  useSyncExternalStore(subscribe, getVersion);

  // Refresh listings from localStorage on mount to ensure we see all listings
  useEffect(() => {
    store.refreshListings();
  }, []);

  const user = store.getUser();
  const listings = store.getSortedListings(); // Featured first
  const myInquiries = store.getMyInquiries();
  const conversations = store.getConversations();
  const isVerified = store.isVerifiedFirm();
  const subscriptionTier = store.getSubscriptionTier();

  const [tab, setTab] = useState<Tab>('listings');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryListing, setInquiryListing] = useState<Listing | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [industryFilter, setIndustryFilter] = useState('all');
  const [showPricingModal, setShowPricingModal] = useState(false);

  if (!user) return null;

  const filteredListings = listings.filter((l) => {
    const matchesSearch = l.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || l.industry.includes(industryFilter);
    return matchesSearch && matchesIndustry;
  });

  const industries = [...new Set(listings.map((l) => l.industry))];

  const handleViewListing = (listing: Listing) => {
    store.trackView(listing.id);
    setSelectedListing(listing);
  };

  const handleSendInquiry = (listing: Listing) => {
    setInquiryListing(listing);
    setShowInquiryModal(true);
  };

  const handleStartChat = async (listing: Listing) => {
    const convId = await store.startConversation(listing.companyId, listing.companyName, 'company', listing.id, listing.companyName);
    setSelectedConversation(convId);
    setTab('messages');
  };

  const getTierBadge = () => {
    if (subscriptionTier === 'enterprise') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-medium text-amber-400">Enterprise</span>
        </div>
      );
    }
    if (subscriptionTier === 'pro') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">Verified</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white grain-overlay">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center shadow-lg glow-green-sm">
              <TridentLogo className="w-5 h-5 text-emerald-200" />
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-neutral-900/80 rounded-xl p-1 border border-neutral-800/50">
            {([
              ['listings', LayoutDashboard, 'Marketplace'],
              ['inquiries', Send, 'My Inquiries'],
              ['messages', MessageSquare, 'Messages'],
            ] as [Tab, typeof LayoutDashboard, string][]).map(([t, Icon, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-inter font-medium transition-all ${
                  tab === t ? 'bg-emerald-700 text-white shadow-lg glow-green-sm' : 'text-neutral-500 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                {t === 'messages' && conversations.some((c) => c.unread > 0) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
                {t === 'inquiries' && myInquiries.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-800/50 text-emerald-400 text-[10px] font-bold flex items-center justify-center">{myInquiries.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Upgrade Button for Free Users */}
            {subscriptionTier === 'free' && (
              <button
                onClick={() => setShowPricingModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-sm font-medium transition-all shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade
              </button>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/50 border border-neutral-800/50">
              <span className="text-lg">{user.avatar}</span>
              <span className="text-sm font-inter font-medium hidden sm:block text-neutral-300">{user.name}</span>
              {getTierBadge()}
            </div>
            <button onClick={() => store.logout()} className="p-2 text-neutral-500 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'listings' && (
          <>
            {/* Upgrade Banner for Free Users */}
            {subscriptionTier === 'free' && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-900/30 to-green-900/20 border border-emerald-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        Get Verified Status
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">PRO</span>
                      </h3>
                      <p className="text-sm text-neutral-400">Stand out to sellers with a verified badge and priority placement in their inquiries</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPricingModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    View Plans
                  </button>
                </div>
              </div>
            )}

            {listings.length > 0 ? (
              <>
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search companies, industries..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter"
                      />
                    </div>
                    {industries.length > 0 && (
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                        <select
                          value={industryFilter}
                          onChange={(e) => setIndustryFilter(e.target.value)}
                          className="appearance-none pl-9 pr-10 py-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter"
                        >
                          <option value="all">All Industries</option>
                          {industries.map((ind) => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 font-inter">
                    <Building2 className="w-4 h-4" />
                    <span>{filteredListings.length} {filteredListings.length === 1 ? 'company' : 'companies'} available for acquisition</span>
                  </div>
                </div>

                {filteredListings.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredListings.map((listing) => (
                      <div
                        key={listing.id}
                        className={`group bg-neutral-900/60 border rounded-2xl overflow-hidden hover:border-emerald-800/50 transition-all duration-300 cursor-pointer ${
                          listing.featured ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-neutral-800/50'
                        }`}
                        onClick={() => handleViewListing(listing)}
                      >
                        {/* Featured Badge */}
                        {listing.featured && (
                          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1.5 flex items-center justify-center gap-2">
                            <Star className="w-3.5 h-3.5 text-black fill-current" />
                            <span className="text-xs font-bold text-black uppercase tracking-wider">Featured Listing</span>
                          </div>
                        )}
                        
                        {listing.coverPhoto && (
                          <div className="h-32 relative overflow-hidden">
                            <img src={listing.coverPhoto} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-neutral-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">{listing.logo}</div>
                              <div>
                                <h3 className="font-roman text-white tracking-wide">{listing.companyName}</h3>
                                <p className="text-xs text-emerald-500 font-inter">{listing.industry}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-inter font-medium ${
                              listing.status === 'active' ? 'bg-emerald-900/20 text-emerald-500 border border-emerald-800/30' : 'bg-yellow-900/20 text-yellow-500 border border-yellow-800/30'
                            }`}>
                              {listing.status === 'active' ? 'Active' : 'In Review'}
                            </span>
                          </div>
                          <p className="text-neutral-500 text-sm line-clamp-2 mb-4 font-inter">{listing.description}</p>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-neutral-800/50 rounded-lg p-2 border border-neutral-700/30">
                              <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-inter">Asking Price</p>
                              <p className="text-sm font-bold text-emerald-400 font-inter">{formatCurrency(listing.askingPrice)}</p>
                            </div>
                            <div className="bg-neutral-800/50 rounded-lg p-2 border border-neutral-700/30">
                              <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-inter">Revenue</p>
                              <p className="text-sm font-bold font-inter">{formatCurrency(listing.revenue)}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-neutral-600 font-inter">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.location.split(',')[1]?.trim() || listing.location}</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{listing.employees}</span>
                            </div>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.views}</span>
                          </div>
                        </div>
                        <div className="border-t border-neutral-800/50 px-5 py-3 flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSendInquiry(listing); }}
                            className="flex-1 py-2 rounded-lg bg-emerald-800/20 hover:bg-emerald-800/40 text-emerald-400 text-xs font-inter font-medium flex items-center justify-center gap-1.5 transition-colors border border-emerald-800/30"
                          >
                            <Send className="w-3 h-3" />
                            Send Offer
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartChat(listing); }}
                            className="flex-1 py-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-400 text-xs font-inter font-medium flex items-center justify-center gap-1.5 transition-colors border border-neutral-700/30"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Chat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Search className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <h3 className="font-roman text-lg text-neutral-400 mb-2 tracking-wide">NO RESULTS FOUND</h3>
                    <p className="text-neutral-600 text-sm font-inter">Try adjusting your search or filter criteria.</p>
                    <button
                      onClick={() => { setSearchQuery(''); setIndustryFilter('all'); }}
                      className="mt-4 px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-sm font-roman tracking-wider transition-colors"
                    >
                      CLEAR FILTERS
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="max-w-lg text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-800/30 to-emerald-900/20 border border-emerald-800/30 flex items-center justify-center mx-auto mb-6 glow-green-sm">
                    <Briefcase className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="font-roman text-2xl text-white mb-3 tracking-wide">MARKETPLACE AWAITING</h2>
                  <p className="text-neutral-500 text-sm leading-relaxed mb-8 font-inter">
                    No companies have listed yet. When sellers create listings, they will appear here for your review, offers, and direct negotiation.
                  </p>

                  <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-2xl p-6 text-left">
                    <div className="flex items-center gap-2 mb-4">
                      <TridentLogo className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-roman text-white tracking-wide">CAPABILITIES</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-900/20 border border-emerald-800/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Search className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-inter font-medium text-white">Browse & Discover</p>
                          <p className="text-xs text-neutral-600 font-inter">Search and filter listings by industry, size, and price</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-900/20 border border-emerald-800/30 flex items-center justify-center shrink-0 mt-0.5">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-inter font-medium text-white">Submit Offers</p>
                          <p className="text-xs text-neutral-600 font-inter">Send price offers and inquiries directly to sellers</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-900/20 border border-emerald-800/30 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-inter font-medium text-white">Negotiate Directly</p>
                          <p className="text-xs text-neutral-600 font-inter">Chat in real-time with company owners</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-neutral-900/30 rounded-xl p-4 border border-neutral-800/30">
                    <p className="text-xs text-neutral-600 flex items-center justify-center gap-2 font-inter">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Monitoring for new listings...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Listing Detail Modal */}
            {selectedListing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedListing(null)}>
                <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-800" onClick={(e) => e.stopPropagation()}>
                  {selectedListing.featured && (
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-2 flex items-center justify-center gap-2">
                      <Star className="w-4 h-4 text-black fill-current" />
                      <span className="text-sm font-bold text-black uppercase tracking-wider">Featured Listing</span>
                    </div>
                  )}
                  {selectedListing.coverPhoto && (
                    <div className="h-48 relative overflow-hidden">
                      <img src={selectedListing.coverPhoto} alt="" className="w-full h-full object-cover opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-transparent" />
                    </div>
                  )}
                  <div className={`p-6 border-b border-neutral-800 ${selectedListing.coverPhoto ? '-mt-16 relative z-10' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-neutral-800 flex items-center justify-center text-3xl border border-neutral-700/50 shadow-lg">{selectedListing.logo}</div>
                        <div>
                          <h2 className="font-roman text-xl text-white tracking-wide">{selectedListing.companyName}</h2>
                          <p className="text-emerald-500 text-sm font-inter">{selectedListing.industry}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedListing(null)} className="p-2 text-neutral-500 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-neutral-800/50 rounded-xl p-3 text-center border border-neutral-700/30">
                        <p className="text-xs text-neutral-500 mb-1 font-inter">Asking Price</p>
                        <p className="text-lg font-bold text-emerald-400 font-inter">{formatCurrency(selectedListing.askingPrice)}</p>
                      </div>
                      <div className="bg-neutral-800/50 rounded-xl p-3 text-center border border-neutral-700/30">
                        <p className="text-xs text-neutral-500 mb-1 font-inter">Revenue</p>
                        <p className="text-lg font-bold font-inter">{formatCurrency(selectedListing.revenue)}</p>
                      </div>
                      <div className="bg-neutral-800/50 rounded-xl p-3 text-center border border-neutral-700/30">
                        <p className="text-xs text-neutral-500 mb-1 font-inter">EBITDA</p>
                        <p className="text-lg font-bold font-inter">{formatCurrency(selectedListing.ebitda)}</p>
                      </div>
                      <div className="bg-neutral-800/50 rounded-xl p-3 text-center border border-neutral-700/30">
                        <p className="text-xs text-neutral-500 mb-1 font-inter">Multiple</p>
                        <p className="text-lg font-bold font-inter">{selectedListing.ebitda > 0 ? (selectedListing.askingPrice / selectedListing.ebitda).toFixed(1) + 'x' : 'N/A'}</p>
                      </div>
                    </div>
                    {selectedListing.description && (
                      <div>
                        <h3 className="text-sm font-roman text-neutral-300 mb-2 tracking-wide">ABOUT</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed font-inter">{selectedListing.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3 font-inter">
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedListing.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Users className="w-4 h-4" />
                        <span>{selectedListing.employees} employees</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Calendar className="w-4 h-4" />
                        <span>Founded {selectedListing.founded}</span>
                      </div>
                    </div>
                    {selectedListing.highlights.length > 0 && (
                      <div>
                        <h3 className="text-sm font-roman text-neutral-300 mb-2 tracking-wide">HIGHLIGHTS</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedListing.highlights.map((h) => (
                            <span key={h} className="px-3 py-1 rounded-full bg-emerald-900/20 text-emerald-400 text-xs font-inter font-medium border border-emerald-800/30">{h}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => { setSelectedListing(null); handleSendInquiry(selectedListing); }}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 font-roman tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg glow-green-sm transition-all"
                      >
                        <DollarSign className="w-4 h-4" />
                        SEND OFFER
                      </button>
                      <button
                        onClick={() => { setSelectedListing(null); handleStartChat(selectedListing); }}
                        className="flex-1 py-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 font-roman tracking-wider text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        <MessageSquare className="w-4 h-4" />
                        MESSAGE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'inquiries' && (
          <div className="space-y-4">
            <h2 className="font-roman text-xl tracking-wide mb-4">MY INQUIRIES & OFFERS</h2>
            {myInquiries.length === 0 ? (
              <div className="text-center py-20">
                <Send className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                <h3 className="font-roman text-lg text-neutral-400 mb-2 tracking-wide">NO INQUIRIES YET</h3>
                <p className="text-neutral-600 text-sm mb-4 font-inter">Browse the marketplace and send offers to companies you&apos;re interested in.</p>
                {listings.length > 0 ? (
                  <button onClick={() => setTab('listings')} className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-sm font-roman tracking-wider flex items-center gap-2 mx-auto transition-colors">
                    BROWSE LISTINGS <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <p className="text-neutral-700 text-xs mt-2 font-inter">No listings available yet — check back when companies start listing.</p>
                )}
              </div>
            ) : (
              myInquiries.map((inq) => {
                const listing = store.getListing(inq.listingId);
                return (
                  <div key={inq.id} className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-roman text-white tracking-wide">{listing?.companyName || 'Unknown'}</h3>
                        <p className="text-xs text-emerald-500 font-inter">{listing?.industry}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-inter font-medium ${
                        inq.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/30' :
                        inq.status === 'accepted' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/30' :
                        'bg-red-900/20 text-red-400 border border-red-800/30'
                      }`}>
                        {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                      </span>
                    </div>
                    {inq.offerPrice && (
                      <p className="text-emerald-400 font-bold mb-2 font-inter">Offer: {formatCurrency(inq.offerPrice)}</p>
                    )}
                    <p className="text-neutral-500 text-sm font-inter">{inq.message}</p>
                    <p className="text-xs text-neutral-700 mt-3 font-inter">{new Date(inq.createdAt).toLocaleDateString()}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'messages' && (
          <ChatPanel
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
        )}
      </main>

      {/* Inquiry Modal */}
      {showInquiryModal && inquiryListing && (
        <InquiryModal
          listing={inquiryListing}
          onClose={() => { setShowInquiryModal(false); setInquiryListing(null); }}
          isVerified={isVerified}
        />
      )}

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        userRole="pe_firm"
      />
    </div>
  );
}

function InquiryModal({ listing, onClose, isVerified }: { listing: Listing; onClose: () => void; isVerified: boolean }) {
  const [message, setMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) return;
    const user = store.getUser();
    if (!user) return;
    const price = offerPrice ? parseFloat(offerPrice.replace(/,/g, '')) : undefined;
    store.addInquiry(listing.id, message.trim(), price);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-neutral-900 rounded-2xl max-w-lg w-full border border-neutral-800" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-roman text-lg text-white tracking-wide flex items-center gap-2">
              SEND INQUIRY
              {isVerified && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
              )}
            </h3>
            <p className="text-sm text-neutral-500 font-inter">{listing.companyName} · Asking {formatCurrency(listing.askingPrice)}</p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {isVerified && (
          <div className="px-5 py-3 bg-emerald-900/20 border-b border-emerald-800/30">
            <p className="text-xs text-emerald-400 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Your inquiry will be marked as verified and shown with priority to the seller
            </p>
          </div>
        )}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Your Offer Price <span className="text-neutral-600">(optional)</span></label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input type="text" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="e.g. 42,000,000" className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Introduce your firm and explain your interest..." className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none font-inter" />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!message.trim()}
            className={`w-full py-3 rounded-xl font-roman tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
              message.trim()
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 shadow-lg glow-green-sm text-white'
                : 'bg-neutral-800 cursor-not-allowed opacity-50 text-neutral-500'
            }`}
          >
            <Send className="w-4 h-4" />
            SEND INQUIRY
          </button>
        </div>
      </div>
    </div>
  );
}
