import React, { useState } from 'react';
import api from '../api/api';

const AIAssistanceTab = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setResponse('Please log in again.');
        setLoading(false);
        return;
      }
      const res = await api.post('/api/ai-assistance', { query }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setResponse(res.data.data.response);
    } catch (error) {
      setResponse('Error: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="ai-assistance">
      <h4>AI Assistance</h4>
      <p>Ask me anything about the system, users, or data.</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="query" className="form-label">Your Query</label>
          <input
            type="text"
            className="form-control"
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., show me data for user John"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask AI'}
        </button>
      </form>
      {response && (
        <div className="mt-4">
          <h5>Response:</h5>
          <pre className="bg-light p-3 rounded">{response}</pre>
        </div>
      )}
    </div>
  );
};

export default AIAssistanceTab;
