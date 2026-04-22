import { useState, useEffect } from "react";
import { PageLayoutDesktop, PageContainerDesktop, Grid } from "../../components/common/Header";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { Modal } from "../../components/common/Modal";
import { useShopStore } from "../../hooks/useShopStore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShopCard, EmptyState } from "../../components/common/ReusableCards";
import Filter from "../../components/common/Filter";
import Pagination from "../../components/common/Pagination";
import { SearchFilters } from "../../types";

const PAGE_SIZE = 10;

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { shops, loading, fetchShops } = useShopStore();

  const [filters, setFilters] = useState<SearchFilters>({
    rating: 0,
    priceMax: 5000,
    distance: 50,
    openNow: false,
  });

  useEffect(() => {
    fetchShops({ keyword: searchQuery });
  }, [fetchShops, searchQuery]);

  const filteredShops = shops.filter((shop) => {
    const matchesRating = (shop.rating || 0) >= filters.rating;
    const matchesPrice = (shop.startingPrice || 0) <= filters.priceMax;
    const matchesOpen = !filters.openNow || (shop.isOpen ?? false);
    const matchesDistance = !shop.distance || shop.distance <= filters.distance;
    return matchesRating && matchesPrice && matchesOpen && matchesDistance;
  });

  // Reset to page 1 whenever query/filters change
  useEffect(() => { setPage(1); }, [searchQuery, filters]);

  const handleSearch = () => {
    setSearchParams({ q: searchQuery });
    setPage(1);
    fetchShops({ keyword: searchQuery });
  };

  const totalPages = Math.ceil(filteredShops.length / PAGE_SIZE);
  const paginatedShops = filteredShops.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PageLayoutDesktop variant="customer">
      <PageContainerDesktop maxWidth="2xl" className="py-12">
        {/* Compressed Global Search Interface */}
        <div className="mb-12 flex justify-center animate-fade-up">
          <div className="relative group p-0.5 rounded-2xl bg-white/[0.03] border border-white/5 shadow-lg transition-all duration-500 hover:border-white/10 w-full max-w-lg">
            <div className="flex h-12">
              <div className="flex-1 flex items-center px-5">
                <Icon icon="search" className="text-gold mr-3 flex-shrink-0" size={16} />
                <input
                  type="text"
                  placeholder="Find a salon or barber..."
                  className="w-full bg-transparent border-none text-white placeholder-white/50 focus:ring-0 focus:outline-none text-base font-medium tracking-tight"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  aria-label="Search salons"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchParams({});
                      fetchShops({ keyword: "" });
                    }}
                    className="ml-2 flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 p-1 px-4 border-l border-white/5">
                <button
                  onClick={() => setShowFilters(true)}
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:bg-gold/10 transition-all cursor-pointer group/refine"
                  title="Filters"
                  aria-label="Open filters"
                >
                  <Icon icon="filter" size={14} className="group-hover/refine:rotate-12" />
                </button>
                <Button
                  variant="primary"
                  className="h-9 px-4 !rounded-xl text-xs font-bold shadow-lg"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results metadata */}
        <div className="flex justify-between items-center mb-8 md:mb-12 px-2 md:px-6">
          <div className="animate-fade-in text-left">
            <span className="text-xs font-bold text-white/50 block mb-1">Search results</span>
            <p className="text-sm font-medium text-white/80">
              {filteredShops.length} salon{filteredShops.length !== 1 ? "s" : ""} found
              {totalPages > 1 && <span className="text-white/40"> · Page {page} of {totalPages}</span>}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-48 text-center">
            <div className="inline-block w-12 h-12 border-2 border-gold/10 border-t-gold rounded-full animate-spin mb-8 shadow-2xl shadow-gold/20" />
            <p className="text-gold/30 font-black text-[10px] tracking-widest uppercase animate-pulse">Searching...</p>
          </div>
        ) : filteredShops.length > 0 ? (
          <div className="mb-12 md:mb-32">
            <Grid cols={3} gap="md">
              {paginatedShops.map((shop, i) => (
                <div key={shop.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <ShopCard
                    shop={shop}
                    onClick={() => navigate(`/customer/shop/${shop.id}`)}
                  />
                </div>
              ))}
            </Grid>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          </div>
        ) : (
          <div className="py-48 text-center">
            <EmptyState
              icon={<Icon icon="store" />}
              title="No Shops Found"
              description={searchQuery ? `No salons match "${searchQuery}". Try a different name, or clear your filters.` : "Try adjusting your filters or search for a different location."}
              action={
                <Button variant="secondary" className="px-8 py-3 !rounded-xl uppercase tracking-widest text-[10px] font-bold" onClick={() => {
                  setSearchQuery("");
                  setSearchParams({});
                  setFilters({ rating: 0, priceMax: 5000, distance: 50, openNow: false });
                }}>
                  Clear Filters
                </Button>
              }
            />
          </div>
        )}

        {/* Refinement Modal */}
        <Modal
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          title="Filter Shops"
        >
          <div className="pt-6">
            <Filter
              filters={filters}
              setFilters={setFilters}
              onReset={() => setFilters({ rating: 0, priceMax: 5000, distance: 50, openNow: false })}
            />
            <div className="mt-12 pt-8 border-t border-white/5">
              <Button
                variant="primary"
                fullWidth
                className="py-4 !rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-gold/10"
                onClick={() => setShowFilters(false)}
              >
                Show Results
              </Button>
            </div>
          </div>
        </Modal>

      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
