import React, { useState } from 'react';

// ✅ Inline definition of the API function
const sendCeoMessage = async (messageData) => {
  const res = await fetch('/api/ceo-messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messageData),
  });

  if (!res.ok) {
    throw new Error('Failed to send CEO message');
  }

  return await res.json();
};

const CeoMessagePanel = () => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    setError(null);
    setSuccess(false);

    try {
      await sendCeoMessage({
        message: message.trim(),
        recipient,
        timestamp: new Date().toISOString(),
      });

      setMessage('');
      setIsExpanded(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <i className="bi bi-megaphone me-2"></i>
          CEO Message Center
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn btn-outline-primary btn-sm"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              Message sent successfully!
            </div>
          )}

          <div>
            <label className="form-label">Send Message To:</label>
            <select
              className="form-select"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="purchaser">Purchasers</option>
              <option value="seller">Sellers</option>
              <option value="driver">Drivers</option>
              <option value="storekeeper">Store Keepers</option>
            </select>
          </div>

          <div>
            <label className="form-label">Message:</label>
            <textarea
              className="form-control"
              rows="3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              disabled={isSending}
            />
          </div>

          <button
            onClick={handleSendMessage}
            className="btn btn-primary"
            disabled={!message.trim() || isSending}
          >
            {isSending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                Sending...
              </>
            ) : (
              <>
                <i className="bi bi-send me-2"></i>
                Send Message
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CeoMessagePanel;
