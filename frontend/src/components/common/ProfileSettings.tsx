import { useState, useEffect } from "react";
import Card from "./Card";
import Button from "./Button";
import Input from "./Input";
import { ConfirmDialog } from "./Modal";
import { authService, UpdateProfileRequest, ChangePasswordRequest } from "../../services/auth.service";
import { useAuthStore } from "../../hooks/useAuthStore";
import ImageUploader from "./ImageUploader";
import { resolveAvatarImage } from "../../config/images";
import toast from "react-hot-toast";

export default function ProfileSettings() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "account">("profile");
  const [loading, setLoading] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState<UpdateProfileRequest>({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    current_password: "",
    new_password: ""
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: (user as any).full_name || (user as any).name || "",
        phone: (user as any).phone || "",
        address: (user as any).address || "",
        city: (user as any).city || "",
        state: (user as any).state || "",
        pincode: (user as any).pincode || ""
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile(profileData);
      updateUser(updatedUser);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword(passwordData);
      setPasswordData({ current_password: "", new_password: "" });
      toast.success("Password changed successfully!");
    } catch (error: any) {
       toast.error(error?.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeactivation = async () => {
    setLoading(true);
    try {
      await authService.deactivateAccount();
      toast.success("Account deactivated successfully");
      window.location.href = "/login";
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to deactivate account");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    } catch (error) {
      // Still logout even if API call fails
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-1 mb-6 bg-coffee/30 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("profile")}
          role="tab"
          aria-selected={activeTab === "profile"}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === "profile"
              ? "bg-gold text-black"
              : "text-cream/60 hover:text-cream"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("password")}
          role="tab"
          aria-selected={activeTab === "password"}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === "password"
              ? "bg-gold text-black"
              : "text-cream/60 hover:text-cream"
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setActiveTab("account")}
          role="tab"
          aria-selected={activeTab === "account"}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === "account"
              ? "bg-gold text-black"
              : "text-cream/60 hover:text-cream"
          }`}
        >
          Account
        </button>
      </div>

      {activeTab === "profile" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-cream mb-6">Profile Information</h2>

          {/* Avatar upload */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/10">
            <ImageUploader
              variant="avatar"
              context="avatar"
              entityId={user?.id}
              initialUrl={resolveAvatarImage(user?.avatar, user?.id)}
              name={user?.fullName || user?.name}
              onUpload={async (result) => {
                try {
                  const updated = await authService.updateProfile({ avatar: result.filename });
                  updateUser({ avatar: updated.avatar ?? result.filename });
                } catch {
                  toast.error("Failed to save avatar.");
                }
              }}
            />
            <div>
              <p className="text-sm font-bold text-cream mb-1">Profile Photo</p>
              <p className="text-xs text-cream/50">Click to upload · JPEG, PNG or WebP · Max 5 MB</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <Input
              label="Full Name"
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              placeholder="Enter your full name"
            />
            <Input
              label="Phone Number"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              placeholder="Enter your phone number"
            />
            <Input
              label="Address"
              value={profileData.address}
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              placeholder="Enter your address"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={profileData.city}
                onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                placeholder="City"
              />
              <Input
                label="State"
                value={profileData.state}
                onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                placeholder="State"
              />
            </div>
            <Input
              label="Pincode"
              value={profileData.pincode}
              onChange={(e) => setProfileData({ ...profileData, pincode: e.target.value })}
              placeholder="Enter pincode"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </Card>
      )}

      {activeTab === "password" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-cream mb-6">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              type="password"
              label="Current Password"
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              placeholder="Enter current password"
              required
            />
            <Input
              type="password"
              label="New Password"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              placeholder="Enter new password (min 6 characters)"
              required
            />
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </Card>
      )}

      {activeTab === "account" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-cream mb-6">Account Settings</h2>
          <div className="space-y-4">
            <div className="p-4 bg-coffee/20 rounded-lg border border-white/10">
              <p className="text-cream/60 text-sm mb-2">Email Address</p>
              <p className="text-cream font-medium">{user?.email}</p>
              <p className="text-cream/60 text-xs mt-1">Email cannot be changed</p>
            </div>
            <div className="p-4 bg-coffee/20 rounded-lg border border-white/10">
              <p className="text-cream/60 text-sm mb-2">Account Status</p>
              <p className="text-cream font-medium">
                {(user as any)?.is_active !== false ? "Active" : "Inactive"}
              </p>
              <p className="text-cream/60 text-xs mt-1">
                {(user as any)?.is_verified ? "Verified" : "Not Verified"}
              </p>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="w-full"
              >
                Logout
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeactivateConfirm(true)}
                disabled={loading}
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                {loading ? "Deactivating..." : "Deactivate Account"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={showDeactivateConfirm}
        title="Deactivate Account"
        message="Are you sure you want to deactivate your account? This action cannot be undone and you will lose access to all your data."
        confirmText="Deactivate"
        cancelText="Cancel"
        isDangerous
        onConfirm={() => { setShowDeactivateConfirm(false); handleAccountDeactivation(); }}
        onCancel={() => setShowDeactivateConfirm(false)}
      />
    </div>
  );
}
