import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, GraduationCap } from 'lucide-react';
import api from '../../services/api';

export default function Departments() {
    const { t } = useTranslation();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/academic/departments/')
            .then(res => setDepartments(res.data.results || res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const iconOptions = [BookOpen, Users, GraduationCap];

    return (
        <div className="pt-20">
            {/* Hero */}
            <section className="py-20 animated-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                        <span className="gradient-text">{t('departments.title')}</span>
                    </h1>
                    <p className="text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto">
                        {t('departments.subtitle')}
                    </p>
                </div>
            </section>

            {/* Departments Grid */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="spinner"></div>
                        </div>
                    ) : departments.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {departments.map((dept, index) => {
                                const Icon = iconOptions[index % iconOptions.length];
                                return (
                                    <div key={dept.id} className="glass-card p-8 card-hover">
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center mb-6">
                                            <Icon className="w-8 h-8 text-[var(--color-accent)]" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3">{dept.name_ar}</h3>
                                        <p className="text-[var(--color-text-muted)] leading-relaxed">
                                            {dept.description_ar || 'قسم أكاديمي متميز يقدم برامج دراسية متنوعة تؤهل الطلاب لسوق العمل'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 glass-card">
                            <BookOpen className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                            <p className="text-xl text-[var(--color-text-muted)]">لا توجد أقسام متاحة حالياً</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
