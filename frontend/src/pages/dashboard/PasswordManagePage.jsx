import React, { useState, useEffect } from 'react';
import { Key, Search, X, Check, Eye, EyeOff, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export default function PasswordManagePage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    
    // Modal state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const roles = [
        { value: '', label: 'جميع الأدوار' },
        { value: 'system_manager', label: 'مدير النظام' },
        { value: 'department_manager', label: 'مدير القسم' },
        { value: 'supervisor', label: 'مشرف القسم' },
        { value: 'teacher', label: 'مدرس' },
        { value: 'ta', label: 'معيد' },
        { value: 'student', label: 'طالب' },
    ];

    useEffect(() => {
        fetchUsers();
    }, [selectedRole, searchQuery]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedRole) params.role = selectedRole;
            if (searchQuery) params.search = searchQuery;
            
            const res = await api.get('/auth/users/', { params });
            setUsers(res.data.results || res.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = (user) => {
        setSelectedUser(user);
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const generateRandomPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
        let pass = '';
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(pass);
        setConfirmPassword(pass);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword.length < 8) {
            setError('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين');
            return;
        }

        try {
            setSubmitting(true);
            const res = await api.post('/auth/admin-reset-password/', {
                user_id: selectedUser.id,
                new_password: newPassword
            });
            setSuccess(res.data.message || 'تم تحديث كلمة المرور بنجاح');
            setTimeout(() => {
                setShowModal(false);
                setSelectedUser(null);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
        } finally {
            setSubmitting(false);
        }
    };

    const getRoleLabel = (role) => {
        const found = roles.find((r) => r.value === role);
        return found ? found.label : role;
    };

    const getRoleColor = (role) => {
        const colors = {
            system_manager: 'var(--color-accent)',
            department_manager: 'var(--color-primary)',
            supervisor: 'var(--color-primary-light)',
            teacher: 'var(--color-success)',
            ta: 'var(--color-text-muted)',
            student: 'var(--color-warning)',
        };
        return colors[role] || 'var(--color-text-muted)';
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Key className="w-8 h-8 text-[var(--color-accent)]" />
                    إعادة تعيين كلمات المرور
                </h1>
                <p className="text-[var(--color-text-muted)]">
                    يمكن لمدير النظام إعادة تعيين كلمة المرور لأي حساب مستخدم أو طالب مباشرة ودون الحاجة لكلمة المرور القديمة.
                </p>
            </div>

            {/* Filter controls */}
            <div className="glass-card p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="ابحث باسم المستخدم، الاسم الكامل، البريد، أو الرقم الجامعي..."
                            className="input-field w-full pr-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div>
                        <select
                            className="input-field w-full"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* User List Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="spinner"></div>
                </div>
            ) : users.length > 0 ? (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">اسم المستخدم / الرقم الجامعي</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">الاسم الكامل</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">البريد الإلكتروني</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">نوع الحساب</th>
                                    <th className="text-center p-4 text-[var(--color-text-muted)] font-medium">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-white">{u.username}</div>
                                            {u.role === 'student' && u.university_student && (
                                                <div className="text-xs text-[var(--color-accent)] mt-0.5">
                                                    رقم جامعي: {u.university_student.university_number}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm">{u.full_name_ar || '-'}</td>
                                        <td className="p-4 text-sm text-[var(--color-text-muted)]">{u.email || '-'}</td>
                                        <td className="p-4">
                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${getRoleColor(u.role)}15`,
                                                    color: getRoleColor(u.role),
                                                    border: `1px solid ${getRoleColor(u.role)}30`
                                                }}
                                            >
                                                {getRoleLabel(u.role)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleResetPassword(u)}
                                                className="btn-primary hover:bg-[var(--color-accent)] hover:text-black py-1.5 px-3 text-xs inline-flex items-center gap-1.5 rounded-lg transition-all"
                                            >
                                                <Key className="w-3.5 h-3.5" />
                                                إعادة تعيين كلمة المرور
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <ShieldAlert className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد حسابات مطابقة للبحث</h3>
                    <p className="text-[var(--color-text-muted)]">تأكد من كتابة معايير البحث بشكل صحيح أو تغيير فلتر الأدوار.</p>
                </div>
            )}

            {/* Reset Password Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md border border-white/10 animate-fade-in">
                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Key className="w-5 h-5 text-[var(--color-accent)]" />
                                    إعادة تعيين كلمة المرور
                                </h2>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                    للحساب: <span className="text-white font-mono">{selectedUser.username}</span> ({selectedUser.full_name_ar || 'بدون اسم عربي'})
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[var(--color-text-muted)] hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="p-3.5 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-sm mb-4">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3.5 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-sm mb-4 flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">كلمة المرور الجديدة</label>
                                    <button
                                        type="button"
                                        onClick={generateRandomPassword}
                                        className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        توليد كلمة مرور عشوائية
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={8}
                                        className="input-field w-full pl-10"
                                        placeholder="أدخل 8 أحرف على الأقل"
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            setConfirmPassword(e.target.value); // Sync by default for generated ones
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">تأكيد كلمة المرور الجديدة</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="input-field w-full"
                                    placeholder="أعد إدخال كلمة المرور"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-accent flex-1 justify-center py-2.5"
                                >
                                    {submitting ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'حفظ كلمة المرور الجديدة'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-primary flex-1 justify-center py-2.5"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
