import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function Settings() {
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const isAdmin = (user?.role || '').toUpperCase() === 'HEAD' || (user?.role || '').toUpperCase() === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Profile forms
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // User Management forms
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUserMode, setEditUserMode] = useState<string | null>(null); // user ID if editing
  const [umEmail, setUmEmail] = useState('');
  const [umRole, setUmRole] = useState('INVESTIGATOR');
  const [umPassword, setUmPassword] = useState('');
  const [umFullName, setUmFullName] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsersList(res);
    } catch (err) {
      showToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers();
    }
  }, [activeTab]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch('/users/me/password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      showToast('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      showToast(err.status === 400 ? 'Incorrect old password' : err.message || 'Failed to update password', 'error');
    }
  };

  const handleOpenUserModal = (u?: any) => {
    if (u) {
      setEditUserMode(u.id);
      setUmEmail(u.email);
      setUmRole(u.role);
      setUmFullName(u.full_name || '');
      setUmPassword('');
    } else {
      setEditUserMode(null);
      setUmEmail('');
      setUmRole('INVESTIGATOR');
      setUmFullName('');
      setUmPassword('');
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editUserMode) {
        const payload: any = { email: umEmail, role: umRole, full_name: umFullName };
        if (umPassword) payload.password = umPassword;
        await api.patch(`/users/${editUserMode}`, payload);
        showToast('User updated successfully');
      } else {
        await api.post('/users', {
          email: umEmail,
          role: umRole,
          full_name: umFullName,
          password: umPassword
        });
        showToast('User created successfully');
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to save user', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      showToast('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col font-mono text-xs">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
          <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
          System Settings & Profile
        </h2>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded flex items-center gap-2 ${toast.type === 'success' ? 'bg-status-success/20 text-status-success border border-status-success/30' : 'bg-status-critical/20 text-status-critical border border-status-critical/30'}`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-outline-variant mb-6 pb-2">
        <button
          className={`px-4 py-2 font-bold transition-all border-b-2 ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface'}`}
          onClick={() => setActiveTab('profile')}
        >
          MY PROFILE
        </button>
        {isAdmin && (
          <button
            className={`px-4 py-2 font-bold transition-all border-b-2 ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface'}`}
            onClick={() => setActiveTab('users')}
          >
            USER MANAGEMENT
          </button>
        )}
      </div>

      {/* Tab Content: Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-2xl">
          <div className="p-4 bg-surface-container border border-outline-variant rounded">
            <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">badge</span>
              CURRENT CREDENTIALS
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-outline uppercase block mb-1">Email / ID</label>
                <div className="text-sm text-on-surface font-bold">{user.email || 'N/A'}</div>
              </div>
              <div>
                <label className="text-[10px] text-outline uppercase block mb-1">Clearance Role</label>
                <div className={`text-xs font-bold inline-block px-2 py-0.5 rounded ${isAdmin ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-primary/10 text-primary border border-primary/30'}`}>
                  {user.role || 'INVESTIGATOR'}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="p-4 bg-surface-container border border-outline-variant rounded space-y-4">
            <h3 className="font-bold text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">password</span>
              CHANGE PASSPHRASE
            </h3>
            <div>
              <label className="text-[10px] text-outline uppercase block mb-1">Current Passphrase</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
              />
            </div>
            <div>
              <label className="text-[10px] text-outline uppercase block mb-1">New Passphrase</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-surface-container-lowest font-bold rounded shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:bg-primary-fixed transition-colors">
              UPDATE SECURITY CREDENTIALS
            </button>
          </form>
        </div>
      )}

      {/* Tab Content: Users Management */}
      {activeTab === 'users' && isAdmin && (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] text-outline">
              Manage system access and roles across the organization.
            </div>
            <button
              onClick={() => handleOpenUserModal()}
              className="bg-primary text-on-primary font-bold py-1.5 px-3 rounded flex items-center gap-2 hover:bg-primary-fixed transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              PROVISION NEW INVESTIGATOR
            </button>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="p-3 text-[10px] font-bold text-outline uppercase">Email</th>
                  <th className="p-3 text-[10px] font-bold text-outline uppercase">Full Name</th>
                  <th className="p-3 text-[10px] font-bold text-outline uppercase">Role</th>
                  <th className="p-3 text-[10px] font-bold text-outline uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="p-4 text-center text-outline">Loading records...</td></tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="border-b border-outline-variant/50 hover:bg-surface-variant/20 transition-colors">
                      <td className="p-3 font-bold text-on-surface">{u.email}</td>
                      <td className="p-3 text-on-surface-variant">{u.full_name || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'HEAD' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-primary/10 text-primary border border-primary/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 flex justify-end gap-2">
                        <button onClick={() => handleOpenUserModal(u)} className="p-1 rounded bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant transition-colors" title="Edit">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1 rounded bg-status-critical/10 hover:bg-status-critical/20 text-status-critical border border-status-critical/30 transition-colors" title="Revoke Access">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleSaveUser} className="bg-surface-container border border-outline-variant rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-[18px]">{editUserMode ? 'edit' : 'person_add'}</span>
              {editUserMode ? 'MODIFY CLEARANCE' : 'PROVISION ACCOUNT'}
            </h3>

            <div>
              <label className="text-[10px] text-outline uppercase block mb-1">Email Address</label>
              <input
                type="email" required
                value={umEmail} onChange={e => setUmEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
              />
            </div>
            <div>
              <label className="text-[10px] text-outline uppercase block mb-1">Full Name (Optional)</label>
              <input
                type="text"
                value={umFullName} onChange={e => setUmFullName(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
              />
            </div>
            <div>
              <label className="text-[10px] text-outline uppercase block mb-1">System Role</label>
              <select
                value={umRole} onChange={e => setUmRole(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
              >
                <option value="INVESTIGATOR">INVESTIGATOR (Standard Access)</option>
                <option value="HEAD">ADMINISTRATOR (Full Clearance)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-outline uppercase block mb-1">{editUserMode ? 'New Password (Leave blank to keep current)' : 'Initial Password'}</label>
              <input
                type="password" required={!editUserMode}
                value={umPassword} onChange={e => setUmPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
              <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 border border-outline-variant rounded text-outline hover:text-white transition-colors">
                CANCEL
              </button>
              <button type="submit" className="px-4 py-2 bg-primary text-surface-container-lowest font-bold rounded shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:bg-primary-fixed transition-colors">
                {editUserMode ? 'UPDATE RECORD' : 'CREATE ACCOUNT'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
