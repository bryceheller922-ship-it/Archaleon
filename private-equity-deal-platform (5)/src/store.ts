import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  orderBy,
  query
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserProfile, Listing, Inquiry, ChatConversation, ChatMessage, ListingViewer } from './types';

// Single localStorage key for everything
const STORAGE_KEY = 'archaleon_data_v2';

interface AppData {
  user: UserProfile | null;
  usersDb: UserProfile[];
  listings: Listing[];
  inquiries: Inquiry[];
  conversations: ChatConversation[];
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      console.log('[Storage] Loaded:', { listings: data.listings?.length || 0 });
      return data;
    }
  } catch (e) {
    console.error('[Storage] Load error:', e);
  }
  return { user: null, usersDb: [], listings: [], inquiries: [], conversations: [] };
}

function saveData(data: Partial<AppData>) {
  try {
    const current = loadData();
    const merged = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    console.log('[Storage] Saved:', { listings: merged.listings?.length || 0 });
  } catch (e) {
    console.error('[Storage] Save error:', e);
  }
}

// Subscription tier limits
const TIER_LIMITS = {
  free: { maxListings: 1, canFeature: false },
  pro: { maxListings: 5, canFeature: true },
  enterprise: { maxListings: 999, canFeature: true },
};

class Store {
  currentUser: UserProfile | null = null;
  listings: Listing[] = [];
  inquiries: Inquiry[] = [];
  conversations: ChatConversation[] = [];
  
  private _listeners: Set<() => void> = new Set();
  private _version = 0;
  private _ready = false;

  constructor() {
    console.log('[Store] Initializing...');
    
    // Load everything from localStorage
    const data = loadData();
    this.currentUser = data.user;
    this.listings = data.listings || [];
    this.inquiries = data.inquiries || [];
    this.conversations = data.conversations || [];
    
    console.log('[Store] Initial data:', {
      user: this.currentUser?.email,
      listings: this.listings.length,
      inquiries: this.inquiries.length,
    });
    
    // Also try to load from Firestore in background
    this._loadFromFirestore();
    
    // Set up Firebase auth listener
    onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] State changed:', firebaseUser?.email || 'signed out');
      
      if (firebaseUser && !this.currentUser) {
        // User is signed in via Firebase but not locally - try to restore
        await this._restoreUser(firebaseUser.uid, firebaseUser.email || '');
      } else if (!firebaseUser && this.currentUser) {
        // User signed out
        this.currentUser = null;
        saveData({ user: null });
      }
      
      this._ready = true;
      this.notify();
    });
  }

  private async _loadFromFirestore() {
    try {
      console.log('[Firestore] Loading listings...');
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const firestoreListings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
        console.log('[Firestore] Found', firestoreListings.length, 'listings');
        
        // Merge with local listings (dedupe by id)
        const mergedMap = new Map<string, Listing>();
        this.listings.forEach(l => mergedMap.set(l.id, l));
        firestoreListings.forEach(l => mergedMap.set(l.id, l));
        
        this.listings = Array.from(mergedMap.values()).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        saveData({ listings: this.listings });
        this.notify();
      }
    } catch (error) {
      console.warn('[Firestore] Could not load:', error);
    }
  }

  private async _restoreUser(uid: string, email: string) {
    // Try Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        this.currentUser = userDoc.data() as UserProfile;
        saveData({ user: this.currentUser });
        console.log('[Auth] Restored from Firestore');
        return;
      }
    } catch (e) {
      console.warn('[Firestore] Could not restore user:', e);
    }
    
    // Try local users DB
    const data = loadData();
    const localUser = data.usersDb.find(u => u.email === email);
    if (localUser) {
      this.currentUser = localUser;
      saveData({ user: this.currentUser });
      console.log('[Auth] Restored from local DB');
    }
  }

  // Subscription methods
  subscribe(listener: () => void) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  notify() {
    this._version++;
    this._listeners.forEach(l => l());
  }

  getVersion() { return this._version; }
  isReady() { return this._ready; }
  getUser() { return this.currentUser; }
  
  getListings() { 
    // Always reload from storage to ensure fresh data
    const data = loadData();
    this.listings = data.listings || [];
    return this.listings; 
  }
  
  getMyListings() {
    if (!this.currentUser) return [];
    const data = loadData();
    return (data.listings || []).filter(l => l.companyId === this.currentUser!.uid);
  }

  getSortedListings() {
    // Reload from storage
    const data = loadData();
    this.listings = data.listings || [];
    
    console.log('[Store] getSortedListings:', this.listings.length, 'listings');
    
    return [...this.listings].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  getListing(id: string) { return this.listings.find(l => l.id === id); }
  getConversation(id: string) { return this.conversations.find(c => c.id === id); }
  getInquiries() { return this.inquiries; }
  
  getInquiriesForMyListings() {
    if (!this.currentUser) return [];
    const myListingIds = this.getMyListings().map(l => l.id);
    return this.inquiries.filter(i => myListingIds.includes(i.listingId));
  }

  getMyInquiries() {
    if (!this.currentUser) return [];
    return this.inquiries.filter(i => i.fromUserId === this.currentUser!.uid);
  }

  getConversations() { return this.conversations; }

  // Subscription tier methods
  getSubscriptionTier(): 'free' | 'pro' | 'enterprise' {
    return this.currentUser?.subscription?.tier || 'free';
  }

  getMaxListings(): number {
    return TIER_LIMITS[this.getSubscriptionTier()].maxListings;
  }

  canCreateListing(): { allowed: boolean; reason?: string } {
    if (!this.currentUser) return { allowed: false, reason: 'Not signed in' };
    if (this.currentUser.role !== 'company') return { allowed: false, reason: 'Only companies can create listings' };
    
    const myListings = this.getMyListings();
    const maxAllowed = this.getMaxListings();
    
    if (myListings.length >= maxAllowed) {
      const tier = this.getSubscriptionTier();
      if (tier === 'free') {
        return { allowed: false, reason: 'Free accounts can only create 1 listing. Upgrade to Pro for up to 5 listings.' };
      } else if (tier === 'pro') {
        return { allowed: false, reason: 'Pro accounts can create up to 5 listings. Upgrade to Enterprise for unlimited.' };
      }
      return { allowed: false, reason: 'Listing limit reached.' };
    }
    
    return { allowed: true };
  }

  canFeatureListings(): boolean {
    return TIER_LIMITS[this.getSubscriptionTier()].canFeature;
  }

  isVerifiedFirm(): boolean {
    if (this.currentUser?.role !== 'pe_firm') return false;
    const tier = this.getSubscriptionTier();
    return tier === 'pro' || tier === 'enterprise';
  }

  // Auth methods
  async signUp(email: string, password: string, role: 'pe_firm' | 'company', name: string, data?: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Auth] Signing up:', email, role);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      const profile: UserProfile = {
        uid: cred.user.uid,
        email,
        name,
        role,
        avatar: role === 'pe_firm' ? '🏛️' : '🏢',
        createdAt: new Date().toISOString(),
        subscription: { tier: 'free', planId: '', status: 'active', currentPeriodEnd: '' },
        ...data,
      };
      
      // Save to local storage
      this.currentUser = profile;
      const appData = loadData();
      appData.user = profile;
      appData.usersDb.push(profile);
      saveData(appData);
      
      // Try to save to Firestore
      try {
        await setDoc(doc(db, 'users', cred.user.uid), profile);
        console.log('[Firestore] User saved');
      } catch (firestoreError) {
        console.warn('[Firestore] Could not save user:', firestoreError);
      }
      
      this.notify();
      return { success: true };
    } catch (error: unknown) {
      console.error('[Auth] Sign up error:', error);
      const firebaseError = error as { code?: string };
      let message = 'Failed to create account';
      if (firebaseError.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists';
      } else if (firebaseError.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters';
      } else if (firebaseError.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      return { success: false, error: message };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Auth] Signing in:', email);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // Try Firestore first
      let profile: UserProfile | null = null;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        if (userDoc.exists()) {
          profile = userDoc.data() as UserProfile;
          console.log('[Auth] Profile from Firestore');
        }
      } catch (e) {
        console.warn('[Firestore] Error:', e);
      }
      
      // Fall back to localStorage
      if (!profile) {
        const appData = loadData();
        profile = appData.usersDb.find(u => u.email === email) || null;
        if (profile) {
          console.log('[Auth] Profile from local DB');
        }
      }
      
      // Create minimal profile if none exists
      if (!profile) {
        profile = {
          uid: cred.user.uid,
          email,
          name: email.split('@')[0],
          role: 'company',
          avatar: '🏢',
          createdAt: new Date().toISOString(),
          subscription: { tier: 'free', planId: '', status: 'active', currentPeriodEnd: '' },
        };
        console.log('[Auth] Created new profile');
      }
      
      this.currentUser = profile;
      saveData({ user: profile });
      
      // Reload listings to make sure we have latest
      await this._loadFromFirestore();
      
      this.notify();
      return { success: true };
    } catch (error: unknown) {
      console.error('[Auth] Sign in error:', error);
      const firebaseError = error as { code?: string };
      let message = 'Invalid email or password';
      if (firebaseError.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      } else if (firebaseError.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (firebaseError.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      }
      return { success: false, error: message };
    }
  }

  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
      saveData({ user: null });
      this.notify();
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to send reset email' };
    }
  }

  // Listing methods
  async addListing(data: Omit<Listing, 'id' | 'companyId' | 'companyName' | 'views' | 'viewers' | 'inquiries' | 'status' | 'createdAt'>): Promise<{ success: boolean; error?: string; id?: string }> {
    if (!this.currentUser) return { success: false, error: 'Not signed in' };
    
    const canCreate = this.canCreateListing();
    if (!canCreate.allowed) {
      return { success: false, error: canCreate.reason };
    }
    
    const id = 'listing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const listing: Listing = {
      id,
      ...data,
      companyId: this.currentUser.uid,
      companyName: this.currentUser.name,
      views: 0,
      viewers: [],
      inquiries: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    
    console.log('[Store] Creating listing:', listing.companyName);
    
    // Save to localStorage immediately
    const appData = loadData();
    appData.listings.unshift(listing);
    saveData({ listings: appData.listings });
    
    // Update local state
    this.listings = appData.listings;
    this.notify();
    
    // Try to save to Firestore
    try {
      await setDoc(doc(db, 'listings', id), listing);
      console.log('[Firestore] Listing saved:', id);
    } catch (error) {
      console.warn('[Firestore] Could not save listing:', error);
    }
    
    return { success: true, id };
  }

  async updateListing(id: string, updates: Partial<Listing>): Promise<{ success: boolean; error?: string }> {
    const appData = loadData();
    const idx = appData.listings.findIndex(l => l.id === id);
    if (idx === -1) return { success: false, error: 'Listing not found' };
    
    appData.listings[idx] = { ...appData.listings[idx], ...updates };
    saveData({ listings: appData.listings });
    this.listings = appData.listings;
    this.notify();
    
    try {
      await updateDoc(doc(db, 'listings', id), updates);
    } catch (error) {
      console.warn('[Firestore] Could not update listing:', error);
    }
    
    return { success: true };
  }

  async toggleListingFeatured(id: string): Promise<{ success: boolean; error?: string }> {
    const listing = this.listings.find(l => l.id === id);
    if (!listing) return { success: false, error: 'Listing not found' };
    
    if (!this.canFeatureListings()) {
      return { success: false, error: 'Upgrade to Pro or Enterprise to feature listings' };
    }
    
    return this.updateListing(id, { featured: !listing.featured });
  }

  async deleteListing(id: string): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) return { success: false, error: 'Not signed in' };
    
    const appData = loadData();
    const listing = appData.listings.find(l => l.id === id);
    if (!listing) return { success: false, error: 'Listing not found' };
    if (listing.companyId !== this.currentUser.uid) return { success: false, error: 'Not authorized' };
    
    appData.listings = appData.listings.filter(l => l.id !== id);
    appData.inquiries = appData.inquiries.filter(i => i.listingId !== id);
    saveData({ listings: appData.listings, inquiries: appData.inquiries });
    
    this.listings = appData.listings;
    this.inquiries = appData.inquiries;
    this.notify();
    
    try {
      await deleteDoc(doc(db, 'listings', id));
    } catch (error) {
      console.warn('[Firestore] Could not delete listing:', error);
    }
    
    return { success: true };
  }

  async trackView(listingId: string): Promise<void> {
    if (!this.currentUser) return;
    
    const appData = loadData();
    const idx = appData.listings.findIndex(l => l.id === listingId);
    if (idx === -1 || appData.listings[idx].companyId === this.currentUser.uid) return;
    
    const listing = appData.listings[idx];
    const viewers = listing.viewers || [];
    const viewerIdx = viewers.findIndex(v => v.userId === this.currentUser!.uid);
    
    if (viewerIdx >= 0) {
      viewers[viewerIdx].viewCount++;
      viewers[viewerIdx].viewedAt = new Date().toISOString();
    } else {
      const newViewer: ListingViewer = {
        userId: this.currentUser.uid,
        userName: this.currentUser.name,
        userRole: this.currentUser.role,
        viewedAt: new Date().toISOString(),
        viewCount: 1,
      };
      viewers.push(newViewer);
    }
    
    listing.viewers = viewers;
    listing.views = (listing.views || 0) + 1;
    appData.listings[idx] = listing;
    
    saveData({ listings: appData.listings });
    this.listings = appData.listings;
    this.notify();
    
    try {
      await updateDoc(doc(db, 'listings', listingId), {
        views: listing.views,
        viewers: listing.viewers,
      });
    } catch (error) {
      console.warn('[Firestore] Could not track view:', error);
    }
  }

  // Inquiry methods
  async addInquiry(listingId: string, message: string, offerPrice?: number): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) return { success: false, error: 'Not signed in' };
    
    const appData = loadData();
    const listing = appData.listings.find(l => l.id === listingId);
    if (!listing) return { success: false, error: 'Listing not found' };
    
    const id = 'inquiry_' + Date.now();
    
    const inquiry: Inquiry = {
      id,
      listingId,
      fromUserId: this.currentUser.uid,
      fromUserName: this.currentUser.name,
      message,
      offerPrice,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    appData.inquiries.unshift(inquiry);
    
    // Update listing inquiry count
    const listingIdx = appData.listings.findIndex(l => l.id === listingId);
    if (listingIdx >= 0) {
      appData.listings[listingIdx].inquiries = (appData.listings[listingIdx].inquiries || 0) + 1;
    }
    
    saveData({ inquiries: appData.inquiries, listings: appData.listings });
    this.inquiries = appData.inquiries;
    this.listings = appData.listings;
    this.notify();
    
    try {
      await addDoc(collection(db, 'inquiries'), inquiry);
      await updateDoc(doc(db, 'listings', listingId), { inquiries: listing.inquiries + 1 });
    } catch (error) {
      console.warn('[Firestore] Could not save inquiry:', error);
    }
    
    return { success: true };
  }

  async updateInquiry(id: string, updates: Partial<Inquiry>): Promise<{ success: boolean; error?: string }> {
    const appData = loadData();
    const idx = appData.inquiries.findIndex(i => i.id === id);
    if (idx === -1) return { success: false, error: 'Inquiry not found' };
    
    appData.inquiries[idx] = { ...appData.inquiries[idx], ...updates };
    saveData({ inquiries: appData.inquiries });
    this.inquiries = appData.inquiries;
    this.notify();
    
    try {
      await updateDoc(doc(db, 'inquiries', id), updates);
    } catch (error) {
      console.warn('[Firestore] Could not update inquiry:', error);
    }
    
    return { success: true };
  }

  // Conversation methods
  async startConversation(otherUserId: string, otherUserName: string, otherUserRole: 'pe_firm' | 'company', listingId?: string, listingName?: string): Promise<string | null> {
    if (!this.currentUser) return null;
    
    const appData = loadData();
    const existing = appData.conversations.find(c => 
      c.participants.some(p => p.id === otherUserId) &&
      (!listingId || c.listingId === listingId)
    );
    if (existing) return existing.id;
    
    const id = 'conv_' + Date.now();
    
    const conversation: ChatConversation = {
      id,
      participants: [
        { id: this.currentUser.uid, name: this.currentUser.name, role: this.currentUser.role },
        { id: otherUserId, name: otherUserName, role: otherUserRole },
      ],
      listingId,
      listingName,
      messages: [],
      unread: 0,
      lastMessageTime: new Date().toISOString(),
    };
    
    appData.conversations.unshift(conversation);
    saveData({ conversations: appData.conversations });
    this.conversations = appData.conversations;
    this.notify();
    
    try {
      await setDoc(doc(db, 'conversations', id), conversation);
    } catch (error) {
      console.warn('[Firestore] Could not save conversation:', error);
    }
    
    return id;
  }

  async sendMessage(conversationId: string, text: string): Promise<void> {
    if (!this.currentUser) return;
    
    const appData = loadData();
    const idx = appData.conversations.findIndex(c => c.id === conversationId);
    if (idx === -1) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: this.currentUser.uid,
      senderName: this.currentUser.name,
      content: text,
      timestamp: new Date().toISOString(),
    };
    
    appData.conversations[idx].messages.push(message);
    appData.conversations[idx].lastMessage = text;
    appData.conversations[idx].lastMessageTime = new Date().toISOString();
    
    saveData({ conversations: appData.conversations });
    this.conversations = appData.conversations;
    this.notify();
    
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        messages: appData.conversations[idx].messages,
        lastMessage: text,
        lastMessageTime: appData.conversations[idx].lastMessageTime,
      });
    } catch (error) {
      console.warn('[Firestore] Could not send message:', error);
    }
  }

  // Subscription methods
  async updateSubscription(tier: 'free' | 'pro' | 'enterprise', planId?: string): Promise<void> {
    if (!this.currentUser) return;
    
    const subscription = { 
      tier, 
      planId: planId || '', 
      status: 'active' as const,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    this.currentUser.subscription = subscription;
    
    const appData = loadData();
    appData.user = this.currentUser;
    const userIdx = appData.usersDb.findIndex(u => u.uid === this.currentUser!.uid);
    if (userIdx >= 0) {
      appData.usersDb[userIdx].subscription = subscription;
    }
    saveData(appData);
    
    this.notify();
    
    try {
      await updateDoc(doc(db, 'users', this.currentUser.uid), { subscription });
    } catch (error) {
      console.warn('[Firestore] Could not update subscription:', error);
    }
  }

  async refreshListings(): Promise<void> {
    console.log('[Store] Refreshing listings...');
    const appData = loadData();
    this.listings = appData.listings;
    
    // Also try Firestore
    await this._loadFromFirestore();
    
    this.notify();
  }
}

export const store = new Store();
