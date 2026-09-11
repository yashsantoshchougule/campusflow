import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/academics', label: 'Academics', icon: '🎓' },
    { path: '/attendance', label: 'Attendance', icon: '📊' },
    { path: '/study-ai', label: 'Study AI', icon: '🧠' },
    { path: '/notices', label: 'Notices', icon: '📢' },
    { path: '/calendar', label: 'Calendar', icon: '🗓️' },
    { path: '/notes-library', label: 'Notes', icon: '📚' },
    { path: '/notes-generator', label: 'Generate', icon: '✨' },
    { path: '/todos', label: 'Todos', icon: '✓' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
    { path: '/portal', label: 'Portal', icon: '🏫' },
    { path: '/timetable', label: 'Timetable', icon: '📅' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>CampusFlow</h2>
      </div>
      <div className="navbar-links">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
      <button className="sign-out-button" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </nav>
  );
};

export default Navbar;
