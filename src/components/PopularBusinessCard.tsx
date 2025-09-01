import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bookmark, Check, BadgeCheck, MapPin, ChevronRight, ChevronLeft, Star } from 'lucide-react';
import facebookIcon from "@/assets/facebook-icon.jpg";
import tiktokIcon from "@/assets/tiktok-icon.jpg";
import phoneIcon from "@/assets/phone-icon.jpg";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Business {
  id: string;
  name: string;
  description?: string;
  category?: string;
  city?: string;
  state?: string;
  rating?: number;
  image_url?: string;
  website?: string;
  product_images?: string[] | null;
  business_options?: string[] | null;
  starting_price?: string | null;
  license_expired_date?: string | null;
  products_catalog?: string | null;
  facebook_page?: string | null;
  tiktok_url?: string | null;
  phone?: string | null;
}

interface PopularBusinessCardProps {
  business: Business;
}

export const PopularBusinessCard = ({ business }: PopularBusinessCardProps) => {
  const [openModal, setOpenModal] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReviews, setExistingReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const { toast } = useToast();

  // Fetch existing reviews when modal opens
  useEffect(() => {
    if (openReviewModal) {
      fetchReviews();
    }
  }, [openReviewModal, business.id]);

  // Check if business is bookmarked when component mounts
  useEffect(() => {
    checkBookmarkStatus();
  }, [business.id]);

  const checkBookmarkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', business.id)
        .maybeSingle();

      if (error) throw error;
      setIsBookmarked(!!data);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('business_reviews')
        .select(`
          id,
          comment,
          rating,
          created_at,
          user_id
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately to get display names
      if (data && data.length > 0) {
        const userIds = data.map(review => review.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        // Merge reviews with profile data
        const reviewsWithProfiles = data.map(review => ({
          ...review,
          profiles: profiles?.find(p => p.user_id === review.user_id) || null
        }));

        setExistingReviews(reviewsWithProfiles);
      } else {
        setExistingReviews(data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setExistingReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to submit a review.",
          variant: "destructive",
        });
        return;
      }

      // Insert review into business_reviews table
      const { error } = await supabase
        .from('business_reviews')
        .insert({
          business_id: business.id,
          user_id: user.id,
          rating: reviewData.rating,
          comment: reviewData.comment,
        });

      if (error) {
        // Handle duplicate review error
        if (error.code === '23505') {
          toast({
            title: "Review already exists",
            description: "You have already reviewed this business. You can only submit one review per business.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });

      setReviewData({ rating: 5, comment: '' });
      // Refresh reviews list
      await fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookmarkToggle = async () => {
    setIsBookmarkLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to bookmark businesses.",
          variant: "destructive",
        });
        return;
      }

      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('business_id', business.id);

        if (error) throw error;

        setIsBookmarked(false);
        toast({
          title: "Bookmark removed",
          description: "Business removed from your bookmarks.",
        });
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            business_id: business.id,
          });

        if (error) throw error;

        setIsBookmarked(true);
        toast({
          title: "Business bookmarked",
          description: "Business added to your bookmarks.",
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const getOptionColors = (index: number) => {
    const colors = [
      'border-green-600 text-green-600',
      'border-blue-600 text-blue-600', 
      'border-purple-600 text-purple-600',
      'border-orange-600 text-orange-600',
      'border-pink-600 text-pink-600',
      'border-indigo-600 text-indigo-600',
      'border-teal-600 text-teal-600',
      'border-red-600 text-red-600'
    ];
    return colors[index % colors.length];
  };

  const isLicenseValid = (licenseDate?: string | null) => {
    if (!licenseDate) return false;
    
    const expiryDate = new Date(licenseDate);
    const currentDate = new Date();
    
    // Set both dates to start of day for accurate date comparison
    expiryDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    return expiryDate >= currentDate;
  };

  const parseProductsCatalog = (catalogString?: string | null) => {
    if (!catalogString || catalogString.trim() === '') {
      return [];
    }
    
    // Try to parse as JSON first (in case it's stored as JSON array)
    try {
      const parsed = JSON.parse(catalogString);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // If JSON parsing fails, treat as comma-separated string
    }
    
    // Parse as comma-separated string
    const products = catalogString
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    return products;
  };

  const hasMultipleImages = business.product_images && business.product_images.length > 1;

  return (
    <Card className="group w-full max-w-[320px] h-[470px] flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300 mx-auto">
      <div className="relative overflow-hidden rounded-t-lg">
        <Swiper
          modules={[Navigation, Pagination]}
          navigation={{
            nextEl: `.swiper-button-next-${business.id}`,
            prevEl: `.swiper-button-prev-${business.id}`,
            enabled: true
          }}
          pagination={{ 
            clickable: true,
            enabled: false 
          }}
          spaceBetween={0}
          slidesPerView={1}
          loop={hasMultipleImages}
          className="w-full h-[200px] product-carousel"
        >
          {business.product_images && business.product_images.length > 0 ? (
            business.product_images.map((image, index) => (
              <SwiperSlide key={index}>
                <img
                  src={`${image}?w=320&h=200&fit=crop`}
                  alt={`${business.name} product ${index + 1}`}
                  className="w-full h-[200px] object-cover"
                />
              </SwiperSlide>
            ))
          ) : business.image_url ? (
            <SwiperSlide>
              <img
                src={`${business.image_url}?w=320&h=200&fit=crop`}
                alt={`${business.name} main image`}
                className="w-full h-[200px] object-cover"
              />
            </SwiperSlide>
          ) : (
            <SwiperSlide>
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=320&h=200&fit=crop"
                alt={`${business.name} products`}
                className="w-full h-[200px] object-cover"
              />
            </SwiperSlide>
          )}
          
          {/* Custom Navigation Arrows - only show if multiple images */}
          {business.product_images && business.product_images.length > 1 && (
            <>
              <button 
                className={`swiper-button-prev-${business.id} absolute left-2 top-1/2 -translate-y-1/2 z-30 w-6 h-6 bg-white/95 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-all duration-200 shadow-lg border border-gray-200`}
                type="button"
              >
                <ChevronLeft className="w-3 h-3 text-gray-800" />
              </button>
              <button 
                className={`swiper-button-next-${business.id} absolute right-2 top-1/2 -translate-y-1/2 z-30 w-6 h-6 bg-white/95 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-all duration-200 shadow-lg border border-gray-200`}
                type="button"
              >
                <ChevronRight className="w-3 h-3 text-gray-800" />
              </button>
            </>
          )}
        </Swiper>
        
        {/* Starting Price Tag - Top Left Corner */}
        {business.starting_price && (
          <div className="absolute top-2 left-2 z-40">
            <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded shadow-lg">
              From {business.starting_price}
            </span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 px-1 py-2 h-auto w-6 bg-white/80 hover:bg-white z-40"
          onClick={handleBookmarkToggle}
          disabled={isBookmarkLoading}
        >
          <Bookmark 
            className={`w-3 h-3 transition-colors ${
              isBookmarked ? 'text-primary fill-primary' : 'text-gray-600'
            }`} 
          />
        </Button>
      </div>
      
      {/* Light green section positioned under the product images */}
      <div className="h-[26px] bg-[#58BB8A] flex items-center justify-between px-2">
        <Dialog open={openReviewModal} onOpenChange={setOpenReviewModal}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-4 px-2 text-[9px] text-black bg-white border-gray-300 hover:bg-gray-50"
            >
              REVIEWS
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reviews for {business.name}</DialogTitle>
            </DialogHeader>
            
            {/* Existing Reviews Section */}
            <div className="space-y-4 mb-6">
              {loadingReviews ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading reviews...</p>
                </div>
              ) : existingReviews.length > 0 ? (
                <>
                  <h3 className="font-medium text-sm text-foreground">Customer Reviews ({existingReviews.length})</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {existingReviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {review.profiles?.display_name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
            
            {/* Review Form */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-sm text-foreground mb-4">Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comment">Your Review</Label>
                <Textarea
                  id="comment"
                  placeholder="Share your experience with this business..."
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  required
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpenReviewModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !reviewData.comment.trim()}>
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </form>
            </div>
          </DialogContent>
        </Dialog>
        {isLicenseValid(business.license_expired_date) && (
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-green-600 bg-white rounded-full p-0.5" />
            <span className="text-white text-[9px] font-medium uppercase">Verified</span>
          </div>
        )}
      </div>
      
      <CardContent className="flex-1 pt-3 px-3 pb-2 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img 
                src={business.image_url || "https://images.unsplash.com/photo-1592659762303-90081d34b277?w=40&h=40&fit=crop"} 
                alt="Business logo" 
                className="w-10 h-10 rounded-md object-cover border border-gray-300"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
                {business.name}
              </h3>
            </div>
          </div>
          
          {business.city && business.state && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-500" />
              {business.city}, {business.state}
            </p>
          )}
          
          {/* Business Options */}
          {business.business_options && business.business_options.length > 0 && (
            <div className="flex flex-wrap gap-x-1 gap-y-1">
              {business.business_options.map((option, index) => (
                <div key={index}>
                  <span className={`text-xs px-2 py-0.5 rounded border ${getOptionColors(index)}`}>
                    {option}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <Button
            className="w-full h-8 text-xs flex items-center justify-center gap-1"
            onClick={() => business.website && window.open(business.website, '_blank')}
          >
            Visit Website
            <ChevronRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
         </div>
       </CardContent>
       
       {/* Light gray bottom section with button and social icons */}
       <div className="h-[50px] bg-muted rounded-b-lg border-t border-border flex items-center justify-between px-3">
         <Dialog open={openModal} onOpenChange={setOpenModal}>
           <DialogTrigger asChild>
             <Button 
               variant="outline" 
               className="h-7 text-xs px-3 bg-[#F5F8FA] hover:bg-[#E8EEF2] border-border"
             >
               See Products
             </Button>
           </DialogTrigger>
           <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>{business.name} - Products Catalog</DialogTitle>
             </DialogHeader>
             <div className="space-y-3">
               {parseProductsCatalog(business.products_catalog).length > 0 ? (
                 parseProductsCatalog(business.products_catalog).map((product: string, index: number) => (
                   <div key={index} className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                     <Check className="w-4 h-4 text-primary" />
                     <span className="text-sm">{product}</span>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-8 text-muted-foreground">
                   <p>No products catalog available</p>
                 </div>
               )}
             </div>
           </DialogContent>
         </Dialog>
         
          <div className="flex items-center gap-2">
            {business.facebook_page && (
              <img 
                src={facebookIcon}
                alt="Facebook"
                className="w-6 h-6 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(business.facebook_page, '_blank')}
              />
            )}
            {business.tiktok_url && (
              <img 
                src={tiktokIcon}
                alt="TikTok"
                className="w-6 h-6 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(business.tiktok_url, '_blank')}
              />
            )}
            {business.phone && (
              <img 
                src={phoneIcon}
                alt="WhatsApp"
                className="w-6 h-6 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(`https://wa.me/${business.phone.replace(/[^\d]/g, '')}`, '_blank')}
              />
            )}
          </div>
       </div>
     </Card>
  );
};