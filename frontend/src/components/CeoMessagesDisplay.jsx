import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

//import { fetchCeoMessages, updateMessageAsRead } from 'http://127.0.0.1:5000/api';
import { fetchCeoMessages, updateMessageAsRead } from './apiHelpers';

const CeoMessagesDisplay = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch messages from backend
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetchCeoMessages();
        setMessages(response.data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    loadMessages();

    // Optional: Set up polling or real-time updates
    const interval = setInterval(loadMessages, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter messages for current user
  const userMessages = messages.filter(msg => 
    msg.recipient === 'all' || msg.recipient === user?.role
  );

  const unreadMessages = userMessages.filter(msg => !msg.isRead);

  const handleMarkAsRead = async (messageId) => {
    try {
      await updateMessageAsRead(messageId);
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ));
    } catch (err) {
      console.error('Failed to mark message as read:', err);
      setError('Failed to update message status');
    }
  };

  if (loading) {
    return (
      <div className="bg-info bg-opacity-10 border border-info rounded p-3 mb-4">
        <div className="text-center py-2">
          <div className="spinner-border spinner-border-sm text-info me-2" role="status"></div>
          Loading messages...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger bg-opacity-10 border border-danger rounded p-3 mb-4">
        <div className="text-danger">{error}</div>
      </div>
    );
  }

  if (userMessages.length === 0) {
    return null;
  }

  return (
    <div className="bg-info bg-opacity-10 border border-info rounded p-3 mb-4">
      <h5 className="text-info mb-3">
        <i className="bi bi-info-circle me-2"></i>
        CEO Messages ({unreadMessages.length} unread)
      </h5>
      
      <div className="max-height-200 overflow-auto">
        {userMessages.slice(0, 5).map((message) => (
          <div
            key={message.id}
            className={`alert ${message.isRead ? 'alert-secondary' : 'alert-info'} py-2 mb-2`}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div className="flex-grow-1">
                <small className="text-muted">
                  {new Date(message.createdAt).toLocaleDateString()} - 
                  To: {message.recipient === 'all' ? 'Everyone' : message.recipient}
                </small>
                <p className="mb-0 mt-1">{message.content}</p>
              </div>
              {!message.isRead && (
                <button
                  onClick={() => handleMarkAsRead(message.id)}
                  className="btn btn-sm btn-outline-primary ms-2"
                >
                  Mark Read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CeoMessagesDisplay;