import { useState, useEffect } from "react";
import { PageLayoutDesktop, PageContainerDesktop, PageHeader } from "../../components/common/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { StatCard } from "../../components/common/StatCard";
import { shopService } from "../../services/shop.service";
import { Shop } from "../../types";

type EarningsPeriod = 'daily' | 'monthly' | 'yearly';

interface ShopEarnings {
  shopId: string | number;
  shopName: string;
  totalEarnings: number;
  todayEarnings: number;
  monthlyEarnings: number;
  bookingCount: number;
  averageBookingValue: number;
}

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  thisWeek: number;
  pending: number;
  shopBreakdown: ShopEarnings[];
}

export default function MultiShopEarnings() {
  const [period, setPeriod] = useState<EarningsPeriod>('monthly');
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      const myShops = await shopService.getMyShops();
      
      const mockShopEarnings: ShopEarnings[] = myShops.map(shop => ({
        shopId: shop.id,
        shopName: shop.name,
        totalEarnings: Math.floor(Math.random() * 50000) + 10000,
        todayEarnings: Math.floor(Math.random() * 2000) + 500,
        monthlyEarnings: Math.floor(Math.random() * 15000) + 3000,
        bookingCount: Math.floor(Math.random() * 100) + 20,
        averageBookingValue: Math.floor(Math.random() * 800) + 200
      }));

      const totalEarnings = mockShopEarnings.reduce((sum, shop) => sum + shop.totalEarnings, 0);
      const thisMonth = mockShopEarnings.reduce((sum, shop) => sum + shop.monthlyEarnings, 0);
      const thisWeek = Math.floor(thisMonth * 0.25);
      const pending = Math.floor(totalEarnings * 0.05);

      setEarningsData({
        totalEarnings,
        thisMonth,
        thisWeek,
        pending,
        shopBreakdown: mockShopEarnings
      });
    } catch (error) {
      console.error("Failed to fetch earnings data:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = earningsData?.shopBreakdown.map(shop => ({
    name: shop.shopName,
    value: period === 'daily' ? shop.todayEarnings : 
          period === 'monthly' ? shop.monthlyEarnings : 
          shop.totalEarnings
  })).sort((a, b) => b.value - a.value) || [];

  if (loading) {
    return (
      <PageLayoutDesktop variant="barber">
        <PageContainerDesktop className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gold text-xl animate-pulse font-serif tracking-widest uppercase">Calculating Dividends</div>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  return (
    <PageLayoutDesktop variant="barber">
      <PageContainerDesktop maxWidth="2xl" className="px-8 py-4">
        <div className="flex justify-between items-end mb-12">
           <div className="flex gap-3 bg-black/20 p-2 rounded-2xl border border-white/5">
            {(['daily', 'monthly', 'yearly'] as EarningsPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${period === p ? 'bg-gold text-cocoa shadow-lg' : 'text-cream/60 hover:text-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Global Revenue" value={earningsData?.totalEarnings || 0} icon="earnings" color="gold" className="!bg-coffee/40 !border-gold/10" />
          <StatCard title="Cycle Dividend" value={earningsData?.thisMonth || 0} icon="calendar" color="gold" className="!bg-coffee/40 !border-gold/10" />
          <StatCard title="Temporal Epoch" value={earningsData?.thisWeek || 0} icon="clock" color="gold" className="!bg-coffee/40 !border-gold/10" />
          <StatCard title="Vault Pending" value={earningsData?.pending || 0} icon="star" color="gold" className="!bg-coffee/40 !border-gold/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Visual Analytics */}
           <div className="lg:col-span-8 space-y-10">
              <Card className="p-10 bg-coffee/40 border-gold/10 rounded-[40px] shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-3xl rounded-full" />
                 <h3 className="text-xl font-bold font-serif text-white uppercase tracking-tighter mb-10 pb-6 border-b border-white/5">Revenue Concentration</h3>
                 
                 <div className="space-y-8">
                    {chartData.map((item) => {
                       const maxValue = Math.max(...chartData.map(d => d.value));
                       const percentage = (item.value / maxValue) * 100;
                       return (
                          <div key={item.name} className="space-y-3 group">
                             <div className="flex justify-between items-end">
                                <div>
                                   <p className="text-xs font-black text-white/50 uppercase tracking-[0.3em] mb-1 group-hover:text-gold/60 transition-colors">Establishment</p>
                                   <p className="text-lg font-bold font-serif text-white uppercase tracking-tight">{item.name}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-sm font-bold text-gold font-serif">₹{item.value.toLocaleString()}</p>
                                </div>
                             </div>
                             <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                                <div 
                                   className="h-full bg-gradient-to-r from-gold to-bronze rounded-full transition-all duration-1000 ease-out"
                                   style={{ width: `${percentage}%` }}
                                />
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </Card>

              {/* Establishment Registry */}
              <Card className="p-10 bg-coffee/40 border-gold/10 rounded-[40px] shadow-2xl overflow-hidden">
                 <h3 className="text-xl font-bold font-serif text-white uppercase tracking-tighter mb-10">Artisanal Yield Table</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-white/5">
                             <th className="pb-6 text-xs font-black text-white/50 uppercase tracking-widest">Establishment</th>
                             <th className="pb-6 text-xs font-black text-white/50 uppercase tracking-widest text-right">Yield</th>
                             <th className="pb-6 text-xs font-black text-white/50 uppercase tracking-widest text-right">Manifests</th>
                             <th className="pb-6 text-xs font-black text-white/50 uppercase tracking-widest text-right">Valuation</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {earningsData?.shopBreakdown.map((shop) => (
                             <tr key={shop.shopId} className="group hover:bg-gold/5 transition-colors">
                                <td className="py-6 pr-4">
                                   <p className="text-sm font-bold text-cream uppercase transition-colors group-hover:text-gold">{shop.shopName}</p>
                                   <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mt-1">Ref: {shop.shopId}</p>
                                </td>
                                <td className="py-6 text-right font-serif text-white font-bold">₹{shop.totalEarnings.toLocaleString()}</td>
                                <td className="py-6 text-right text-xs font-black text-cream/60">{shop.bookingCount}</td>
                                <td className="py-6 text-right text-xs font-bold text-gold">₹{shop.averageBookingValue}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </Card>
           </div>

           {/* Sidebar Orchestration */}
           <div className="lg:col-span-4 space-y-10">
              <Card className="p-8 bg-gold text-cocoa rounded-[40px] shadow-2xl relative overflow-hidden group">
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/30 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-8 opacity-60">Vault Orchestration</h3>
                 <div className="mb-10">
                    <p className="text-4xl font-bold font-serif tracking-tighter mb-2">₹{earningsData?.pending.toLocaleString()}</p>
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Liquidable Dividend</p>
                 </div>
                 <Button variant="primary" className="w-full !bg-cocoa !text-gold !rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                    INITIATE WITHDRAWAL
                 </Button>
              </Card>

              <Card className="p-8 bg-coffee/40 border-gold/10 rounded-[40px] shadow-2xl">
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 mb-8">Financial Archive</h3>
                 <div className="space-y-6">
                    {[
                       { label: "Quarterly Ledger", icon: "terms" },
                       { label: "Tax Certifications", icon: "settings" },
                       { label: "Yield Reports", icon: "earnings" }
                    ].map((item) => (
                       <div key={item.label} className="flex justify-between items-center group cursor-pointer">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-cocoa transition-all duration-500">
                                <Icon icon={item.icon as any} size={18} />
                             </div>
                             <span className="text-xs font-bold text-cream/60 uppercase group-hover:text-white transition-colors">{item.label}</span>
                          </div>
                          <Icon icon="arrow-right" size={14} className="text-white/20 group-hover:text-gold transition-colors" />
                       </div>
                    ))}
                 </div>
              </Card>
           </div>
        </div>
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
