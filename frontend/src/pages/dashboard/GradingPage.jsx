import { useState, useEffect } from 'react';
import { ClipboardList, Check, Save, User, FileText, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function GradingPage() {
    const { user } = useAuth();
    const isTA = user?.role === 'ta';
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSubmission, setExpandedSubmission] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchAssignments();
        }
    }, [selectedCourse]);

    useEffect(() => {
        if (selectedAssignment) {
            fetchSubmissions();
        }
    }, [selectedAssignment]);

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

    const fetchAssignments = async () => {
        try {
            // TAs only see lab assignments — theory assignments belong to teachers
            const typeParam = isTA ? '&type=lab' : '';
            const res = await api.get(`/academic/assignments/?course=${selectedCourse.id}${typeParam}`);
            const data = res.data.results || res.data;
            setAssignments(data);
            if (data.length > 0) setSelectedAssignment(data[0]);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        }
    };

    const fetchSubmissions = async () => {
        try {
            const res = await api.get(`/academic/submissions/?assignment=${selectedAssignment.id}`);
            setSubmissions(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
    };

    const handleGrade = async (submissionId, grade, feedback) => {
        try {
            await api.patch(`/academic/submissions/${submissionId}/grade/`, {
                grade,
                feedback,
            });
            fetchSubmissions();
        } catch (error) {
            console.error('Error grading submission:', error);
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
                <h1 className="text-3xl font-bold mb-2">تصحيح الواجبات</h1>
                <p className="text-[var(--color-text-muted)]">تصحيح ومراجعة واجبات الطلاب</p>
            </div>

            {courses.length > 0 ? (
                <>
                    {/* Filters */}
                    <div className="glass-card p-4 mb-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">المادة</label>
                                <select
                                    className="input-field"
                                    value={selectedCourse?.id || ''}
                                    onChange={(e) => {
                                        const course = courses.find((c) => c.id === parseInt(e.target.value));
                                        setSelectedCourse(course);
                                        setSelectedAssignment(null);
                                        setSubmissions([]);
                                    }}
                                >
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.name_ar} ({course.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">الواجب</label>
                                <select
                                    className="input-field"
                                    value={selectedAssignment?.id || ''}
                                    onChange={(e) => {
                                        const assignment = assignments.find((a) => a.id === parseInt(e.target.value));
                                        setSelectedAssignment(assignment);
                                    }}
                                    disabled={!assignments.length}
                                >
                                    {assignments.length === 0 ? (
                                        <option>لا توجد واجبات</option>
                                    ) : (
                                        assignments.map((assignment) => (
                                            <option key={assignment.id} value={assignment.id}>
                                                {assignment.title_ar} (الدرجة: {assignment.max_grade})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Submissions List */}
                    {selectedAssignment && submissions.length > 0 ? (
                        <div className="space-y-4">
                            {submissions.map((submission) => (
                                <SubmissionCard
                                    key={submission.id}
                                    submission={submission}
                                    maxGrade={selectedAssignment.max_grade}
                                    isExpanded={expandedSubmission === submission.id}
                                    onToggle={() =>
                                        setExpandedSubmission(expandedSubmission === submission.id ? null : submission.id)
                                    }
                                    onGrade={handleGrade}
                                    canGrade={!isTA || selectedAssignment?.assignment_type === 'lab'}
                                />
                            ))}
                        </div>
                    ) : selectedAssignment ? (
                        <div className="glass-card p-12 text-center">
                            <ClipboardList className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">لا توجد تسليمات</h3>
                            <p className="text-[var(--color-text-muted)]">لم يقم أي طالب بتسليم هذا الواجب بعد</p>
                        </div>
                    ) : null}
                </>
            ) : (
                <div className="glass-card p-12 text-center">
                    <ClipboardList className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد مواد مسندة</h3>
                    <p className="text-[var(--color-text-muted)]">لم يتم إسناد أي مواد إليك بعد</p>
                </div>
            )}
        </div>
    );
}

function SubmissionCard({ submission, maxGrade, isExpanded, onToggle, onGrade, canGrade = true }) {
    const [grade, setGrade] = useState(submission.grade || '');
    const [feedback, setFeedback] = useState(submission.feedback || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onGrade(submission.id, parseInt(grade), feedback);
        setSaving(false);
    };

    return (
        <div className="glass-card overflow-hidden">
            <div
                onClick={onToggle}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-medium">{submission.student?.full_name_ar || 'طالب'}</h3>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            تم التسليم: {new Date(submission.submitted_at).toLocaleDateString('ar-SD')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {submission.grade != null ? (
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-success)]/20 text-[var(--color-success)]">
                            <Check className="w-4 h-4" />
                            {submission.grade}/{maxGrade}
                        </span>
                    ) : (
                        <span className="px-3 py-1 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
                            بانتظار التصحيح
                        </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 pt-0 border-t border-white/10">
                    {/* Submission Content */}
                    <div className="mb-4 p-4 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-2">
                            <FileText className="w-4 h-4" />
                            <span>إجابة الطالب:</span>
                        </div>
                        <p className="whitespace-pre-line">{submission.content || 'لا يوجد محتوى نصي'}</p>
                        {submission.file && (
                            <a
                                href={submission.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline"
                            >
                                <FileText className="w-4 h-4" />
                                عرض الملف المرفق
                            </a>
                        )}
                    </div>

                    {/* Grading Form — teachers only; TAs blocked on theory assignments */}
                    {canGrade ? (
                        <>
                            <div className="grid sm:grid-cols-[120px,1fr] gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">الدرجة</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={maxGrade}
                                        className="input-field"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        placeholder={`من ${maxGrade}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">الملاحظات</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="أضف ملاحظاتك للطالب..."
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button onClick={handleSave} disabled={saving || !grade} className="btn-accent">
                                    {saving ? <span className="spinner w-5 h-5 border-2"></span> : <Save className="w-5 h-5" />}
                                    حفظ الدرجة
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                            <Lock className="w-5 h-5 shrink-0" />
                            <p className="text-sm">تصحيح هذا الواجب مخصص للمدرس فقط. لا يمكن للمعيد تصحيح واجبات النظري.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
