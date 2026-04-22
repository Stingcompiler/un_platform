import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Video, FileText, Clock, CheckCircle, AlertCircle, Upload, Send, X, Eye, ArrowRight, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function StudentCoursesView() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [activeTab, setActiveTab] = useState('lectures');
    const [lectures, setLectures] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionContent, setSubmissionContent] = useState('');
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showLectureModal, setShowLectureModal] = useState(false);
    const [selectedLecture, setSelectedLecture] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchLectures();
            fetchAssignments();
            fetchSubmissions();
        }
    }, [selectedCourse]);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/academic/courses/');
            const data = res.data.results || res.data;
            setCourses(data);
            if (data.length > 0) setSelectedCourse(data[0]);
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
            console.error('Error:', error);
        }
    };

    const fetchAssignments = async () => {
        try {
            const res = await api.get(`/academic/assignments/?course=${selectedCourse.id}`);
            setAssignments(res.data.results || res.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchSubmissions = async () => {
        try {
            const res = await api.get('/academic/submissions/');
            setSubmissions(res.data.results || res.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const getSubmissionForAssignment = (assignmentId) => {
        return submissions.find(s => s.assignment === assignmentId);
    };

    const isAssignmentOverdue = (dueDate) => {
        return new Date(dueDate) < new Date();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const openSubmitModal = (assignment) => {
        setSelectedAssignment(assignment);
        setSubmissionContent('');
        setSubmissionFile(null);
        setShowSubmitModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAssignment) return;

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('assignment', selectedAssignment.id);
            formData.append('content', submissionContent);
            if (submissionFile) {
                formData.append('file', submissionFile);
            }

            await api.post('/academic/submissions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            fetchSubmissions();
            setShowSubmitModal(false);
            setSelectedAssignment(null);
        } catch (error) {
            console.error('Error submitting:', error);
            alert(error.response?.data?.detail || 'حدث خطأ أثناء تسليم الواجب');
        } finally {
            setSubmitting(false);
        }
    };

    const openLectureModal = (lecture) => {
        setSelectedLecture(lecture);
        setShowLectureModal(true);
    };

    if (loading) {
        return <div className="flex justify-center py-20"><div className="spinner"></div></div>;
    }

    if (courses.length === 0) {
        return (
            <div className="glass-card p-12 text-center">
                <BookOpen className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد مواد مسجلة</h3>
                <p className="text-[var(--color-text-muted)]">لم يتم تسجيلك في أي مادة حتى الآن</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">موادي الدراسية</h1>
                <p className="text-[var(--color-text-muted)]">عرض المحاضرات والواجبات وتسليم الواجبات</p>
            </div>

            <div className="grid lg:grid-cols-[300px,1fr] gap-6">
                {/* Course Sidebar */}
                <div className="glass-card p-4">
                    {selectedCourse ? (
                        /* Selected Course Details */
                        <div>
                            <button
                                onClick={() => setSelectedCourse(null)}
                                className="flex items-center gap-2 text-[var(--color-accent)] hover:underline mb-4 text-sm"
                            >
                                <ArrowRight className="w-4 h-4" />
                                العودة للمواد
                            </button>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{selectedCourse.name_ar}</h3>
                                    <span className="px-3 py-1 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-sm">
                                        {selectedCourse.code}
                                    </span>
                                </div>

                                {selectedCourse.description_ar && (
                                    <div>
                                        <p className="text-sm text-[var(--color-text-muted)] mb-1">الوصف</p>
                                        <p className="text-sm">{selectedCourse.description_ar}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <p className="text-xs text-[var(--color-text-muted)]">السنة الدراسية</p>
                                        <p className="font-semibold">السنة {selectedCourse.academic_year}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <p className="text-xs text-[var(--color-text-muted)]">الفصل الدراسي</p>
                                        <p className="font-semibold">الفصل {selectedCourse.semester}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5 col-span-2">
                                        <p className="text-xs text-[var(--color-text-muted)]">الساعات المعتمدة</p>
                                        <p className="font-semibold">{selectedCourse.credit_hours} ساعات</p>
                                    </div>
                                </div>

                                {/* Instructors */}
                                <div>
                                    <p className="text-sm text-[var(--color-text-muted)] mb-2 flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        المدرسين
                                    </p>
                                    {selectedCourse.instructors?.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedCourse.instructors.map(inst => (
                                                <div key={inst.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                                                    <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-accent)]">
                                                        {inst.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{inst.name}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">{inst.role_display}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[var(--color-text-muted)]">لا يوجد مدرسين معينين</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Course List */
                        <div>
                            <h3 className="font-semibold mb-4">المواد</h3>
                            <div className="space-y-2">
                                {courses.map((course) => (
                                    <button
                                        key={course.id}
                                        onClick={() => setSelectedCourse(course)}
                                        className="w-full text-right p-3 rounded-lg transition-colors hover:bg-white/5"
                                    >
                                        <p className="font-medium">{course.name_ar}</p>
                                        <p className="text-sm text-[var(--color-text-muted)]">{course.code}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Course Content */}
                {selectedCourse ? (
                    <div>
                        <div className="glass-card p-6 mb-6">
                            <h2 className="text-2xl font-bold">{selectedCourse.name_ar}</h2>
                            <p className="text-[var(--color-text-muted)]">{selectedCourse.code} • {selectedCourse.credit_hours} ساعات</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setActiveTab('lectures')}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'lectures' ? 'bg-[var(--color-accent)] text-[var(--color-bg)]' : 'bg-white/5'}`}
                            >
                                <Video className="w-4 h-4" />
                                المحاضرات ({lectures.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('assignments')}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'assignments' ? 'bg-[var(--color-accent)] text-[var(--color-bg)]' : 'bg-white/5'}`}
                            >
                                <FileText className="w-4 h-4" />
                                الواجبات ({assignments.length})
                            </button>
                        </div>

                        {/* Lectures Tab */}
                        {activeTab === 'lectures' && (
                            <div className="space-y-4">
                                {lectures.length > 0 ? (
                                    lectures.map((lecture) => (
                                        <div key={lecture.id} className="glass-card p-5 hover:bg-white/5 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-1 rounded text-xs ${lecture.lecture_type === 'theory' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                                            {lecture.lecture_type === 'theory' ? 'نظري' : 'عملي'}
                                                        </span>
                                                        <span className="text-sm text-[var(--color-text-muted)]">
                                                            محاضرة {lecture.order}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-lg mb-1">{lecture.title_ar}</h3>
                                                    <p className="text-sm text-[var(--color-text-muted)]">
                                                        بواسطة: {lecture.created_by_name}
                                                    </p>
                                                </div>
                                                <Link
                                                    to={`/dashboard/lecture/${lecture.id}`}
                                                    className="btn-primary px-4 py-2"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    عرض
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="glass-card p-8 text-center">
                                        <Video className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
                                        <p className="text-[var(--color-text-muted)]">لا توجد محاضرات حتى الآن</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Assignments Tab */}
                        {activeTab === 'assignments' && (
                            <div className="space-y-4">
                                {assignments.length > 0 ? (
                                    assignments.map((assignment) => {
                                        const submission = getSubmissionForAssignment(assignment.id);
                                        const overdue = isAssignmentOverdue(assignment.due_date);

                                        return (
                                            <div key={assignment.id} className="glass-card p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`px-2 py-1 rounded text-xs ${assignment.assignment_type === 'theory' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                                                {assignment.assignment_type === 'theory' ? 'نظري' : 'عملي'}
                                                            </span>
                                                            {submission ? (
                                                                <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    تم التسليم
                                                                </span>
                                                            ) : overdue ? (
                                                                <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    انتهى الموعد
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    في الانتظار
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="font-semibold text-lg mb-1">{assignment.title_ar}</h3>
                                                        <p className="text-sm text-[var(--color-text-muted)] mb-2">
                                                            {assignment.description?.substring(0, 100)}...
                                                        </p>
                                                        <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                {formatDate(assignment.due_date)}
                                                            </span>
                                                            <span>
                                                                الدرجة: {assignment.max_grade}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Link
                                                            to={`/dashboard/exercise/${assignment.id}`}
                                                            className="btn-primary px-3 py-2 text-sm justify-center"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            التفاصيل
                                                        </Link>
                                                        {submission ? (
                                                            <div className="text-center p-3 bg-white/5 rounded-lg">
                                                                {submission.grade !== null ? (
                                                                    <>
                                                                        <p className="text-2xl font-bold text-[var(--color-accent)]">
                                                                            {submission.grade}
                                                                        </p>
                                                                        <p className="text-sm text-[var(--color-text-muted)]">
                                                                            من {assignment.max_grade}
                                                                        </p>
                                                                        {submission.feedback && (
                                                                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                                                                {submission.feedback}
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <p className="text-sm text-[var(--color-text-muted)]">
                                                                        قيد التصحيح
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : !overdue ? (
                                                            <button
                                                                onClick={() => openSubmitModal(assignment)}
                                                                className="btn-accent"
                                                            >
                                                                <Upload className="w-4 h-4" />
                                                                تسليم
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="glass-card p-8 text-center">
                                        <FileText className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
                                        <p className="text-[var(--color-text-muted)]">لا توجد واجبات حتى الآن</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="glass-card p-12 text-center">
                        <BookOpen className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">اختر مادة</h3>
                        <p className="text-[var(--color-text-muted)]">اختر مادة من القائمة لعرض المحاضرات والواجبات</p>
                    </div>
                )}
            </div>

            {/* Submission Modal */}
            {showSubmitModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">تسليم الواجب</h2>
                            <button onClick={() => setShowSubmitModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4 p-4 bg-white/5 rounded-lg">
                            <h3 className="font-semibold">{selectedAssignment.title_ar}</h3>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                موعد التسليم: {formatDate(selectedAssignment.due_date)}
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                الدرجة القصوى: {selectedAssignment.max_grade}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">الإجابة *</label>
                                <textarea
                                    required
                                    rows={6}
                                    className="input-field resize-none"
                                    value={submissionContent}
                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                    placeholder="اكتب إجابتك هنا..."
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">ملف مرفق (اختياري)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setSubmissionFile(e.target.files[0])}
                                    className="input-field"
                                />
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                    يمكنك إرفاق ملف PDF أو صورة
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-accent flex-1 justify-center"
                                >
                                    {submitting ? (
                                        <div className="spinner w-5 h-5"></div>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            تسليم
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowSubmitModal(false)}
                                    className="btn-primary flex-1 justify-center"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Lecture View Modal */}
            {showLectureModal && selectedLecture && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold">{selectedLecture.title_ar}</h2>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    {selectedLecture.lecture_type === 'theory' ? 'نظري' : 'عملي'} • محاضرة {selectedLecture.order}
                                </p>
                            </div>
                            <button onClick={() => setShowLectureModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="prose prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-[var(--color-text)]">
                                {selectedLecture.content}
                            </div>
                        </div>

                        {selectedLecture.file && (
                            <div className="mt-6 p-4 bg-white/5 rounded-lg">
                                <a
                                    href={selectedLecture.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[var(--color-accent)] hover:underline flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    تحميل الملف المرفق
                                </a>
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-white/10 text-sm text-[var(--color-text-muted)]">
                            بواسطة: {selectedLecture.created_by_name}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
