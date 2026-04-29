import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Plus, Edit, Trash2, X, Save, Video, FileText, Eye, Users, Download, User, Clock, ChevronDown } from 'lucide-react';
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
                    {/* Course List — Desktop Sidebar */}
                    <div className="hidden lg:block glass-card p-4">
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

                    {/* Course Selector — Mobile Dropdown */}
                    <div className="lg:hidden glass-card p-4">
                        <label className="block text-sm font-medium mb-2 text-[var(--color-text-muted)]">اختر المادة</label>
                        <div className="relative">
                            <select
                                className="input-field w-full appearance-none pr-4 pl-10"
                                value={selectedCourse?.id || ''}
                                onChange={(e) => {
                                    const c = courses.find(c => String(c.id) === e.target.value);
                                    if (c) setSelectedCourse(c);
                                }}
                            >
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.name_ar} — {course.code}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>
                    </div>

                    {/* Course Content */}
                    {selectedCourse && (
                        <div>
                            {/* Course Header */}
                            <div className="glass-card p-4 sm:p-6 mb-6">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                                        <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--color-accent)]" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xl sm:text-2xl font-bold truncate">{selectedCourse.name_ar}</h2>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            {selectedCourse.code} • {selectedCourse.credit_hours} ساعات
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setActiveTab('lectures')}
                                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-medium transition-colors text-sm sm:text-base ${activeTab === 'lectures'
                                        ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                                        : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    المحاضرات ({lectures.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('assignments')}
                                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-medium transition-colors text-sm sm:text-base ${activeTab === 'assignments'
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
                                        <div className="space-y-3 sm:space-y-4">
                                            {lectures.map((lecture) => (
                                                <div key={lecture.id} className="glass-card p-4 sm:p-5 hover:bg-white/5 transition-colors">
                                                    {/* Desktop: horizontal layout */}
                                                    <div className="hidden sm:flex items-start justify-between">
                                                        <Link to={`/dashboard/lecture/${lecture.id}`} className="flex items-start gap-4 flex-1 min-w-0">
                                                            <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                                                                <Video className="w-6 h-6 text-[var(--color-accent)]" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className={`text-xs px-2 py-0.5 rounded ${lecture.lecture_type === 'theory'
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : 'bg-green-500/20 text-green-400'
                                                                    }`}>
                                                                    {lecture.lecture_type === 'theory' ? 'نظري' : 'عملي'}
                                                                </span>
                                                                <h3 className="text-lg font-semibold mt-1 truncate">{lecture.title_ar || lecture.title}</h3>
                                                                <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
                                                                    {lecture.content?.substring(0, 100)}...
                                                                </p>
                                                            </div>
                                                        </Link>
                                                        <div className="flex gap-2 shrink-0 mr-3">
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

                                                    {/* Mobile: vertical layout */}
                                                    <div className="sm:hidden">
                                                        <Link to={`/dashboard/lecture/${lecture.id}`} className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                                                                <Video className="w-5 h-5 text-[var(--color-accent)]" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`text-xs px-2 py-0.5 rounded ${lecture.lecture_type === 'theory'
                                                                        ? 'bg-blue-500/20 text-blue-400'
                                                                        : 'bg-green-500/20 text-green-400'
                                                                        }`}>
                                                                        {lecture.lecture_type === 'theory' ? 'نظري' : 'عملي'}
                                                                    </span>
                                                                </div>
                                                                <h3 className="font-semibold text-base leading-tight line-clamp-2">{lecture.title_ar || lecture.title}</h3>
                                                                <p className="text-xs text-[var(--color-text-muted)] line-clamp-1 mt-1">
                                                                    {lecture.content?.substring(0, 60)}...
                                                                </p>
                                                            </div>
                                                        </Link>
                                                        <div className="flex gap-1 mt-3 pt-3 border-t border-white/5">
                                                            <Link
                                                                to={`/dashboard/lecture/${lecture.id}`}
                                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> عرض
                                                            </Link>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(lecture);
                                                                    setShowLectureModal(true);
                                                                }}
                                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-[var(--color-text-muted)] text-xs font-medium"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" /> تعديل
                                                            </button>
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => handleDeleteLecture(lecture.id)}
                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 text-[var(--color-error)] text-xs font-medium"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" /> حذف
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="glass-card p-8 sm:p-12 text-center">
                                            <Video className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                                            <h3 className="text-lg sm:text-xl font-semibold mb-2">لا توجد محاضرات</h3>
                                            <p className="text-sm text-[var(--color-text-muted)]">لم يتم إضافة أي محاضرات لهذه المادة</p>
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
                                        <div className="space-y-3 sm:space-y-4">
                                            {assignments.map((assignment) => (
                                                <div key={assignment.id} className="glass-card p-4 sm:p-5">
                                                    {/* Desktop layout */}
                                                    <div className="hidden sm:flex items-start justify-between">
                                                        <div className="flex items-start gap-4 min-w-0">
                                                            <div className="w-12 h-12 rounded-lg bg-[var(--color-accent)]/20 flex items-center justify-center shrink-0">
                                                                <FileText className="w-6 h-6 text-[var(--color-accent)]" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className={`text-xs px-2 py-0.5 rounded ${assignment.assignment_type === 'theory'
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : 'bg-green-500/20 text-green-400'
                                                                    }`}>
                                                                    {assignment.assignment_type === 'theory' ? 'نظري' : 'عملي'}
                                                                </span>
                                                                <h3 className="text-lg font-semibold mt-1 truncate">{assignment.title_ar}</h3>
                                                                <p className="text-sm text-[var(--color-text-muted)]">
                                                                    الدرجة: {assignment.max_grade} | التسليم: {new Date(assignment.due_date).toLocaleDateString('ar-SD')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 shrink-0 mr-3">
                                                            <Link to={`/dashboard/exercise/${assignment.id}`} className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-accent)]" title="عرض التفاصيل"><Eye className="w-4 h-4" /></Link>
                                                            <button onClick={() => viewSubmissions(assignment)} className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-primary-light)]" title="عرض التسليمات"><Users className="w-4 h-4" /></button>
                                                            <button onClick={() => { setEditingItem(assignment); setShowAssignmentModal(true); }} className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]"><Edit className="w-4 h-4" /></button>
                                                            {canDelete && (<button onClick={() => handleDeleteAssignment(assignment.id)} className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-error)]"><Trash2 className="w-4 h-4" /></button>)}
                                                        </div>
                                                    </div>

                                                    {/* Mobile layout */}
                                                    <div className="sm:hidden">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/20 flex items-center justify-center shrink-0">
                                                                <FileText className="w-5 h-5 text-[var(--color-accent)]" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <span className={`text-xs px-2 py-0.5 rounded ${assignment.assignment_type === 'theory' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                                                    {assignment.assignment_type === 'theory' ? 'نظري' : 'عملي'}
                                                                </span>
                                                                <h3 className="font-semibold text-base mt-1 line-clamp-2">{assignment.title_ar}</h3>
                                                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                                                    الدرجة: {assignment.max_grade} | التسليم: {new Date(assignment.due_date).toLocaleDateString('ar-SD')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 mt-3 pt-3 border-t border-white/5">
                                                            <Link to={`/dashboard/exercise/${assignment.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium"><Eye className="w-3.5 h-3.5" /> عرض</Link>
                                                            <button onClick={() => viewSubmissions(assignment)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium"><Users className="w-3.5 h-3.5" /> التسليمات</button>
                                                            <button onClick={() => { setEditingItem(assignment); setShowAssignmentModal(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-[var(--color-text-muted)] text-xs font-medium"><Edit className="w-3.5 h-3.5" /> تعديل</button>
                                                            {canDelete && (<button onClick={() => handleDeleteAssignment(assignment.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 text-[var(--color-error)] text-xs font-medium"><Trash2 className="w-3.5 h-3.5" /> حذف</button>)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="glass-card p-8 sm:p-12 text-center">
                                            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                                            <h3 className="text-lg sm:text-xl font-semibold mb-2">لا توجد واجبات</h3>
                                            <p className="text-sm text-[var(--color-text-muted)]">لم يتم إضافة أي واجبات لهذه المادة</p>
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

// ─── Feedback Modals ──────────────────────────────────────────────────────────

function SuccessModal({ title, message, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="glass-card p-8 w-full max-w-md text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-green-400 mb-2">{title}</h3>
                <p className="text-[var(--color-text-muted)] text-sm mb-6">{message}</p>
                <button onClick={onClose} className="btn-accent w-full justify-center">
                    <Save className="w-4 h-4" />
                    حسناً، إغلاق
                </button>
            </div>
        </div>
    );
}

function ErrorModal({ title, reason, onClose, onRetry }) {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="glass-card p-8 w-full max-w-md text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-red-400 mb-2">{title}</h3>
                {reason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-right">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">سبب الخطأ:</p>
                        <p className="text-sm text-red-300">{reason}</p>
                    </div>
                )}
                <p className="text-[var(--color-text-muted)] text-sm mb-6">
                    يمكنك المحاولة مجدداً أو استخدام رابط YouTube بدلاً من رفع الملف مباشرة.
                </p>
                <div className="flex gap-3">
                    {onRetry && (
                        <button onClick={onRetry} className="btn-accent flex-1 justify-center">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            إعادة المحاولة
                        </button>
                    )}
                    <button onClick={onClose} className="btn-primary flex-1 justify-center">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── LectureModal ─────────────────────────────────────────────────────────────

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

    // Upload tracking
    const [uploadProgress, setUploadProgress] = useState(0);        // 0-100
    const [uploadPhase, setUploadPhase] = useState('idle');          // idle | uploading | processing
    const [elapsedSecs, setElapsedSecs] = useState(0);
    const [showSlowWarning, setShowSlowWarning] = useState(false);   // >3 min toast

    // Feedback modals
    const [successModal, setSuccessModal] = useState(null);          // { title, message } | null
    const [errorModal, setErrorModal] = useState(null);              // { title, reason } | null

    // Refs for timers and abort
    const timerRef = React.useRef(null);
    const slowRef = React.useRef(null);
    const abortRef = React.useRef(null);

    const fileSizeMB = videoFile ? (videoFile.size / 1024 / 1024).toFixed(1) : 0;

    // ── helpers ──────────────────────────────────────────────────────────────
    const startTimers = () => {
        setElapsedSecs(0);
        setShowSlowWarning(false);

        // Elapsed counter (ticks every second)
        timerRef.current = setInterval(() => {
            setElapsedSecs(s => s + 1);
        }, 1000);

        // Slow-network warning after 3 minutes = 180 s
        slowRef.current = setTimeout(() => {
            setShowSlowWarning(true);
        }, 180_000);
    };

    const clearTimers = () => {
        clearInterval(timerRef.current);
        clearTimeout(slowRef.current);
    };

    const fmtElapsed = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}د ${sec}ث` : `${sec}ث`;
    };

    const extractError = (error) => {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
            return 'تم إلغاء الرفع.';
        }
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            return 'فشل الرفع بسبب انتهاء مهلة الاتصال. قد يحدث هذا عندما يكون الإنترنت بطيئًا أو يكون ملف الفيديو كبيرًا جدًا. يرجى المحاولة مرة أخرى وإبقاء الصفحة مفتوحة حتى ينتهي الرفع.';
        }
        if (!error.response) {
            return 'تعذّر الوصول إلى الخادم. تحقق من اتصالك بالإنترنت وحاول مجدداً.';
        }

        // Catch server errors (e.g. 500 Internal Server Error) which often return raw HTML/Env vars
        if (error.response.status >= 500) {
            return 'حدث خطأ في الخادم أثناء معالجة طلبك. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.';
        }

        const d = error.response.data;
        
        // Prevent rendering raw HTML pages as error strings
        if (typeof d === 'string' && (d.trim().startsWith('<') || d.length > 150)) {
            return `خطأ ${error.response.status} — حدث خطأ غير متوقع من الخادم.`;
        }

        return (
            d?.detail ||
            d?.video_file?.[0] ||
            d?.file?.[0] ||
            d?.title_ar?.[0] ||
            d?.non_field_errors?.[0] ||
            (typeof d === 'string' ? d : null) ||
            `خطأ ${error.response.status} — حدث خطأ غير متوقع من الخادم.`
        );
    };

    // ── submit ────────────────────────────────────────────────────────────────
    const doSubmit = async () => {
        setLoading(true);
        setUploadProgress(0);
        setUploadPhase(videoFile ? 'uploading' : 'uploading');
        setShowSlowWarning(false);
        setSuccessModal(null);
        setErrorModal(null);

        abortRef.current = new AbortController();
        startTimers();

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

        const config = {
            headers: { 'Content-Type': 'multipart/form-data' },
            signal: abortRef.current.signal,
            onUploadProgress: (e) => {
                if (!e.total) return;
                const pct = Math.round((e.loaded * 100) / e.total);
                setUploadProgress(pct);
                if (pct >= 100) setUploadPhase('processing');
            },
        };

        try {
            if (lecture) {
                await api.patch(`/academic/lectures/${lecture.id}/`, submitData, config);
            } else {
                await api.post('/academic/lectures/', submitData, config);
            }

            clearTimers();
            setLoading(false);
            setUploadPhase('idle');

            setSuccessModal({
                title: lecture ? 'تم تحديث المحاضرة بنجاح ✓' : 'تمت إضافة المحاضرة بنجاح ✓',
                message: lecture
                    ? `تم تحديث "${formData.title_ar}" وحفظ التغييرات.`
                    : `تمت إضافة المحاضرة "${formData.title_ar}" إلى ${course.name_ar}.`,
            });
        } catch (error) {
            clearTimers();
            setLoading(false);
            setUploadPhase('idle');
            setUploadProgress(0);

            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return; // user aborted

            console.error('Upload error:', error);
            setErrorModal({
                title: 'فشل رفع المحاضرة',
                reason: extractError(error),
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        doSubmit();
    };

    const handleAbort = () => {
        abortRef.current?.abort();
        clearTimers();
        setLoading(false);
        setUploadPhase('idle');
        setUploadProgress(0);
        setShowSlowWarning(false);
    };

    const handleSuccessClose = () => {
        setSuccessModal(null);
        onSave();
    };

    const handleErrorClose = () => setErrorModal(null);
    const handleRetry = () => { setErrorModal(null); doSubmit(); };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
                <div className="glass-card p-4 sm:p-6 w-full max-w-2xl my-2 sm:my-8 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 1rem)' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                        <h2 className="text-lg sm:text-xl font-bold">
                            {lecture ? 'تعديل المحاضرة' : 'إضافة محاضرة جديدة'}
                        </h2>
                        <button
                            onClick={loading ? handleAbort : onClose}
                            className={`p-2 rounded-lg transition-colors ${loading
                                ? 'hover:bg-red-500/20 text-red-400'
                                : 'hover:bg-white/10 text-[var(--color-text-muted)]'}`}
                            title={loading ? 'إلغاء الرفع' : 'إغلاق'}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* ── Slow-network toast ── */}
                    {showSlowWarning && loading && (
                        <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                            <span className="text-yellow-400 text-lg mt-0.5">⏳</span>
                            <div className="flex-1">
                                <p className="text-yellow-400 font-semibold text-sm">الاتصال بطيء</p>
                                <p className="text-yellow-300/80 text-xs mt-0.5">
                                    مضى على الرفع أكثر من 3 دقائق. للفيديوهات الكبيرة يُنصح باستخدام رابط YouTube بدلاً من الرفع المباشر.
                                </p>
                            </div>
                            <button onClick={() => setShowSlowWarning(false)} className="text-yellow-400 hover:text-yellow-300 shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}



                    {/* ── Form ── */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Titles */}
                        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">العنوان (عربي)</label>
                                <input
                                    type="text" className="input-field"
                                    value={formData.title_ar}
                                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Title (English)</label>
                                <input
                                    type="text" className="input-field"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Type + Order */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">نوع المحاضرة</label>
                                <select className="input-field" value={formData.lecture_type}
                                    onChange={(e) => setFormData({ ...formData, lecture_type: e.target.value })}>
                                    {!isTA && <option value="theory">نظري</option>}
                                    <option value="lab">عملي</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">الترتيب</label>
                                <input type="number" min="0" className="input-field"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium mb-2">المحتوى</label>
                            <textarea rows={4} className="input-field resize-none"
                                placeholder="اكتب محتوى المحاضرة هنا..."
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            />
                        </div>

                        {/* Video Section */}
                        <div className="border-t border-white/10 pt-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Video className="w-5 h-5" /> الفيديو
                            </h3>

                            {/* Info note */}
                            <div className="mb-3 p-2.5 sm:p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs sm:text-sm text-blue-300 flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">ℹ️</span>
                                <span>
                                    رفع الفيديو مباشرةً قد يستغرق وقتاً طويلاً.
                                    <strong className="text-blue-200"> لا تغلق النافذة</strong> أثناء الرفع.
                                    للفيديوهات الكبيرة يُفضّل استخدام <strong className="text-blue-200">رابط YouTube/Vimeo</strong>.
                                </span>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">ملف فيديو (MP4)</label>
                                    <input type="file" accept="video/*" className="input-field"
                                        onChange={(e) => setVideoFile(e.target.files[0])} />
                                    {videoFile ? (
                                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                            {videoFile.name} ({fileSizeMB} MB)
                                        </p>
                                    ) : lecture?.video_file ? (
                                        <p className="text-xs text-green-400 mt-1">✓ يوجد فيديو مرفوع مسبقاً</p>
                                    ) : null}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">رابط فيديو خارجي (YouTube/Vimeo)</label>
                                    <input type="url" className="input-field"
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={formData.video_url}
                                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Files Section */}
                        <div className="border-t border-white/10 pt-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5" /> الملفات والمراجع
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">ملف مرفق (PDF, PPT, etc.)</label>
                                    <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.zip"
                                        className="input-field"
                                        onChange={(e) => setFile(e.target.files[0])} />
                                    {lecture?.file && (
                                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                            ملف حالي: {lecture.file.split('/').pop()}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">رابط المراجع (اختياري)</label>
                                    <input type="url" className="input-field"
                                        placeholder="https://example.com/references"
                                        value={formData.reference_url}
                                        onChange={(e) => setFormData({ ...formData, reference_url: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Upload Progress Panel (Bottom) ── */}
                        {loading && (
                            <div className="mb-4 p-3 sm:p-5 rounded-xl bg-[var(--color-primary)]/10 border-2 border-[var(--color-accent)]/30 shadow-lg shadow-[var(--color-accent)]/10">
                                {/* Phase label + elapsed */}
                                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                                        {uploadPhase === 'processing' ? (
                                            <p className="text-xs sm:text-sm font-bold text-[var(--color-accent)]">جاري المعالجة على الخادم...</p>
                                        ) : videoFile ? (
                                            <p className="text-xs sm:text-sm font-bold text-[var(--color-accent)]">جاري رفع الفيديو...</p>
                                        ) : (
                                            <p className="text-xs sm:text-sm font-bold text-[var(--color-accent)]">جاري الحفظ...</p>
                                        )}
                                    </div>
                                    {videoFile && (
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <span className="text-sm sm:text-base font-bold text-[var(--color-accent)]">
                                                {uploadProgress}%
                                            </span>
                                            <span className="text-xs text-[var(--color-text-muted)]">
                                                {fmtElapsed(elapsedSecs)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Progress bar — taller on mobile for visibility */}
                                <div className="w-full bg-white/5 rounded-full h-5 sm:h-4 overflow-hidden mb-3 relative">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 relative flex items-center justify-center"
                                        style={{
                                            width: uploadPhase === 'processing' ? '100%' : `${Math.max(uploadProgress, 2)}%`,
                                            background: 'linear-gradient(90deg, var(--color-accent-dark), var(--color-accent), var(--color-accent-light))',
                                            backgroundSize: '200% 100%',
                                            animation: uploadPhase === 'processing'
                                                ? 'shimmer 1.5s linear infinite'
                                                : 'none',
                                        }}
                                    >
                                        {uploadProgress > 15 && (
                                            <span className="text-[10px] sm:text-xs font-bold text-[var(--color-bg)] drop-shadow">{uploadProgress}%</span>
                                        )}
                                    </div>
                                </div>

                                {/* File meta */}
                                <p className="text-[10px] sm:text-xs font-medium text-[var(--color-text-muted)] truncate">
                                    {videoFile
                                        ? `${videoFile.name} • ${fileSizeMB} MB`
                                        : 'لا تغلق هذه النافذة أثناء الحفظ'}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 border-t border-white/10 mt-4">
                            <button type="submit" disabled={loading} className="btn-accent flex-1 justify-center text-sm sm:text-base py-3 sm:py-2.5">
                                {loading
                                    ? <>{videoFile ? 'جاري الرفع...' : 'جاري الحفظ...'}</>
                                    : <><Save className="w-5 h-5" />{lecture ? 'تحديث' : 'إضافة'}</>
                                }
                            </button>
                            <button type="button" onClick={loading ? handleAbort : onClose}
                                className={`flex-1 justify-center btn-primary text-sm sm:text-base py-3 sm:py-2.5 ${loading ? 'border border-red-500/30 text-red-400' : ''}`}>
                                {loading ? 'إلغاء الرفع' : 'إلغاء'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {successModal && (
                <SuccessModal
                    title={successModal.title}
                    message={successModal.message}
                    onClose={handleSuccessClose}
                />
            )}

            {/* Error Modal */}
            {errorModal && (
                <ErrorModal
                    title={errorModal.title}
                    reason={errorModal.reason}
                    onClose={handleErrorClose}
                    onRetry={handleRetry}
                />
            )}
        </>
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
