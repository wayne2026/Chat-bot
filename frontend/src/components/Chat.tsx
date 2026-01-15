import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import './Chat.css';

interface ChatProps {
    token: string;
    onLogout: () => void;
}

const Chat: React.FC<ChatProps> = ({ token, onLogout }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [thinking, setThinking] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadHistory = async () => {
        try {
            const response = await fetch('/api/chat/getMessageHistory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            if (response.ok) {
                const history = await response.json();
                setMessages(history);
            }
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setThinking(true);
        setError('');

        let accumulatedContent = '';
        let firstChunkReceived = false;

        try {
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage.content, token }),
            });

            if (!response.body) {
                throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Add empty assistant message
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.error) {
                                setError(data.error);
                                setMessages(prev => prev.slice(0, -1));
                                break;
                            }

                            if (data.content) {
                                if (!firstChunkReceived) {
                                    setThinking(false);
                                    firstChunkReceived = true;
                                }
                                accumulatedContent += data.content;
                                setMessages(prev => [
                                    ...prev.slice(0, -1),
                                    { role: 'assistant', content: accumulatedContent }
                                ]);
                            }

                            if (data.done) {
                                break;
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
            setMessages(prev => prev.slice(0, -1));
            setThinking(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage();
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h1 className="chat-header-title">AI Chatbot</h1>
                <div className="chat-header-buttons">
                    <button onClick={onLogout} className="chat-logout-button">
                        Logout
                    </button>
                </div>
            </div>

            <div className="chat-messages-container">
                {messages.length === 0 && (
                    <div className="chat-empty-state">
                        <p>Start a conversation with the AI!</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
                    >
                        <div className="chat-message-role">
                            {msg.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
                        </div>
                        <div className="chat-message-content">{msg.content}</div>
                    </div>
                ))}

                {thinking && (
                    <div className="chat-message chat-message-assistant">
                        <div className="chat-message-role">🤖 AI Assistant</div>
                        <div className="chat-thinking-indicator">Thinking</div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {error && <div className="chat-error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="chat-input"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="chat-send-button"
                    disabled={loading || !input.trim()}
                >
                    {loading ? '...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default Chat;
