export type UserRole = 'pe_firm' | 'company';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface Subscription {
  tier: SubscriptionTier;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodEnd: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  phone?: string;
  contactMethod?: 'email' | 'phone';
  description?: string;
  createdAt: string;
  subscription?: Subscription;
  // PE Firm fields
  aum?: string;
  investmentFocus?: string[];
  dealSizeMin?: string;
  dealSizeMax?: string;
  yearsExperience?: string;
  portfolioSize?: string;
  website?: string;
  location?: string;
  // Company fields
  industry?: string;
  revenue?: string;
  employees?: string;
  founded?: string;
  reasonForSelling?: string;
  companyLocation?: string;
}

export interface ListingViewer {
  userId: string;
  userName: string;
  userRole: UserRole;
  viewedAt: string;
  viewCount: number;
}

export interface Listing {
  id: string;
  companyId: string;
  companyName: string;
  industry: string;
  description: string;
  askingPrice: number;
  revenue: number;
  ebitda: number;
  employees: number;
  location: string;
  founded: number;
  views: number;
  inquiries: number;
  status: 'active' | 'under_review' | 'sold';
  createdAt: string;
  logo: string;
  highlights: string[];
  coverPhoto?: string;
  viewers: ListingViewer[];
  featured?: boolean;
  featuredUntil?: string;
}

export interface Inquiry {
  id: string;
  listingId: string;
  fromUserId: string;
  fromUserName: string;
  offerPrice?: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  participants: { id: string; name: string; role: UserRole }[];
  listingId?: string;
  listingName?: string;
  messages: ChatMessage[];
  lastMessage?: string;
  lastMessageTime?: string;
  unread: number;
}
