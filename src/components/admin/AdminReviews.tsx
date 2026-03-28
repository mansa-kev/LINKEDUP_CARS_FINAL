import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { 
  Star, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Flag, 
  CheckCircle2, 
  User, 
  Car,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  carName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'published' | 'pending' | 'flagged';
}

// --- Components ---

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await adminService.getReviews();
      const formattedReviews: Review[] = (data || []).map((r: any) => ({
        id: r.id,
        userName: r.user_profiles?.full_name || 'Anonymous',
        userAvatar: undefined,
        carName: `${r.cars?.make} ${r.cars?.model}` || 'Unknown Car',
        rating: r.rating,
        comment: r.comment,
        date: new Date(r.created_at).toLocaleDateString(),
        status: r.status as any
      }));
      setReviews(formattedReviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    const promise = (async () => {
      await adminService.updateReviewStatus(id, status);
      fetchReviews();
    })();

    toast.promise(promise, {
      loading: `Updating review status to ${status}...`,
      success: `Review status updated to ${status} successfully`,
      error: 'Failed to update review status'
    });
  };

  const handleDelete = async (id: string) => {
    const promise = (async () => {
      await adminService.deleteReview(id);
      fetchReviews();
    })();

    toast.promise(promise, {
      loading: 'Deleting review...',
      success: 'Review deleted successfully',
      error: 'Failed to delete review'
    });
  };

  const filteredReviews = reviews.filter(r => {
    const matchesRating = filterRating === 'all' || r.rating === filterRating;
    const matchesSearch = r.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.carName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRating && matchesSearch;
  });

  if (loading && reviews.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search reviews..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
            <Filter size={16} className="text-muted-foreground" />
            <select 
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-transparent border-none text-sm font-medium outline-none cursor-pointer"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filteredReviews.length}</span> reviews found
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <User size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{review.userName}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Car size={14} />
                    <span>{review.carName}</span>
                    <span className="mx-1">•</span>
                    <span>{review.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  review.status === 'published' ? 'bg-success/10 text-success' : 
                  review.status === 'pending' ? 'bg-warning/10 text-warning' : 
                  'bg-error/10 text-error'
                }`}>
                  {review.status}
                </span>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <MoreVertical size={18} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={16} 
                  className={i < review.rating ? 'fill-warning text-warning' : 'text-muted'} 
                />
              ))}
            </div>

            <p className="text-sm text-foreground leading-relaxed mb-6 italic">
              "{review.comment}"
            </p>

            <div className="flex items-center gap-3 pt-4 border-t border-border">
              {review.status !== 'published' && (
                <button 
                  onClick={() => handleUpdateStatus(review.id, 'published')}
                  className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl text-xs font-bold hover:bg-success/20 transition-colors"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
              )}
              {review.status !== 'flagged' && (
                <button 
                  onClick={() => handleUpdateStatus(review.id, 'flagged')}
                  className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-xl text-xs font-bold hover:bg-warning/20 transition-colors"
                >
                  <Flag size={14} /> Flag
                </button>
              )}
              <button 
                onClick={() => handleDelete(review.id)}
                className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error rounded-xl text-xs font-bold hover:bg-error/20 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">Showing 1 to {filteredReviews.length} of {filteredReviews.length} reviews</p>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50" disabled>
            <ChevronLeft size={20} />
          </button>
          <button className="w-10 h-10 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20">1</button>
          <button className="p-2 border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50" disabled>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
