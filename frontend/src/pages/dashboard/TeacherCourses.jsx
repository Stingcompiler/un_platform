import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Plus, Edit, Trash2, X, Save, Video, FileText, Eye, Users, Download, User, Clock } from 'lucide-react';
import api from '../../services/api';

export default function TeacherCourses() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [activeTab, setActiveTab] = useState('lectures');
    const [lectures, setLectures] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [showLectureModal, setShowLectureModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [editingItem, setEditingItem] = useState(null);

    const isTA = user?.role === 'ta';
    const canDelete = ['system_manager', 'department_manager'].includes(user?.role);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchLectures();
            fetchAssignments();
        }
    }, [selectedCourse]);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/academic/courses/');
            setCourses(res.data.results || res.data);
            if (res.data.length > 0) {
                setSelectedCourse(res.data[0]);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLectures = async () => {
        try {
            const res = await api.get(`/academic/lectures/?course=${selectedCourse.id}`);
            setLectures(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching lectures:', error);
        }
    };

    const fetchAssignments = async () => {
        try {
            const res = await api.get(`/academic/assignments/?course=${selectedCourse.id}`);
            setAssignments(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        }
    };

    const handleDeleteLecture = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) {
            try {
                await api.delete(`/academic/lectures/${id}/`);
                fetchLectures();
            } catch (error) {
                console.error('Error deleting lecture:', error);
            }
        }
    };

    const handleDeleteAssignment = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الواجب؟')) {
            try {
                await api.delete(`/academic/assignments/${id}/`);
                fetchAssignments();
            } catch (error) {
                console.error('Error deleting assignment:', error);
            }
        }
    };

    const viewSubmissions = async (assignment) => {
        setSelectedAssignment(assignment);
        try {
            const res = await api.get(`/academic/submissions/?assignment=${assignment.id}`);
            setSubmissions(res.data.results || res.data);
            setShowSubmissionsModal(true);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">موادي الدراسية</h1>
                <p className="text-[var(--color-text-muted)]">
                    إدارة المحاضرات والواجبات للمواد المسندة إليك
                </p>
            </div>

            {courses.length > 0 ? (
                <div className="grid lg:grid-cols-[280px,1fr] gap-6">
                    {/* Course List */}
                    <div className="glass-card p-4">
                        <h3 className="font-semibold mb-4">المواد</h3>
                        <div className="space-y-2">
                            {courses.map((course) => (
                                <button
                                    key={course.id}
                                    onClick={() => setSelectedCourse(course)}
                                    className={`w-full text-right p-3 rounded-lg transition-colors ${selectedCourse?.id === course.id
                                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                                        : 'hover:bg-white/5'
                                        }`}
                                >
                                    <p className="font-medium">{course.name_ar}</p>
                                    <p className="text-sm text-[var(--color-text-muted)]">{course.code}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Course Content */}
                    {selectedCourse && (
                        <div>
                            {/* Course Header */}
                            <div className="glass-card p-6 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center">
                                        <BookOpen className="w-7 h-7 text-[var(--color-accent)]" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedCourse.name_ar}</h2>
                                        <p className="text-[var(--color-text-muted)]">
                                            {selectedCourse.code} • {selectedCourse.credit_hours} ساعات
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setActiveTab('lectures')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'lectures'
                                        ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                                        : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    المحاضرات ({lectures.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('assignments')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'assignments'
                                        ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                                        : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    الواجبات ({assignments.length})
                                </button>
                            </div>

                            {/* Content */}
                            {activeTab === 'lectures' && (
                                <div>
                                    <div className="flex justify-end mb-4">
                                        <button
                                            onClick={() => {
                                                setEditingItem(null);
                                                setShowLectureModal(true);
                                            }}
                                            className="btn-accent"
                                        >
                                            <Plus className="w-5 h-5" />
                                            إضافة محاضرة
                                        </button>
                                    </div>

                                    {lectures.length > 0 ? (
                                        <div className="space-y-4">
                                            {lectures.map((lecture) => (
                                                <div key={lecture.id} className="glass-card p-5 hover:bg-white/5 transition-colors">
                                                    <div className="flex items-start justify-between">
                                                        <Link to={`/dashboard/lecture/${lecture.id}`} className="flex items-start gap-4 flex-1">
                                                            <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center">
                                                                <Video className="w-6 h-6 text-[var(--color-accent)]" />
                                                            </div>
                                                            <div>
                                                                <span className={`text-xs px-2 py-0.5 rounded ${lecture.lecture_type === 'theory'
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : 'bg-green-500/20 text-green-400'
                                                                    }`}>
                                                                    {lecture.lecture_type === 'theory' ? 'نظري' : 'عملي'}
                                                                </span>
                                                                <h3 className="text-lg font-semibold mt-1">{lecture.title_ar || lecture.title}</h3>
                                                                <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
                                                                    {lecture.content?.substring(0, 100)}...
                                                                </p>
                                                            </div>
                                                        </Link>
                                                        <div className="flex gap-2">
                                                            <Link
                                                                to={`/dashboard/lecture/${lecture.id}`}
                                                                className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-accent)]"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(lecture);
                                                                    setShowLectureModal(true);
                                                                }}
                                                                className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => handleDeleteLecture(lecture.id)}
                                                                    className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-error)]"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="glass-card p-12 text-center">
                                            <Video className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold mb-2">لا توجد محاضرات</h3>
                                            <p className="text-[var(--color-text-muted)]">لم يتم إضافة أي محاضرات لهذه المادة</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'assignments' && (
                                <div>
                                    <div className="flex justify-end mb-4">
                                        <button
                                            onClick={() => {
                                                setEditingItem(null);
                                                setShowAssignmentModal(true);
                                            }}
                                            className="btn-accent"
                                        >
                                            <Plus className="w-5 h-5" />
                                            إضافة واجب
                                        </button>
                                    </div>

                                    {assignments.length > 0 ? (
                                        <div className="space-y-4">
                                            {assignments.map((assignment) => (
                                                <div key={assignment.id} className="glass-card p-5">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 rounded-lg bg-[var(--color-accent)]/20 flex items-center justify-center">
                                                                <FileText className="w-6 h-6 text-[var(--color-accent)]" />
                                                            </div>
                                                            <div>
                                                                <span className={`text-xs px-2 py-0.5 rounded ${assignment.assignment_type === 'theory'
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : 'bg-green-500/20 text-green-400'
                                                                    }`}>
                                                                    {assignment.assignment_type === 'theory' ? 'نظري' : 'عملي'}
                                                                </span>
                                                                <h3 className="text-lg font-semibold mt-1">{assignment.title_ar}</h3>
                                                                <p className="text-sm text-[var(--color-text-muted)]">
                                                                    الدرجة: {assignment.max_grade} | التسليم: {new Date(assignment.due_date).toLocaleDateString('ar-SD')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => viewSubmissions(assignment)}
                                                                className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-primary-light)]"
                                                                title="عرض التسليمات"
                                                            >
                                                                <Users className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(assignment);
                                                                    setShowAssignmentModal(true);
                                                                }}
                                                                className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                                                    className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-error)]"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="glass-card p-12 text-center">
                                            <FileText className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold mb-2">لا توجد واجبات</h3>
                                            <p className="text-[var(--color-text-muted)]">لم يتم إضافة أي واجبات لهذه المادة</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <BookOpen className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد مواد مسندة</h3>
                    <p className="text-[var(--color-text-muted)]">لم يتم إسناد أي مواد إليك بعد</p>
                </div>
            )}

            {/* Lecture Modal */}
            {showLectureModal && (
                <LectureModal
                    course={selectedCourse}
                    lecture={editingItem}
                    isTA={isTA}
                    onClose={() => {
                        setShowLectureModal(false);
                        setEditingItem(null);
                    }}
                    onSave={() => {
                        fetchLectures();
                        setShowLectureModal(false);
                        setEditingItem(null);
                    }}
                />
            )}

            {/* Assignment Modal */}
            {showAssignmentModal && (
                <AssignmentModal
                    course={selectedCourse}
                    assignment={editingItem}
                    isTA={isTA}
                    onClose={() => {
                        setShowAssignmentModal(false);
                        setEditingItem(null);
                    }}
                    onSave={() => {
                        fetchAssignments();
                        setShowAssignmentModal(false);
                        setEditingItem(null);
                    }}
                />
            )}

            {/* Submissions Modal */}
            {showSubmissionsModal && selectedAssignment && (
                <SubmissionsModal
                    assignment={selectedAssignment}
                    submissions={submissions}
                    onClose={() => {
                        setShowSubmissionsModal(false);
                        setSelectedAssignment(null);
                        setSubmissions([]);
                    }}
                />
            )}
        </div>
    );
}

function LectureModal({ course, lecture, isTA, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: lecture?.title || '',
        title_ar: lecture?.title_ar || '',
        content: lecture?.content || '',
        lecture_type: lecture?.lecture_type || (isTA ? 'lab' : 'theory'),
        order: lecture?.order || 0,
        video_url: lecture?.video_url || '',
        reference_url: lecture?.reference_url || '',
    });
    const [file, setFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('course', course.id);
            submitData.append('title', formData.title);
            submitData.append('title_ar', formData.title_ar);
            submitData.append('content', formData.content);
            submitData.append('lecture_type', formData.lecture_type);
            submitData.append('order', formData.order);
            if (formData.video_url) submitData.append('video_url', formData.video_url);
            if (formData.reference_url) submitData.append('reference_url', formData.reference_url);
            if (file) submitData.append('file', file);
            if (videoFile) submitData.append('video_file', videoFile);

            if (lecture) {
                await api.patch(`/academic/lectures/${lecture.id}/`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/academic/lectures/', submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            onSave();
        } catch (error) {
            console.error('Error saving lecture:', error);
            alert(error.response?.data?.detail || error.response?.data?.[0] || 'حدث خطأ أثناء حفظ المحاضرة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass-card p-6 w-full max-w-2xl my-4 sm:my-8 max-h-[calc(100dvh-2rem)] sm:max-h-none overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{lecture ? 'تعديل المحاضرة' : 'إضافة محاضرة جديدة'}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title Fields */}
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">العنوان (عربي) *</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.title_ar}
                                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Title (English)</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Type and Order */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">نوع المحاضرة</label>
                            <select
                                className="input-field"
                                value={formData.lecture_type}
                                onChange={(e) => setFormData({ ...formData, lecture_type: e.target.value })}
                            >
                                {!isTA && <option value="theory">نظري</option>}
                                <option value="lab">عملي</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">الترتيب</label>
                            <input
                                type="number"
                                min="0"
                                className="input-field"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium mb-2">المحتوى *</label>
                        <textarea
                            rows={4}
                            required
                            className="input-field resize-none"
                            placeholder="اكتب محتوى المحاضرة هنا..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        ></textarea>
                    </div>

                    {/* Video Section */}
                    <div className="border-t border-white/10 pt-4 mt-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Video className="w-5 h-5" />
                            الفيديو
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">ملف فيديو (اختياري - يُرفع إلى Bunny Stream)</label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    className="input-field"
                                    onChange={(e) => setVideoFile(e.target.files[0])}
                                />
                                {lecture?.bunny_video_url && (
                                    <p className="text-xs text-green-400 mt-1">
                                        ✓ يوجد فيديو مرفوع على Bunny Stream
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">رابط فيديو خارجي (YouTube/Vimeo)</label>
                                <input
                                    type="url"
                                    className="input-field"
                                    placeholder="https://youtube.com/watch?v=..."
                                    value={formData.video_url}
                                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Files Section */}
                    <div className="border-t border-white/10 pt-4 mt-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            الملفات والمراجع
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">ملف مرفق (PDF, PPT, etc.)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.ppt,.pptx,.doc,.docx,.zip"
                                    className="input-field"
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                                {lecture?.file && (
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                        ملف حالي: {lecture.file.split('/').pop()}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">رابط المراجع (اختياري)</label>
                                <input
                                    type="url"
                                    className="input-field"
                                    placeholder="https://example.com/references"
                                    value={formData.reference_url}
                                    onChange={(e) => setFormData({ ...formData, reference_url: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="submit" disabled={loading} className="btn-accent flex-1 justify-center">
                            {loading ? <span className="spinner w-5 h-5 border-2"></span> : <Save className="w-5 h-5" />}
                            {lecture ? 'تحديث' : 'إضافة'}
                        </button>
                        <button type="button" onClick={onClose} className="btn-primary flex-1 justify-center">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AssignmentModal({ course, assignment, isTA, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: assignment?.title || '',
        title_ar: assignment?.title_ar || '',
        description: assignment?.description || '',
        assignment_type: assignment?.assignment_type || (isTA ? 'lab' : 'theory'),
        max_grade: assignment?.max_grade || 10,
        due_date: assignment?.due_date?.split('T')[0] || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { ...formData, course: course.id };
            if (assignment) {
                await api.patch(`/academic/assignments/${assignment.id}/`, data);
            } else {
                await api.post('/academic/assignments/', data);
            }
            onSave();
        } catch (error) {
            console.error('Error saving assignment:', error);
            alert(error.response?.data?.detail || JSON.stringify(error.response?.data) || 'حدث خطأ أثناء حفظ الواجب');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass-card p-6 w-full max-w-lg my-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{assignment ? 'تعديل الواجب' : 'إضافة واجب جديد'}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">العنوان (عربي)</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.title_ar}
                                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Title (English)</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">النوع</label>
                            <select
                                className="input-field"
                                value={formData.assignment_type}
                                onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                            >
                                {!isTA && <option value="theory">نظري</option>}
                                <option value="lab">عملي</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">الدرجة القصوى</label>
                            <input
                                type="number"
                                min="1"
                                required
                                className="input-field"
                                value={formData.max_grade}
                                onChange={(e) => setFormData({ ...formData, max_grade: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">تاريخ التسليم</label>
                            <input
                                type="date"
                                required
                                className="input-field"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">الوصف</label>
                        <textarea
                            rows={3}
                            required
                            className="input-field resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="submit" disabled={loading} className="btn-accent flex-1 justify-center">
                            {loading ? <span className="spinner w-5 h-5 border-2"></span> : <Save className="w-5 h-5" />}
                            {assignment ? 'تحديث' : 'إضافة'}
                        </button>
                        <button type="button" onClick={onClose} className="btn-primary flex-1 justify-center">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

}

function SubmissionsModal({ assignment, submissions, onClose }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-SD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold">تسليمات الطلاب</h2>
                        <p className="text-[var(--color-text-muted)]">
                            {assignment.title_ar} • {submissions.length} تسليم
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {submissions.length > 0 ? (
                        submissions.map((submission) => (
                            <div key={submission.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
                                            <User className="w-5 h-5 text-[var(--color-accent)]" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{submission.student_name}</h4>
                                            <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(submission.created_at)}
                                            </p>

                                            <div className="mt-3 text-sm bg-black/20 p-3 rounded text-[var(--color-text)] whitespace-pre-wrap">
                                                {submission.content}
                                            </div>

                                            {submission.file && (
                                                <a
                                                    href={submission.file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline text-sm"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    تحميل الملف المرفق
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-center min-w-[100px]">
                                        {submission.grade !== null ? (
                                            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm font-bold">
                                                {submission.grade} / {assignment.max_grade}
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-sm">
                                                قيد التصحيح
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-[var(--color-text-muted)]">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>لم يقم أي طالب بتسليم هذا الواجب بعد</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
