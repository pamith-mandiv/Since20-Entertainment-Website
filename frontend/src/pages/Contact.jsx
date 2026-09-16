import { useState } from 'react';
import { api } from '../api';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    spotify: '',
    youtube: '',
    email: '',
    about: ''
  });
  const [msg, setMsg] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.email.includes('@') || !formData.phone || !formData.about) {
      setMsg({ text: 'Please fill in all required fields and provide a valid email.', isError: true });
      setLoading(false);
      return;
    }

    try {
      await api.submitContactForm(formData);
      setMsg({ text: 'Thanks! Your invitation request has been successfully received.', isError: false });
      setFormData({
        name: '',
        phone: '',
        spotify: '',
        youtube: '',
        email: '',
        about: ''
      });
    } catch (err) {
      setMsg({ text: err.message || 'Failed to submit application.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: '120px', paddingBottom: '80px', width: '100%', overflowX: 'hidden' }}>
      {/* PAGE HEADER */}
      <section className="container" style={{ textAlign: 'center', marginBottom: '60px' }}>
        <span className="label-tag">GET IN TOUCH</span>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: '800', marginBottom: '20px' }}>Join the Roster</h1>
        <p style={{ color: 'var(--gray)', fontSize: 'clamp(15px, 2vw, 18px)', maxWidth: '680px', margin: '0 auto', padding: '0 10px' }}>
          Ready to release globally? Submit an application to request catalog access, or reach out to our office directly.
        </p>
      </section>

      {/* CONTACT GRID */}
      <section className="container">
        <div className="two-col-mobile" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '30px' }}>
          
          {/* APPLICATION FORM */}
          <div className="glass-card">
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Request an Invitation</h3>
            <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '26px' }}>Tell us about yourself and your music — we'll review and get back to you.</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <input 
                  className="field" 
                  type="text" 
                  id="name" 
                  placeholder="Full name" 
                  value={formData.name}
                  onChange={handleChange}
                  required 
                />
                <input 
                  className="field" 
                  type="tel" 
                  id="phone" 
                  placeholder="Contact number" 
                  value={formData.phone}
                  onChange={handleChange}
                  required 
                />
              </div>
              <input 
                className="field" 
                type="url" 
                id="spotify" 
                placeholder="Spotify profile link (if available)" 
                value={formData.spotify}
                onChange={handleChange}
              />
              <input 
                className="field" 
                type="url" 
                id="youtube" 
                placeholder="YouTube channel link (if available)" 
                value={formData.youtube}
                onChange={handleChange}
              />
              <input 
                className="field" 
                type="email" 
                id="email" 
                placeholder="Email address" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
              <textarea 
                className="field" 
                id="about" 
                placeholder="Tell us about you and your music catalog (genres, plans)" 
                value={formData.about}
                onChange={handleChange}
                style={{ resize: 'vertical', minHeight: '120px' }}
                required
              ></textarea>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px 0' }} disabled={loading}>
                {loading ? 'Submitting Application...' : 'Request Invitation'} <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
              </button>

              {msg.text && (
                <div style={{ 
                  marginTop: '16px', fontSize: '13.5px', fontWeight: '500',
                  color: msg.isError ? '#ff6b6b' : 'var(--yellow)', textAlign: 'center' 
                }}>
                  {msg.text}
                </div>
              )}
            </form>
          </div>

          {/* SIDE INFORMATION CARD */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px', padding: 'clamp(20px, 4vw, 40px)', height: 'fit-content' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '26px' }}>Office Coordinates</h3>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,212,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--yellow)', fontSize: '16px' }}></i>
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Address</h4>
                <p style={{ color: 'var(--gray)', fontSize: '13.5px', lineHeight: '1.5' }}>Golden City, Kalagedihena</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,212,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fa-solid fa-envelope" style={{ color: 'var(--yellow)', fontSize: '16px' }}></i>
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Support Email</h4>
                <p style={{ color: 'var(--gray)', fontSize: '13.5px', lineHeight: '1.5' }}>info@since20entertainment.com</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,212,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fa-solid fa-phone" style={{ color: 'var(--yellow)', fontSize: '16px' }}></i>
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Phone Contact</h4>
                <p style={{ color: 'var(--gray)', fontSize: '13.5px', lineHeight: '1.5' }}>0716623026</p>
              </div>
            </div>

            <div className="social-row" style={{ marginTop: '40px', justifyContent: 'center' }}>
              <a href="#instagram"><i className="fa-brands fa-instagram"></i></a>
              <a href="#facebook"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#youtube"><i className="fa-brands fa-youtube"></i></a>
              <a href="#tiktok"><i className="fa-brands fa-tiktok"></i></a>
              <a href="#twitter"><i className="fa-brands fa-x-twitter"></i></a>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
