import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, GraduationCap, Facebook, Twitter, Instagram, Code } from 'lucide-react';
import college_logo from '../../assets/college_logo.png';
export default function Footer() {
    const { t } = useTranslation();

    const quickLinks = [
        { path: '/', label: t('nav.home') },
        { path: '/about', label: t('nav.about') },
        { path: '/departments', label: t('nav.departments') },
        { path: '/events', label: t('nav.events') },
        { path: '/contact', label: t('nav.contact') },
        { path: '/policies', label: 'السياسات واللوائح' },
    ];

    return (
        <footer className="bg-[var(--color-bg-card)] border-t border-white/10 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Logo & Description */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                                <img src={college_logo} alt="College Logo" className="w-12 h-12" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold gradient-text"> كلية الامارات </h3>
                                <p className="text-sm text-[var(--color-text-muted)]">للعلوم والتكنولوجيا</p>
                            </div>
                        </div>
                        <p className="text-[var(--color-text-muted)] mb-6 max-w-md">
                            {t('footer.description')}
                        </p>
                        <div className="flex gap-4">
                            <a target='_blank' href="https://www.facebook.com/share/1CveoX9t48/" className="w-10 h-10 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center hover:bg-[var(--color-primary)] transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a target='_blank' href="#" className="w-10 h-10 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center hover:bg-[var(--color-primary)] transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a target='_blank' href="#" className="w-10 h-10 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center hover:bg-[var(--color-primary)] transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">{t('footer.quick_links')}</h4>
                        <ul className="space-y-3">
                            {quickLinks.map((link) => (
                                <li key={link.path}>
                                    <Link to={link.path} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">{t('footer.contact_info')}</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-[var(--color-accent)] mt-1 flex-shrink-0" />
                                <span className="text-[var(--color-text-muted)]">{t('footer.location')}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0" />
                                <a href="tel:+249123456789" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                                    +24990
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0" />
                                <a href="mailto:info@eust.edu.sd" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                                    info@eust.edu.sd
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/10 mt-10 pt-6 text-center">
                    <p className="text-[var(--color-text-muted)]">
                        © {new Date().getFullYear()} كلية الامارات للعلوم والتكنولوجيا. {t('footer.rights')}
                    </p>
                    <p className='text-[var(--color-text-muted)] flex items-center gap-2 justify-center text-center  mt-2'>
                        <a href="https://stingdev.pro/"
                            className='text-[var(--color-accent)]  hover:text-[var(--color-primary)] transition-colors'
                            target="_blank" rel="noopener noreferrer">stingdev</a>
                        <span className='flex items-center gap-2'>
                            <Code className='w-5 h-5 text-[var(--color-accent)] flex-shrink-0' />
                            developed by
                        </span>

                    </p>
                </div>
            </div>
        </footer>
    );
}
