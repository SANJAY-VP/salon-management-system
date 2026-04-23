import { useState, useEffect } from "react";
import { ShopCard } from "../common/ReusableCards";
import Card from "../common/Card";
import Button from "../common/Button";
import { shopService } from "../../services/shop.service";
import { Shop } from "../../types";
import { useNavigate } from "react-router-dom";

export default function FeaturedShops() {
  const [featuredShops, setFeaturedShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedShops();
  }, []);

  const fetchFeaturedShops = async () => {
    try {
      const shops = await shopService.getFeaturedShops(10);
      setFeaturedShops(shops);
    } catch (error) {
      console.error("Failed to fetch featured shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShopClick = (shopId: string | number) => {
    navigate(`/customer/shop/${shopId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gold text-xl animate-pulse">Loading featured shops...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-cream mb-4">Featured Salons</h2>
        <p className="text-cream/60">Discover top-rated salons in your area</p>
      </div>

      {featuredShops.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-xl text-cream mb-4">No featured shops available</h3>
          <p className="text-cream/60">Check back later for amazing salons</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {featuredShops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              onClick={() => handleShopClick(shop.id)}
            />
          ))}
        </div>
      )}

      {featuredShops.length > 0 && (
        <div className="text-center mt-12">
          <Button
            variant="secondary"
            onClick={() => navigate("/customer/search")}
            className="px-8"
          >
            Explore All Salons
          </Button>
        </div>
      )}
    </div>
  );
}
