import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { signUp } from '../utils/api';

// Strong password criteria
const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: p => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A-Z)', test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a-z)', test: p => /[a-z]/.test(p) },
  { id: 'number', label: 'One number (0-9)', test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$…)', test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

function getStrength(password) {
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  if (passed === 0) return { score: 0, label: '', color: '' };
  if (passed <= 2) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (passed === 3) return { score: 2, label: 'Fair', color: '#f59e0b' };
  if (passed === 4) return { score: 3, label: 'Good', color: '#3b82f6' };
  return { score: 4, label: 'Strong', color: '#10b981' };
}

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const strength = getStrength(formData.password);
  const passedRules = PASSWORD_RULES.filter(r => r.test(formData.password));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'password') setPasswordTouched(true);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email))
      newErrors.email = 'Enter a valid email address';

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const failed = PASSWORD_RULES.filter(r => !r.test(formData.password));
      if (failed.length > 0) {
        newErrors.password = 'Password does not meet the requirements below';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });
    try {
      const data = await signUp({ name: formData.name, email: formData.email, password: formData.password });
      if (data.success) {
        setMessage({ text: 'Account created successfully! Redirecting to login...', type: 'success' });
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setMessage({ text: data.error || 'Failed to create account. Please try again.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: `Error: ${error.message || 'An unexpected error occurred.'}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up | DiaBP Diet Consultant</title>
        <meta name="description" content="Create your DiaBP Diet Consultant account" />
      </Head>

      <div className="signup-page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="signup-wrapper">
          {/* Left branding panel */}
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
            <h2 className="brand-tagline">Join Thousands Managing Their Health Better</h2>
            <p className="brand-description">
              Get a personalized diet plan tailored to your diabetes and blood pressure needs — powered by clinical AI.
            </p>
            <div className="features-list">
              {[
                { icon: '🎯', t: 'Personalized 1–30 day diet plans' },
                { icon: '📁', t: 'Upload & analyze medical reports' },
                { icon: '📈', t: 'BMI & health record tracking' },
                { icon: '🤖', t: 'AI-powered nutrition guidance' },
              ].map(f => (
                <div key={f.t} className="feature-item">
                  <span className="feature-icon">{f.icon}</span>
                  <span>{f.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right form panel */}
          <div className="form-panel">
            <div className="form-card">
              <div className="form-header">
                <h1 className="form-title">Create Account</h1>
                <p className="form-subtitle">Start your personalized health journey today</p>
              </div>

              {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    {message.type === 'success'
                      ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    }
                  </svg>
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-fields">
                {/* Full Name */}
                <div className="field-group">
                  <label htmlFor="name" className="field-label">Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input type="text" id="name" name="name" placeholder="Enter your full name"
                      value={formData.name} onChange={handleChange}
                      className={`field-input ${errors.name ? 'input-error' : ''}`} />
                  </div>
                  {errors.name && <p className="field-error">{errors.name}</p>}
                </div>

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
                    <input type="email" id="email" name="email" placeholder="Enter your email address"
                      value={formData.email} onChange={handleChange}
                      className={`field-input ${errors.email ? 'input-error' : ''}`} />
                  </div>
                  {errors.email && <p className="field-error">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="field-group">
                  <label htmlFor="password" className="field-label">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input type={showPassword ? 'text' : 'password'} id="password" name="password"
                      placeholder="Create a strong password"
                      value={formData.password} onChange={handleChange}
                      className={`field-input pr-12 ${errors.password ? 'input-error' : ''}`} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="eye-toggle">
                      {showPassword
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.736 4.943 5.522 1 10 1s8.264 3.943 9.542 9c-1.278 5.057-5.064 9-9.542 9S1.736 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 4.943 14.478 1 10 1a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 5.057 5.064 9 9.542 9 .847 0 1.669-.105 2.454-.303z" /></svg>
                      }
                    </button>
                  </div>
                  {errors.password && <p className="field-error">{errors.password}</p>}

                  {/* Strength meter */}
                  {passwordTouched && formData.password && (
                    <div className="strength-meter">
                      <div className="strength-bar-row">
                        {[1, 2, 3, 4].map(s => (
                          <div key={s} className="strength-bar-segment"
                            style={{ background: strength.score >= s ? strength.color : '#e5e7eb' }} />
                        ))}
                        {strength.label && (
                          <span className="strength-label" style={{ color: strength.color }}>
                            {strength.label}
                          </span>
                        )}
                      </div>
                      <ul className="requirements-list">
                        {PASSWORD_RULES.map(rule => {
                          const ok = rule.test(formData.password);
                          return (
                            <li key={rule.id} className={`req-item ${ok ? 'req-ok' : 'req-fail'}`}>
                              <span className="req-icon">{ok ? '✓' : '○'}</span>
                              {rule.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="field-group">
                  <label htmlFor="confirmPassword" className="field-label">Confirm Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <input type={showConfirm ? 'text' : 'password'} id="confirmPassword" name="confirmPassword"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword} onChange={handleChange}
                      className={`field-input pr-12 ${errors.confirmPassword ? 'input-error' : ''}`} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} className="eye-toggle">
                      {showConfirm
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.736 4.943 5.522 1 10 1s8.264 3.943 9.542 9c-1.278 5.057-5.064 9-9.542 9S1.736 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 4.943 14.478 1 10 1a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 5.057 5.064 9 9.542 9 .847 0 1.669-.105 2.454-.303z" /></svg>
                      }
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
                </div>

                {/* Submit */}
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="form-footer">
                <div className="divider"><span>Already have an account?</span></div>
                <Link href="/login" className="login-link">Sign in →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .signup-page {
          min-height: calc(100vh - 130px);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #f0fdf4 0%, #e0e7ff 50%, #f0f9ff 100%);
          padding: 2rem 1rem;
        }
        .blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .blob-1 { width: 400px; height: 400px; top: -100px; right: -100px; background: rgba(99,102,241,0.15); animation: float 8s ease-in-out infinite; }
        .blob-2 { width: 350px; height: 350px; bottom: -80px; left: -80px; background: rgba(59,130,246,0.15); animation: float 10s ease-in-out infinite reverse; }
        .blob-3 { width: 250px; height: 250px; top: 40%; right: 20%; background: rgba(16,185,129,0.08); animation: floatCenter 12s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.05)} }
        @keyframes floatCenter { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-15px) scale(1.03)} }

        .signup-wrapper {
          display: flex;
          width: 100%;
          max-width: 1050px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(99,102,241,0.08);
          overflow: hidden;
          position: relative;
          z-index: 10;
          animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .brand-panel {
          background: linear-gradient(135deg, #065f46 0%, #1d4ed8 50%, #4c1d95 100%);
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 40%;
          position: relative;
          overflow: hidden;
        }
        .brand-panel::before { content:''; position:absolute; top:-60px; right:-60px; width:200px; height:200px; background:rgba(255,255,255,0.06); border-radius:50%; }
        .brand-panel::after  { content:''; position:absolute; bottom:-40px; left:-40px; width:160px; height:160px; background:rgba(255,255,255,0.04); border-radius:50%; }
        .brand-logo { display:flex; align-items:center; gap:0.75rem; margin-bottom:2rem; }
        .brand-icon { width:52px; height:52px; background:rgba(255,255,255,0.15); border-radius:14px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.2); }
        .brand-name { display:block; font-size:1.6rem; font-weight:800; color:white; }
        .brand-subtitle { display:block; font-size:0.7rem; color:rgba(255,255,255,0.65); text-transform:uppercase; letter-spacing:0.08em; margin-top:-2px; }
        .brand-tagline { font-size:1.35rem; font-weight:700; color:white; line-height:1.35; margin-bottom:0.875rem; }
        .brand-description { font-size:0.875rem; color:rgba(255,255,255,0.72); line-height:1.6; margin-bottom:2rem; }
        .features-list { display:flex; flex-direction:column; gap:0.6rem; }
        .feature-item { display:flex; align-items:center; gap:0.75rem; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.14); border-radius:10px; padding:0.55rem 0.875rem; color:white; font-size:0.83rem; font-weight:500; }
        .feature-icon { font-size:1rem; }

        .form-panel { flex:1; display:flex; align-items:center; justify-content:center; padding:2.5rem 2.5rem; background:white; }
        .form-card { width:100%; max-width:420px; }
        .form-header { margin-bottom:1.5rem; }
        .form-title { font-size:1.75rem; font-weight:800; color:#111827; letter-spacing:-0.025em; margin-bottom:0.35rem; }
        .form-subtitle { color:#6b7280; font-size:0.875rem; }

        .alert { display:flex; align-items:flex-start; gap:0.625rem; padding:0.875rem 1rem; border-radius:10px; font-size:0.875rem; margin-bottom:1.25rem; }
        .alert-success { background:#f0fdf4; border:1px solid #86efac; color:#166534; }
        .alert-error   { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; }

        .form-fields { display:flex; flex-direction:column; gap:0.875rem; }
        .field-group { }
        .field-label { display:block; font-size:0.85rem; font-weight:600; color:#374151; margin-bottom:0.35rem; }
        .input-wrapper { position:relative; display:flex; align-items:center; }
        .input-icon { position:absolute; left:0.875rem; color:#9ca3af; pointer-events:none; display:flex; align-items:center; }
        .field-input {
          width:100%; padding:0.7rem 0.875rem 0.7rem 2.75rem;
          border:1.5px solid #e5e7eb; border-radius:10px;
          font-size:0.875rem; color:#111827; background:#fafafa;
          transition:border-color 0.15s, box-shadow 0.15s, background 0.15s; outline:none;
        }
        .field-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.12); background:white; }
        .field-input.input-error { border-color:#ef4444; }
        .field-input.input-error:focus { box-shadow:0 0 0 3px rgba(239,68,68,0.12); }
        .field-input.pr-12 { padding-right:3rem; }
        .field-error { font-size:0.78rem; color:#ef4444; margin-top:0.25rem; }

        .eye-toggle { position:absolute; right:0.875rem; color:#9ca3af; background:none; border:none; cursor:pointer; display:flex; align-items:center; padding:0; transition:color 0.15s; }
        .eye-toggle:hover { color:#4b5563; }

        /* Password Strength */
        .strength-meter { margin-top:0.625rem; }
        .strength-bar-row { display:flex; align-items:center; gap:0.25rem; margin-bottom:0.5rem; }
        .strength-bar-segment { flex:1; height:4px; border-radius:99px; transition:background 0.3s; }
        .strength-label { font-size:0.75rem; font-weight:600; margin-left:0.5rem; white-space:nowrap; transition:color 0.3s; }
        .requirements-list { display:grid; grid-template-columns:1fr 1fr; gap:0.2rem 0.5rem; padding:0; margin:0; list-style:none; }
        .req-item { display:flex; align-items:center; gap:0.35rem; font-size:0.75rem; transition:color 0.2s; }
        .req-ok   { color:#10b981; }
        .req-fail { color:#9ca3af; }
        .req-icon { font-size:0.7rem; font-weight:700; width:12px; text-align:center; }

        .submit-btn {
          width:100%; display:flex; align-items:center; justify-content:center; gap:0.5rem;
          padding:0.8rem 1.5rem; margin-top:0.25rem;
          background:linear-gradient(135deg,#2563eb,#4f46e5);
          color:white; font-weight:600; font-size:0.925rem;
          border:none; border-radius:10px; cursor:pointer;
          transition:all 0.2s; box-shadow:0 4px 14px rgba(79,70,229,0.35);
        }
        .submit-btn:hover:not(:disabled) { background:linear-gradient(135deg,#1d4ed8,#4338ca); box-shadow:0 6px 20px rgba(79,70,229,0.45); transform:translateY(-1px); }
        .submit-btn:disabled { opacity:0.7; cursor:not-allowed; transform:none; }

        .form-footer { margin-top:1.5rem; text-align:center; }
        .divider { display:flex; align-items:center; gap:0.75rem; color:#9ca3af; font-size:0.78rem; margin-bottom:0.875rem; }
        .divider::before,.divider::after { content:''; flex:1; height:1px; background:#e5e7eb; }
        .login-link { font-size:0.875rem; font-weight:600; color:#4f46e5; text-decoration:none; transition:color 0.15s; }
        .login-link:hover { color:#4338ca; }

        @media (max-width: 768px) {
          .signup-wrapper { flex-direction:column; border-radius:16px; }
          .brand-panel { width:100%; padding:2rem 1.5rem; }
          .form-panel { padding:2rem 1.5rem; }
          .requirements-list { grid-template-columns:1fr; }
        }
      `}</style>
    </>
  );
}