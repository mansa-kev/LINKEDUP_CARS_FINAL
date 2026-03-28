import { 
  mockCars, mockBookings, mockClientDocuments, 
  mockContracts, mockTransactions, mockMessages, 
  mockCoupons 
} from '../lib/mockData';

export const clientService = new Proxy({} as any, {
  get: (target, prop) => {
    if (prop === 'getDashboardData') return async () => ({
      activeBookings: mockBookings.filter(b => b.status === 'confirmed'),
      upcomingBookings: mockBookings.filter(b => b.status === 'pending'),
      recentActivity: [],
      loyaltyPoints: 1250,
      loyaltyTier: 'Silver'
    });
    if (prop === 'getAllBookings') return async () => mockBookings;
    if (prop === 'getClientDocuments') return async () => mockClientDocuments;
    if (prop === 'getSignedContracts') return async () => mockContracts;
    if (prop === 'getTransactions') return async () => mockTransactions;
    if (prop === 'getPreferences') return async () => ({ notifications: true, newsletter: false });
    if (prop === 'getWishlist') return async () => mockCars.map(c => ({ id: c.id, car_id: c.id, cars: c }));
    if (prop === 'getMessages') return async () => mockMessages;
    if (prop === 'getExtensionRequests') return async () => [];
    if (prop === 'getLoyaltyStatus') return async () => ({ points: 1250, tier: 'Silver', nextTierPoints: 2000 });
    if (prop === 'getPromoCodes') return async () => mockCoupons;
    if (prop === 'getExclusiveOffers') return async () => [];
    
    // Default mock for any other method
    return async () => {
      console.log(`Mocked clientService.${String(prop)} called`);
      return [];
    };
  }
});
