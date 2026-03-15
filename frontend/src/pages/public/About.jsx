import { useTranslation } from 'react-i18next';
import { Target, Eye, Award, Users, BookOpen, CheckCircle } from 'lucide-react';

export default function About() {
    const { t } = useTranslation();

    const values = [
        { icon: Award, title: 'الجودة', description: 'نلتزم بأعلى معايير الجودة في التعليم' },
        { icon: Users, title: 'التعاون', description: 'نعمل معاً لتحقيق أهدافنا المشتركة' },
        { icon: BookOpen, title: 'الابتكار', description: 'نسعى دائماً للتطوير والتحسين المستمر' },
    ];

    const achievements = [
        'اعتماد وزارة التعليم العالي',
        'شراكات دولية مع جامعات عالمية',
        'برامج تدريبية متميزة',
        'مختبرات حديثة ومجهزة',
        'كوادر أكاديمية متخصصة',
        'بيئة تعليمية محفزة',
    ];

    return (
        <div className="pt-20">
            {/* Hero */}
            <section className="py-20 animated-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            <span className="gradient-text">{t('about.title')}</span>
                        </h1>
                        <p className="text-xl text-[var(--color-text-muted)] leading-relaxed">
                            {t('about.description')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Vision & Mission */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="glass-card p-8 card-hover">
                            <div className="w-14 h-14 rounded-xl bg-[var(--color-accent)]/20 flex items-center justify-center mb-6">
                                <Eye className="w-7 h-7 text-[var(--color-accent)]" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">{t('about.vision')}</h2>
                            <p className="text-[var(--color-text-muted)] text-lg leading-relaxed">
                                {t('about.vision_text')}
                            </p>
                        </div>

                        <div className="glass-card p-8 card-hover">
                            <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center mb-6">
                                <Target className="w-7 h-7 text-[var(--color-accent)]" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">{t('about.mission')}</h2>
                            <p className="text-[var(--color-text-muted)] text-lg leading-relaxed">
                                {t('about.mission_text')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-[var(--color-bg-card)]/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="section-title mb-12">قيمنا</h2>
                    <div className="grid sm:grid-cols-3 gap-6">
                        {values.map((value, index) => (
                            <div key={index} className="glass-card p-6 text-center card-hover">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-4">
                                    <value.icon className="w-8 h-8 text-[var(--color-bg)]" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                                <p className="text-[var(--color-text-muted)]">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Achievements */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="section-title text-right mb-6">إنجازاتنا</h2>
                            <p className="text-[var(--color-text-muted)] text-lg mb-8">
                                نفخر بما حققناه من إنجازات على مدار السنوات، ونسعى دائماً لتحقيق المزيد
                            </p>
                            <div className="grid gap-4">
                                {achievements.map((achievement, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--color-success)]/20 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
                                        </div>
                                        <span className="text-lg">{achievement}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card p-8">
                            <div className="grid grid-cols-2 gap-6 text-center">
                                <div>
                                    <h3 className="text-4xl font-bold gradient-text mb-2">26+</h3>
                                    <p className="text-[var(--color-text-muted)]">سنة خبرة</p>
                                </div>
                                <div>
                                    <h3 className="text-4xl font-bold gradient-text mb-2">10000+</h3>
                                    <p className="text-[var(--color-text-muted)]">خريج</p>
                                </div>
                                <div>
                                    <h3 className="text-4xl font-bold gradient-text mb-2">50+</h3>
                                    <p className="text-[var(--color-text-muted)]">أستاذ</p>
                                </div>
                                <div>
                                    <h3 className="text-4xl font-bold gradient-text mb-2">17</h3>
                                    <p className="text-[var(--color-text-muted)]">قسم أكاديمي</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
