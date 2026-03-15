import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, ArrowRight, Clock } from 'lucide-react';
import api from '../../services/api';

export function Events() {
    const { t } = useTranslation();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/public/events/')
            .then(res => setEvents(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="pt-20">
            {/* Hero */}
            <section className="py-20 animated-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                        <span className="gradient-text">{t('events.title')}</span>
                    </h1>
                    <p className="text-xl text-[var(--color-text-muted)]">{t('events.subtitle')}</p>
                </div>
            </section>

            {/* Events Grid */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="spinner"></div>
                        </div>
                    ) : events.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {events.map((event) => (
                                <Link key={event.id} to={`/events/${event.id}`} className="glass-card overflow-hidden card-hover group">
                                    <div className="aspect-video bg-[var(--color-bg-elevated)] overflow-hidden">
                                        {event.image ? (
                                            <img
                                                src={event.image}
                                                alt={event.title_ar}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Calendar className="w-16 h-16 text-[var(--color-text-muted)]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)] mb-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4 text-[var(--color-accent)]" />
                                                {new Date(event.date).toLocaleDateString('ar-SD')}
                                            </span>
                                            {event.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4 text-[var(--color-accent)]" />
                                                    {event.location}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                                            {event.title_ar}
                                        </h3>
                                        <p className="text-[var(--color-text-muted)] line-clamp-2">
                                            {event.description_ar}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 glass-card">
                            <Calendar className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                            <p className="text-xl text-[var(--color-text-muted)]">{t('events.no_events')}</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export function EventDetail() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/public/events/${id}/`)
            .then(res => setEvent(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="pt-20 min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="pt-20 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">الفعالية غير موجودة</h1>
                    <Link to="/events" className="btn-primary">
                        <ArrowRight className="w-5 h-5" />
                        العودة للفعاليات
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-20">
            {/* Hero Image */}
            {event.image && (
                <div className="h-[50vh] relative">
                    <img src={event.image} alt={event.title_ar} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-transparent"></div>
                </div>
            )}

            <section className="py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link to="/events" className="inline-flex items-center gap-2 text-[var(--color-accent)] mb-6 hover:underline">
                        <ArrowRight className="w-5 h-5" />
                        العودة للفعاليات
                    </Link>

                    <div className="glass-card p-8">
                        <div className="flex flex-wrap items-center gap-4 text-[var(--color-text-muted)] mb-6">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
                                {new Date(event.date).toLocaleDateString('ar-SD', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[var(--color-accent)]" />
                                {new Date(event.date).toLocaleTimeString('ar-SD', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                            {event.location && (
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-[var(--color-accent)]" />
                                    {event.location}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-bold mb-6">{event.title_ar}</h1>

                        <div className="prose prose-invert max-w-none">
                            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">
                                {event.description_ar}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
