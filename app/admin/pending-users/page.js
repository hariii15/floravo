'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { logOut } from '../../../lib/auth';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Admin Data states
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const [newCodeInput, setNewCodeInput] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [codeSuccessMsg, setCodeSuccessMsg] = useState('');

  // Dashboard Tab states
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'users', 'codes'
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Verify Authentication & Role
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace('/');
      } else {
        setUser(u);
        try {
          const token = await u.getIdToken(true);
          const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const response = await fetch(`${apiHost}/api/auth/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (data.success && data.user.role === 'admin') {
            setIsAdmin(true);
          } else {
            router.replace('/builder');
          }
        } catch (err) {
          console.error('Admin verification error:', err);
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.warn('Admin offline local bypass activated.');
            setIsAdmin(true);
          } else {
            router.replace('/builder');
          }
        } finally {
          setCheckingAdmin(false);
          setCheckingAuth(false);
        }
      }
    });
    return () => unsub();
  }, [router]);

  // 2. Fetch Dashboard Data
  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoadingUsers(true);
    setLoadingCodes(true);
    setLoadingAllUsers(true);
    setLoadingMetrics(true);
    setErrorMsg('');

    try {
      const token = await auth.currentUser.getIdToken();
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // Fetch pending users
      const usersRes = await fetch(`${apiHost}/api/admin/pending-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setPendingUsers(usersData.users);
      } else {
        throw new Error(usersData.error || 'Failed to fetch pending users');
      }

      // Fetch invite codes
      const codesRes = await fetch(`${apiHost}/api/admin/invite-codes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const codesData = await codesRes.json();
      if (codesData.success) {
        setInviteCodes(codesData.inviteCodes);
      } else {
        throw new Error(codesData.error || 'Failed to fetch invite codes');
      }

      // Fetch all users
      const allUsersRes = await fetch(`${apiHost}/api/admin/all-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allUsersData = await allUsersRes.json();
      if (allUsersData.success) {
        setAllUsers(allUsersData.users);
      }

      // Fetch metrics
      const metricsRes = await fetch(`${apiHost}/api/admin/metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const metricsData = await metricsRes.json();
      if (metricsData.success) {
        setMetrics(metricsData.metrics);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error fetching data from server.');
    } finally {
      setLoadingUsers(false);
      setLoadingCodes(false);
      setLoadingAllUsers(false);
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // 3. User Approvals
  const handleApproveUser = async (id) => {
    setActionLoadingId(id);
    setErrorMsg('');
    try {
      const token = await auth.currentUser.getIdToken();
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiHost}/api/admin/users/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPendingUsers((prev) => prev.filter((u) => u._id !== id));
        setAllUsers((prev) => prev.map((u) => u._id === id ? { ...u, approved: true, role: 'user' } : u));
        fetchData(); // Recalculate metrics
      } else {
        throw new Error(data.error || 'Approval failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to approve user.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Update User Role & Access Status (e.g. Revoke permissions)
  const handleUpdateUser = async (id, updates) => {
    setActionLoadingId(id);
    setErrorMsg('');
    try {
      const token = await auth.currentUser.getIdToken();
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiHost}/api/admin/users/${id}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (data.success) {
        setAllUsers((prev) => prev.map((u) => u._id === id ? { ...u, ...updates } : u));
        if (updates.approved === false) {
          const userObj = allUsers.find((u) => u._id === id);
          if (userObj) {
            setPendingUsers((prev) => [...prev.filter((u) => u._id !== id), { ...userObj, ...updates }]);
          }
        } else if (updates.approved === true) {
          setPendingUsers((prev) => prev.filter((u) => u._id !== id));
        }
        fetchData(); // Recalculate metrics
      } else {
        throw new Error(data.error || 'Failed to update user');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update user settings.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Delete User Permanently
  const handleRejectUser = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this user? All their details will be removed.')) return;
    setActionLoadingId(id);
    setErrorMsg('');
    try {
      const token = await auth.currentUser.getIdToken();
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiHost}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPendingUsers((prev) => prev.filter((u) => u._id !== id));
        setAllUsers((prev) => prev.filter((u) => u._id !== id));
        fetchData(); // Recalculate metrics
      } else {
        throw new Error(data.error || 'Deletion failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete user.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 6. Invite Code Generator
  const handleGenerateCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setCodeSuccessMsg('');
    try {
      const token = await auth.currentUser.getIdToken();
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiHost}/api/admin/invite-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: newCodeInput.trim() || undefined })
      });
      const data = await response.json();
      if (data.success) {
        setInviteCodes((prev) => [data.inviteCode, ...prev]);
        setNewCodeInput('');
        setCodeSuccessMsg(`Invite code created: ${data.inviteCode.code}`);
        fetchData(); // Recalculate metrics
      } else {
        throw new Error(data.error || 'Failed to generate invite code');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error generating invite code.');
    }
  };

  const handleSignOut = async () => {
    await logOut();
    router.replace('/');
  };

  // User search filter logic
  const filteredUsers = allUsers.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.firebaseUid && u.firebaseUid.toLowerCase().includes(term))
    );
  });

  if (checkingAuth || checkingAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--parchment-light)' }}>
        <span className="font-typewriter text-sepia" style={{ fontSize: '0.8rem', letterSpacing: '3px' }}>Verifying Credentials…</span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--parchment-light)',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 24px',
      fontFamily: 'var(--font-typewriter)'
    }}>
      {/* Admin header */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 32px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--parchment-deep)',
        paddingBottom: '24px',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/flowers/Floravo - 3 - Edited.png" alt="Floravo Logo" style={{ height: 40, objectFit: 'contain' }} />
            <span style={{ fontSize: '0.7rem', background: 'var(--ink-brown)', color: 'white', padding: '3px 8px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Atelier Admin
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: '1.8rem', color: 'var(--ink-brown)', fontWeight: 600, marginTop: '8px' }}>
            Atelier Management Dashboard
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/builder')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '8px 18px', fontWeight: 'bold' }}>
            Back to Builder
          </button>
          <button onClick={handleSignOut} className="btn-primary" style={{ fontSize: '0.75rem', padding: '8px 18px', fontWeight: 'bold' }}>
            Depart
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="error-msg" style={{ maxWidth: '1200px', width: '100%', margin: '0 auto 24px auto' }} role="alert">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Metrics Row */}
      {metrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto 36px auto'
        }}>
          {[
            { label: 'Registered Users', value: metrics.totalUsers, desc: `${metrics.approvedUsers} Approved` },
            { label: 'Waitlist Queue', value: metrics.pendingUsers, desc: 'Awaiting Verification' },
            { label: 'Saved Bouquets', value: metrics.totalBouquets, desc: 'Created on platform' },
            { label: 'Beta Invite Codes', value: metrics.totalCodes, desc: `${metrics.totalCodes - metrics.claimedCodes} Available` }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.4)',
              border: '1px solid var(--parchment-deep)',
              padding: '24px 20px',
              borderRadius: '6px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--sepia-light)', marginBottom: '8px', fontWeight: 'bold' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--ink-brown)', margin: '4px 0' }}>
                {item.value}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--sepia)', fontStyle: 'italic' }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Navigation Menu */}
      <div style={{
        display: 'flex',
        gap: '8px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 24px auto',
        borderBottom: '1px solid var(--parchment-deep)',
        paddingBottom: '12px',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'queue', label: `Verification Queue (${pendingUsers.length})` },
          { id: 'users', label: `User Directory (${allUsers.length})` },
          { id: 'codes', label: `Beta Invite Codes (${inviteCodes.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setErrorMsg('');
              setCodeSuccessMsg('');
            }}
            style={{
              padding: '8px 18px',
              fontFamily: 'var(--font-typewriter)',
              fontSize: '0.72rem',
              letterSpacing: '1px',
              border: '1px solid black',
              background: activeTab === tab.id ? 'var(--ink-brown)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--ink-brown)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Areas */}
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', flex: 1 }}>

        {/* Tab 1: Verification Waitlist Queue */}
        {activeTab === 'queue' && (
          <div className="letter-card" style={{ padding: '36px', height: 'fit-content', background: 'white', border: '1px solid var(--parchment-deep)', borderRadius: '8px' }}>
            <div className="letter-card-inner" style={{ padding: '4px' }}>
              <h2 className="font-display" style={{ fontSize: '1.3rem', color: 'var(--ink-brown)', marginBottom: 8 }}>
                Verification Queue
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--sepia-light)', marginBottom: 20 }}>
                Review registered profiles waiting for permission to access the bouquet builder atelier.
              </p>
              <div style={{ borderBottom: '1px solid var(--parchment-deep)', marginBottom: 20 }} />

              {loadingUsers ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--sepia-light)', fontStyle: 'italic' }}>Loading queue list…</p>
              ) : pendingUsers.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--sepia-light)', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                  ✉ No pending registrations in queue.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {pendingUsers.map((item) => (
                    <div 
                      key={item._id}
                      style={{
                        background: 'rgba(0, 0, 0, 0.02)',
                        border: '1px solid var(--parchment-deep)',
                        borderRadius: '6px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--ink-brown)' }}>
                          {item.name || 'Anonymous User'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--sepia)', marginTop: '2px', wordBreak: 'break-all' }}>
                          {item.email}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--sepia-light)', marginTop: '8px' }}>
                          UID: {item.firebaseUid}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--sepia-light)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Registered: {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApproveUser(item._id)}
                          disabled={actionLoadingId !== null}
                          className="btn-secondary"
                          style={{
                            flex: 1.2,
                            fontSize: '0.7rem',
                            padding: '6px 12px',
                            background: 'rgba(122, 79, 42, 0.1)',
                            borderColor: 'var(--sepia)',
                            color: 'var(--sepia)'
                          }}
                        >
                          {actionLoadingId === item._id ? 'Approve…' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => handleRejectUser(item._id)}
                          disabled={actionLoadingId !== null}
                          className="btn-ghost"
                          style={{
                            flex: 0.8,
                            fontSize: '0.7rem',
                            padding: '6px 12px',
                            color: 'var(--postal-red)',
                            borderColor: 'rgba(200, 50, 50, 0.2)'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: User Directory (Search & Management) */}
        {activeTab === 'users' && (
          <div className="letter-card" style={{ padding: '36px', height: 'fit-content', background: 'white', border: '1px solid var(--parchment-deep)', borderRadius: '8px' }}>
            <div className="letter-card-inner" style={{ padding: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                <div>
                  <h2 className="font-display" style={{ fontSize: '1.3rem', color: 'var(--ink-brown)', marginBottom: 4 }}>
                    User Directory
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--sepia-light)' }}>
                    Search and manage roles, modify permissions, or revoke access for all registered profiles.
                  </p>
                </div>
                
                {/* Search Bar */}
                <input
                  type="text"
                  className="vintage-input"
                  placeholder="Search by name, email, or UID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '0.75rem', padding: '8px 12px', maxWidth: '300px', width: '100%' }}
                />
              </div>
              <div style={{ borderBottom: '1px solid var(--parchment-deep)', marginBottom: 20 }} />

              {loadingAllUsers ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--sepia-light)', fontStyle: 'italic' }}>Loading directory list…</p>
              ) : filteredUsers.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--sepia-light)', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                  No users matched your search criteria.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredUsers.map((item) => (
                    <div 
                      key={item._id}
                      style={{
                        background: 'rgba(0, 0, 0, 0.02)',
                        border: '1px solid var(--parchment-deep)',
                        borderRadius: '6px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                      }}
                    >
                      <div style={{ minWidth: '220px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--ink-brown)' }}>
                            {item.name || 'Anonymous User'}
                          </span>
                          {/* Badges */}
                          <span style={{ 
                            fontSize: '0.55rem', 
                            background: item.role === 'admin' ? 'var(--ink-brown)' : 'rgba(0,0,0,0.06)', 
                            color: item.role === 'admin' ? 'white' : 'var(--sepia)', 
                            padding: '2px 6px', 
                            borderRadius: '3px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {item.role}
                          </span>
                          <span style={{ 
                            fontSize: '0.55rem', 
                            background: item.approved ? 'rgba(0, 150, 0, 0.08)' : 'rgba(200, 50, 50, 0.08)', 
                            color: item.approved ? 'green' : 'var(--postal-red)', 
                            padding: '2px 6px', 
                            borderRadius: '3px',
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                          }}>
                            {item.approved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--sepia)', marginTop: '4px', wordBreak: 'break-all' }}>
                          {item.email}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--sepia-light)', marginTop: '4px' }}>
                          UID: {item.firebaseUid} {item.inviteCode && `• Code: ${item.inviteCode}`}
                        </div>
                      </div>

                      {/* Directory Action Controls */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {item.approved ? (
                          <button
                            onClick={() => handleUpdateUser(item._id, { approved: false, role: 'pending' })}
                            disabled={actionLoadingId !== null}
                            className="btn-secondary"
                            style={{
                              fontSize: '0.68rem',
                              padding: '6px 12px',
                              background: 'transparent',
                              borderColor: 'var(--postal-red)',
                              color: 'var(--postal-red)'
                            }}
                          >
                            Revoke Access
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApproveUser(item._id)}
                            disabled={actionLoadingId !== null}
                            className="btn-secondary"
                            style={{
                              fontSize: '0.68rem',
                              padding: '6px 12px',
                              background: 'rgba(0,120,0,0.05)',
                              borderColor: 'green',
                              color: 'green'
                            }}
                          >
                            Approve
                          </button>
                        )}

                        {/* Admin Role toggler */}
                        <button
                          onClick={() => handleUpdateUser(item._id, { role: item.role === 'admin' ? 'user' : 'admin' })}
                          disabled={actionLoadingId !== null}
                          className="btn-secondary"
                          style={{
                            fontSize: '0.68rem',
                            padding: '6px 12px',
                            borderColor: 'var(--sepia)'
                          }}
                        >
                          {item.role === 'admin' ? 'Make User' : 'Make Admin'}
                        </button>

                        {/* Delete permanently */}
                        <button
                          onClick={() => handleRejectUser(item._id)}
                          disabled={actionLoadingId !== null}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: '0.68rem',
                            color: 'var(--postal-red)',
                            marginLeft: '8px',
                            textDecoration: 'underline'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Beta Invite Codes Management */}
        {activeTab === 'codes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {/* Generate Invite Form Card */}
            <div className="letter-card" style={{ padding: '36px', height: 'fit-content', background: 'white', border: '1px solid var(--parchment-deep)', borderRadius: '8px' }}>
              <div className="letter-card-inner" style={{ padding: '4px' }}>
                <h2 className="font-display" style={{ fontSize: '1.3rem', color: 'var(--ink-brown)', marginBottom: 8 }}>
                  Generate Invite Code
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--sepia-light)', marginBottom: 20 }}>
                  Create custom or randomly generated single-use codes to bypass queue authorization.
                </p>
                <div style={{ borderBottom: '1px solid var(--parchment-deep)', marginBottom: 20 }} />

                <form onSubmit={handleGenerateCode} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                      <label className="input-label" htmlFor="newCode" style={{ fontSize: '0.65rem', marginBottom: '6px', display: 'block' }}>
                        Custom Invite Code (Optional)
                      </label>
                      <input
                        id="newCode"
                        type="text"
                        className="vintage-input"
                        placeholder="e.g. SPECIAL-ATELIER"
                        value={newCodeInput}
                        onChange={(e) => setNewCodeInput(e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '9px 16px', whiteSpace: 'nowrap' }}
                    >
                      + Generate
                    </button>
                  </div>
                  {codeSuccessMsg && (
                    <div style={{ fontSize: '0.7rem', color: 'green', marginTop: '8px', fontWeight: 'bold' }}>
                      ✓ {codeSuccessMsg}
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* List Active Codes Card */}
            <div className="letter-card" style={{ padding: '36px', height: 'fit-content', background: 'white', border: '1px solid var(--parchment-deep)', borderRadius: '8px' }}>
              <div className="letter-card-inner" style={{ padding: '4px' }}>
                <h2 className="font-display" style={{ fontSize: '1.3rem', color: 'var(--ink-brown)', marginBottom: 8 }}>
                  Active & Claimed Codes
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--sepia-light)', marginBottom: 20 }}>
                  Single-use beta invitation credentials logs.
                </p>
                <div style={{ borderBottom: '1px solid var(--parchment-deep)', marginBottom: 20 }} />

                {loadingCodes ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--sepia-light)', fontStyle: 'italic' }}>Loading invite list…</p>
                ) : inviteCodes.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--sepia-light)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                    No invite codes created yet.
                  </p>
                ) : (
                  <div style={{
                    maxHeight: '380px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingRight: '6px'
                  }}>
                    {inviteCodes.map((item) => (
                      <div
                        key={item._id}
                        style={{
                          background: item.used ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.5)',
                          border: '1px solid var(--parchment-deep)',
                          borderRadius: '4px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.75rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', letterSpacing: '1px', color: item.used ? 'var(--sepia-light)' : 'var(--ink-brown)' }}>
                            {item.code}
                          </div>
                          {item.used && (
                            <div style={{ fontSize: '0.55rem', color: 'var(--sepia-light)', marginTop: '2px', wordBreak: 'break-all' }}>
                              Claimed by UID: {item.usedBy}
                            </div>
                          )}
                        </div>

                        <div>
                          {item.used ? (
                            <span style={{ fontSize: '0.6rem', color: 'var(--sepia-light)', textTransform: 'uppercase', border: '1px solid var(--parchment-deep)', padding: '2px 6px', borderRadius: '3px' }}>
                              Claimed
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.6rem', color: 'green', fontWeight: 'bold', textTransform: 'uppercase', background: 'rgba(0, 150, 0, 0.08)', padding: '2px 6px', borderRadius: '3px' }}>
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
