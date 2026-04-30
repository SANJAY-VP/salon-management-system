import React from "react";
import Card from "./Card";
import Button from "./Button";
import { Icon } from "./Icon";
import ImageUploader from "./ImageUploader";
import { useAuthStore } from "../../hooks/useAuthStore";
import api from "../../services/api";
import { resolveAvatarImage } from "../../config/images";
import type { UploadResult } from "../../services/image.service";
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
    menuItems: _menuItems
}: ProfileSidebarProps) => {
    const { user, updateUser } = useAuthStore();

    const handleAvatarUpload = async (result: UploadResult) => {
        try {
            await api.put("/api/v1/auth/me", { avatar: result.filename });
            updateUser({
                avatar: result.filename,
                profileImage: result.url,
            });
        } catch {
            toast.error("Could not save profile photo.");
        }
    };

    const initialAvatar = resolveAvatarImage(user?.avatar, user?.id);

    return (
        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-32 animate-fade-up">
            {/* Profile Summary Card */}
            <Card className="text-center p-8 border-gold/10 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-gold/10 to-transparent opacity-50" />

                <div className="relative mx-auto mb-10 flex justify-center">
                    <ImageUploader
                        variant="avatar"
                        context="avatar"
                        entityId={user?.id}
                        initialUrl={profile.profileImage || initialAvatar}
                        name={profile.name}
                        onUpload={handleAvatarUpload}
                        className="w-40 h-40 rounded-[48px]"
                    />
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
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={onLogout}
                        className="py-3 !rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/50 border-white/10"
                    >
                        Sign out
                    </Button>
                </div>
            </Card>


        </div>
    );
};
