import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Award, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Home() {
    const { t } = useTranslation();
    const [departments, setDepartments] = useState([]);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        // Fetch departments
        api.get('/academic/departments/')
            .then(res => setDepartments(res.data.results || res.data))
            .catch(console.error);

        // Fetch events
        api.get('/public/events/')
            .then(res => setEvents(res.data))
            .catch(console.error);
    }, []);

    const stats = [
        { icon: Users, value: '10000+', label: 'طالب وطالبة' },
        { icon: BookOpen, value: '19+', label: 'برنامج أكاديمي' },
        { icon: Award, value: '26+', label: 'سنة خبرة' },
    ];

    return (
        <div className="pt-20">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center animated-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 mb-6">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
                            <span className="text-[var(--color-accent)] text-sm">{t('hero.location')}</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                            <span className="gradient-text">{t('hero.title')}</span>
                        </h1>

                        <p className="text-xl text-[var(--color-text-muted)] mb-8 max-w-xl">
                            {t('hero.subtitle')}
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link to="/register" className="btn-accent">
                                {t('hero.cta_register')}
                                <ArrowLeft className="w-5 h-5 icon-flip" />
                            </Link>
                            <Link to="/contact" className="btn-primary">
                                {t('hero.cta_contact')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/4 left-10 w-72 h-72 bg-[var(--color-accent)]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[var(--color-primary)]/20 rounded-full blur-3xl"></div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-[var(--color-bg-card)]/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="glass-card p-6 text-center card-hover">
                                <div className="w-14 h-14 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
                                    <stat.icon className="w-7 h-7 text-[var(--color-accent)]" />
                                </div>
                                <h3 className="text-3xl font-bold gradient-text mb-2">{stat.value}</h3>
                                <p className="text-[var(--color-text-muted)]">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="section-title text-right mb-6">{t('about.title')}</h2>
                            <p className="text-[var(--color-text-muted)] text-lg mb-8 leading-relaxed">
                                {t('about.description')}
                            </p>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="glass-card p-5">
                                    <h4 className="font-semibold text-[var(--color-accent)] mb-2">{t('about.vision')}</h4>
                                    <p className="text-sm text-[var(--color-text-muted)]">{t('about.vision_text')}</p>
                                </div>
                                <div className="glass-card p-5">
                                    <h4 className="font-semibold text-[var(--color-accent)] mb-2">{t('about.mission')}</h4>
                                    <p className="text-sm text-[var(--color-text-muted)]">{t('about.mission_text')}</p>
                                </div>
                            </div>

                            <Link to="/about" className="btn-primary mt-8 inline-flex">
                                المزيد عن الكلية
                                <ArrowLeft className="w-5 h-5 icon-flip" />
                            </Link>
                        </div>

                        <div className="relative">
                            <div className="glass-card p-8 aspect-square flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-6">
                                        <Award className="w-16 h-16 text-[var(--color-bg)]" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">التميز الأكاديمي</h3>
                                    <p className="text-[var(--color-text-muted)]">معتمدة لدى وزارة التعليم العالي</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Departments Section */}
            <section className="py-20 bg-[var(--color-bg-card)]/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="section-title">{t('departments.title')}</h2>
                        <p className="text-[var(--color-text-muted)] text-lg">{t('departments.subtitle')}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departments.length > 0 ? departments.slice(0, 6).map((dept) => (
                            <div key={dept.id} className="glass-card p-6 card-hover">
                                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center mb-4">
                                    <BookOpen className="w-6 h-6 text-[var(--color-accent)]" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{dept.name_ar}</h3>
                                <p className="text-[var(--color-text-muted)] text-sm line-clamp-2">
                                    {dept.description_ar || 'قسم أكاديمي متميز يقدم برامج متنوعة في تخصصات متعددة'}
                                </p>
                            </div>
                        )) : (
                            // Placeholder cards
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="glass-card p-6 card-hover">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center mb-4">
                                        <BookOpen className="w-6 h-6 text-[var(--color-accent)]" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">قسم {i + 1}</h3>
                                    <p className="text-[var(--color-text-muted)] text-sm">
                                        قسم أكاديمي متميز يقدم برامج متنوعة
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="text-center mt-10">
                        <Link to="/departments" className="btn-primary">
                            عرض جميع الأقسام
                            <ArrowLeft className="w-5 h-5 icon-flip" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Events Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-12">
                        <div>
                            <h2 className="section-title text-right">{t('events.title')}</h2>
                            <p className="text-[var(--color-text-muted)]">{t('events.subtitle')}</p>
                        </div>
                        <Link to="/events" className="btn-accent">
                            {t('events.view_all')}
                            <ArrowLeft className="w-5 h-5 icon-flip" />
                        </Link>
                    </div>

                    {events.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.slice(0, 3).map((event) => (
                                <Link key={event.id} to={`/events/${event.id}`} className="glass-card overflow-hidden card-hover">
                                    {event.image && (
                                        <div className="aspect-video bg-[var(--color-bg-elevated)]">
                                            <img src={event.image} alt={event.title_ar} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 text-[var(--color-accent)] text-sm mb-3">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(event.date).toLocaleDateString('ar-SD')}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">{event.title_ar}</h3>
                                        <p className="text-[var(--color-text-muted)] text-sm line-clamp-2">
                                            {event.description_ar}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 glass-card">
                            <Calendar className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                            <p className="text-[var(--color-text-muted)]">{t('events.no_events')}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-6">انضم إلينا الآن</h2>
                    <p className="text-xl text-white/80 mb-8">
                        ابدأ رحلتك الأكاديمية مع الكلية الإماراتية للعلوم والتكنولوجيا
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/register" className="btn-accent">
                            التسجيل الآن
                            <ArrowLeft className="w-5 h-5 icon-flip" />
                        </Link>
                        <Link to="/contact" className="bg-white/10 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors">
                            تواصل معنا
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
