import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Form submitted with:', { email, password: '***' });
      const result = await login(email, password);

      if (!result.success) {
        setError(result.error || 'Login failed');
        console.error('Login failed:', result.error);
      } else {
        console.log('Login successful, checking first login...');
        if (result.isFirstLogin) {
          console.log('First login detected, redirecting to change password...');
          navigate('/change-password');
        } else {
          console.log('Not first login, redirecting to dashboard...');
          navigate('/');  // 👈 Redirect user to dashboard (or main page)
        }
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        status: error.status,
        response: error.response?.data,
        isNetworkError: error.isNetworkError,
        isHtmlError: error.isHtmlError
      });
      
      // Show more specific error message
      if (error.isNetworkError) {
        setError('Cannot connect to server. Please check your connection and try again.');
      } else if (error.isHtmlError) {
        setError('Server error: Received invalid response. Please try again later.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <div className="card card-custom" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h1 className="h3 mb-3 text-gradient">🍊RYANMART GROCERIES</h1>
            <p className="text-muted">RYANMART GROCERIES</p>
          </div>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} autoComplete="on">
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="username"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  id="password"
                  name="current-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
