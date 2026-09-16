import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuthToken, logout } from '../api';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAuthToken();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, [location, token]);

  const handleLogoutClick = (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const closeMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <nav className={scrolled ? 'scrolled' : ''}>
        <div className="container nav-inner">
          <Link to="/" className="logo" onClick={closeMenu}>
            {/* Swapped inline SVG for custom uploaded PNG logo */}
            <img 
              src="/logo.png" 
              alt="SINCE'20" 
              style={{ height: '40px', objectFit: 'contain', marginRight: '6px' }} 
            />
            <div>
              <span className="logo-text">SINCE<span>'20</span></span>
              <span className="logo-sub">ENTERTAINMENTS</span>
            </div>
          </Link>

          <div className="nav-links">
            <Link to="/" className={isActive('/')}>Home</Link>
            <Link to="/about" className={isActive('/about')}>About</Link>
            <Link to="/services" className={isActive('/services')}>Services</Link>
            <Link to="/platforms" className={isActive('/platforms')}>Platforms</Link>
            {/* Removed Artists Page Link from Main Menu as requested */}
            <Link to="/contact" className={isActive('/contact')}>Contact Us</Link>
            
            {user ? (
              <>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn btn-outline" style={{ padding: '8px 18px' }}>
                  Dashboard
                </Link>
                <a href="#logout" onClick={handleLogoutClick} className="btn btn-primary" style={{ padding: '8px 18px' }}>
                  Logout
                </a>
              </>
            ) : (
              <>
                <Link to="/auth/login" className={isActive('/auth/login')}>Login</Link>
                <Link to="/contact" className="btn btn-primary" style={{ padding: '8px 18px' }}>Get Started</Link>
              </>
            )}
          </div>

          <div className="burger-menu" onClick={() => setMobileOpen(!mobileOpen)}>
            <span style={{ transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
            <span style={{ opacity: mobileOpen ? 0 : 1 }}></span>
            <span style={{ transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></span>
          </div>
        </div>
      </nav>

      {/* Mobile Backdrop & Sidebar Menu */}
      <div 
        className={`menu-backdrop ${mobileOpen ? 'open' : ''}`} 
        onClick={closeMenu} 
        style={{ display: mobileOpen ? 'block' : 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 90 }}
      ></div>
      
      <div 
        className={`mobile-menu ${mobileOpen ? 'open' : ''}`}
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh', width: '75%', maxWidth: '320px',
          background: '#0a0a0a', borderLeft: '1px solid var(--border)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .45s var(--ease)',
          zIndex: 95, padding: '100px 36px 40px', display: 'flex', flexDirection: 'column', gap: '24px'
        }}
      >
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/about" onClick={closeMenu}>About</Link>
        <Link to="/services" onClick={closeMenu}>Services</Link>
        <Link to="/platforms" onClick={closeMenu}>Platforms</Link>
        {/* Removed Artists Page Link from Mobile Menu as requested */}
        <Link to="/contact" onClick={closeMenu}>Contact Us</Link>
        <hr style={{ borderColor: 'var(--border)' }} />
        {user ? (
          <>
            <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={closeMenu} className="btn btn-outline">
              Dashboard
            </Link>
            <a href="#logout" onClick={(e) => { handleLogoutClick(e); closeMenu(); }} className="btn btn-primary">
              Logout
            </a>
          </>
        ) : (
          <>
            <Link to="/auth/login" onClick={closeMenu}>Login</Link>
            <Link to="/contact" onClick={closeMenu} className="btn btn-primary">Get Started</Link>
          </>
        )}
      </div>
    </>
  );
}
