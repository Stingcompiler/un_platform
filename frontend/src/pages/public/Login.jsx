import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(formData.username, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pt-20 min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="glass-card p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-4">
                            <LogIn className="w-8 h-8 text-[var(--color-bg)]" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">{t('login.title')}</h1>
                        <p className="text-[var(--color-text-muted)]">{t('login.subtitle')}</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 mb-6">
                            <AlertCircle className="w-5 h-5 text-[var(--color-error)] flex-shrink-0" />
                            <p className="text-[var(--color-error)]">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2">{t('login.username')}</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                placeholder="اسم المستخدم / الاسم الكامل / رقم النظام"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('login.password')}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="input-field pl-12"
                                    placeholder={t('login.password')}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-accent w-full justify-center py-3"
                        >
                            {loading ? <span className="spinner w-5 h-5 border-2"></span> : t('login.submit')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-[var(--color-text-muted)]">
                            {t('login.no_account')}{' '}
                            <Link to="/register" className="text-[var(--color-accent)] hover:underline">
                                {t('login.register_link')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
