import { useState, useEffect } from 'react';
import { submitFeedback } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function FeedbackModal({ isOpen, onClose }) {
  const { isLoggedIn } = useAuth();
  const [aspect, setAspect] = useState('application');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAspect('application');
      setRating(5);
      setComments('');
      setSuggestion('');
      setError('');
      setSuccess('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isLoggedIn) {
      setError('Please log in to submit feedback.');
      return;
    }
    if (!comments.trim()) {
      setError('Comments are required.');
      return;
    }

    setSubmitting(true);
    const payload = {
      aspect,
      rating: rating ? Number(rating) : null,
      comments: comments.trim(),
      suggestion: suggestion.trim() || null
    };
    const res = await submitFeedback(payload);
    setSubmitting(false);
    if (res.success) {
      setSuccess('Thanks! Your feedback has been submitted.');
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setError(res.error || 'Failed to submit feedback.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Share Your Feedback</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
          {success && <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">{success}</div>}

          <div>
            <label className="form-label">What are you giving feedback on?</label>
            <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="form-input">
              <option value="application">Overall Application</option>
              <option value="chatbot">Chatbot</option>
            </select>
          </div>

          <div>
            <label className="form-label">Rating (optional)</label>
            <div className="flex items-center space-x-2">
              <input type="range" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} className="w-full" />
              <span className="w-6 text-sm text-gray-700">{rating}</span>
            </div>
          </div>

          <div>
            <label className="form-label">Comments</label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={4} placeholder="Tell us what worked well and what can be improved" className="form-input" />
          </div>

          <div>
            <label className="form-label">Suggestions (optional)</label>
            <textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} rows={3} placeholder="Any specific features or improvements you suggest?" className="form-input" />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




