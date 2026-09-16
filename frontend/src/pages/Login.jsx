import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setAuthToken } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please provide email and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.login({ email, password });
      
      // Store token and user details in session/memory
      setAuthToken(response.token);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect based on the authorized database role returned by backend
      if (response.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authorization failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px' }}>
      
      {/* GLOW DECORATIONS */}
      <div className="blob blob1" style={{ position: 'absolute', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(255,212,0,0.06), transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>
      
      <div className="glass-card" style={{ maxWidth: '420px', width: '100%', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <img 
              src="/logo.png" 
              alt="SINCE'20" 
              style={{ height: '75px', width: 'auto', filter: 'drop-shadow(0 0 10px rgba(255,212,0,.2))' }} 
            />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Platform Login</h2>
          <p style={{ color: 'var(--gray)', fontSize: '13.5px', marginTop: '6px' }}>Access your SINCE'20 account portal</p>
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

        <form onSubmit={handleLoginSubmit}>
          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--gray)', display: 'block', marginBottom: '6px' }}>Email address</label>
            <input 
              type="email" 
              className="field" 
              placeholder="e.g. artist@since20.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--gray)', display: 'block', marginBottom: '6px' }}>Password</label>
            <input 
              type="password" 
              className="field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px 0', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13.5px', color: 'var(--gray)' }}>
          Don't have catalog access? <Link to="/auth/register" style={{ color: 'var(--yellow)', fontWeight: '600' }}>Register here</Link>
        </div>
      </div>
    </div>
  );
}
