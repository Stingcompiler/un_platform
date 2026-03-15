import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, X, Save, Shield } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function UsersManage() {
    const { user } = useAuth();
    const canDelete = ['system_manager', 'department_manager'].includes(user?.role);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name_ar: '',
        role: 'teacher',
        password: '',
    });

    const roles = [
        { value: 'system_manager', label: 'مدير النظام' },
        { value: 'department_manager', label: 'مدير القسم' },
        { value: 'supervisor', label: 'مشرف القسم' },
        { value: 'teacher', label: 'مدرس' },
        { value: 'ta', label: 'معيد' },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users/');
            setUsers(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData };
            if (editingUser && !data.password) {
                delete data.password;
            }

            if (editingUser) {
                await api.patch(`/auth/users/${editingUser.id}/`, data);
            } else {
                await api.post('/auth/users/', data);
            }
            fetchUsers();
            closeModal();
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            try {
                await api.delete(`/auth/users/${id}/`);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const openModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                email: user.email || '',
                full_name_ar: user.full_name_ar || '',
                role: user.role,
                password: '',
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                email: '',
                full_name_ar: '',
                role: 'teacher',
                password: '',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const getRoleLabel = (role) => {
        const found = roles.find((r) => r.value === role);
        return found ? found.label : role;
    };

    const getRoleColor = (role) => {
        const colors = {
            system_manager: 'var(--color-accent)',
            department_manager: 'var(--color-primary)',
            supervisor: 'var(--color-primary)',
            teacher: 'var(--color-success)',
            ta: 'var(--color-text-muted)',
        };
        return colors[role] || 'var(--color-text-muted)';
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">إدارة المستخدمين</h1>
                    <p className="text-[var(--color-text-muted)]">إضافة وتعديل حسابات المستخدمين</p>
                </div>
                <button onClick={() => openModal()} className="btn-accent">
                    <Plus className="w-5 h-5" />
                    إضافة مستخدم
                </button>
            </div>

            {users.length > 0 ? (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">المستخدم</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">الاسم</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">الدور</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                                                    <span className="text-sm font-medium">{user.username[0].toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.username}</p>
                                                    <p className="text-sm text-[var(--color-text-muted)]">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">{user.full_name_ar || '-'}</td>
                                        <td className="p-4">
                                            <span
                                                className="px-3 py-1 rounded-full text-sm"
                                                style={{ backgroundColor: `${getRoleColor(user.role)}20`, color: getRoleColor(user.role) }}
                                            >
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openModal(user)}
                                                    className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-error)]"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <Users className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا يوجد مستخدمين</h3>
                    <p className="text-[var(--color-text-muted)] mb-6">لم يتم إضافة أي مستخدمين بعد</p>
                    <button onClick={() => openModal()} className="btn-accent">
                        <Plus className="w-5 h-5" />
                        إضافة أول مستخدم
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">
                                {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
                            </h2>
                            <button onClick={closeModal} className="p-2 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">اسم المستخدم</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">الاسم الكامل (عربي)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.full_name_ar}
                                    onChange={(e) => setFormData({ ...formData, full_name_ar: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">الدور</label>
                                <select
                                    className="input-field"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    {roles.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {editingUser ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    className="input-field"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn-accent flex-1 justify-center">
                                    <Save className="w-5 h-5" />
                                    {editingUser ? 'تحديث' : 'إضافة'}
                                </button>
                                <button type="button" onClick={closeModal} className="btn-primary flex-1 justify-center">
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
