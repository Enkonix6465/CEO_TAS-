import React, { useState, useEffect } from "react";
import { useThemeStore } from "../store/themeStore";
import { useAuthStore } from "../store/authStore";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Globe,
  Palette,
  Lock,
  Download,
  Upload,
  Save,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { sendPasswordResetEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import toast from "react-hot-toast";

const Settings = () => {
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    location: "",
    bio: "",
    avatar: "",
  });

  const [preferences, setPreferences] = useState({
    theme: theme,
    language: "en",
    timezone: "UTC",
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: "30",
    loginHistory: true,
    deviceTracking: true,
  });

  const [passwordReset, setPasswordReset] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showPasswordForm: false,
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      if (preferences.theme !== theme) {
        setTheme(preferences.theme);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Preferences saved successfully");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Security settings updated successfully");
    } catch (error) {
      toast.error("Failed to update security settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordReset.newPassword !== passwordReset.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordReset.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!passwordReset.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    setIsChangingPassword(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error("No authenticated user found");
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordReset.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, passwordReset.newPassword);

      toast.success("Password updated successfully!");
      setPasswordReset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        showPasswordForm: false,
      });
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        toast.error("Current password is incorrect");
      } else if (error.code === 'auth/weak-password') {
        toast.error("New password is too weak");
      } else {
        toast.error("Failed to update password. Please try again.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendPasswordResetEmail = async () => {
    if (!user?.email) {
      toast.error("No email address found");
      return;
    }

    setIsSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        toast.error("No account found with this email address");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-violet-200/20 to-purple-200/20 dark:from-violet-900/10 dark:to-purple-900/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-violet-200/20 dark:from-indigo-900/10 dark:to-violet-900/10 rounded-full blur-3xl opacity-60"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-violet-200/50 dark:border-violet-500/20 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-xs text-violet-600/70 dark:text-violet-300/70 font-medium">
              Manage your preferences
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-64 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-r border-violet-200/50 dark:border-violet-500/20 p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Profile Information</h2>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {profileData.fullName.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <button className="flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-500/30 transition-colors">
                        <Upload className="w-4 h-4" />
                        Change Avatar
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG up to 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                        className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Preferences</h2>
                  
                  {/* Theme Setting */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Monitor },
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setPreferences({...preferences, theme: option.value})}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                              preferences.theme === option.value
                                ? 'bg-violet-100 dark:bg-violet-500/20 border-violet-300 dark:border-violet-500 text-violet-700 dark:text-violet-300'
                                : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-500/10'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Other Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Language
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                        className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
                        className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="GMT">Greenwich Mean Time</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    disabled={isLoading}
                    className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Security Settings</h2>
                  
                  <div className="space-y-6">
                    {/* Two Factor Auth */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <h3 className="font-medium text-slate-800 dark:text-white">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                      </div>
                      <button
                        onClick={() => setSecurity({...security, twoFactorEnabled: !security.twoFactorEnabled})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          security.twoFactorEnabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Session Timeout */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <select
                        value={security.sessionTimeout}
                        onChange={(e) => setSecurity({...security, sessionTimeout: e.target.value})}
                        className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>

                    {/* Login History */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <h3 className="font-medium text-slate-800 dark:text-white">Login History</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Keep track of login sessions</p>
                      </div>
                      <button
                        onClick={() => setSecurity({...security, loginHistory: !security.loginHistory})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          security.loginHistory ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            security.loginHistory ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Password Management */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Password Management</h3>

                    <div className="space-y-4">
                      {/* Change Password */}
                      <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-slate-800 dark:text-white">Change Password</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
                          </div>
                          <button
                            onClick={() => setPasswordReset({...passwordReset, showPasswordForm: !passwordReset.showPasswordForm})}
                            className="px-4 py-2 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-500/30 transition-colors flex items-center gap-2"
                          >
                            <KeyRound className="w-4 h-4" />
                            {passwordReset.showPasswordForm ? 'Cancel' : 'Change Password'}
                          </button>
                        </div>

                        {passwordReset.showPasswordForm && (
                          <div className="space-y-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Current Password
                              </label>
                              <input
                                type="password"
                                value={passwordReset.currentPassword}
                                onChange={(e) => setPasswordReset({...passwordReset, currentPassword: e.target.value})}
                                className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="Enter current password"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                New Password
                              </label>
                              <input
                                type="password"
                                value={passwordReset.newPassword}
                                onChange={(e) => setPasswordReset({...passwordReset, newPassword: e.target.value})}
                                className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="Enter new password"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Confirm New Password
                              </label>
                              <input
                                type="password"
                                value={passwordReset.confirmPassword}
                                onChange={(e) => setPasswordReset({...passwordReset, confirmPassword: e.target.value})}
                                className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="Confirm new password"
                              />
                            </div>

                            <button
                              onClick={handleChangePassword}
                              disabled={isChangingPassword}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg font-medium disabled:opacity-50"
                            >
                              {isChangingPassword ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Updating Password...
                                </>
                              ) : (
                                <>
                                  <KeyRound className="w-4 h-4" />
                                  Update Password
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Send Reset Email */}
                      <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-800 dark:text-white">Reset via Email</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Send password reset link to your email</p>
                          </div>
                          <button
                            onClick={handleSendPasswordResetEmail}
                            disabled={isSendingResetEmail}
                            className="px-4 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {isSendingResetEmail ? (
                              <>
                                <div className="w-4 h-4 border-2 border-blue-700/30 border-t-blue-700 rounded-full animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4" />
                                Send Reset Email
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSecurity}
                    disabled={isLoading}
                    className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Saving...' : 'Save Security Settings'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                      { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser push notifications' },
                      { key: 'marketingEmails', label: 'Marketing Emails', description: 'Product updates and announcements' },
                      { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Summary of your weekly activity' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div>
                          <h3 className="font-medium text-slate-800 dark:text-white">{item.label}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                        </div>
                        <button
                          onClick={() => setPreferences({...preferences, [item.key]: !preferences[item.key as keyof typeof preferences]})}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            preferences[item.key as keyof typeof preferences] ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              preferences[item.key as keyof typeof preferences] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    disabled={isLoading}
                    className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Saving...' : 'Save Notification Settings'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
