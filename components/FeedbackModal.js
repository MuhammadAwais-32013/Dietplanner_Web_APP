import { useState, useEffect } from 'react';
import { submitFeedback } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ASPECTS = [
  { value: 'application', label: '📱 Overall Application' },
  { value: 'chatbot', label: '🤖 Chatbot' },
  { value: 'diet-plan', label: '🥗 Diet Plan' },
  { value: 'bmi', label: '⚖️ BMI Calculator' },
];

const EMOJI_RATINGS = ['😞', '😕', '😐', '🙂', '😄'];

export default function FeedbackModal({ isOpen, onClose }) {
  const { isLoggedIn } = useAuth();
  const [aspect, setAspect] = useState('application');
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(null);
  const [comments, setComments] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAspect('application'); setRating(5); setHovered(null);
      setComments(''); setSuggestion(''); setError(''); setSuccess(''); setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!isLoggedIn) { setError('Please log in to submit feedback.'); return; }
    if (!comments.trim()) { setError('Please write your comments before submitting.'); return; }
    setSubmitting(true);
    const res = await submitFeedback({ aspect, rating: Number(rating), comments: comments.trim(), suggestion: suggestion.trim() || null });
    setSubmitting(false);
    if (res.success) {
      setSuccess('🎉 Thank you! Your feedback has been submitted.');
      setTimeout(() => onClose(), 1400);
    } else {
      setError(res.error || 'Failed to submit. Please try again.');
    }
  };

  const activeRating = hovered || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">💬</div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Share Feedback</h3>
              <p className="text-blue-100 text-xs">Help us improve DiaBP for you</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="text-base">⚠️</span> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <span className="text-base">✅</span> {success}
            </div>
          )}

          {/* Aspect selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">What are you reviewing?</label>
            <div className="grid grid-cols-2 gap-2">
              {ASPECTS.map(a => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAspect(a.value)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${aspect === a.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji star rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(null)}
                  className={`text-2xl transition-transform hover:scale-125 ${n <= activeRating ? 'opacity-100' : 'opacity-25'}`}
                  title={`${n} star${n > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-xl">{EMOJI_RATINGS[(activeRating || 5) - 1]}</span>
              <span className="text-sm text-gray-400 ml-1">{activeRating}/5</span>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Comments <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={4}
              placeholder="Tell us what worked well and what can be improved…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{comments.length} characters</p>
          </div>

          {/* Suggestion */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Suggestions <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
              rows={2}
              placeholder="Any specific features or improvements you'd like to see?"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Submitting…
                </span>
              ) : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
