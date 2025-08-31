import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PopularBusinessCard } from '@/components/PopularBusinessCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { supabase } from '@/integrations/supabase/client';

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  state: string;
  rating: number;
  image_url: string;
  website: string;
  product_images?: string[] | null;
  business_options?: string[] | null;
  starting_price?: string | null;
  license_expired_date?: string | null;
  products_catalog?: string | null;
  facebook_page?: string | null;
  tiktok_url?: string | null;
  phone?: string | null;
}

const PopularBusinesses = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      // Query businesses table directly to get all fields including products_catalog
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          description,
          category,
          city,
          state,
          rating,
          image_url,
          website,
          product_images,
          business_options,
          starting_price,
          license_expired_date,
          products_catalog,
          facebook_page,
          tiktok_url,
          phone
        `)
        .order('created_at', { ascending: false })
        .limit(6);
        
      if (error) {
        console.error('Error fetching businesses:', error);
        return;
      }
      
      console.log('Fetched businesses data:', data);
      if (data && data.length > 0) {
        console.log('First business products_catalog:', data[0]?.products_catalog);
      }
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Popular Businesses</h2>
          <div className="flex justify-center">
            <div className="text-muted-foreground">Loading businesses...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Popular Businesses</h2>
        
        <div className="hidden md:block bg-muted/30 rounded-2xl p-8 mx-4">
          <div className="relative">
            <Swiper
              modules={[Pagination]}
              pagination={{ 
                clickable: true,
                dynamicBullets: false,
                horizontalClass: 'swiper-pagination-horizontal',
                bulletClass: 'swiper-pagination-bullet',
                bulletActiveClass: 'swiper-pagination-bullet-active'
              }}
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 2.5,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 20,
                },
                1280: {
                  slidesPerView: 4,
                  spaceBetween: 20,
                },
              }}
            loop={false}
            grabCursor={true}
            centeredSlides={false}
            className="popular-businesses-swiper pb-12"
          >
            {businesses.map((business) => (
              <SwiperSlide key={business.id}>
                <PopularBusinessCard business={business} />
              </SwiperSlide>
            ))}
            
            {/* Fixed seventh card - Discover more shops */}
            <SwiperSlide key="discover-more">
              <Card className="group w-full max-w-[320px] h-[455px] flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300 mx-auto bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="relative overflow-hidden rounded-t-lg h-[200px] bg-gradient-to-br from-slate-700 to-slate-800">
                  <img
                    src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=320&h=200&fit=crop"
                    alt="Discover more shops"
                    className="w-full h-[200px] object-cover opacity-30"
                  />
                </div>
                
                <CardContent className="flex-1 p-3 flex flex-col justify-center items-center text-center">
                  <div className="space-y-4">
                    <h3 className="text-white text-lg font-bold">
                      Discover more shops
                    </h3>
                    <p className="text-white/80 text-sm">
                      Explore hundreds of businesses and find exactly what you're looking for
                    </p>
                    <Button 
                      style={{ backgroundColor: '#EAB33A' }}
                      className="w-full h-10 text-black font-medium hover:opacity-90 transition-opacity"
                    >
                      Go Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </SwiperSlide>
           </Swiper>
          </div>
        </div>
        
        {/* Mobile version without background container */}
        <div className="block md:hidden">
          <div className="relative">
            <Swiper
              modules={[Pagination]}
              pagination={{ 
                clickable: true,
                dynamicBullets: false,
                horizontalClass: 'swiper-pagination-horizontal'
              }}
              spaceBetween={20}
              slidesPerView={1.15}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 2.5,
                  spaceBetween: 20,
                },
              }}
              loop={false}
              grabCursor={true}
              centeredSlides={false}
              className="popular-businesses-swiper-mobile pb-12 pl-4"
            >
            {businesses.map((business) => (
              <SwiperSlide key={business.id}>
                <PopularBusinessCard business={business} />
              </SwiperSlide>
            ))}
              
              {/* Fixed seventh card - Discover more shops (Mobile) */}
              <SwiperSlide key="discover-more-mobile">
                <Card className="group w-full max-w-[320px] h-[455px] flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300 mx-auto bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="relative overflow-hidden rounded-t-lg h-[200px] bg-gradient-to-br from-slate-700 to-slate-800">
                    <img
                      src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=320&h=200&fit=crop"
                      alt="Discover more shops"
                      className="w-full h-[200px] object-cover opacity-30"
                    />
                  </div>
                  
                  <CardContent className="flex-1 p-3 flex flex-col justify-center items-center text-center">
                    <div className="space-y-4">
                      <h3 className="text-white text-lg font-bold">
                        Discover more shops
                      </h3>
                      <p className="text-white/80 text-sm">
                        Explore hundreds of businesses and find exactly what you're looking for
                      </p>
                      <Button 
                        style={{ backgroundColor: '#EAB33A' }}
                        className="w-full h-10 text-black font-medium hover:opacity-90 transition-opacity"
                      >
                        Go Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PopularBusinesses;