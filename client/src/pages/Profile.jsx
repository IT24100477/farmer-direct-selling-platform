import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { logout, setUser } from '../redux/slices/authSlice.js';

const Modal = ({ open, title, description, children, onClose, actions }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1f17]/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#d2e4d8] bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-semibold text-[#153a2b]">{title}</h3>
        {description && <p className="mt-1 text-sm text-[#4f6d5c]">{description}</p>}
        <div className="mt-4">{children}</div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#c8ddcf] bg-white px-3 py-2 text-sm font-semibold text-[#315744] hover:bg-[#f4faf6]"
          >
            Cancel
          </button>
          {actions}
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    profileImage: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [confirmText, setConfirmText] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      profileImage: user.profileImage || ''
    });
  }, [user]);

  const initials = useMemo(() => {
    const source = profileForm.name || user?.name || 'User';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [profileForm.name, user?.name]);

  const validateProfile = () => {
    if (!profileForm.name.trim()) return 'Name is required.';
    if (!profileForm.email.trim()) return 'Email is required.';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(profileForm.email.trim())) return 'Please enter a valid email address.';
    return '';
  };

  const saveProfile = async () => {
    const validation = validateProfile();
    if (validation) {
      toast.error(validation);
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        profileImage: profileForm.profileImage.trim()
      };
      const { data } = await api.put('/users/me', payload);
      dispatch(setUser(data));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const openPasswordConfirm = () => {
    setPasswordError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    setPasswordModalOpen(true);
  };

  const submitPasswordChange = async () => {
    setChangingPassword(true);
    try {
      await api.put('/users/me/password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordModalOpen(false);
      setPasswordError('');
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const deactivateAccount = async () => {
    setDeactivating(true);
    try {
      await api.put('/users/me/deactivate');
      dispatch(logout());
      setDeactivateModalOpen(false);
      toast.success('Account deactivated');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate account');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="relative isolate overflow-hidden bg-[#f4f7f2]">
      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-[#d9ebde] blur-3xl" />
      <div className="pointer-events-none absolute top-72 -right-20 h-64 w-64 rounded-full bg-[#f7ebd5] blur-3xl" />

      <main className="relative max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <section className="rounded-3xl border border-[#d8e7dd] bg-gradient-to-r from-[#f8fcf8] via-white to-[#f3f8f4] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1f7a4d]">Account settings</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#153a2b]">Profile Management</h1>
          <p className="mt-2 text-sm text-[#4f6d5c]">
            Keep your details accurate and secure. Update personal information, change password, and manage account status.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-[0_16px_30px_-18px_rgba(20,64,45,0.55)]">
              <div className="flex items-center gap-4">
                {profileForm.profileImage ? (
                  <img
                    src={profileForm.profileImage}
                    alt={profileForm.name || 'Profile'}
                    className="h-20 w-20 rounded-2xl object-cover ring-2 ring-[#d8e7dd]"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#e8f3ec] text-2xl font-bold text-[#1f7a4d]">
                    {initials || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-[#153a2b]">{profileForm.name || 'User'}</p>
                  <p className="truncate text-sm text-[#567162]">{profileForm.email || 'No email provided'}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#1f7a4d]">
                    Role: {user?.role || 'customer'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#f0d2ce] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#153a2b]">Danger Zone</h2>
              <p className="mt-1 text-sm text-[#6f4f4a]">
                Deactivating your account disables login access until reactivated by an administrator.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirmText('');
                  setDeactivateModalOpen(true);
                }}
                className="mt-4 rounded-lg border border-[#e59d93] bg-[#fff5f4] px-4 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#ffeceb]"
              >
                Deactivate Account
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-[#153a2b]">Personal Information</h2>
              <p className="mt-1 text-sm text-[#4f6d5c]">These details are used across orders, notifications, and account records.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="auth-label">Full Name</label>
                  <input
                    className="auth-input"
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="auth-label">Email</label>
                  <input
                    className="auth-input"
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="auth-label">Phone</label>
                  <input
                    className="auth-input"
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="auth-label">Profile Image URL</label>
                  <input
                    className="auth-input"
                    value={profileForm.profileImage}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, profileImage: event.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="auth-label">Address</label>
                  <textarea
                    className="auth-input min-h-[90px]"
                    value={profileForm.address}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, address: event.target.value }))}
                    placeholder="Enter your address"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={saveProfile}
                disabled={savingProfile}
                className="mt-4 btn disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            <div className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-[#153a2b]">Change Password</h2>
              <p className="mt-1 text-sm text-[#4f6d5c]">For security, use at least 6 characters with a mix of letters and numbers.</p>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="auth-label">Current Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    placeholder="Current password"
                  />
                </div>
                <div>
                  <label className="auth-label">New Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    placeholder="New password"
                  />
                </div>
                <div>
                  <label className="auth-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
              <button type="button" onClick={openPasswordConfirm} className="mt-4 btn">
                Change Password
              </button>
            </div>
          </div>
        </section>
      </main>

      <Modal
        open={passwordModalOpen}
        title="Confirm Password Change"
        description="This will update your login password immediately."
        onClose={() => setPasswordModalOpen(false)}
        actions={
          <button
            type="button"
            onClick={submitPasswordChange}
            disabled={changingPassword}
            className="rounded-lg bg-[#1f7a4d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#18643f] disabled:opacity-60"
          >
            {changingPassword ? 'Updating...' : 'Confirm Change'}
          </button>
        }
      >
        <p className="text-sm text-[#4f6d5c]">
          After updating, use your new password for future logins.
        </p>
      </Modal>

      <Modal
        open={deactivateModalOpen}
        title="Deactivate Account"
        description="Type DEACTIVATE to confirm this action."
        onClose={() => setDeactivateModalOpen(false)}
        actions={
          <button
            type="button"
            onClick={deactivateAccount}
            disabled={deactivating || confirmText !== 'DEACTIVATE'}
            className="rounded-lg bg-[#b42318] px-3 py-2 text-sm font-semibold text-white hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deactivating ? 'Deactivating...' : 'Deactivate'}
          </button>
        }
      >
        <input
          className="auth-input"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder="Type DEACTIVATE"
        />
      </Modal>
    </div>
  );
};

export default Profile;
