import React from "react";
import Card from "./Card";
import Button from "./Button";

interface ProfileData {
    name: string;
    email: string;
    phone: string;
    profileImage: string;
}

interface ProfileEditFormProps {
    profile: ProfileData;
    setProfile: (profile: ProfileData) => void;
    onCancel: () => void;
    onSave: () => void;
}

export const ProfileEditForm = ({
    profile,
    setProfile,
    onCancel,
    onSave
}: ProfileEditFormProps) => {
    return (
        <Card className="p-8 animate-fade-in-up border-gold/10">
            <h3 className="text-xl font-serif text-gold mb-6 pb-4 border-b border-white/5">Edit Personal Details</h3>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-cream focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all placeholder:text-white/30"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">Phone Number</label>
                        <input
                            type="number"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            onInput={(e) => {
                                const input = e.target as HTMLInputElement;
                                if (input.value.length > 10) input.value = input.value.slice(0, 10);
                            }}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-cream focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all placeholder:text-white/30"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-stone-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-cream focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all placeholder:text-white/30"
                        />
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-4">
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                        Save Changes
                    </Button>
                </div>
            </form>
        </Card>
    );
};
