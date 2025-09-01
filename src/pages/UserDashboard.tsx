import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { PopularBusinessCard } from "@/components/PopularBusinessCard";
import { supabase } from "@/integrations/supabase/client";
import BusinessForm from "@/components/BusinessForm";
import { addDays, format } from "date-fns";
import { 
  User, 
  Mail, 
  Heart, 
  Building2, 
  Plus, 
  Globe, 
  CreditCard, 
  LogOut,
  Home,
  Edit
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const sidebarItems = [
  { title: "Dashboard", icon: Home, action: "dashboard" },
  { title: "Saved Listings", icon: Heart, action: "wishlists" },
  { title: "Add Listing", icon: Plus, action: "add-listing" },
  { title: "Get Website + POS", icon: Globe, action: "website-pos" },
  { title: "My Listings", icon: Building2, action: "listings" },
  { title: "Subscriptions", icon: CreditCard, action: "subscription" },
  { title: "Profile Info", icon: User, action: "profile" },
  { title: "Email Settings", icon: Mail, action: "email" },
];

export default function UserDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = React.useState("dashboard");
  const [userBusinesses, setUserBusinesses] = React.useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingBusiness, setEditingBusiness] = React.useState(null);
  const [bookmarkedBusinesses, setBookmarkedBusinesses] = React.useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = React.useState(false);
  const [businessCount, setBusinessCount] = React.useState(0);
  const [bookmarkCount, setBookmarkCount] = React.useState(0);

  const fetchUserBusinesses = async () => {
    if (!user?.id) return;
    
    setLoadingBusinesses(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user businesses:', error);
        return;
      }
      
      setUserBusinesses(data || []);
      setBusinessCount(data?.length || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const fetchDashboardCounts = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch business count
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id);
      
      if (!businessError) {
        setBusinessCount(businessData?.length || 0);
      }

      // Fetch bookmark count
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id);
      
      if (!bookmarkError) {
        setBookmarkCount(bookmarkData?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching dashboard counts:', error);
    }
  };

  React.useEffect(() => {
    if (user?.id) {
      fetchDashboardCounts();
    }
  }, [user?.id]);

  const fetchBookmarkedBusinesses = async () => {
    console.log('fetchBookmarkedBusinesses called, user ID:', user?.id);
    if (!user?.id) {
      console.log('No user ID, returning early');
      return;
    }
    
    setLoadingBookmarks(true);
    try {
      console.log('Fetching bookmarks for user:', user.id);
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          businesses (
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
          )
        `)
        .eq('user_id', user.id);
      
      console.log('Bookmarks query result:', { data, error });
      
      if (error) {
        console.error('Error fetching bookmarks:', error);
        return;
      }
      
      // Transform the data to match the expected business format
      const transformedData = data?.map(bookmark => {
        console.log('Processing bookmark:', bookmark);
        const business = bookmark.businesses as any;
        if (!business) {
          console.log('No business data found for bookmark:', bookmark.id);
          return null;
        }
        return {
          id: business.id,
          name: business.name,
          description: business.description,
          category: business.category,
          city: business.city,
          state: business.state,
          rating: business.rating,
          image_url: business.image_url,
          website: business.website,
          product_images: business.product_images,
          business_options: business.business_options,
          starting_price: business.starting_price,
          license_expired_date: business.license_expired_date,
          products_catalog: business.products_catalog,
          facebook_page: business.facebook_page,
          tiktok_url: business.tiktok_url,
          phone: business.phone,
          bookmarkId: bookmark.id
        };
      }).filter(Boolean) || [];
      
      console.log('Transformed bookmarked businesses:', transformedData);
      setBookmarkedBusinesses(transformedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const handleSidebarAction = (action: string) => {
    console.log('Sidebar action triggered:', action);
    setActiveSection(action);
    
    if (action === "website-pos") {
      navigate("/list-&-get-pos-website");
    } else if (action === "listings" || action === "subscription") {
      fetchUserBusinesses();
    } else if (action === "wishlists") {
      console.log('Wishlists section selected, fetching bookmarks');
      fetchBookmarkedBusinesses();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleEditBusiness = (business: any) => {
    setEditingBusiness(business);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setEditingBusiness(null);
    fetchUserBusinesses();
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting bookmark:', error);
        return;
      }
      
      // Refresh bookmarked businesses
      fetchBookmarkedBusinesses();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getDashboardContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-dashboard-gradient-start to-dashboard-gradient-end bg-clip-text text-transparent">Profile Information</h2>
            <Card className="bg-dashboard-card-bg border-0 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-dashboard-gradient-start/5 to-dashboard-gradient-end/5"></div>
              <CardContent className="pt-8 relative">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-24 w-24 ring-4 ring-primary/20 shadow-lg">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-dashboard-gradient-start to-dashboard-gradient-end text-white text-2xl">
                      {profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">
                      {profile?.display_name || "No display name set"}
                    </h3>
                    <p className="text-muted-foreground text-lg">{user?.email}</p>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-primary/10 rounded-full">
                        <p className="text-sm font-medium text-primary capitalize">
                          {profile?.role || "user"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case "email":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-dashboard-gradient-start to-dashboard-gradient-end bg-clip-text text-transparent">Email Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Primary Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{user?.email}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Email verified: {user?.email_confirmed_at ? "Yes" : "No"}
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "wishlists":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-dashboard-gradient-start to-dashboard-gradient-end bg-clip-text text-transparent">Saved Listings</h2>
            {loadingBookmarks ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading your saved businesses...</p>
              </div>
            ) : bookmarkedBusinesses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bookmarkedBusinesses.map((business) => (
                  <div key={business.id} className="relative">
                    <div className="absolute top-2 right-12 z-40">
                      <Button
                        onClick={() => handleDeleteBookmark(business.bookmarkId)}
                        size="sm"
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-2 py-1 h-auto text-xs rounded"
                      >
                        Unsave
                      </Button>
                    </div>
                    <PopularBusinessCard business={business} />
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    No saved listings yet. Start exploring businesses and bookmark your favorites!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "listings":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-dashboard-gradient-start to-dashboard-gradient-end bg-clip-text text-transparent">My Business Listings</h2>
            {loadingBusinesses ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading your businesses...</p>
              </div>
            ) : userBusinesses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {userBusinesses.map((business) => (
                  <div key={business.id} className="relative">
                    <div className="absolute top-2 left-2 z-40 flex items-center gap-2">
                      <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                        {business.starting_price ? (
                          <span>From {business.starting_price}</span>
                        ) : 'Price on request'}
                      </div>
                      <Button
                        onClick={() => handleEditBusiness(business)}
                        size="sm"
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-2 py-1 h-auto text-xs rounded"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <PopularBusinessCard business={business} />
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    No business listings yet. 
                    <Button 
                      variant="link" 
                      className="ml-2 p-0 h-auto"
                      onClick={() => navigate("/list-business")}
                    >
                      Create your first listing
                    </Button>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "add-listing":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-dashboard-gradient-start to-dashboard-gradient-end bg-clip-text text-transparent">Add New Business Listing</h2>
            <BusinessForm onSuccess={() => {
              setActiveSection("listings");
              fetchUserBusinesses();
            }} />
          </div>
        );

      case "subscription":
        const activePOSBusinesses = userBusinesses.filter(business => business["POS+Website"] === 1);
        
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-dashboard-gradient-start to-dashboard-gradient-end bg-clip-text text-transparent">Subscription</h2>
            <Card>
              <CardHeader>
                <CardTitle>Business Listing</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingBusinesses ? (
                  <p className="text-muted-foreground">Loading businesses...</p>
                ) : userBusinesses.length === 0 ? (
                  <>
                    <p className="text-lg font-medium">Not Active</p>
                    <p className="text-muted-foreground mt-2">
                      Upgrade to unlock premium features and boost your business visibility.
                    </p>
                    <Button className="mt-4">List Your Business($2/Year)</Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg font-medium text-green-600">Active Listing(s)</p>
                    <div className="space-y-3">
                      {userBusinesses.map((business) => {
                        const expirationDate = addDays(new Date(business.created_at), 365);
                        return (
                          <div key={business.id} className="border rounded-lg p-3 bg-muted/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-foreground">{business.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Expires: {format(expirationDate, 'MMM dd, yyyy')}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>POS + Website</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingBusinesses ? (
                  <p className="text-muted-foreground">Loading businesses...</p>
                ) : activePOSBusinesses.length === 0 ? (
                  <>
                    <p className="text-lg font-medium">Not Active</p>
                    <p className="text-muted-foreground mt-2">
                      Get a complete business solution with Point of Sale system and professional website.
                    </p>
                    <Button className="mt-4">Get Started</Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg font-medium text-green-600">Active POS + Website</p>
                    <div className="space-y-3">
                      {activePOSBusinesses.map((business) => {
                        const odooExpiredDate = business.odoo_expired_date 
                          ? new Date(business.odoo_expired_date)
                          : addDays(new Date(business.created_at), 7);
                        return (
                          <div key={business.id} className="border rounded-lg p-3 bg-muted/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-foreground">{business.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Odoo software expired date: {format(odooExpiredDate, 'MMM dd, yyyy')}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-8">
            <div className="text-center py-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-dashboard-gradient-start to-dashboard-gradient-end bg-clip-text text-transparent mb-2">
                Dashboard Overview
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Track your business performance and manage your listings from one central place
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="relative overflow-hidden bg-dashboard-card-bg border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
                <CardHeader className="relative pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    My Listings
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-blue-600">{businessCount}</p>
                    <p className="text-sm text-muted-foreground pb-1">active</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-2 flex-1 bg-blue-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{width: `${Math.min(businessCount * 20, 100)}%`}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden bg-dashboard-card-bg border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in" style={{animationDelay: '0.1s'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-pink-600/5"></div>
                <CardHeader className="relative pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                      <Heart className="h-5 w-5 text-pink-600" />
                    </div>
                    Saved
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-pink-600">{bookmarkCount}</p>
                    <p className="text-sm text-muted-foreground pb-1">bookmarks</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-2 flex-1 bg-pink-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full" style={{width: `${Math.min(bookmarkCount * 10, 100)}%`}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden bg-dashboard-card-bg border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in" style={{animationDelay: '0.2s'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
                <CardHeader className="relative pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-3">
                    <p className="text-2xl font-bold text-green-600">Free Tier</p>
                    <p className="text-sm text-muted-foreground">Basic features included</p>
                    <Button size="sm" className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0">
                      Upgrade Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Actions Section */}
            <div className="mt-12 animate-slide-up">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Quick Actions
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button 
                  onClick={() => handleSidebarAction("add-listing")}
                  className="h-auto p-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 flex-col gap-2 border-0 shadow-lg"
                >
                  <Plus className="h-6 w-6" />
                  <span className="font-medium">Add Listing</span>
                </Button>
                <Button 
                  onClick={() => handleSidebarAction("listings")}
                  variant="outline"
                  className="h-auto p-6 flex-col gap-2 bg-dashboard-card-bg hover:bg-dashboard-accent border-dashboard-shadow"
                >
                  <Building2 className="h-6 w-6" />
                  <span className="font-medium">Manage Listings</span>
                </Button>
                <Button 
                  onClick={() => handleSidebarAction("wishlists")}
                  variant="outline"
                  className="h-auto p-6 flex-col gap-2 bg-dashboard-card-bg hover:bg-dashboard-accent border-dashboard-shadow"
                >
                  <Heart className="h-6 w-6" />
                  <span className="font-medium">View Saved</span>
                </Button>
                <Button 
                  onClick={() => handleSidebarAction("website-pos")}
                  variant="outline"
                  className="h-auto p-6 flex-col gap-2 bg-dashboard-card-bg hover:bg-dashboard-accent border-dashboard-shadow"
                >
                  <Globe className="h-6 w-6" />
                  <span className="font-medium">Get Website</span>
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  const AppSidebar = () => {
    const { setOpenMobile, isMobile } = useSidebar();
    
    const handleMenuClick = (action: string) => {
      handleSidebarAction(action);
      // Close mobile sidebar when a menu item is clicked
      if (isMobile) {
        setOpenMobile(false);
      }
    };

    const handleLogoutClick = () => {
      handleSignOut();
      // Close mobile sidebar when logout is clicked
      if (isMobile) {
        setOpenMobile(false);
      }
    };

    return (
      <Sidebar className="border-r md:mt-16 md:h-[calc(100vh-4rem)] bg-sidebar/50 backdrop-blur-sm">
        <SidebarContent>
          {/* User Info Section */}
          <div className="p-6 border-b border-sidebar-border/50">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-dashboard-gradient-start to-dashboard-gradient-end text-white">
                  {profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">
                  {profile?.display_name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleMenuClick(item.action)}
                      isActive={activeSection === item.action}
                      className="w-full justify-start py-3 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80 data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/10 data-[active=true]:to-primary/5 data-[active=true]:border-primary/20 data-[active=true]:shadow-sm"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleLogoutClick}
                    className="w-full justify-start text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Please sign in to access your dashboard.</p>
            <Button 
              onClick={() => navigate("/auth/signin")} 
              className="w-full mt-4"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-bg pt-16">
      <Navbar />
      <div className="flex">
        <SidebarProvider>
          <div className="hidden md:block">
            <AppSidebar />
          </div>
          <div className="md:hidden">
            <AppSidebar />
          </div>
          <main className="flex-1 p-6 lg:p-8 overflow-auto ml-0 bg-gradient-to-br from-dashboard-bg via-dashboard-accent to-dashboard-bg">
            {/* Header Section with Gradient */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-dashboard-gradient-start to-dashboard-gradient-end rounded-2xl opacity-10"></div>
              <div className="relative flex items-center justify-between p-6 rounded-2xl bg-dashboard-card-bg/50 backdrop-blur-sm border border-white/20 shadow-lg">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors" />
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-dashboard-gradient-start to-dashboard-gradient-end bg-clip-text text-transparent">
                      Welcome back, {profile?.display_name || "User"}!
                    </h1>
                    <p className="text-muted-foreground">Manage your business presence with ease</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-dashboard-gradient-start to-dashboard-gradient-end text-white">
                      {profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="font-medium">
                      {profile?.display_name || "User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="animate-fade-in">
              {getDashboardContent()}
            </div>
          </main>
        </SidebarProvider>
      </div>
      
      {/* Edit Business Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Business Listing</DialogTitle>
          </DialogHeader>
          {editingBusiness && (
            <BusinessForm 
              editingBusiness={editingBusiness}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}