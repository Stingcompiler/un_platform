import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, Lock, GraduationCap, Building2, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        full_name_ar: '',
        username: '',
        email: '',
        phone: '',
        year: '',
        semester: '',
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                full_name_ar: user.full_name_ar || '',
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
                year: user.year || '',
                semester: user.semester || '',
            });
        }
    }, [user]);

    const getRoleLabel = () => {
        const labels = {
            system_manager: 'مدير النظام',
            department_manager: 'مدير القسم',
            supervisor: 'مشرف القسم',
            teacher: 'مدرس',
            ta: 'معيد',
            student: 'طالب',
        };
        return labels[user?.role] || 'مستخدم';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await api.patch('/auth/profile/', formData);
            setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح' });
            if (refreshUser) refreshUser();
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'حدث خطأ أثناء تحديث البيانات'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة' });
            return;
        }

        if (passwordData.new_password.length < 8) {
            setMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await api.post('/auth/change-password/', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });
            setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setShowPasswordForm(false);
        } catch (error) {
            console.error('Error changing password:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'كلمة المرور الحالية غير صحيحة'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">الملف الشخصي</h1>
                <p className="text-[var(--color-text-muted)]">
                    عرض وتعديل بياناتك الشخصية
                </p>
            </div>

            <div className="grid lg:grid-cols-[300px,1fr] gap-6">
                {/* Profile Card */}
                <div className="glass-card p-6 text-center lg:sticky lg:top-24 lg:h-fit">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-4">
                        <GraduationCap className="w-12 h-12 text-[var(--color-bg)]" />
                    </div>
                    <h2 className="text-xl font-bold mb-1">{user?.full_name_ar || user?.username}</h2>
                    <p className="text-[var(--color-accent)] mb-4">{getRoleLabel()}</p>

                    <div className="space-y-3 text-sm text-right border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[var(--color-text-muted)]" />
                            <span className="text-[var(--color-text-muted)]">اسم المستخدم:</span>
                            <span className="mr-auto font-mono">{user?.username}</span>
                        </div>
                        {user?.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <span className="text-[var(--color-text-muted)]">البريد:</span>
                                <span className="mr-auto">{user?.email}</span>
                            </div>
                        )}
                        {user?.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <span className="text-[var(--color-text-muted)]">الهاتف:</span>
                                <span className="mr-auto" dir="ltr">{user?.phone}</span>
                            </div>
                        )}
                    </div>

                    {/* Student Info */}
                    {user?.role === 'student' && (
                        <div className="space-y-3 text-sm text-right border-t border-white/10 pt-4 mt-4">
                            <h3 className="font-medium text-[var(--color-accent)]">البيانات الأكاديمية</h3>
                            {user?.university_number && (
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-[var(--color-text-muted)]" />
                                    <span className="text-[var(--color-text-muted)]">الرقم الجامعي:</span>
                                    <span className="mr-auto font-mono">{user.university_number}</span>
                                </div>
                            )}
                            {user?.department && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-[var(--color-text-muted)]" />
                                    <span className="text-[var(--color-text-muted)]">القسم:</span>
                                    <span className="mr-auto">{user.department.name_ar}</span>
                                </div>
                            )}
                            {user?.year && (
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-[var(--color-text-muted)]" />
                                    <span className="text-[var(--color-text-muted)]">السنة:</span>
                                    <span className="mr-auto">السنة {user.year}</span>
                                </div>
                            )}
                            {user?.semester && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                                    <span className="text-[var(--color-text-muted)]">الفصل:</span>
                                    <span className="mr-auto">الفصل {user.semester}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Edit Forms */}
                <div className="space-y-6">
                    {/* Message */}
                    {message.text && (
                        <div className={`p-4 rounded-xl ${message.type === 'success'
                            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                            : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Profile Form */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-6">تعديل البيانات الشخصية</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full name - only for non-students */}
                            {user?.role !== 'student' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        الاسم الكامل بالعربية
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.full_name_ar}
                                        onChange={(e) => setFormData({ ...formData, full_name_ar: e.target.value })}
                                        className="input-field"
                                        placeholder="أدخل اسمك الكامل"
                                    />
                                </div>
                            )}

                            {/* Username - only for students */}
                            {user?.role === 'student' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        اسم المستخدم
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="input-field"
                                        placeholder="أدخل اسم المستخدم"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    البريد الإلكتروني
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field"
                                    placeholder="example@email.com"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    رقم الهاتف
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input-field"
                                    placeholder="+971 50 123 4567"
                                    dir="ltr"
                                />
                            </div>

                            {/* Year & Semester - only for students */}
                            {user?.role === 'student' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            السنة الدراسية
                                        </label>
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
                                        <label className="block text-sm font-medium mb-1">
                                            الفصل الدراسي
                                        </label>
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
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-accent w-full justify-center"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                            </button>
                        </form>
                    </div>




                    {/* Password Change */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">تغيير كلمة المرور</h2>
                            <button
                                onClick={() => setShowPasswordForm(!showPasswordForm)}
                                className="text-[var(--color-accent)] hover:underline text-sm"
                            >
                                {showPasswordForm ? 'إلغاء' : 'تغيير'}
                            </button>
                        </div>

                        {showPasswordForm ? (
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        كلمة المرور الحالية
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        كلمة المرور الجديدة
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        className="input-field"
                                        required
                                        minLength={8}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        تأكيد كلمة المرور الجديدة
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full justify-center"
                                >
                                    <Lock className="w-5 h-5" />
                                    {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                                </button>
                            </form>
                        ) : (
                            <p className="text-[var(--color-text-muted)]">
                                اضغط على "تغيير" لتغيير كلمة المرور الخاصة بك
                            </p>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
}
