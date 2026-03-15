import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Phone, Clock, Trash2, Check, Eye } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function MessagesView() {
    const { user } = useAuth();
    const canDelete = ['system_manager', 'department_manager'].includes(user?.role);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await api.get('/public/messages/');
            setMessages(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await api.patch(`/public/messages/${id}/`, { is_read: true });
            fetchMessages();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
            try {
                await api.delete(`/public/messages/${id}/`);
                setSelectedMessage(null);
                fetchMessages();
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">الرسائل الواردة</h1>
                <p className="text-[var(--color-text-muted)]">
                    عرض رسائل التواصل من الزوار ({messages.filter(m => !m.is_read).length} غير مقروءة)
                </p>
            </div>

            <div className="grid lg:grid-cols-[1fr,400px] gap-6">
                {/* Messages List */}
                <div className="glass-card overflow-hidden">
                    {messages.length > 0 ? (
                        <div className="divide-y divide-white/10">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    onClick={() => {
                                        setSelectedMessage(msg);
                                        if (!msg.is_read) handleMarkRead(msg.id);
                                    }}
                                    className={`p-4 cursor-pointer transition-colors ${selectedMessage?.id === msg.id ? 'bg-white/10' : 'hover:bg-white/5'
                                        } ${!msg.is_read ? 'border-r-4 border-[var(--color-accent)]' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium truncate">{msg.name}</span>
                                                {!msg.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
                                                )}
                                            </div>
                                            <p className="text-sm text-[var(--color-accent)] mb-1">{msg.subject}</p>
                                            <p className="text-sm text-[var(--color-text-muted)] line-clamp-1">
                                                {msg.message}
                                            </p>
                                        </div>
                                        <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
                                            {new Date(msg.created_at).toLocaleDateString('ar-SD')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <MessageSquare className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">لا توجد رسائل</h3>
                            <p className="text-[var(--color-text-muted)]">لم يتم استلام أي رسائل بعد</p>
                        </div>
                    )}
                </div>

                {/* Message Detail */}
                <div className="glass-card p-6 lg:sticky lg:top-28 lg:h-fit">
                    {selectedMessage ? (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">تفاصيل الرسالة</h2>
                                <div className="flex gap-2">
                                    {!selectedMessage.is_read && (
                                        <button
                                            onClick={() => handleMarkRead(selectedMessage.id)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-success)]"
                                            title="تحديد كمقروءة"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(selectedMessage.id)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-error)]"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                                        <span className="text-lg font-medium">
                                            {selectedMessage.name[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{selectedMessage.name}</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">{selectedMessage.email}</p>
                                    </div>
                                </div>

                                {selectedMessage.phone && (
                                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                                        <Phone className="w-4 h-4" />
                                        <span>{selectedMessage.phone}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {new Date(selectedMessage.created_at).toLocaleDateString('ar-SD', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <h4 className="font-medium text-[var(--color-accent)] mb-2">
                                        {selectedMessage.subject}
                                    </h4>
                                    <p className="text-[var(--color-text-muted)] whitespace-pre-line">
                                        {selectedMessage.message}
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <a target='_top'
                                        href={`mailto:${selectedMessage.email}`}
                                        className="btn-accent w-full justify-center"
                                    >
                                        <Mail className="w-5 h-5" />
                                        الرد عبر البريد
                                    </a>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <Eye className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                            <p className="text-[var(--color-text-muted)]">اختر رسالة لعرض التفاصيل</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
