import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdClose, IoMdEye, IoMdEyeOff } from 'react-icons/io';
import { toast } from 'react-toastify';
import { useAuth } from '../../../Context/AuthContext';
import { loginUser } from '../../../Services/authService';
import { getFriendlyErrorMessage } from '../../../Api/api';
import './LoginModal.scss';

const INITIAL_FORM = {
  username: '',
  password: '',
};

export default function LoginModal({ onClose }) {
  const navigate = useNavigate();
  const { handleLogin } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
    setServerError('');
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Email or phone is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6 || formData.password.length > 16) {
      errors.password = 'Password must be between 6 and 16 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError('');

    try {
      const response = await loginUser({
        username: formData.username.trim(),
        password: formData.password,
      });

      localStorage.setItem('token', response.token);
      handleLogin(response.user);
      toast.success('Login successful');
      onClose();
      navigate('/dashboard');
    } catch (error) {
      setServerError(getFriendlyErrorMessage(error, 'Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-modal__overlay" onClick={onClose} role="presentation">
      <div
        className="login-modal__content"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button type="button" className="login-modal__close" onClick={onClose} aria-label="Close">
          <IoMdClose size={22} />
        </button>

        <h2 id="login-modal-title" className="login-modal__title">
          Staff Login
        </h2>
        <p className="login-modal__subtitle">
          Sign in to manage purchase orders and shipments.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="login-modal__field">
            <label className="login-modal__label" htmlFor="login-username">
              Email or phone
            </label>
            <input
              id="login-username"
              type="text"
              className="login-modal__input"
              value={formData.username}
              onChange={handleChange('username')}
              placeholder="admin@technoai.ae"
              autoComplete="username"
            />
            {formErrors.username && (
              <p className="login-modal__error">{formErrors.username}</p>
            )}
          </div>

          <div className="login-modal__field">
            <label className="login-modal__label" htmlFor="login-password">
              Password
            </label>
            <div className="login-modal__password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="login-modal__input"
                value={formData.password}
                onChange={handleChange('password')}
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-modal__toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IoMdEyeOff size={20} /> : <IoMdEye size={20} />}
              </button>
            </div>
            {formErrors.password && (
              <p className="login-modal__error">{formErrors.password}</p>
            )}
          </div>

          {serverError && <p className="login-modal__error">{serverError}</p>}

          <button type="submit" className="login-modal__submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
