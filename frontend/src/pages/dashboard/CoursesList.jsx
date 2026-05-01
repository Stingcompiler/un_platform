import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, Edit, Trash2, Users, X, Save, UserPlus, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function CoursesList() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'system_manager';
    const isManager = ['department_manager', 'supervisor'].includes(user?.role);
    const isProfessor = ['teacher', 'ta'].includes(user?.role);
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [teachers, setTeachers] = useState([]);

    // Subject filter state
    const [filterDept, setFilterDept] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showInstructorModal, setShowInstructorModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        name_ar: '',
        code: '',
        description: '',
        description_ar: '',
        department: '',
        academic_year: 1,
        semester: 1,
        credit_hours: 3,
    });
    const [instructorForm, setInstructorForm] = useState({
        user: '',
        role: 'teacher',
    });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        fetchCourses();
        fetchDepartments();
        fetchTeachers();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/academic/courses/');
            setCourses(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/academic/departments/');
            const depts = res.data.results || res.data;
            setDepartments(depts);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/auth/users/');
            const allUsers = res.data.results || res.data;
            // Filter teachers and TAs
            const teacherUsers = allUsers.filter(u => u.role === 'teacher' || u.role === 'ta');
            setTeachers(teacherUsers);
            console.log('Teachers loaded:', teacherUsers); // Debug log
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                department: parseInt(formData.department),
                academic_year: parseInt(formData.academic_year),
                semester: parseInt(formData.semester),
                credit_hours: parseInt(formData.credit_hours),
            };

            if (editingCourse) {
                await api.patch(`/academic/courses/${editingCourse.id}/`, data);
            } else {
                await api.post('/academic/courses/', data);
            }
            fetchCourses();
            closeModal();
        } catch (error) {
            console.error('Error saving course:', error);
            alert(error.response?.data?.detail || 'حدث خطأ أثناء حفظ المادة');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذه المادة؟')) {
            try {
                await api.delete(`/academic/courses/${id}/`);
                fetchCourses();
            } catch (error) {
                console.error('Error deleting course:', error);
            }
        }
    };

    const handleAssignInstructor = async (e) => {
        e.preventDefault();
        if (!selectedCourse) return;

        try {
            await api.post('/academic/instructors/', {
                user: parseInt(instructorForm.user),
                course: selectedCourse.id,
                role: instructorForm.role,
            });

            // Show success message
            showToast('تم تعيين المدرس بنجاح!', 'success');

            // Fetch updated courses data
            const res = await api.get('/academic/courses/');
            const updatedCourses = res.data.results || res.data;
            setCourses(updatedCourses);

            // Close modal and reset form
            closeInstructorModal();

        } catch (error) {
            console.error('Error assigning instructor:', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.detail
                || error.response?.data?.non_field_errors?.[0]
                || JSON.stringify(error.response?.data)
                || 'حدث خطأ أثناء تعيين المدرس';
            showToast(errorMsg, 'error');
        }
    };

    const handleRemoveInstructor = async (instructorId) => {
        if (window.confirm('هل أنت متأكد من إزالة هذا المدرس؟')) {
            try {
                await api.delete(`/academic/instructors/${instructorId}/`);
                fetchCourses();
            } catch (error) {
                console.error('Error removing instructor:', error);
            }
        }
    };

    const openModal = (course = null) => {
        if (course) {
            setEditingCourse(course);
            setFormData({
                name: course.name,
                name_ar: course.name_ar,
                code: course.code,
                description: course.description || '',
                description_ar: course.description_ar || '',
                department: course.department,
                academic_year: course.academic_year,
                semester: course.semester,
                credit_hours: course.credit_hours,
            });
        } else {
            setEditingCourse(null);
            // For department manager, auto-select their department
            const defaultDept = (user?.role === 'department_manager' || user?.role === 'supervisor') && departments.length === 1
                ? departments[0]?.id
                : (departments[0]?.id || '');
            setFormData({
                name: '',
                name_ar: '',
                code: '',
                description: '',
                description_ar: '',
                department: defaultDept,
                academic_year: 1,
                semester: 1,
                credit_hours: 3,
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCourse(null);
    };

    const openInstructorModal = (course) => {
        setSelectedCourse(course);
        setInstructorForm({ user: '', role: 'teacher' });
        setShowInstructorModal(true);
    };

    const closeInstructorModal = () => {
        setShowInstructorModal(false);
        setSelectedCourse(null);
    };

    // Get available teachers for a course (not already assigned)
    const getAvailableTeachers = () => {
        if (!selectedCourse) return teachers;
        const assignedUserIds = selectedCourse.instructors?.map(i => i.user_id) || [];
        console.log('Selected course instructors:', selectedCourse.instructors);
        console.log('Assigned user IDs:', assignedUserIds);
        console.log('All teachers:', teachers);
        const availableTeachers = teachers.filter(t => !assignedUserIds.includes(t.id));
        console.log('Available teachers:', availableTeachers);
        return availableTeachers;
    };

    const canManageCourses = user?.role === 'system_manager' || user?.role === 'department_manager' || user?.role === 'supervisor';
    const canDeleteCourses = user?.role === 'system_manager' || user?.role === 'department_manager';

    // Client-side filtering
    const filteredCourses = useMemo(() => {
        let data = courses;
        if (filterDept) {
            data = data.filter(c => String(c.department) === filterDept);
        }
        if (filterLevel) {
            data = data.filter(c => String(c.academic_year) === filterLevel);
        }
        if (filterSemester) {
            data = data.filter(c => String(c.semester) === filterSemester);
        }
        if (filterSearch.trim()) {
            const q = filterSearch.toLowerCase();
            data = data.filter(c =>
                (c.name_ar || '').toLowerCase().includes(q) ||
                (c.name || '').toLowerCase().includes(q) ||
                (c.code || '').toLowerCase().includes(q)
            );
        }
        return data;
    }, [courses, filterDept, filterLevel, filterSemester, filterSearch]);

    const filterActiveCount = [filterDept, filterLevel, filterSemester, filterSearch].filter(Boolean).length;
    const resetFilters = () => { setFilterDept(''); setFilterLevel(''); setFilterSemester(''); setFilterSearch(''); };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">إدارة المواد</h1>
                    <p className="text-[var(--color-text-muted)]">إضافة وتعديل المواد الدراسية</p>
                </div>
                {canManageCourses && (
                    <button onClick={() => openModal()} className="btn-accent">
                        <Plus className="w-5 h-5" />
                        إضافة مادة
                    </button>
                )}
            </div>

            {/* Dept context banner for managers */}
            {isManager && user?.department && (
                <div className="mb-4 px-4 py-2 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-sm flex items-center gap-2">
                    <span className="text-[var(--color-accent)] font-medium">القسم:</span>
                    <span>{user.department.name_ar}</span>
                    <span className="text-[var(--color-text-muted)] text-xs mr-auto">البيانات مقيدة بقسمك فقط</span>
                </div>
            )}

            {/* Role-Based Filters */}
            <div className="glass-card p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[var(--color-accent)]" />
                        الفلاتر
                        {filterActiveCount > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-bold">{filterActiveCount}</span>
                        )}
                    </span>
                    {filterActiveCount > 0 && (
                        <button onClick={resetFilters} className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors">
                            <X className="w-3 h-3" /> مسح الكل
                        </button>
                    )}
                </div>

                <div className={`grid gap-3 ${isAdmin ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                    {/* Subject Name Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input type="text" className="input-field pr-10" placeholder="ابحث باسم المادة..."
                            value={filterSearch} onChange={e => setFilterSearch(e.target.value)} />
                    </div>

                    {/* Department filter — system_manager only */}
                    {isAdmin && (
                        <select className="input-field" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                            <option value="">جميع الأقسام</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
                        </select>
                    )}

                    {/* Level (1-5) */}
                    <select className="input-field" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                        <option value="">جميع المستويات</option>
                        {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>المستوى {y}</option>)}
                    </select>

                    {/* Semester (1-10) */}
                    <select className="input-field" value={filterSemester} onChange={e => setFilterSemester(e.target.value)}>
                        <option value="">جميع الفصول</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <option key={s} value={s}>الفصل {s}</option>)}
                    </select>
                </div>
            </div>

            {/* Results summary */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--color-text-muted)]">
                    {filteredCourses.length === 0 ? 'لا توجد نتائج' : `${filteredCourses.length} مادة`}
                </p>
            </div>

            {filteredCourses.length > 0 ? (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">الرمز</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">اسم المادة</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">القسم</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">المدرسين</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">الساعات</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">الفصل</th>
                                    <th className="text-right p-4 text-[var(--color-text-muted)] font-medium">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCourses.map((course) => (
                                    <tr key={course.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-4">
                                            <span className="px-3 py-1 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-sm">
                                                {course.code}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium">{course.name_ar}</td>
                                        <td className="p-4 text-[var(--color-text-muted)]">{course.department_name}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {course.instructors?.length > 0 ? (
                                                    course.instructors.map(inst => (
                                                        <span
                                                            key={inst.id}
                                                            className="px-2 py-1 rounded text-xs bg-[var(--color-primary-light)]/20 text-[var(--color-text)]"
                                                            title={inst.role_display}
                                                        >
                                                            {inst.name}
                                                            {canManageCourses && (
                                                                <button
                                                                    onClick={() => handleRemoveInstructor(inst.id)}
                                                                    className="mr-1 text-[var(--color-error)] hover:text-red-400"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[var(--color-warning)] text-sm">لا يوجد</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-[var(--color-text-muted)]">{course.credit_hours}</td>
                                        <td className="p-4 text-[var(--color-text-muted)]">الفصل {course.semester}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {canManageCourses && (
                                                    <>
                                                        <button
                                                            onClick={() => openInstructorModal(course)}
                                                            className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-accent)]"
                                                            title="تعيين مدرس"
                                                        >
                                                            <UserPlus className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openModal(course)}
                                                            className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]"
                                                            title="تعديل"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        {canDeleteCourses && (
                                                            <button
                                                                onClick={() => handleDelete(course.id)}
                                                                className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-error)]"
                                                                title="حذف"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </>
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
                    <BookOpen className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد مواد</h3>
                    <p className="text-[var(--color-text-muted)] mb-6">
                        {filterActiveCount > 0 ? 'لا توجد مواد تطابق الفلاتر المحددة' : 'لم يتم إضافة أي مواد بعد'}
                    </p>
                    {filterActiveCount > 0 ? (
                        <button onClick={resetFilters} className="btn-accent">
                            <X className="w-5 h-5" />
                            مسح الفلاتر
                        </button>
                    ) : canManageCourses && (
                        <button onClick={() => openModal()} className="btn-accent">
                            <Plus className="w-5 h-5" />
                            إضافة أول مادة
                        </button>
                    )}
                </div>
            )}

            {/* Course Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">
                                {editingCourse ? 'تعديل المادة' : 'إضافة مادة جديدة'}
                            </h2>
                            <button onClick={closeModal} className="p-2 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">رمز المادة *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="CS101"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">القسم *</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    >
                                        <option value="">اختر القسم</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name_ar}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">اسم المادة (عربي) *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.name_ar}
                                        onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Course Name (English) *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">السنة الدراسية *</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={formData.academic_year}
                                        onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                    >
                                        {[1, 2, 3, 4, 5].map((year) => (
                                            <option key={year} value={year}>
                                                السنة {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">الفصل الدراسي *</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                    >
                                        <option value={1}>الفصل الأول</option>
                                        <option value={2}>الفصل الثاني</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">الساعات المعتمدة *</label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        max={6}
                                        className="input-field"
                                        value={formData.credit_hours}
                                        onChange={(e) => setFormData({ ...formData, credit_hours: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">الوصف (عربي)</label>
                                <textarea
                                    rows={2}
                                    className="input-field resize-none"
                                    value={formData.description_ar}
                                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description (English)</label>
                                <textarea
                                    rows={2}
                                    className="input-field resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    dir="ltr"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn-accent flex-1 justify-center">
                                    <Save className="w-5 h-5" />
                                    {editingCourse ? 'تحديث' : 'إضافة'}
                                </button>
                                <button type="button" onClick={closeModal} className="btn-primary flex-1 justify-center">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Instructor Assignment Modal */}
            {showInstructorModal && selectedCourse && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">تعيين مدرس</h2>
                            <button onClick={closeInstructorModal} className="p-2 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-[var(--color-text-muted)] mb-4">
                            المادة: <span className="text-[var(--color-accent)]">{selectedCourse.name_ar}</span>
                        </p>

                        {/* Current Instructors */}
                        {selectedCourse.instructors?.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">المدرسين الحاليين:</label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCourse.instructors.map(inst => (
                                        <span
                                            key={inst.id}
                                            className="px-3 py-1 rounded-lg bg-[var(--color-primary-light)]/20 text-sm flex items-center gap-2"
                                        >
                                            {inst.name} ({inst.role_display})
                                            <button
                                                onClick={() => handleRemoveInstructor(inst.id)}
                                                className="text-[var(--color-error)] hover:text-red-400"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleAssignInstructor} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">اختر المدرس *</label>
                                <select
                                    required
                                    className="input-field"
                                    value={instructorForm.user}
                                    onChange={(e) => setInstructorForm({ ...instructorForm, user: e.target.value })}
                                >
                                    <option value="">اختر مدرس</option>
                                    {getAvailableTeachers().map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.full_name_ar || teacher.username} ({teacher.role === 'teacher' ? 'مدرس' : 'معيد'})
                                        </option>
                                    ))}
                                </select>
                                {teachers.length === 0 && (
                                    <p className="text-sm text-[var(--color-warning)] mt-2">
                                        لا يوجد مدرسين في النظام. يجب إضافة مستخدمين بدور "مدرس" أو "معيد" أولاً.
                                    </p>
                                )}
                                {teachers.length > 0 && getAvailableTeachers().length === 0 && (
                                    <p className="text-sm text-[var(--color-text-muted)] mt-2">
                                        تم تعيين جميع المدرسين المتاحين لهذه المادة.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">الدور *</label>
                                <select
                                    required
                                    className="input-field"
                                    value={instructorForm.role}
                                    onChange={(e) => setInstructorForm({ ...instructorForm, role: e.target.value })}
                                >
                                    <option value="teacher">مدرس</option>
                                    <option value="ta">معيد</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn-accent flex-1 justify-center">
                                    <UserPlus className="w-5 h-5" />
                                    تعيين
                                </button>
                                <button type="button" onClick={closeInstructorModal} className="btn-primary flex-1 justify-center">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in ${toast.type === 'success'
                    ? 'bg-green-500/90 text-white'
                    : 'bg-red-500/90 text-white'
                    }`}>
                    {toast.type === 'success'
                        ? <CheckCircle className="w-6 h-6" />
                        : <AlertCircle className="w-6 h-6" />
                    }
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}
        </div>
    );
}
