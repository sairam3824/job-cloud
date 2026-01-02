'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader2, MessageSquarePlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './FeedbackWidget.module.css';

type FeedbackType = 'general_feedback' | 'role_request' | 'location_request';

export default function FeedbackWidget({ className = "" }: { className?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [type, setType] = useState<FeedbackType>('role_request');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('feedback')
                .insert([{ feedback_type: type, content }]);

            if (error) throw error;

            setMessage({ text: 'Thank you for your feedback!', type: 'success' });
            setContent('');

            // Close after delay
            setTimeout(() => {
                setIsOpen(false);
                setMessage(null);
            }, 2000);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setMessage({ text: 'Failed to submit.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPlaceholder = () => {
        switch (type) {
            case 'role_request': return "e.g. Senior Frontend Developer, Product Manager...";
            case 'location_request': return "e.g. Bangalore, Remote, Toronto...";
            default: return "Tell us how we can improve...";
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`${styles.triggerButton} ${className}`}
                aria-label="Open feedback form"
            >
                <MessageSquarePlus size={18} />
                <span>Feedback</span>
            </button>

            {isOpen && mounted && createPortal(
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                    <div
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.header}>
                            <h3 className={styles.title}>Feedback & Requests</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className={styles.closeButton}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Type Selector */}
                            <div className={styles.section}>
                                <label className={styles.label}>I want to...</label>
                                <div className={styles.typeGrid}>
                                    <button
                                        type="button"
                                        onClick={() => setType('role_request')}
                                        className={`${styles.typeButton} ${type === 'role_request' ? styles.active : ''}`}
                                    >
                                        Request Role
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('location_request')}
                                        className={`${styles.typeButton} ${type === 'location_request' ? styles.active : ''}`}
                                    >
                                        Request Loc
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('general_feedback')}
                                        className={`${styles.typeButton} ${type === 'general_feedback' ? styles.active : ''}`}
                                    >
                                        Give Feedback
                                    </button>
                                </div>
                            </div>

                            {/* Text Area */}
                            <div className={styles.section}>
                                <label className={styles.label}>Details</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={getPlaceholder()}
                                    className={styles.textarea}
                                    required
                                    autoFocus
                                />
                            </div>

                            {/* Footer actions */}
                            <div className={styles.footer}>
                                <span className={`${styles.message} ${message?.type === 'error' ? styles.error : styles.success}`}>
                                    {message?.text}
                                </span>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !content.trim()}
                                    className={styles.submitButton}
                                >
                                    {isSubmitting ? <Loader2 size={16} className={styles.spin} /> : <Send size={16} />}
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
