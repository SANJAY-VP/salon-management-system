import React, { useRef } from "react";
import Card from "./Card";
import Button from "./Button";
import { Icon } from "./Icon";
import toast from "react-hot-toast";

interface ProfileData {
    name: string;
    email: string;
    phone: string;
    profileImage: string;
}

interface ProfileSidebarProps {
    profile: ProfileData;
    isEditing: boolean;
    onToggleEdit: () => void;
    onLogout: () => void;
    menuItems: { label: string; icon: string; onClick?: () => void }[];
}

export const ProfileSidebar = ({
    profile,
    isEditing,
    onToggleEdit,
    onLogout,
    menuItems
}: ProfileSidebarProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Mocking the upload process in a high-fidelity interaction layer
            toast("Digital identity preservation is restricted in this session. Profile imagery remains standard.", { icon: "(i)" });
        }
    };

    // Helper to render avatar or fallback
    const renderAvatar = () => {
        if (profile.profileImage && profile.profileImage !== "https://via.placeholder.com/150") {
            return (
                <img
                    src={profile.profileImage}
                    alt={profile.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100"
                />
            );
        }
        return (
            <div className="w-full h-full bg-gradient-to-br from-gold/20 via-background to-cocoa flex items-center justify-center">
                <span className="text-5xl font-serif font-bold text-gold group-hover:scale-125 transition-transform duration-700">
                    {profile.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                </span>
            </div>
        );
    };

    return (
        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-32 animate-fade-up">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*"
            />
            
            {/* Profile Summary Card */}
            <Card className="text-center p-8 border-gold/10 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-gold/10 to-transparent opacity-50" />

                <div 
                    onClick={handleImageClick}
                    className="relative mx-auto w-40 h-40 rounded-[48px] overflow-hidden border-2 border-gold/10 hover:border-gold/30 shadow-2xl mb-10 transition-all duration-700 cursor-pointer group/avatar"
                >
                    <div className="absolute inset-0 bg-background/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center z-10 transition-all duration-700">
                        <Icon icon="camera" size={28} className="text-gold animate-pulse" />
                    </div>
                    {renderAvatar()}
                </div>

                <h2 className="text-2xl font-bold font-serif text-cream mb-1">{profile.name}</h2>
                <p className="text-gold/80 text-sm mb-6">{profile.email}</p>

                <div className="flex justify-center gap-4 text-sm text-stone-400 mb-8">
                    <span className="flex items-center gap-1.5">
                        <Icon icon="phone" size={14} />
                        {profile.phone}
                    </span>
                </div>

                <div className="space-y-3">
                    <Button
                        variant={isEditing ? "secondary" : "primary"}
                        fullWidth
                        onClick={onToggleEdit}
                        className="py-4 !rounded-2xl text-xs font-bold shadow-2xl shadow-gold/10"
                    >
                        {isEditing ? "Cancel editing" : "Edit profile"}
                    </Button>
                </div>
            </Card>


        </div>
    );
};
