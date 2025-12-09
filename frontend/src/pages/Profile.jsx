import React, { useState, useEffect } from 'react';
import api from '../api/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/api/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        setUser(res.data.data);
        setName(res.data.data.name);
        setPreview(res.data.data.profile_image);
      });
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!profileImage) return;
    const formData = new FormData();
    formData.append('file', profileImage);
    try {
      const res = await api.post('/api/profile-image', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage('Profile image updated!');
      setPreview(res.data.data.profile_image);
    } catch (err) {
      setMessage('Image upload failed.');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/users/${user.id}`, {
        email: user.email,
        name,
        role: user.role,
        password: password || undefined,
        profile_image: preview
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage('Profile updated!');
    } catch (err) {
      setMessage('Profile update failed.');
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Profile</h2>
      <img src={preview || '/default-profile.png'} alt="Profile" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
      <form onSubmit={handleImageUpload} style={{ margin: '1rem 0' }}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <button type="submit">Upload Image</button>
      </form>
      <form onSubmit={handleProfileUpdate}>
        <div>Email: <b>{user.email}</b></div>
        <div>Role: <b>{user.role}</b></div>
        <div style={{ margin: '0.5rem 0' }}>
          <label>Name: </label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ margin: '0.5rem 0' }}>
          <label>New Password: </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit">Save Changes</button>
      </form>
      {message && <div style={{ marginTop: 10, color: 'green' }}>{message}</div>}
    </div>
  );
};

export default Profile;
