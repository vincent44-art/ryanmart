import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { user, logout, verifyAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      if (response.data.success) {
          // Attempt to store updated credentials in browser password manager
        try {
          if (navigator.credentials && navigator.credentials.create) {
            // Ensure we're using string values and handling the user object properly
            const userEmail = typeof user?.email === 'string' ? user.email : '';
            const userName = typeof user?.name === 'string' ? user.name : userEmail;
            
            const cred = await navigator.credentials.create({
              password: {
                id: userEmail,
                name: userName,
                password: newPassword,
              },
            });
            if (cred && navigator.credentials && navigator.credentials.store) {
              await navigator.credentials.store(cred);
            }
          }
        } catch (cmErr) {
          console.warn('Credential Management API store failed:', cmErr);
        }        toast.success('Password changed successfully!');
        // Refresh user data to update is_first_login status
        await verifyAuth();
        // Navigate back to the intended page or dashboard
        navigate(-1); // Go back to previous page
      } else {
        const errorMessage = typeof response.data.message === 'string' ? response.data.message : 'Failed to change password';
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Change password error:', error);
      const errorMsg = typeof error.response?.data?.message === 'string' ? error.response?.data?.message : 'Failed to change password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <div className="card card-custom" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h1 className="h3 mb-3 text-gradient">🔐 Change Password</h1>
            <p className="text-muted">Please set a new password for your account</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on">
            <div className="mb-3">
              <label htmlFor="currentPassword" className="form-label">Current Password</label>
              <div className="input-group">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="form-control"
                  id="currentPassword"
                  name="current-password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter your current password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowCurrent((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle current password visibility"
                  title={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <div className="input-group">
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-control"
                  id="newPassword"
                  name="new-password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter your new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowNew((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle new password visibility"
                  title={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
              <div className="input-group">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="form-control"
                  id="confirmPassword"
                  name="confirm-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle confirm password visibility"
                  title={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-gradient w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <small className="text-muted">
              Password must be at least 6 characters long
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
