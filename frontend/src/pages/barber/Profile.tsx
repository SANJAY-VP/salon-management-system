import { useState, useEffect } from "react";
import { ProfileLayout } from "../../components/common/ProfileLayout";
import { ProfileEditForm } from "../../components/common/ProfileEditForm";
import Card from "../../components/common/Card";
import { Icon } from "../../components/common/Icon";
import { useAuthStore } from "../../hooks/useAuthStore";
import { shopService } from "../../services/shop.service";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function BarberProfile() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    shopName: "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
    profileImage: "",
  });

  const [stats, setStats] = useState({
    totalShops: 0,
    totalReviews: 0,
    activeShops: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const shops = await shopService.getMyShops();
        setStats({
          totalShops: shops.length,
          totalReviews: shops.reduce((acc, s) => acc + (s.reviewCount || 0), 0),
          activeShops: shops.filter(s => s.isOpen).length
        });
      } catch (err) {
        console.error("Failed to fetch profile stats", err);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    // Basic init if needed later
  }, []);

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await api.put("/api/v1/auth/me", {
        full_name: profile.name,
        phone: profile.phone,
      });
      updateUser({ name: profile.name, phone: profile.phone });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update profile");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <ProfileLayout
      variant="barber"
      profile={profile}
      isEditing={isEditing}
      onToggleEdit={() => setIsEditing(!isEditing)}
      onLogout={handleLogout}
      menuItems={[
        { label: "Security & Operations", icon: "settings" },
        { label: "Concierge Support", icon: "support" },
        { label: "Business Terms", icon: "terms" },
      ]}
    >
      {isEditing ? (
        <ProfileEditForm
          profile={profile}
          setProfile={(updatedProfile: any) =>
            setProfile({ ...profile, ...updatedProfile })
          }
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
        />
      ) : (
        <Card className="p-10 relative overflow-hidden bg-coffee/40 border-gold/10 rounded-[40px] shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl opacity-50" />
          <div className="flex justify-between items-start mb-12 relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold mb-3">Legacy Account</p>
              <h2 className="text-4xl font-bold text-white tracking-tighter uppercase font-serif">
                Overview
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 relative z-10">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-gold/20 transition-all group/stat">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 group-hover/stat:text-gold transition-colors">Total Shops</p>
              <p className="text-4xl font-bold text-white font-serif tracking-tighter">
                {stats.totalShops < 10 ? `0${stats.totalShops}` : stats.totalShops}
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-gold/20 transition-all group/stat">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 group-hover/stat:text-gold transition-colors">Client Reviews</p>
              <p className="text-4xl font-bold text-white font-serif tracking-tighter">
                {stats.totalReviews < 10 ? `0${stats.totalReviews}` : stats.totalReviews}
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all group/stat">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/40 mb-3 group-hover/stat:text-emerald-400 transition-colors">Active Shops</p>
              <p className="text-4xl font-bold text-emerald-400 font-serif tracking-tighter">
                {stats.activeShops < 10 ? `0${stats.activeShops}` : stats.activeShops}
              </p>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-10 relative z-10">
            <p className="text-[11px] text-white/30 leading-relaxed font-medium uppercase tracking-widest">
              Automated synchronization with your global establishment network. 
              Manage specific shop dynamics from your control center.
            </p>
          </div>
        </Card>
      )}
    </ProfileLayout>
  );
}
