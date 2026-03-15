import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, X, Save, Users } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function DepartmentsManage() {
    const { user } = useAuth();
    const canDelete = ['system_manager', 'department_manager'].includes(user?.role);
    const [departments, setDepartments] = useState([]);
    const [managers, setManagers] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        name_ar: '',
        description: '',
        description_ar: '',
        department_manager: '',
        supervisor: '',
    });

    useEffect(() => {
        fetchDepartments();
        fetchManagers();
        fetchSupervisors();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/academic/departments/');
            setDepartments(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            const res = await api.get('/auth/users/');
            const allUsers = res.data.results || res.data;
            const deptManagers = allUsers.filter(u => u.role === 'department_manager');
            setManagers(deptManagers);
        } catch (error) {
            console.error('Error fetching managers:', error);
        }
    };

    const fetchSupervisors = async () => {
        try {
            const res = await api.get('/auth/users/');
            const allUsers = res.data.results || res.data;
            const sups = allUsers.filter(u => u.role === 'supervisor');
            setSupervisors(sups);
        } catch (error) {
            console.error('Error fetching supervisors:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                name: formData.name,
                name_ar: formData.name_ar,
                description: formData.description,
                description_ar: formData.description_ar,
            };

            // Only include department_manager if it has a value, otherwise set to null explicitly
            if (formData.department_manager && formData.department_manager !== '') {
                data.department_manager = parseInt(formData.department_manager);
            } else {
                data.department_manager = null;
            }

            if (formData.supervisor && formData.supervisor !== '') {
                data.supervisor = parseInt(formData.supervisor);
            } else {
                data.supervisor = null;
            }

            if (editingDept) {
                await api.patch(`/academic/departments/${editingDept.id}/`, data);
            } else {
                await api.post('/academic/departments/', data);
            }
            fetchDepartments();
            closeModal();
        } catch (error) {
            console.error('Error saving department:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
            try {
                await api.delete(`/academic/departments/${id}/`);
                fetchDepartments();
            } catch (error) {
                console.error('Error deleting department:', error);
            }
        }
    };

    const openModal = (dept = null) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({
                name: dept.name,
                name_ar: dept.name_ar,
                description: dept.description || '',
                description_ar: dept.description_ar || '',
                department_manager: dept.department_manager?.id || dept.department_manager || '',
                supervisor: dept.supervisor?.id || dept.supervisor || '',
            });
        } else {
            setEditingDept(null);
            setFormData({ name: '', name_ar: '', description: '', description_ar: '', department_manager: '', supervisor: '' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingDept(null);
        setFormData({ name: '', name_ar: '', description: '', description_ar: '', department_manager: '', supervisor: '' });
    };

    // Get available managers (not assigned to other departments)
    const getAvailableManagers = () => {
        const assignedManagerIds = departments
            .filter(d => d.department_manager && (!editingDept || d.id !== editingDept.id))
            .map(d => d.department_manager?.id || d.department_manager);
        return managers.filter(m => !assignedManagerIds.includes(m.id));
    };

    // Get available supervisors
    const getAvailableSupervisors = () => {
        return supervisors;
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
                    <h1 className="text-3xl font-bold mb-2">إدارة الأقسام</h1>
                    <p className="text-[var(--color-text-muted)]">إضافة وتعديل الأقسام الأكاديمية</p>
                </div>
                <button onClick={() => openModal()} className="btn-accent">
                    <Plus className="w-5 h-5" />
                    إضافة قسم
                </button>
            </div>

            {departments.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((dept) => (
                        <div key={dept.id} className="glass-card p-6 card-hover">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-[var(--color-accent)]" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(dept)}
                                        className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(dept.id)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-error)]"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{dept.name_ar}</h3>
                            <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                {dept.description_ar || 'لا يوجد وصف'}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4 text-[var(--color-accent)]" />
                                {dept.department_manager_details ? (
                                    <span className="text-[var(--color-accent)]">
                                        مدير القسم: {dept.department_manager_details.full_name_ar || dept.department_manager_details.username}
                                    </span>
                                ) : (
                                    <span className="text-[var(--color-warning)]">لم يتم تعيين مدير</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm mt-2">
                                <Users className="w-4 h-4 text-[var(--color-success)]" />
                                {dept.supervisor_details ? (
                                    <span className="text-[var(--color-success)]">
                                        المشرف: {dept.supervisor_details.full_name_ar || dept.supervisor_details.username}
                                    </span>
                                ) : (
                                    <span className="text-[var(--color-text-muted)]">لم يتم تعيين مشرف</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <BookOpen className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد أقسام</h3>
                    <p className="text-[var(--color-text-muted)] mb-6">لم يتم إضافة أي أقسام بعد</p>
                    <button onClick={() => openModal()} className="btn-accent">
                        <Plus className="w-5 h-5" />
                        إضافة أول قسم
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">
                                {editingDept ? 'تعديل القسم' : 'إضافة قسم جديد'}
                            </h2>
                            <button onClick={closeModal} className="p-2 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">الاسم (عربي) *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.name_ar}
                                        onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Name (English) *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">الوصف (عربي)</label>
                                <textarea
                                    rows={3}
                                    className="input-field resize-none"
                                    value={formData.description_ar}
                                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description (English)</label>
                                <textarea
                                    rows={3}
                                    className="input-field resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            {/* Department Manager Assignment */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Users className="w-4 h-4 inline ml-1" />
                                    مدير القسم
                                </label>
                                <select
                                    className="input-field"
                                    value={formData.department_manager}
                                    onChange={(e) => setFormData({ ...formData, department_manager: e.target.value })}
                                >
                                    <option value="">-- بدون مدير --</option>
                                    {getAvailableManagers().map((manager) => (
                                        <option key={manager.id} value={manager.id}>
                                            {manager.full_name_ar || manager.username} ({manager.email || manager.username})
                                        </option>
                                    ))}
                                    {/* Also show current manager if editing */}
                                    {editingDept?.department_manager_details && !getAvailableManagers().find(m => m.id === (editingDept.department_manager?.id || editingDept.department_manager)) && (
                                        <option value={editingDept.department_manager?.id || editingDept.department_manager}>
                                            {editingDept.department_manager_details.full_name_ar || editingDept.department_manager_details.username} (الحالي)
                                        </option>
                                    )}
                                </select>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                    يمكنك تعيين مدير قسم من قائمة المستخدمين المتاحين
                                </p>
                            </div>

                            {/* Supervisor Assignment */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Users className="w-4 h-4 inline ml-1" />
                                    المشرف
                                </label>
                                <select
                                    className="input-field"
                                    value={formData.supervisor}
                                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                                >
                                    <option value="">-- بدون مشرف --</option>
                                    {getAvailableSupervisors().map((sup) => (
                                        <option key={sup.id} value={sup.id}>
                                            {sup.full_name_ar || sup.username} ({sup.email || sup.username})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                    يمكنك تعيين مشرف للقسم
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn-accent flex-1 justify-center">
                                    <Save className="w-5 h-5" />
                                    {editingDept ? 'تحديث' : 'إضافة'}
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

