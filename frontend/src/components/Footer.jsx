import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim().includes('@')) {
      setMsg("You're subscribed! 🎶");
      setEmail('');
    } else {
      setMsg("Please enter a valid email.");
    }
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">
              {/* Swapped inline SVG for custom uploaded PNG logo */}
              <img 
                src="/logo.png" 
                alt="SINCE'20" 
                style={{ height: '44px', objectFit: 'contain', marginRight: '6px' }} 
              />
              <span className="logo-text" style={{ fontSize: '20px' }}>SINCE<span>'20</span></span>
            </div>
            <p>Helping independent artists and labels distribute, manage and monetize their music globally — since 2020.</p>
            <div className="social-row">
              <a href="#instagram"><i className="fa-brands fa-instagram"></i></a>
              <a href="#facebook"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#youtube"><i className="fa-brands fa-youtube"></i></a>
              <a href="#tiktok"><i className="fa-brands fa-tiktok"></i></a>
              <a href="#twitter"><i className="fa-brands fa-x-twitter"></i></a>
            </div>
          </div>
          <div>
            <h4>NAVIGATION</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/platforms">Platforms</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4>SERVICES</h4>
            <ul>
              <li><Link to="/services">Distribution</Link></li>
              <li><Link to="/services">Royalty Payments</Link></li>
              <li><Link to="/services">Rights Management</Link></li>
              <li><Link to="/services">Analytics & PR</Link></li>
            </ul>
          </div>
          <div>
            <h4>STAY UPDATED</h4>
            <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '14px' }}>Subscribe for release tips and platform updates.</p>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="Your email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
              <button type="submit"><i className="fa-solid fa-paper-plane"></i></button>
            </form>
            {msg && <div className="news-msg" style={{ fontSize: '12.5px', color: 'var(--yellow)', marginTop: '10px' }}>{msg}</div>}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 SINCE'20 Entertainments. All Rights Reserved.</span>
          <span><a href="#privacy">Privacy Policy</a> &nbsp;|&nbsp; <a href="#terms">Terms & Conditions</a></span>
        </div>
      </div>
    </footer>
  );
}
