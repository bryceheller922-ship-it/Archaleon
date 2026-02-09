import { useState, useSyncExternalStore, useCallback, useRef } from 'react';
import { store } from '../store';
import { Listing, ListingViewer } from '../types';
import {
  LogOut, LayoutDashboard, MessageSquare, PlusCircle,
  Eye, DollarSign, Users, Send, BarChart3, CheckCircle, XCircle,
  Clock, ArrowUpRight, Building2, Landmark, ArrowLeft,
  Image, X, TrendingUp, UserCheck, Gift, ChevronRight, Calendar, MapPin,
  Star, Sparkles, Crown, Shield, Trash2
} from 'lucide-react';
import { PricingModal } from './PricingModal';
import { ChatPanel } from './ChatPanel';
import { formatCurrency } from '../utils/format';

type Tab = 'dashboard' | 'create' | 'inquiries' | 'messages';

export function CompanyDashboard() {
  const subscribe = useCallback((cb: () => void) => store.subscribe(cb), []);
  const getVersion = useCallback(() => store.getVersion(), []);
  useSyncExternalStore(subscribe, getVersion);

  const user = store.getUser();
  const myListings = store.getMyListings();
  const inquiries = store.getInquiriesForMyListings();
  const conversations = store.getConversations();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedListingDetail, setSelectedListingDetail] = useState<string | null>(null);
  const [showSpecialOfferModal, setShowSpecialOfferModal] = useState<{ viewer: ListingViewer; listing: Listing } | null>(null);
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canFeatureListings = store.canFeatureListings();
  const subscriptionTier = store.getSubscriptionTier();
  const maxListings = store.getMaxListings();

  const pendingInquiries = inquiries.filter((i) => i.status === 'pending').length;

  const [formData, setFormData] = useState({
    companyName: user?.name || '',
    industry: user?.industry || '',
    description: user?.description || '',
    askingPrice: '',
    revenue: user?.revenue || '',
    ebitda: '',
    employees: user?.employees || '',
    location: user?.companyLocation || '',
    founded: user?.founded || '',
    logo: '🏢',
    highlights: '',
    coverPhoto: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const totalViews = myListings.reduce((sum, l) => sum + l.views, 0);
  const totalInquiries = inquiries.length;
  const totalViewers = myListings.reduce((sum, l) => sum + (l.viewers?.length || 0), 0);

  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, coverPhoto: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateListing = () => {
    if (!formData.companyName || !formData.askingPrice) return;
    store.addListing({
      industry: formData.industry || 'General',
      description: formData.description,
      askingPrice: parseFloat(formData.askingPrice.replace(/,/g, '')) || 0,
      revenue: parseFloat(formData.revenue.replace(/,/g, '')) || 0,
      ebitda: parseFloat(formData.ebitda.replace(/,/g, '')) || 0,
      employees: parseInt(formData.employees) || 0,
      location: formData.location || 'United States',
      founded: parseInt(formData.founded) || new Date().getFullYear(),
      logo: formData.logo,
      highlights: formData.highlights.split(',').map((h) => h.trim()).filter(Boolean),
      coverPhoto: formData.coverPhoto || undefined,
    });
    setFormData({
      companyName: user?.name || '', industry: user?.industry || '', description: user?.description || '', askingPrice: '',
      revenue: user?.revenue || '', ebitda: '', employees: user?.employees || '', location: user?.companyLocation || '', founded: user?.founded || '', logo: '🏢', highlights: '', coverPhoto: '',
    });
    setTab('dashboard');
  };

  const handleInquiryAction = (inquiryId: string, status: 'accepted' | 'rejected') => {
    store.updateInquiry(inquiryId, { status });
  };

  const handleChatWithFirm = async (firmId: string, firmName: string, listingId?: string) => {
    const convId = await store.startConversation(firmId, firmName, 'pe_firm', listingId);
    if (convId) {
      setSelectedConversation(convId);
      setTab('messages');
    }
  };

  const handleDeleteListing = async (listing: Listing) => {
    setIsDeleting(true);
    try {
      await store.deleteListing(listing.id);
      setDeleteConfirm(null);
      setSelectedListingDetail(null);
    } catch (e) {
      console.error('Failed to delete listing:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendSpecialOffer = async (viewer: ListingViewer, listing: Listing, message: string) => {
    const convId = await store.startConversation(viewer.userId, viewer.userName, 'pe_firm', listing.id, listing.companyName);
    if (convId) {
      await store.sendMessage(convId, message);
      setShowSpecialOfferModal(null);
      setSelectedConversation(convId);
      setTab('messages');
    }
  };

  const logos = ['🏢', '🚀', '🌿', '🏥', '🍽️', '🔐', '📚', '⚡', '🎯', '💎', '🔬', '🛡️'];

  // Per-listing detail view
  const detailListing = selectedListingDetail ? myListings.find(l => l.id === selectedListingDetail) : null;
  const detailInquiries = detailListing ? inquiries.filter(i => i.listingId === detailListing.id) : [];
  const detailViewers = detailListing?.viewers || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white grain-overlay">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center shadow-lg glow-green-sm">
              <Landmark className="w-5 h-5 text-emerald-200" />
            </div>
            <span className="font-roman text-lg tracking-wider hidden sm:block">ARCHALEON</span>
          </div>

          <nav className="flex items-center gap-1 bg-neutral-900/80 rounded-xl p-1 border border-neutral-800/50">
            {([
              ['dashboard', LayoutDashboard, 'Dashboard'],
              ['create', PlusCircle, 'New Listing'],
              ['inquiries', Send, 'Inquiries'],
              ['messages', MessageSquare, 'Messages'],
            ] as [Tab, typeof LayoutDashboard, string][]).map(([t, Icon, label]) => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelectedListingDetail(null); }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-inter font-medium transition-all ${
                  tab === t ? 'bg-emerald-700 text-white shadow-lg glow-green-sm' : 'text-neutral-500 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                {t === 'inquiries' && pendingInquiries > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-800/50 text-emerald-400 text-[10px] font-bold flex items-center justify-center">{pendingInquiries}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Upgrade Button for Free Users */}
            {subscriptionTier === 'free' && (
              <button
                onClick={() => setShowPricingModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-sm font-semibold transition-all shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade
              </button>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/50 border border-neutral-800/50">
              <span className="text-lg">{user.avatar}</span>
              <span className="text-sm font-inter font-medium hidden sm:block text-neutral-300">{user.name}</span>
              {subscriptionTier === 'enterprise' && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Premium</span>
                </div>
              )}
              {subscriptionTier === 'pro' && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Pro</span>
                </div>
              )}
            </div>
            <button onClick={() => store.logout()} className="p-2 text-neutral-500 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'dashboard' && !selectedListingDetail && (
          <div className="space-y-6">
            {myListings.length === 0 && (
              <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/10 border border-emerald-800/30 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-roman text-xl text-white mb-1 tracking-wide">WELCOME, {user.name.toUpperCase()}</h2>
                    <p className="text-neutral-500 text-sm font-inter">Create your first listing to begin receiving inquiries from qualified PE firms.</p>
                  </div>
                  <button
                    onClick={() => setTab('create')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 font-roman tracking-wider text-sm flex items-center gap-2 shadow-lg glow-green-sm transition-all shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    CREATE LISTING
                  </button>
                </div>
              </div>
            )}

            {/* Upgrade Banner for Free Users */}
            {subscriptionTier === 'free' && myListings.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-900/20 to-yellow-900/10 border border-amber-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Star className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        Get Featured Listings
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">PRO</span>
                      </h3>
                      <p className="text-sm text-neutral-400">Stand out in the marketplace with featured badges and priority placement</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPricingModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2 font-inter">
                  <Building2 className="w-4 h-4" />
                  <span>Listings</span>
                </div>
                <p className="text-3xl font-bold font-inter">{myListings.length}</p>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2 font-inter">
                  <Eye className="w-4 h-4" />
                  <span>Total Views</span>
                </div>
                <p className="text-3xl font-bold font-inter">{totalViews}</p>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2 font-inter">
                  <UserCheck className="w-4 h-4" />
                  <span>Unique Viewers</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400 font-inter">{totalViewers}</p>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2 font-inter">
                  <Send className="w-4 h-4" />
                  <span>Inquiries</span>
                </div>
                <p className="text-3xl font-bold font-inter">{totalInquiries}</p>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2 font-inter">
                  <Clock className="w-4 h-4" />
                  <span>Pending</span>
                </div>
                <p className="text-3xl font-bold text-yellow-400 font-inter">{pendingInquiries}</p>
              </div>
            </div>

            {/* My Listings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-roman text-xl tracking-wide">MY LISTINGS</h2>
                <button onClick={() => setTab('create')} className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-sm font-roman tracking-wider flex items-center gap-2 transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  NEW
                </button>
              </div>

              {myListings.length === 0 ? (
                <div className="text-center py-16 bg-neutral-900/40 rounded-2xl border border-neutral-800/50 border-dashed">
                  <Building2 className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <h3 className="font-roman text-lg text-neutral-400 mb-2 tracking-wide">NO LISTINGS YET</h3>
                  <p className="text-neutral-600 text-sm mb-4 font-inter">Create your first listing to start receiving inquiries.</p>
                  <button onClick={() => setTab('create')} className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-sm font-roman tracking-wider inline-flex items-center gap-2 transition-colors">
                    <PlusCircle className="w-4 h-4" />
                    CREATE LISTING
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myListings.map((listing) => {
                    const listingInquiries = inquiries.filter(i => i.listingId === listing.id);
                    const listingPending = listingInquiries.filter(i => i.status === 'pending').length;
                    return (
                      <div
                        key={listing.id}
                        className="group bg-neutral-900/60 border border-neutral-800/50 rounded-2xl overflow-hidden hover:border-emerald-800/50 transition-all duration-300"
                      >
                        <button
                          onClick={() => setSelectedListingDetail(listing.id)}
                          className="block text-left w-full"
                        >
                          {listing.coverPhoto ? (
                            <div className="h-32 relative overflow-hidden">
                              <img src={listing.coverPhoto} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent" />
                              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                                <span className="text-2xl">{listing.logo}</span>
                                <div>
                                  <h3 className="font-roman text-white tracking-wide text-sm">{listing.companyName}</h3>
                                  <p className="text-[10px] text-emerald-400 font-inter">{listing.industry}</p>
                                </div>
                              </div>
                              <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-inter font-medium ${listing.status === 'active' ? 'bg-emerald-900/80 text-emerald-400 border border-emerald-700/50' : 'bg-yellow-900/80 text-yellow-400 border border-yellow-700/50'}`}>
                                {listing.status === 'active' ? 'Active' : 'In Review'}
                              </span>
                            </div>
                          ) : (
                            <div className="h-24 bg-gradient-to-br from-neutral-800/50 to-neutral-900 relative flex items-end p-4">
                              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(34,197,94,0.3), transparent 70%)' }} />
                              <div className="flex items-center gap-2 relative z-10">
                                <span className="text-2xl">{listing.logo}</span>
                                <div>
                                  <h3 className="font-roman text-white tracking-wide text-sm">{listing.companyName}</h3>
                                  <p className="text-[10px] text-emerald-400 font-inter">{listing.industry}</p>
                                </div>
                              </div>
                              <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-inter font-medium ${listing.status === 'active' ? 'bg-emerald-900/80 text-emerald-400 border border-emerald-700/50' : 'bg-yellow-900/80 text-yellow-400 border border-yellow-700/50'}`}>
                                {listing.status === 'active' ? 'Active' : 'In Review'}
                              </span>
                            </div>
                          )}
                        </button>

                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-lg font-bold text-emerald-400 font-inter">{formatCurrency(listing.askingPrice)}</p>
                            <div className="flex items-center gap-2">
                              {listingPending > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-yellow-900/20 text-yellow-400 text-[10px] font-inter font-medium border border-yellow-800/30">
                                  {listingPending} pending
                                </span>
                              )}
                              {canFeatureListings && (
                                <button
                                  onClick={() => store.toggleListingFeatured(listing.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-inter flex items-center gap-1 border transition-colors ${
                                    listing.featured
                                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                                      : 'bg-neutral-800/50 text-neutral-400 border-neutral-700/30 hover:bg-neutral-700/50'
                                  }`}
                                >
                                  <Star className={`w-3 h-3 ${listing.featured ? 'fill-current' : ''}`} />
                                  {listing.featured ? 'Featured' : 'Feature'}
                                </button>
                              )}
                              <button
                                onClick={() => setEditListing(listing)}
                                className="px-3 py-1.5 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300 text-xs font-inter border border-neutral-700/30"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(listing); }}
                                className="px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-inter border border-red-800/30 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-neutral-800/40 rounded-lg p-2 text-center border border-neutral-700/20">
                              <Eye className="w-3 h-3 text-emerald-500 mx-auto mb-0.5" />
                              <p className="text-sm font-bold font-inter">{listing.views}</p>
                              <p className="text-[9px] text-neutral-600 font-inter">Views</p>
                            </div>
                            <div className="bg-neutral-800/40 rounded-lg p-2 text-center border border-neutral-700/20">
                              <UserCheck className="w-3 h-3 text-emerald-500 mx-auto mb-0.5" />
                              <p className="text-sm font-bold font-inter">{listing.viewers?.length || 0}</p>
                              <p className="text-[9px] text-neutral-600 font-inter">Viewers</p>
                            </div>
                            <div className="bg-neutral-800/40 rounded-lg p-2 text-center border border-neutral-700/20">
                              <Send className="w-3 h-3 text-emerald-500 mx-auto mb-0.5" />
                              <p className="text-sm font-bold font-inter">{listing.inquiries}</p>
                              <p className="text-[9px] text-neutral-600 font-inter">Inquiries</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-neutral-600 font-inter">
                            <span>View details</span>
                            <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LISTING DETAIL DASHBOARD */}
        {tab === 'dashboard' && selectedListingDetail && detailListing && (
          <div className="space-y-6">
            <button onClick={() => setSelectedListingDetail(null)} className="text-neutral-500 hover:text-white text-sm flex items-center gap-1 transition-colors font-inter">
              <ArrowLeft className="w-4 h-4" /> Back to all listings
            </button>

            <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-2xl overflow-hidden">
              {detailListing.coverPhoto ? (
                <div className="h-48 relative overflow-hidden">
                  <img src={detailListing.coverPhoto} alt="" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-end justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center text-3xl border border-neutral-700/50 shadow-xl">{detailListing.logo}</div>
                        <div>
                          <h2 className="font-roman text-2xl text-white tracking-wide">{detailListing.companyName}</h2>
                          <p className="text-emerald-400 text-sm font-inter">{detailListing.industry} · Listed {new Date(detailListing.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setEditListing(detailListing)} className="px-4 py-2 rounded-xl bg-neutral-900/70 hover:bg-neutral-800 text-neutral-300 text-sm font-inter border border-neutral-700/50">Edit</button>
                        <button onClick={() => setDeleteConfirm(detailListing)} className="px-4 py-2 rounded-xl bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-inter border border-red-800/50 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                        <p className="text-3xl font-bold text-emerald-400 font-inter">{formatCurrency(detailListing.askingPrice)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center text-3xl border border-neutral-700/50">{detailListing.logo}</div>
                    <div>
                      <h2 className="font-roman text-2xl text-white tracking-wide">{detailListing.companyName}</h2>
                      <p className="text-emerald-400 text-sm font-inter">{detailListing.industry} · Listed {new Date(detailListing.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditListing(detailListing)} className="px-4 py-2 rounded-xl bg-neutral-900/70 hover:bg-neutral-800 text-neutral-300 text-sm font-inter border border-neutral-700/50">Edit</button>
                    <button onClick={() => setDeleteConfirm(detailListing)} className="px-4 py-2 rounded-xl bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-inter border border-red-800/50 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <p className="text-3xl font-bold text-emerald-400 font-inter">{formatCurrency(detailListing.askingPrice)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1.5 font-inter"><Eye className="w-3.5 h-3.5" /> Total Views</div>
                <p className="text-2xl font-bold font-inter">{detailListing.views}</p>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1.5 font-inter"><UserCheck className="w-3.5 h-3.5" /> Unique Viewers</div>
                <p className="text-2xl font-bold text-emerald-400 font-inter">{detailViewers.length}</p>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1.5 font-inter"><Send className="w-3.5 h-3.5" /> Inquiries</div>
                <p className="text-2xl font-bold font-inter">{detailListing.inquiries}</p>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1.5 font-inter"><TrendingUp className="w-3.5 h-3.5" /> Conversion</div>
                <p className="text-2xl font-bold font-inter">{detailListing.views > 0 ? ((detailListing.inquiries / detailListing.views) * 100).toFixed(1) : 0}%</p>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1.5 font-inter"><DollarSign className="w-3.5 h-3.5" /> Revenue</div>
                <p className="text-2xl font-bold font-inter">{formatCurrency(detailListing.revenue)}</p>
              </div>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-roman text-sm tracking-wide text-neutral-300">ENGAGEMENT OVERVIEW</h3>
                {detailListing.views > 0 && (
                  <span className="flex items-center gap-1 text-emerald-500 text-xs font-inter"><ArrowUpRight className="w-3 h-3" /> Active</span>
                )}
              </div>
              <div className="w-full h-3 rounded-full bg-neutral-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700" style={{ width: `${Math.min(100, detailListing.views > 0 ? Math.max(5, (detailListing.views / 50) * 100) : 0)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-600 mt-1.5 font-inter">
                <span>0 views</span>
                <span>{detailListing.views} views</span>
              </div>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
              <h3 className="font-roman text-sm tracking-wide text-neutral-300 mb-3">LISTING DETAILS</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-neutral-400 font-inter"><MapPin className="w-4 h-4 text-neutral-600" /> {detailListing.location}</div>
                <div className="flex items-center gap-2 text-sm text-neutral-400 font-inter"><Users className="w-4 h-4 text-neutral-600" /> {detailListing.employees} employees</div>
                <div className="flex items-center gap-2 text-sm text-neutral-400 font-inter"><Calendar className="w-4 h-4 text-neutral-600" /> Founded {detailListing.founded}</div>
                <div className="flex items-center gap-2 text-sm text-neutral-400 font-inter"><BarChart3 className="w-4 h-4 text-neutral-600" /> EBITDA {formatCurrency(detailListing.ebitda)}</div>
              </div>
              {detailListing.description && <p className="text-neutral-500 text-sm font-inter leading-relaxed">{detailListing.description}</p>}
              {detailListing.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {detailListing.highlights.map((h) => (
                    <span key={h} className="px-2.5 py-1 rounded-full bg-emerald-900/20 text-emerald-400 text-xs font-inter font-medium border border-emerald-800/30">{h}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Viewers Section */}
            <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-roman text-sm tracking-wide text-neutral-300">WHO VIEWED YOUR LISTING</h3>
                <span className="text-xs text-neutral-600 font-inter">{detailViewers.length} unique viewers</span>
              </div>
              {detailViewers.length === 0 ? (
                <div className="text-center py-10">
                  <Eye className="w-10 h-10 text-neutral-800 mx-auto mb-3" />
                  <p className="text-neutral-600 text-sm font-inter">No one has viewed this listing yet.</p>
                  <p className="text-neutral-700 text-xs font-inter mt-1">Views will be tracked as PE firms browse the marketplace.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {detailViewers.map((viewer) => (
                    <div key={viewer.userId} className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/30 border border-neutral-700/20 hover:border-neutral-700/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800/30 to-emerald-900/20 border border-emerald-800/30 flex items-center justify-center">
                          <span className="text-lg">🏛️</span>
                        </div>
                        <div>
                          <p className="text-sm font-inter font-medium text-white">{viewer.userName}</p>
                          <div className="flex items-center gap-3 text-[11px] text-neutral-600 font-inter">
                            <span>{viewer.viewCount} {viewer.viewCount === 1 ? 'view' : 'views'}</span>
                            <span>·</span>
                            <span>Last: {new Date(viewer.viewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowSpecialOfferModal({ viewer, listing: detailListing })} className="px-3 py-1.5 rounded-lg bg-emerald-800/20 hover:bg-emerald-800/40 text-emerald-400 text-xs font-inter font-medium flex items-center gap-1.5 transition-colors border border-emerald-800/30">
                          <Gift className="w-3 h-3" />
                          Special Offer
                        </button>
                        <button onClick={() => handleChatWithFirm(viewer.userId, viewer.userName, detailListing.id)} className="px-3 py-1.5 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-400 text-xs font-inter font-medium flex items-center gap-1.5 transition-colors border border-neutral-700/30">
                          <MessageSquare className="w-3 h-3" />
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Listing Inquiries */}
            <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-roman text-sm tracking-wide text-neutral-300">INQUIRIES FOR THIS LISTING</h3>
                <span className="text-xs text-neutral-600 font-inter">{detailInquiries.length} total</span>
              </div>
              {detailInquiries.length === 0 ? (
                <div className="text-center py-8">
                  <Send className="w-8 h-8 text-neutral-800 mx-auto mb-2" />
                  <p className="text-neutral-600 text-sm font-inter">No inquiries received yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detailInquiries.map((inq) => (
                    <div key={inq.id} className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏛️</span>
                          <span className="font-roman text-sm text-white tracking-wide">{inq.fromUserName}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-inter font-medium ${
                          inq.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/30' :
                          inq.status === 'accepted' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/30' :
                          'bg-red-900/20 text-red-400 border border-red-800/30'
                        }`}>
                          {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                        </span>
                      </div>
                      {inq.offerPrice && <p className="text-emerald-400 font-bold text-sm mb-1 font-inter">Offer: {formatCurrency(inq.offerPrice)}</p>}
                      <p className="text-neutral-500 text-sm font-inter mb-3">{inq.message}</p>
                      <div className="flex flex-wrap gap-2">
                        {inq.status === 'pending' && (
                          <>
                            <button onClick={() => handleInquiryAction(inq.id, 'accepted')} className="px-3 py-1.5 rounded-lg bg-emerald-800/20 hover:bg-emerald-800/40 text-emerald-400 text-xs font-inter font-medium flex items-center gap-1 transition-colors border border-emerald-800/30">
                              <CheckCircle className="w-3 h-3" /> Accept
                            </button>
                            <button onClick={() => handleInquiryAction(inq.id, 'rejected')} className="px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-inter font-medium flex items-center gap-1 transition-colors border border-red-800/30">
                              <XCircle className="w-3 h-3" /> Decline
                            </button>
                          </>
                        )}
                        <button onClick={() => handleChatWithFirm(inq.fromUserId, inq.fromUserName, inq.listingId)} className="px-3 py-1.5 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-400 text-xs font-inter font-medium flex items-center gap-1 transition-colors border border-neutral-700/30">
                          <MessageSquare className="w-3 h-3" /> Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="font-roman text-2xl tracking-wide mb-2">NEW LISTING</h2>
            <p className="text-neutral-500 text-sm mb-4 font-inter">Complete the details below to list your company. It will appear in the marketplace immediately.</p>
            
            {/* Listing limit info */}
            {myListings.length >= maxListings && subscriptionTier === 'free' && (
              <div className="mb-6 p-4 rounded-xl bg-amber-900/20 border border-amber-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-amber-400 font-medium text-sm">Listing Limit Reached</p>
                      <p className="text-neutral-400 text-xs">Free accounts can have {maxListings} active listing. Upgrade to list more companies.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPricingModal(true)} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors">
                    Upgrade
                  </button>
                </div>
              </div>
            )}
            
            {myListings.length < maxListings && (
              <p className="text-neutral-600 text-xs mb-6 font-inter">
                {subscriptionTier === 'enterprise' ? 'Unlimited listings' : `${myListings.length}/${maxListings} listings used`}
              </p>
            )}
            <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-2xl p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Cover Photo <span className="text-neutral-600">(shown on listing card)</span></label>
                {formData.coverPhoto ? (
                  <div className="relative h-40 rounded-xl overflow-hidden border border-neutral-700/50 group">
                    <img src={formData.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-neutral-900/80 text-white text-sm font-inter flex items-center gap-2 hover:bg-neutral-800">
                        <Image className="w-4 h-4" /> Change
                      </button>
                      <button onClick={() => setFormData({ ...formData, coverPhoto: '' })} className="px-4 py-2 rounded-lg bg-red-900/80 text-red-300 text-sm font-inter flex items-center gap-2 hover:bg-red-800">
                        <X className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full h-32 rounded-xl border-2 border-dashed border-neutral-700/50 bg-neutral-900/30 hover:border-emerald-800/50 hover:bg-neutral-900/60 transition-all flex flex-col items-center justify-center gap-2 group">
                    <Image className="w-8 h-8 text-neutral-700 group-hover:text-emerald-600 transition-colors" />
                    <span className="text-neutral-600 text-sm font-inter group-hover:text-neutral-400">Click to upload a cover photo</span>
                    <span className="text-neutral-700 text-xs font-inter">JPG, PNG, WebP</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverPhotoUpload} className="hidden" />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Choose an Icon</label>
                <div className="flex flex-wrap gap-2">
                  {logos.map((logo) => (
                    <button key={logo} onClick={() => setFormData({ ...formData, logo })} className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${formData.logo === logo ? 'bg-emerald-700 ring-2 ring-emerald-500 scale-110' : 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/50'}`}>
                      {logo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Company Name *</label>
                  <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="Your company name" className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Industry *</label>
                  <input type="text" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} placeholder="e.g. SaaS / Technology" className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Describe your company, what makes it unique..." className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none font-inter" />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Asking Price ($) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input type="text" value={formData.askingPrice} onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })} placeholder="10,000,000" className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Annual Revenue ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input type="text" value={formData.revenue} onChange={(e) => setFormData({ ...formData, revenue: e.target.value })} placeholder="5,000,000" className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">EBITDA ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input type="text" value={formData.ebitda} onChange={(e) => setFormData({ ...formData, ebitda: e.target.value })} placeholder="1,500,000" className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Employees</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input type="number" value={formData.employees} onChange={(e) => setFormData({ ...formData, employees: e.target.value })} placeholder="50" className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="San Francisco, CA" className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Year Founded</label>
                  <input type="number" value={formData.founded} onChange={(e) => setFormData({ ...formData, founded: e.target.value })} placeholder="2020" className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Key Highlights <span className="text-neutral-600">(comma separated)</span></label>
                <input type="text" value={formData.highlights} onChange={(e) => setFormData({ ...formData, highlights: e.target.value })} placeholder="Recurring revenue, Strong IP, Market leader" className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
              </div>

              <button
                onClick={handleCreateListing}
                disabled={!formData.companyName.trim() || !formData.askingPrice.trim()}
                className={`w-full py-3.5 rounded-xl font-roman tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
                  formData.companyName.trim() && formData.askingPrice.trim()
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 shadow-lg glow-green-sm text-white'
                    : 'bg-neutral-800 cursor-not-allowed opacity-50 text-neutral-500'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                PUBLISH LISTING
              </button>
            </div>
          </div>
        )}

        {tab === 'inquiries' && (
          <div className="space-y-4">
            <h2 className="font-roman text-xl tracking-wide mb-4">RECEIVED INQUIRIES</h2>
            {inquiries.length === 0 ? (
              <div className="text-center py-20">
                <Send className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                <h3 className="font-roman text-lg text-neutral-400 mb-2 tracking-wide">NO INQUIRIES YET</h3>
                <p className="text-neutral-600 text-sm font-inter">
                  {myListings.length === 0
                    ? 'Create a listing first, then PE firms can send you inquiries and offers.'
                    : 'When PE firms send inquiries about your listings, they will appear here.'}
                </p>
                {myListings.length === 0 && (
                  <button onClick={() => setTab('create')} className="mt-4 px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-sm font-roman tracking-wider inline-flex items-center gap-2 transition-colors">
                    <PlusCircle className="w-4 h-4" />
                    CREATE LISTING
                  </button>
                )}
              </div>
            ) : (
              inquiries.map((inq) => {
                const listing = store.getListing(inq.listingId);
                return (
                  <div key={inq.id} className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🏛️</span>
                          <h3 className="font-roman text-white tracking-wide">{inq.fromUserName}</h3>
                        </div>
                        <p className="text-xs text-emerald-500 font-inter">Inquiry for: {listing?.companyName}</p>
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
                      <div className="bg-emerald-900/15 border border-emerald-800/30 rounded-lg px-4 py-2 mb-3 inline-flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-400 font-bold font-inter">{formatCurrency(inq.offerPrice)}</span>
                        <span className="text-neutral-500 text-sm font-inter">offered</span>
                      </div>
                    )}
                    <p className="text-neutral-500 text-sm mb-4 font-inter">{inq.message}</p>
                    <div className="flex flex-wrap gap-2">
                      {inq.status === 'pending' && (
                        <>
                          <button onClick={() => handleInquiryAction(inq.id, 'accepted')} className="px-4 py-2 rounded-lg bg-emerald-800/20 hover:bg-emerald-800/40 text-emerald-400 text-sm font-inter font-medium flex items-center gap-1.5 transition-colors border border-emerald-800/30">
                            <CheckCircle className="w-4 h-4" /> Accept
                          </button>
                          <button onClick={() => handleInquiryAction(inq.id, 'rejected')} className="px-4 py-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 text-sm font-inter font-medium flex items-center gap-1.5 transition-colors border border-red-800/30">
                            <XCircle className="w-4 h-4" /> Decline
                          </button>
                        </>
                      )}
                      <button onClick={() => handleChatWithFirm(inq.fromUserId, inq.fromUserName, inq.listingId)} className="px-4 py-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-400 text-sm font-inter font-medium flex items-center gap-1.5 transition-colors border border-neutral-700/30">
                        <MessageSquare className="w-4 h-4" /> Chat
                      </button>
                    </div>
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

      {/* Special Offer Modal */}
      {showSpecialOfferModal && (
        <SpecialOfferModal
          viewer={showSpecialOfferModal.viewer}
          listing={showSpecialOfferModal.listing}
          onClose={() => setShowSpecialOfferModal(null)}
          onSend={handleSendSpecialOffer}
        />
      )}

      {/* Edit Listing Modal */}
      {editListing && (
        <EditListingModal
          listing={editListing}
          onClose={() => setEditListing(null)}
          onSave={(id, updates) => {
            store.updateListing(id, updates);
            setEditListing(null);
          }}
        />
      )}

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        userRole="company"
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-neutral-900 rounded-2xl max-w-md w-full border border-neutral-800 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-roman text-lg text-white tracking-wide">DELETE LISTING</h3>
                <p className="text-sm text-neutral-500 font-inter">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-neutral-800/50 rounded-xl p-4 mb-4 border border-neutral-700/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{deleteConfirm.logo}</span>
                <div>
                  <p className="font-medium text-white font-inter">{deleteConfirm.companyName}</p>
                  <p className="text-sm text-neutral-500 font-inter">{deleteConfirm.industry} · {formatCurrency(deleteConfirm.askingPrice)}</p>
                </div>
              </div>
            </div>

            <p className="text-neutral-400 text-sm font-inter mb-6">
              Are you sure you want to delete this listing? All associated inquiries and viewer data will also be removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteListing(deleteConfirm)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed font-roman tracking-wider text-sm flex items-center justify-center gap-2 transition-colors text-white"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    DELETING...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    DELETE LISTING
                  </>
                )}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 font-roman tracking-wider text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditListingModal({ listing, onClose, onSave }: {
  listing: Listing;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Omit<Listing, 'id' | 'companyId' | 'views' | 'inquiries' | 'status' | 'createdAt' | 'viewers'>>) => void;
}) {
  const [companyName, setCompanyName] = useState(listing.companyName);
  const [industry, setIndustry] = useState(listing.industry);
  const [description, setDescription] = useState(listing.description);
  const [askingPrice, setAskingPrice] = useState(String(listing.askingPrice));
  const [revenue, setRevenue] = useState(String(listing.revenue));
  const [ebitda, setEbitda] = useState(String(listing.ebitda));
  const [employees, setEmployees] = useState(String(listing.employees));
  const [location, setLocation] = useState(listing.location);
  const [founded, setFounded] = useState(String(listing.founded));
  const [logo, setLogo] = useState(listing.logo);
  const [highlights, setHighlights] = useState(listing.highlights.join(', '));
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(listing.coverPhoto);

  const fileRef = useRef<HTMLInputElement>(null);
  const logos = ['🏢', '🚀', '🌿', '🏥', '🍽️', '🔐', '📚', '⚡', '🎯', '💎', '🔬', '🛡️'];

  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCoverPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave(listing.id, {
      companyName,
      industry,
      description,
      askingPrice: parseFloat(askingPrice.replace(/,/g, '')) || 0,
      revenue: parseFloat(revenue.replace(/,/g, '')) || 0,
      ebitda: parseFloat(ebitda.replace(/,/g, '')) || 0,
      employees: parseInt(employees) || 0,
      location,
      founded: parseInt(founded) || listing.founded,
      logo,
      highlights: highlights.split(',').map(h => h.trim()).filter(Boolean),
      coverPhoto,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full border border-neutral-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="font-roman text-lg text-white tracking-wide">EDIT LISTING</h3>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Cover Photo</label>
            {coverPhoto ? (
              <div className="relative h-40 rounded-xl overflow-hidden border border-neutral-700/50 group">
                <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-lg bg-neutral-900/80 text-white text-sm font-inter flex items-center gap-2 hover:bg-neutral-800">
                    <Image className="w-4 h-4" /> Change
                  </button>
                  <button onClick={() => setCoverPhoto(undefined)} className="px-4 py-2 rounded-lg bg-red-900/80 text-red-300 text-sm font-inter flex items-center gap-2 hover:bg-red-800">
                    <X className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="w-full h-32 rounded-xl border-2 border-dashed border-neutral-700/50 bg-neutral-900/30 hover:border-emerald-800/50 hover:bg-neutral-900/60 transition-all flex flex-col items-center justify-center gap-2 group">
                <Image className="w-8 h-8 text-neutral-700 group-hover:text-emerald-600 transition-colors" />
                <span className="text-neutral-600 text-sm font-inter group-hover:text-neutral-400">Click to upload a cover photo</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleCoverPhotoUpload} className="hidden" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Company Name *</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Industry *</label>
              <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS / Technology" className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe your company, what makes it unique..." className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none font-inter" />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Asking Price ($) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input type="text" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} placeholder="10,000,000" className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Annual Revenue ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input type="text" value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="5,000,000" className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">EBITDA ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input type="text" value={ebitda} onChange={(e) => setEbitda(e.target.value)} placeholder="1,500,000" className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Employees</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input type="number" value={employees} onChange={(e) => setEmployees(e.target.value)} placeholder="50" className="w-full pl-9 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="San Francisco, CA" className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Year Founded</label>
              <input type="number" value={founded} onChange={(e) => setFounded(e.target.value)} placeholder="2020" className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Key Highlights <span className="text-neutral-600">(comma separated)</span></label>
            <input type="text" value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder="Recurring revenue, Strong IP, Market leader" className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-inter" />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Choose an Icon</label>
            <div className="flex flex-wrap gap-2">
              {logos.map((l) => (
                <button key={l} onClick={() => setLogo(l)} className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${logo === l ? 'bg-emerald-700 ring-2 ring-emerald-500 scale-110' : 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/50'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 font-roman tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg glow-green-sm transition-all">
              <CheckCircle className="w-4 h-4" /> SAVE CHANGES
            </button>
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 font-roman tracking-wider text-sm flex items-center justify-center gap-2 transition-all">
              <X className="w-4 h-4" /> CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecialOfferModal({ viewer, listing, onClose, onSend }: {
  viewer: ListingViewer;
  listing: Listing;
  onClose: () => void;
  onSend: (viewer: ListingViewer, listing: Listing, message: string) => void;
}) {
  const [offerType, setOfferType] = useState<'discount' | 'exclusive' | 'custom'>('discount');
  const [customMessage, setCustomMessage] = useState('');
  const [discountPercent, setDiscountPercent] = useState('5');

  const getDefaultMessage = () => {
    switch (offerType) {
      case 'discount':
        return `Hello ${viewer.userName},\n\nThank you for your interest in ${listing.companyName}. We noticed you've been reviewing our listing and would like to extend a special offer.\n\nWe're prepared to offer a ${discountPercent}% discount off the asking price of ${formatCurrency(listing.askingPrice)}, bringing it to ${formatCurrency(listing.askingPrice * (1 - parseInt(discountPercent) / 100))}.\n\nThis is an exclusive offer for you. Let us know if you'd like to discuss further.`;
      case 'exclusive':
        return `Hello ${viewer.userName},\n\nWe noticed your interest in ${listing.companyName} and wanted to reach out directly. We believe your firm could be an exceptional fit for this acquisition.\n\nWe'd like to offer you exclusive first-look access and priority in our negotiation process. Would you be available for a confidential discussion?\n\nLooking forward to connecting.`;
      case 'custom':
        return customMessage;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-neutral-900 rounded-2xl max-w-lg w-full border border-neutral-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-roman text-lg text-white tracking-wide">SPECIAL OFFER</h3>
            <p className="text-sm text-neutral-500 font-inter">To {viewer.userName} · Re: {listing.companyName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/30 border border-neutral-700/20">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800/30 to-emerald-900/20 border border-emerald-800/30 flex items-center justify-center">
              <span className="text-lg">🏛️</span>
            </div>
            <div>
              <p className="text-sm font-inter font-medium text-white">{viewer.userName}</p>
              <p className="text-xs text-neutral-600 font-inter">Viewed {viewer.viewCount} times · Last viewed {new Date(viewer.viewedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Offer Type</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'discount' as const, label: 'Price Discount', icon: DollarSign },
                { key: 'exclusive' as const, label: 'Exclusive Access', icon: Gift },
                { key: 'custom' as const, label: 'Custom', icon: MessageSquare },
              ]).map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setOfferType(key)} className={`p-3 rounded-xl border text-xs font-inter font-medium flex flex-col items-center gap-2 transition-all ${offerType === key ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-400 ring-1 ring-emerald-600/30' : 'border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:border-neutral-700'}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {offerType === 'discount' && (
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">Discount Percentage</label>
              <div className="flex items-center gap-3">
                <input type="number" min="1" max="50" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="w-24 px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white text-center font-inter focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                <span className="text-neutral-500 font-inter">%</span>
                <div className="flex-1 text-right">
                  <p className="text-xs text-neutral-600 font-inter">New price</p>
                  <p className="text-emerald-400 font-bold font-inter">{formatCurrency(listing.askingPrice * (1 - parseInt(discountPercent || '0') / 100))}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2 font-inter">
              {offerType === 'custom' ? 'Your Message' : 'Message Preview'}
            </label>
            {offerType === 'custom' ? (
              <textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={6} placeholder="Write your custom message..." className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none font-inter text-sm" />
            ) : (
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-700/50 text-neutral-300 text-sm font-inter whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                {getDefaultMessage()}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const msg = offerType === 'custom' ? customMessage : getDefaultMessage();
              if (msg.trim()) onSend(viewer, listing, msg);
            }}
            disabled={offerType === 'custom' && !customMessage.trim()}
            className={`w-full py-3 rounded-xl font-roman tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
              (offerType !== 'custom' || customMessage.trim())
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 shadow-lg glow-green-sm text-white'
                : 'bg-neutral-800 cursor-not-allowed opacity-50 text-neutral-500'
            }`}
          >
            <Send className="w-4 h-4" />
            SEND SPECIAL OFFER
          </button>
        </div>
      </div>
    </div>
  );
}
