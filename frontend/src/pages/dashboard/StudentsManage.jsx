import { useState, useEffect } from 'react';
import { GraduationCap, Plus, Edit, Trash2, X, Save, Upload, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentsManage() {
    const { user } = useAuth();
    const isSupervisor = user?.role === 'supervisor';
    const canDelete = ['system_manager', 'department_manager'].includes(user?.role);
    const [students, setStudents] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [filters, setFilters] = useState({ department: '', year: '', registered: '', search: '' });
    const [formData, setFormData] = useState({
        university_number: '',
        full_name: '',
        email: '',
        phone: '',
        gender: '',
        nationality: '',
        birth_date: '',
        address: '',
        department: '',
        year: '',
        semester: '',
    });
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadError, setUploadError] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    useEffect(() => {
        fetchStudents();
        fetchDepartments();
    }, [filters, currentPage]);

    const fetchStudents = async () => {
        try {
            let url = '/auth/university-students/';
            const params = new URLSearchParams();
            if (filters.department) params.append('department', filters.department);
            if (filters.year) params.append('year', filters.year);
            if (filters.registered) params.append('registered', filters.registered);
            if (filters.search) params.append('search', filters.search);
            params.append('page', currentPage);
            url += '?' + params.toString();

            const res = await api.get(url);
            if (res.data.results) {
                setStudents(res.data.results);
                setTotalCount(res.data.count || 0);
                const pageSize = 20;
                setTotalPages(Math.ceil((res.data.count || 0) / pageSize));
            } else {
                setStudents(res.data);
                setTotalCount(res.data.length);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/academic/departments/');
            setDepartments(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Clean empty strings to null
            const cleanData = {};
            for (const [key, value] of Object.entries(formData)) {
                cleanData[key] = value === '' ? null : value;
            }
            if (editingStudent) {
                await api.patch(`/auth/university-students/${editingStudent.id}/`, cleanData);
            } else {
                await api.post('/auth/university-students/', cleanData);
            }
            fetchStudents();
            closeModal();
        } catch (error) {
            console.error('Error saving student:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
            try {
                await api.delete(`/auth/university-students/${id}/`);
                fetchStudents();
            } catch (error) {
                console.error('Error deleting student:', error);
            }
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            setUploadError('الرجاء اختيار ملف');
            return;
        }

        const formData = new FormData();
        formData.append('file', uploadFile);

        try {
            await api.post('/auth/university-students/bulk-upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchStudents();
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadError('');
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadError(error.response?.data?.error || 'حدث خطأ أثناء رفع الملف');
        }
    };

    const openModal = (student = null) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                university_number: student.university_number || '',
                full_name: student.full_name || '',
                email: student.email || '',
                phone: student.phone || '',
                gender: student.gender || '',
                nationality: student.nationality || '',
                birth_date: student.birth_date || '',
                address: student.address || '',
                department: student.department?.id || student.department || '',
                year: student.year || '',
                semester: student.semester || '',
            });
        } else {
            setEditingStudent(null);
            setFormData({
                university_number: '',
                full_name: '',
                email: '',
                phone: '',
                gender: '',
                nationality: '',
                birth_date: '',
                address: '',
                department: departments[0]?.id || '',
                year: '',
                semester: '',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStudent(null);
    };

    const getDepartmentName = (deptId) => {
        const dept = departments.find(d => d.id === deptId);
        return dept?.name_ar || dept?.name_en || '-';
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">إدارة الطلاب</h1>
                    <p className="text-[var(--color-text-muted)]">
                        إدارة طلاب الجامعة ({totalCount} طالب)
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="btn-primary"
                    >
                        <Upload className="w-5 h-5" />
                        رفع ملف
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="btn-accent"
                    >
                        <Plus className="w-5 h-5" />
                        إضافة طالب
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 mb-6">
                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">القسم</label>
                        <select
                            value={filters.department}
                            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                            className="input-field"
                        >
                            <option value="">جميع الأقسام</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name_ar || dept.name_en}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">السنة الدراسية</label>
                        <select
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                            className="input-field"
                        >
                            <option value="">جميع السنوات</option>
                            <option value="1">السنة الأولى</option>
                            <option value="2">السنة الثانية</option>
                            <option value="3">السنة الثالثة</option>
                            <option value="4">السنة الرابعة</option>
                            <option value="5">السنة الخامسة</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">حالة التسجيل</label>
                        <select
                            value={filters.registered}
                            onChange={(e) => setFilters({ ...filters, registered: e.target.value })}
                            className="input-field"
                        >
                            <option value="">الكل</option>
                            <option value="true">مسجل في النظام</option>
                            <option value="false">غير مسجل</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="glass-card overflow-hidden">
                {students.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="text-right p-4 font-medium">الرقم الجامعي</th>
                                    <th className="text-right p-4 font-medium">الاسم</th>
                                    <th className="text-right p-4 font-medium">القسم</th>
                                    <th className="text-right p-4 font-medium">السنة</th>
                                    <th className="text-right p-4 font-medium">الفصل</th>
                                    <th className="text-right p-4 font-medium">الجنس</th>
                                    <th className="text-right p-4 font-medium">الحالة</th>
                                    <th className="text-center p-4 font-medium">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-white/5">
                                        <td className="p-4 font-mono">{student.university_number}</td>
                                        <td className="p-4">{student.full_name}</td>
                                        <td className="p-4">
                                            {student.department_name || getDepartmentName(student.department) || '-'}
                                        </td>
                                        <td className="p-4">{student.year ? `السنة ${student.year}` : '-'}</td>
                                        <td className="p-4">{student.semester || '-'}</td>
                                        <td className="p-4">
                                            {student.gender === 'male' ? 'ذكر' : student.gender === 'female' ? 'أنثى' : '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-sm ${student.is_registered
                                                ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                                                : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                                                }`}>
                                                {student.is_registered ? 'مسجل' : 'غير مسجل'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openModal(student)}
                                                    className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-accent)]"
                                                    title="تعديل"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(student.id)}
                                                        className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-error)]"
                                                        title="حذف"
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
                ) : (
                    <div className="p-12 text-center">
                        <GraduationCap className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">لا يوجد طلاب</h3>
                        <p className="text-[var(--color-text-muted)] mb-4">
                            لم يتم إضافة أي طلاب بعد
                        </p>
                        <button onClick={() => openModal()} className="btn-accent">
                            <Plus className="w-5 h-5" />
                            إضافة طالب
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-white/10">
                        <p className="text-sm text-[var(--color-text-muted)]">
                            صفحة {currentPage} من {totalPages} — إجمالي {totalCount} طالب
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let page;
                                if (totalPages <= 5) {
                                    page = i + 1;
                                } else if (currentPage <= 3) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    page = totalPages - 4 + i;
                                } else {
                                    page = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium ${currentPage === page
                                            ? 'bg-[var(--color-accent)] text-white'
                                            : 'hover:bg-white/10'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">
                                {editingStudent ? 'تعديل طالب' : 'إضافة طالب جديد'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        الرقم الجامعي *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.university_number}
                                        onChange={(e) => setFormData({ ...formData, university_number: e.target.value })}
                                        className="input-field"
                                        required
                                        disabled={!!editingStudent}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        الاسم الكامل *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        البريد الإلكتروني
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        رقم الهاتف
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        الجنس
                                    </label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">غير محدد</option>
                                        <option value="male">ذكر</option>
                                        <option value="female">أنثى</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        الجنسية
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nationality}
                                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        تاريخ الميلاد
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        القسم
                                    </label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">اختر القسم</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name_ar || dept.name_en}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        السنة الدراسية
                                    </label>
                                    <select
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : '' })}
                                        className="input-field"
                                    >
                                        <option value="">غير محدد</option>
                                        <option value={1}>السنة الأولى</option>
                                        <option value={2}>السنة الثانية</option>
                                        <option value={3}>السنة الثالثة</option>
                                        <option value={4}>السنة الرابعة</option>
                                        <option value={5}>السنة الخامسة</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        الفصل الدراسي
                                    </label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value ? parseInt(e.target.value) : '' })}
                                        className="input-field"
                                    >
                                        <option value="">غير محدد</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                                            <option key={s} value={s}>الفصل {s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    العنوان
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="input-field"
                                    rows={2}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn-accent flex-1">
                                    <Save className="w-5 h-5" />
                                    {editingStudent ? 'تحديث' : 'إضافة'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn-primary flex-1"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">رفع ملف الطلاب</h2>
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setUploadFile(null);
                                    setUploadError('');
                                }}
                                className="p-2 rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-[var(--color-text-muted)] mb-4">
                                قم برفع ملف Excel أو CSV يحتوي على بيانات الطلاب. يجب أن يحتوي الملف على الأعمدة التالية:
                            </p>
                            <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1">
                                <li>university_number (الرقم الجامعي)</li>
                                <li>full_name (الاسم الكامل)</li>
                                <li>department_id (رقم القسم)</li>
                                <li>year (السنة الدراسية)</li>
                                <li>semester (الفصل الدراسي) - اختياري</li>
                                <li>email (البريد الإلكتروني) - اختياري</li>
                                <li>phone (رقم الهاتف) - اختياري</li>
                                <li>gender (الجنس: male/female) - اختياري</li>
                                <li>nationality (الجنسية) - اختياري</li>
                            </ul>
                        </div>

                        <form onSubmit={handleFileUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    اختر الملف
                                </label>
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => setUploadFile(e.target.files[0])}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer"
                                    >
                                        <Upload className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
                                        {uploadFile ? (
                                            <p className="text-[var(--color-accent)]">{uploadFile.name}</p>
                                        ) : (
                                            <p className="text-[var(--color-text-muted)]">
                                                اضغط لاختيار ملف أو اسحب الملف هنا
                                            </p>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {uploadError && (
                                <div className="p-3 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)]">
                                    {uploadError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn-accent flex-1">
                                    <Upload className="w-5 h-5" />
                                    رفع الملف
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadFile(null);
                                        setUploadError('');
                                    }}
                                    className="btn-primary flex-1"
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
