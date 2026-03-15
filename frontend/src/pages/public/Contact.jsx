import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Phone, Mail, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function Contact() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            await api.post('/public/contact/', formData);
            setStatus('success');
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch (error) {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const contactInfo = [
        { icon: MapPin, label: 'العنوان', value: 'الجريف – الخرطوم غرب – السودان' },
        { icon: Phone, label: 'الهاتف', value: '+249 123 456 789' },
        { icon: Mail, label: 'البريد الإلكتروني', value: 'info@emiratescollege.edu.sd' },
    ];

    return (
        <div className="pt-20">
            {/* Hero */}
            <section className="py-20 animated-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                        <span className="gradient-text">{t('contact.title')}</span>
                    </h1>
                    <p className="text-xl text-[var(--color-text-muted)]">{t('contact.subtitle')}</p>
                </div>
            </section>

            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Contact Info */}
                        <div className="lg:col-span-1">
                            <div className="glass-card p-8">
                                <h2 className="text-2xl font-bold mb-6">معلومات الاتصال</h2>
                                <div className="space-y-6">
                                    {contactInfo.map((item, index) => (
                                        <div key={index} className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                                                <item.icon className="w-6 h-6 text-[var(--color-accent)]" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium mb-1">{item.label}</h3>
                                                <p className="text-[var(--color-text-muted)]">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Map placeholder */}
                                <div className="mt-8 aspect-video rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center">
                                    <MapPin className="w-12 h-12 text-[var(--color-text-muted)]" />
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <div className="glass-card p-8">
                                <h2 className="text-2xl font-bold mb-6">أرسل رسالتك</h2>

                                {status === 'success' && (
                                    <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 mb-6">
                                        <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
                                        <p className="text-[var(--color-success)]">{t('contact.success')}</p>
                                    </div>
                                )}

                                {status === 'error' && (
                                    <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 mb-6">
                                        <AlertCircle className="w-5 h-5 text-[var(--color-error)]" />
                                        <p className="text-[var(--color-error)]">{t('contact.error')}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{t('contact.name')}</label>
                                            <input
                                                type="text"
                                                required
                                                className="input-field"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{t('contact.email')}</label>
                                            <input
                                                type="email"
                                                required
                                                className="input-field"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{t('contact.phone')}</label>
                                            <input
                                                type="tel"
                                                className="input-field"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{t('contact.subject')}</label>
                                            <input
                                                type="text"
                                                required
                                                className="input-field"
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">{t('contact.message')}</label>
                                        <textarea
                                            required
                                            rows={6}
                                            className="input-field resize-none"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-accent"
                                    >
                                        {loading ? (
                                            <span className="spinner w-5 h-5 border-2"></span>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                {t('contact.send')}
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
