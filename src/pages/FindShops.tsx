import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PopularBusinessCard } from "@/components/PopularBusinessCard";
import { SearchFilters } from "@/components/SearchFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { expandSearchTerms, normalizeCategoryName } from "@/utils/synonymDictionary";

interface Business {
  id: string;
  name: string;
  description?: string;
  category: string;
  address?: string;
  towns?: string;
  province_district?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  rating: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export default function FindShops() {
  const [searchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    fetchCategories();
    
    // Get search term from URL params
    const urlSearchTerm = searchParams.get('search');
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(0);
    setHasMore(true);
    // Always fetch businesses - either with filters or show all
    fetchBusinesses(true);
  }, [searchTerm, selectedCategory, selectedProducts, locationFilter, deliveryFilter]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("business_categories")
        .select("id, name")
        .order("name");

      if (error) throw error;
      const categoriesData = data || [];
      setCategories(categoriesData);
      setCategoryNames(categoriesData.map(cat => cat.name));
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBusinesses = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setBusinesses([]);
      } else {
        setLoadingMore(true);
      }

      const page = reset ? 0 : currentPage;
      
      // Prepare search parameters for RPC call
      let searchTerms = null;
      if (searchTerm) {
        // For improved accuracy, prioritize exact phrases over individual terms
        const trimmedTerm = searchTerm.toLowerCase().trim();
        
        // Always use synonym expansion for better search results
        const { exactPhrases, individualTerms } = expandSearchTerms(searchTerm);
        
        // Check if it's a compound term that should prioritize exact phrase matching
        const isCompoundTerm = trimmedTerm.includes("'") || 
                              (trimmedTerm.split(/\s+/).length > 1 && 
                               (trimmedTerm.includes("women") || trimmedTerm.includes("men") || 
                                trimmedTerm.includes("kids") || trimmedTerm.includes("children")));
        
        if (isCompoundTerm && exactPhrases.length > 0) {
          // For compound terms, prioritize exact phrases (including synonyms)
          searchTerms = exactPhrases;
        } else if (exactPhrases.length > 0) {
          // Use exact phrases when available
          searchTerms = exactPhrases;
        } else {
          const words = trimmedTerm.split(/\s+/);
          if (words.length > 1) {
            searchTerms = words; // Let RPC handle AND logic for multi-word queries
          } else {
            searchTerms = individualTerms.length > 0 ? individualTerms : [searchTerm];
          }
        }
      }
      
      // Get category ID for selected category
      let categoryId = null;
      if (selectedCategory !== "all") {
        const categoryData = categories.find(cat => cat.name === selectedCategory);
        categoryId = categoryData?.id || null;
      }
      
      // Prepare product terms
      const productTerms = selectedProducts.length > 0 && !selectedProducts.includes("All Products") 
        ? selectedProducts 
        : null;
      
      // Prepare location parameters
      let locationToken = null;
      let locationTown = null;
      let locationProvince = null;
      
      if (locationFilter) {
        if (locationFilter.includes(",")) {
          const [town, province] = locationFilter.split(",").map((s) => s.trim());
          locationTown = town || null;
          locationProvince = province || null;
        } else {
          locationToken = locationFilter;
        }
      }
      
      // Prepare delivery options
      const deliveryOptions = deliveryFilter.length > 0 ? deliveryFilter : null;

      // Call the RPC function with proper AND/OR logic
      const { data, error } = await supabase.rpc('search_businesses', {
        search_terms: searchTerms,
        category_id: categoryId,
        product_terms: productTerms,
        location_token: locationToken,
        location_town: locationTown,
        location_province: locationProvince,
        delivery_options: deliveryOptions,
        page: page,
        page_size: ITEMS_PER_PAGE
      });

      if (error) throw error;

      if (error) throw error;
      
      const newBusinesses = data || [];
      
      if (reset) {
        setBusinesses(newBusinesses);
        setCurrentPage(0);
      } else {
        setBusinesses(prev => [...prev, ...newBusinesses]);
        setCurrentPage(page + 1);
      }
      
      setHasMore(newBusinesses.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch businesses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchBusinesses(false);
    }
  };

  const BusinessSkeleton = () => (
    <div className="w-[280px]">
      <Skeleton className="h-[280px] w-full rounded-t-lg" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <SearchFilters
          onSearchChange={setSearchTerm}
          onCategoryChange={setSelectedCategory}
          onLocationChange={setLocationFilter}
          onProductChange={(products) => {
            if (typeof products === 'string') {
              setSelectedProducts(products === 'all' ? [] : [products]);
            } else {
              setSelectedProducts(products);
            }
          }}
          onDeliveryFilter={(type) => {
            const filters = type ? type.split(',').filter(f => f.trim()) : [];
            setDeliveryFilter(filters);
          }}
          categories={categoryNames}
          initialSearchTerm={searchTerm}
          initialCategory={selectedCategory}
        />

        <div className="mt-8">
          <div className="flex flex-wrap justify-center gap-5 max-w-[580px] md:max-w-[580px] lg:max-w-[900px] mx-auto">
            {loading ? (
              // Show skeletons while loading
              Array.from({ length: 6 }).map((_, index) => (
                <BusinessSkeleton key={index} />
              ))
            ) : businesses.length > 0 ? (
              businesses.map((business) => (
                <PopularBusinessCard key={business.id} business={business} />
              ))
            ) : (
              <div className="text-center py-12 w-full">
                <p className="text-xl text-muted-foreground">
                  No businesses found matching your criteria.
                </p>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your search filters or browse all categories.
                </p>
              </div>
            )}
          </div>
          
          {!loading && businesses.length > 0 && hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg border-2 border-primary shadow-lg hover:shadow-xl hover:bg-primary/90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}