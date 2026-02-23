import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { login } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login: loginUser } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (error) setError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email))
      newErrors.email = 'Enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const data = await login({ email: formData.email, password: formData.password });
      if (data.success) {
        loginUser({ id: data.id, name: data.name });
        router.push('/');
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | DiaBP Diet Consultant</title>
        <meta name="description" content="Log in to your DiaBP Diet Consultant account" />
      </Head>

      <div className="login-page">
        {/* Background blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="login-wrapper">
          {/* Left panel — branding */}
          <div className="brand-panel">
            <div className="brand-logo">
              <div className="brand-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
              <div>
                <span className="brand-name">DiaBP</span>
                <span className="brand-subtitle">Diet Consultant</span>
              </div>
            </div>

            <h2 className="brand-tagline">Your Personalized Health Journey Starts Here</h2>
            <p className="brand-description">
              AI-powered nutrition guidance specially designed for patients managing diabetes and hypertension.
            </p>

            <div className="trust-badges">
              {[
                { icon: '🩺', label: 'Clinical Dietitian AI' },
                { icon: '🔒', label: 'Secure & Private' },
                { icon: '📊', label: 'Evidence-Based Plans' },
              ].map(b => (
                <div key={b.label} className="trust-badge">
                  <span className="trust-icon">{b.icon}</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — form */}
          <div className="form-panel">
            <div className="form-card">
              <div className="form-header">
                <h1 className="form-title">Welcome Back</h1>
                <p className="form-subtitle">Sign in to access your personalized diet plans</p>
              </div>

              {error && (
                <div className="alert alert-error">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="field-group">
                  <label htmlFor="email" className="field-label">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      className={`field-input ${errors.email ? 'input-error' : ''}`}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <p className="field-error">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="field-group">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="field-label mb-0">Password</label>
                    <Link href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`field-input pr-12 ${errors.password ? 'input-error' : ''}`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="eye-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.736 4.943 5.522 1 10 1s8.264 3.943 9.542 9c-1.278 5.057-5.064 9-9.542 9S1.736 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 4.943 14.478 1 10 1a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 5.057 5.064 9 9.542 9 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="field-error">{errors.password}</p>}
                </div>

                {/* Submit */}
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In to Account
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="form-footer">
                <div className="divider"><span>New to DiaBP?</span></div>
                <Link href="/signup" className="signup-link">
                  Create a free account →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: calc(100vh - 130px);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #f0fdf4 100%);
          padding: 2rem 1rem;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .blob-1 { width: 400px; height: 400px; top: -100px; left: -100px; background: rgba(59,130,246,0.18); animation: float 8s ease-in-out infinite; }
        .blob-2 { width: 350px; height: 350px; bottom: -80px; right: -80px; background: rgba(99,102,241,0.15); animation: float 10s ease-in-out infinite reverse; }
        .blob-3 { width: 250px; height: 250px; top: 50%; left: 50%; transform: translate(-50%,-50%); background: rgba(6,182,212,0.1); animation: float 12s ease-in-out infinite; }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .blob-3 { animation-name: floatCenter; }
        @keyframes floatCenter {
          0%, 100% { transform: translate(-50%,-50%) scale(1); }
          50% { transform: translate(-50%,-55%) scale(1.05); }
        }

        .login-wrapper {
          display: flex;
          width: 100%;
          max-width: 1000px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(99,102,241,0.08);
          overflow: hidden;
          position: relative;
          z-index: 10;
          animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .brand-panel {
          background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 50%, #6d28d9 100%);
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 520px;
          width: 42%;
          position: relative;
          overflow: hidden;
        }
        .brand-panel::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 220px; height: 220px;
          background: rgba(255,255,255,0.06);
          border-radius: 50%;
        }
        .brand-panel::after {
          content: '';
          position: absolute;
          bottom: -40px; left: -40px;
          width: 180px; height: 180px;
          background: rgba(255,255,255,0.04);
          border-radius: 50%;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
        }
        .brand-icon {
          width: 56px; height: 56px;
          background: rgba(255,255,255,0.15);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .brand-name {
          display: block;
          font-size: 1.75rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.025em;
        }
        .brand-subtitle {
          display: block;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.7);
          margin-top: -2px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .brand-tagline {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          line-height: 1.3;
          margin-bottom: 1rem;
        }
        .brand-description {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.75);
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }
        .trust-badges { display: flex; flex-direction: column; gap: 0.75rem; }
        .trust-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          padding: 0.6rem 1rem;
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
          backdrop-filter: blur(4px);
        }
        .trust-icon { font-size: 1.1rem; }

        .form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2.5rem;
          background: white;
        }
        .form-card { width: 100%; max-width: 400px; }
        .form-header { margin-bottom: 2rem; }
        .form-title {
          font-size: 1.875rem;
          font-weight: 800;
          color: #111827;
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }
        .form-subtitle { color: #6b7280; font-size: 0.9rem; }

        .alert {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.875rem 1rem;
          border-radius: 10px;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
        }
        .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }

        .field-group { margin-bottom: 0.25rem; }
        .field-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.375rem;
        }
        .field-label.mb-0 { margin-bottom: 0; }
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon {
          position: absolute;
          left: 0.875rem;
          color: #9ca3af;
          pointer-events: none;
          display: flex;
          align-items: center;
        }
        .field-input {
          width: 100%;
          padding: 0.75rem 0.875rem 0.75rem 2.75rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.9rem;
          color: #111827;
          background: #fafafa;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          outline: none;
        }
        .field-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
          background: white;
        }
        .field-input.input-error { border-color: #ef4444; }
        .field-input.input-error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
        .field-input.pr-12 { padding-right: 3rem; }
        .field-error { font-size: 0.8rem; color: #ef4444; margin-top: 0.3rem; }

        .eye-toggle {
          position: absolute;
          right: 0.875rem;
          color: #9ca3af;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.15s;
        }
        .eye-toggle:hover { color: #4b5563; }

        .submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(79,70,229,0.35);
          margin-top: 0.5rem;
        }
        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8, #4338ca);
          box-shadow: 0 6px 20px rgba(79,70,229,0.45);
          transform: translateY(-1px);
        }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .form-footer { margin-top: 1.75rem; text-align: center; }
        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #9ca3af;
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .signup-link {
          display: inline-block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #4f46e5;
          text-decoration: none;
          transition: color 0.15s;
        }
        .signup-link:hover { color: #4338ca; }

        @media (max-width: 768px) {
          .login-wrapper { flex-direction: column; border-radius: 16px; }
          .brand-panel { width: 100%; min-height: auto; padding: 2rem 1.5rem; }
          .form-panel { padding: 2rem 1.5rem; }
          .trust-badges { flex-direction: row; flex-wrap: wrap; }
        }
      `}</style>
    </>
  );
}