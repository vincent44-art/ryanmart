import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const RoleSeparatedUsers = ({ data }) => {
  const { getAllUsers, addUser, updateUser, deleteUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'purchaser',
    status: 'active'
  });
  const [users, setUsers] = useState([]);
  const [activeRole, setActiveRole] = useState('all');

  useEffect(() => {
    async function fetchUsers() {
      const allUsers = await getAllUsers();
      setUsers(Array.isArray(allUsers) ? allUsers : []);
    }
    fetchUsers();
  }, [showAddModal, getAllUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    const password = window.prompt('Enter password for new user:');
    if (!password) {
      alert('Password is required!');
      return;
    }
    const userToAdd = { ...newUser, password };
    const success = await addUser(userToAdd);
    if (success) {
      setNewUser({ name: '', email: '', role: 'purchaser', status: 'active' });
      setShowAddModal(false);
    }
  };

  const toggleUserStatus = (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    updateUser(userId, { status: newStatus });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ceo': return 'bg-danger';
      case 'purchaser': return 'bg-primary';
      case 'seller': return 'bg-success';
      case 'driver': return 'bg-warning';
      case 'storekeeper': return 'bg-info';
      case 'it': return 'bg-dark';
      case 'admin': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ceo': return 'bi-crown';
      case 'purchaser': return 'bi-cart';
      case 'seller': return 'bi-shop';
      case 'driver': return 'bi-truck';
      case 'storekeeper': return 'bi-boxes';
      case 'it': return 'bi-cpu';
      case 'admin': return 'bi-shield';
      default: return 'bi-person';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ceo': return 'CEO';
      case 'purchaser': return 'Purchaser';
      case 'seller': return 'Seller';
      case 'driver': return 'Driver';
      case 'storekeeper': return 'Storekeeper';
      case 'it': return 'IT';
      case 'admin': return 'Admin';
      default: return 'Unknown';
    }
  };

  // Group users by role
  const groupedUsers = users.reduce((groups, user) => {
    const role = user.role || 'unknown';
    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role].push(user);
    return groups;
  }, {});

  // Role statistics
  const roleStats = Object.keys(groupedUsers).map(role => ({
    role,
    count: groupedUsers[role].length,
    active: groupedUsers[role].filter(u => u.status === 'active').length,
    blocked: groupedUsers[role].filter(u => u.status === 'blocked').length
  }));

  const filteredUsers = activeRole === 'all' ? users : users.filter(user => user.role === activeRole);

  return (
    <div className="tab-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5>User Management by Role</h5>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-person-plus me-2"></i>Add User
        </button>
      </div>

      {/* Role Statistics Cards */}
      <div className="row mb-4">
        {roleStats.map(stat => (
          <div key={stat.role} className="col-md-3 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <i className={`bi ${getRoleIcon(stat.role)} fs-3 mb-2 text-primary`}></i>
                <h6 className="card-title">{getRoleDisplayName(stat.role)}</h6>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Total: {stat.count}</small>
                  <small className="text-success">Active: {stat.active}</small>
                </div>
                {stat.blocked > 0 && (
                  <small className="text-danger">Blocked: {stat.blocked}</small>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Filter Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeRole === 'all' ? 'active' : ''}`}
            onClick={() => setActiveRole('all')}
          >
            All Users ({users.length})
          </button>
        </li>
        {Object.keys(groupedUsers).map(role => (
          <li key={role} className="nav-item">
            <button
              className={`nav-link ${activeRole === role ? 'active' : ''}`}
              onClick={() => setActiveRole(role)}
            >
              <i className={`bi ${getRoleIcon(role)} me-1`}></i>
              {getRoleDisplayName(role)} ({groupedUsers[role].length})
            </button>
          </li>
        ))}
      </ul>

      {/* Users Table */}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${getRoleColor(user.role)} text-white`}>
                    <i className={`bi ${getRoleIcon(user.role)} me-1`}></i>
                    {user.role && typeof user.role === 'string' ? user.role.toUpperCase() : ''}
                  </span>
                </td>
                <td>
                  <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                    {user.status && typeof user.status === 'string' ? user.status.toUpperCase() : ''}
                  </span>
                </td>
                <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</td>
                <td>
                  {user.role !== 'ceo' && (
                    <>
                      <button
                        className={`btn btn-sm ${user.status === 'active' ? 'btn-warning' : 'btn-success'} me-2`}
                        onClick={() => toggleUserStatus(user.id, user.status)}
                      >
                        {user.status === 'active' ? 'Block' : 'Activate'}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleAddUser}>
                <div className="modal-header">
                  <h5 className="modal-title">Add New User</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                    <small className="form-text text-muted">
                      Email should contain the role name (except for CEO and Store Keeper)
                    </small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="purchaser">Purchaser</option>
                      <option value="seller">Seller</option>
                      <option value="driver">Driver</option>
                      <option value="storekeeper">Storekeeper</option>
                      <option value="it">IT</option>
                      <option value="admin">Admin</option>
                      <option value="ceo">CEO</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={newUser.status}
                      onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Add User</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSeparatedUsers;
