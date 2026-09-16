import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    artistName: '',
    country: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { name, email, password, phone, artistName, country } = formData;

    if (!name || !email || !password || !phone || !artistName || !country) {
      setError('Please fill in all registration fields.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      await api.register(formData);
      setSuccess('Account registered successfully! Redirecting to login portal...');
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '95vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px' }}>
      
      {/* GLOW DECORATIONS */}
      <div className="blob blob1" style={{ position: 'absolute', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,212,0,0.06), transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>
      
      <div className="glass-card" style={{ maxWidth: '480px', width: '100%', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {/* Swapped inline SVG for custom PNG logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <img 
              src="/logo.png" 
              alt="SINCE'20" 
              style={{ height: '75px', width: 'auto', filter: 'drop-shadow(0 0 10px rgba(255,212,0,.2))' }} 
            />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Artist Registration</h2>
          <p style={{ color: 'var(--gray)', fontSize: '13.5px', marginTop: '6px' }}>Request your music distribution catalog key</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(231, 76, 60, 0.08)', border: '1px solid rgba(231, 76, 60, 0.2)',
            color: '#ff6b6b', fontSize: '13.5px', padding: '12px', borderRadius: '8px', 
            marginBottom: '20px', textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(46, 204, 113, 0.08)', border: '1px solid rgba(46, 204, 113, 0.2)',
            color: '#2ecc71', fontSize: '13.5px', padding: '12px', borderRadius: '8px', 
            marginBottom: '20px', textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Full Name *</label>
              <input 
                type="text" 
                id="name" 
                className="field" 
                placeholder="John Doe" 
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Contact Phone *</label>
              <input 
                type="tel" 
                id="phone" 
                className="field" 
                placeholder="+94 77 123 4567" 
                value={formData.phone}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Artist Name *</label>
              <input 
                type="text" 
                id="artistName" 
                className="field" 
                placeholder="Stage / Brand Name" 
                value={formData.artistName}
                onChange={handleChange}
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Country *</label>
              <input 
                type="text" 
                id="country" 
                className="field" 
                placeholder="Sri Lanka" 
                value={formData.country}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Email Address *</label>
            <input 
              type="email" 
              id="email" 
              className="field" 
              placeholder="name@example.com" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Password * (Min 8 characters)</label>
            <input 
              type="password" 
              id="password" 
              className="field" 
              placeholder="••••••••" 
              value={formData.password}
              onChange={handleChange}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px 0', marginTop: '12px' }} disabled={loading}>
            {loading ? 'Submitting Registration...' : 'Create Roster Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13.5px', color: 'var(--gray)' }}>
          Already have an account? <Link to="/auth/login" style={{ color: 'var(--yellow)', fontWeight: '600' }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}
