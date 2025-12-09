import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Calculator from './Calculator';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showCalculator, setShowCalculator] = useState(false);
  const navigate = useNavigate();

  const getRoleColor = (role) => {
    const colors = {
      ceo: 'bg-danger',
      purchaser: 'bg-primary',
      seller: 'bg-success',
      driver: 'bg-warning',
      storekeeper: 'bg-info',
      default: 'bg-secondary'
    };
    return colors[role?.toLowerCase()] || colors.default;
  };

  const getRoleDisplayName = (role) => {
    const names = {
      ceo: 'CEO',
      purchaser: 'Purchaser',
      seller: 'Seller',
      driver: 'Driver',
      storekeeper: 'Store Keeper',
      default: 'User'
    };
    return names[role?.toLowerCase()] || names.default;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container-fluid">
          <a 
            className="navbar-brand d-flex align-items-center" 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            <span className="me-2">🍊</span>
            <span className="fw-bold">Ryanmartfruit company</span>
          </a>
          <div className="d-flex align-items-center">
            <button
              className="btn btn-outline-info me-3"
              onClick={() => window.location.reload()}
              title="Refresh Page"
              aria-label="Refresh page"
            >
              <i className="bi bi-arrow-clockwise fs-5"></i>
            </button>
            <button
              className="btn btn-outline-light me-3"
              onClick={() => setShowCalculator(true)}
              title="Calculator"
              aria-label="Open calculator"
            >
              <i className="bi bi-calculator fs-5"></i>
            </button>
            {user && (
              <div className="dropdown">
                <button 
                  className="btn btn-dark dropdown-toggle d-flex align-items-center"
                  type="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img
                    src={user.profile_image || '/default-profile.png'}
                    alt="Profile"
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }}
                  />
                  <span className={`badge ${getRoleColor(user?.role)} rounded-pill me-2`}>
                    {getRoleDisplayName(user?.role)}
                  </span>
                  <span className="d-none d-sm-inline">{user?.name}</span>
                  <i className="bi bi-person-circle ms-1"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  <li>
                    <div className="dropdown-header">
                      <div className="fw-bold">{user?.name}</div>
                      <div className="small text-muted">{user?.email}</div>
                    </div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <a 
                      className="dropdown-item" 
                      href="/profile" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <i className="bi bi-person me-2"></i>
                      Profile
                    </a>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={() => navigate('/settings')}
                    >
                      <i className="bi bi-gear me-2"></i>
                      Settings
                    </button>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button 
                      className="dropdown-item text-danger" 
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>
      {showCalculator && (
        <Calculator onClose={() => setShowCalculator(false)} />
      )}
    </>
  );
};

export default Navbar;