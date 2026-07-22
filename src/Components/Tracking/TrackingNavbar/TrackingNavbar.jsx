import { useState } from 'react';
import logo from '../../../assets/Logo/TechnoAi-Logo.png';
import { useAuth } from '../../../Context/AuthContext';
import LoginModal from '../../Auth/LoginModal/LoginModal';
import './TrackingNavbar.scss';

export default function TrackingNavbar() {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <header className="tracking-navbar">
        <div className="tracking-navbar__inner">
          <a
            href="https://technoai.ae"
            className="tracking-navbar__logo-link"
            aria-label="TechnoAi home"
          >
            <img className="tracking-navbar__logo" src={logo} alt="TechnoAi" />
          </a>

          {!user && (
            <div className="tracking-navbar__actions">
              <button
                type="button"
                className="tracking-navbar__btn tracking-navbar__btn--primary"
                onClick={() => setShowLoginModal(true)}
              >
                Login
              </button>
            </div>
          )}
        </div>
      </header>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
}
