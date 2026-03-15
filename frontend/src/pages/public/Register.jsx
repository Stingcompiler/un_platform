import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export default function Register() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        university_number: '',
        full_name: '',
        username: '',
        year: '',
        semester: '',
        password: '',
        password_confirm: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.password_confirm) {
            setError('كلمات المرور غير متطابقة');
            setLoading(false);
            return;
        }

        try {
            await register(formData);
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            const errors = err.response?.data;
            if (errors) {
                const firstError = Object.values(errors)[0];
                setError(Array.isArray(firstError) ? firstError[0] : firstError);
            } else {
                setError(t('common.error'));
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="pt-20 min-h-screen flex items-center justify-center px-4">
                <div className="glass-card p-8 text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-[var(--color-success)]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">تم التسجيل بنجاح!</h2>
                    <p className="text-[var(--color-text-muted)]">جاري تحويلك إلى لوحة التحكم...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-20 min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="glass-card p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-8 h-8 text-[var(--color-bg)]" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">{t('register.title')}</h1>
                        <p className="text-[var(--color-text-muted)]">{t('register.subtitle')}</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 mb-6">
                            <AlertCircle className="w-5 h-5 text-[var(--color-error)] flex-shrink-0" />
                            <p className="text-[var(--color-error)]">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2">{t('register.university_number')}</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                placeholder="مثال: 2024001"
                                value={formData.university_number}
                                onChange={(e) => setFormData({ ...formData, university_number: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('register.full_name')}</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                placeholder="الاسم كما هو مسجل في الكلية"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('register.username')}</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="اختياري - يمكنك تركه فارغاً"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">{t('register.year')}</label>
                                <select
                                    className="input-field"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                >
                                    <option value="">اختر السنة</option>
                                    <option value="1">السنة الأولى</option>
                                    <option value="2">السنة الثانية</option>
                                    <option value="3">السنة الثالثة</option>
                                    <option value="4">السنة الرابعة</option>
                                    <option value="5">السنة الخامسة</option>
                                    <option value="6">السنة السادسة</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">{t('register.semester')}</label>
                                <select
                                    className="input-field"
                                    value={formData.semester}
                                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                >
                                    <option value="">اختر الفصل</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                                        <option key={s} value={s}>الفصل {s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('register.password')}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    className="input-field pl-12"
                                    placeholder="8 أحرف على الأقل"
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

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('register.password_confirm')}</label>
                            <input
                                type="password"
                                required
                                className="input-field"
                                placeholder={t('register.password_confirm')}
                                value={formData.password_confirm}
                                onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-accent w-full justify-center py-3"
                        >
                            {loading ? <span className="spinner w-5 h-5 border-2"></span> : t('register.submit')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-[var(--color-text-muted)]">
                            {t('register.have_account')}{' '}
                            <Link to="/login" className="text-[var(--color-accent)] hover:underline">
                                {t('register.login_link')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
