import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Platforms from './pages/Platforms';
import Artists from './pages/Artists';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicPortfolio from './pages/PublicPortfolio';

// Layout wrapper to hide Navbar/Footer in dashboards & portfolio pages
function PageLayout({ children }) {
  const location = useLocation();
  const isCustomRoute = 
    location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/artist');

  return (
    <>
      <div className="grain"></div>
      <div className="glow-cursor" id="glowCursor" style={{ display: isCustomRoute ? 'none' : 'block' }}></div>
      {!isCustomRoute && <Navbar />}
      <main style={{ minHeight: isCustomRoute ? '100vh' : '80vh' }}>
        {children}
      </main>
      {!isCustomRoute && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <PageLayout>
        <Routes>
          {/* Public Views */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/platforms" element={<Platforms />} />
          <Route path="/artists-roster" element={<Artists />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/artist/:slug" element={<PublicPortfolio />} />
          
          {/* Auth Views */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          
          {/* Dashboard Views */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </PageLayout>
    </Router>
  );
}
