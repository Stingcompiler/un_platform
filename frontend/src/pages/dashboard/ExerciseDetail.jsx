import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText, Download, ArrowRight, Clock, User, CheckCircle,
    Upload, Send, X, BookOpen, Award, AlertCircle, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ExerciseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [mySubmission, setMySubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const isStudent = user?.role === 'student';
    const isInstructor = ['system_manager', 'department_manager', 'supervisor', 'teacher', 'ta'].includes(user?.role);

    useEffect(() => { fetchAll(); }, [id]);

    const fetchAll = async () => {
        try {
            const res = await api.get(`/academic/assignments/${id}/`);
            setAssignment(res.data);
            if (isStudent) {
                const sr = await api.get(`/academic/submissions/?assignment=${id}`);
                const data = sr.data.results || sr.data;
                if (data.length > 0) setMySubmission(data[0]);
            }
            if (isInstructor) {
                const sr = await api.get(`/academic/submissions/?assignment=${id}`);
                setSubmissions(sr.data.results || sr.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError('');
        try {
            const fd = new FormData();
            fd.append('assignment', id);
            fd.append('content', content);
            if (file) fd.append('file', file);
            await api.post('/academic/submissions/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowModal(false);
            setContent('');
            setFile(null);
            fetchAll();
        } catch (e) {
            setSubmitError(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'حدث خطأ أثناء التسليم');
        } finally {
            setSubmitting(false);
        }
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    if (loading) return <div className="flex justify-center py-20"><div className="spinner"></div></div>;

    if (!assignment) return (
        <div className="glass-card p-12 text-center">
            <FileText className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">التمرين غير موجود</h3>
            <button onClick={() => navigate(-1)} className="btn-accent mt-4"><ArrowRight className="w-4 h-4" />العودة</button>
        </div>
    );

    const isOverdue = new Date(assignment.due_date) < new Date();
    const isTheory = assignment.assignment_type === 'theory';

    return (
        <div>
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/10 mt-1">
                    <ArrowRight className="w-6 h-6" />
                </button>
                <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${isTheory ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                            {isTheory ? 'نظري' : 'عملي'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {isOverdue ? 'انتهى الموعد' : 'جارٍ'}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold">{assignment.title_ar || assignment.title}</h1>
                    <p className="text-[var(--color-text-muted)] mt-1">{assignment.course_name}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
                            وصف التمرين
                        </h2>
                        <p className="whitespace-pre-wrap text-[var(--color-text)] leading-relaxed">
                            {assignment.description}
                        </p>
                        {assignment.file && (
                            <a href={assignment.file} target="_blank" rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline text-sm">
                                <Download className="w-4 h-4" />
                                تحميل ملف التمرين
                            </a>
                        )}
                    </div>

                    {/* Student: my submission */}
                    {isStudent && (
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Send className="w-5 h-5 text-[var(--color-accent)]" />
                                تسليمك
                            </h2>
                            {mySubmission ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-green-400 font-medium">
                                        <CheckCircle className="w-5 h-5" />
                                        تم التسليم بنجاح
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <p className="text-xs text-[var(--color-text-muted)] mb-2">إجابتك</p>
                                        <p className="whitespace-pre-wrap text-sm">{mySubmission.content}</p>
                                    </div>
                                    {mySubmission.file && (
                                        <a href={mySubmission.file} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline text-sm">
                                            <Download className="w-4 h-4" />تحميل الملف المرفق
                                        </a>
                                    )}
                                    {mySubmission.grade !== null ? (
                                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                            <p className="text-sm text-green-400 mb-1">درجتك</p>
                                            <p className="text-3xl font-bold">
                                                <span className="text-[var(--color-accent)]">{mySubmission.grade}</span>
                                                <span className="text-lg text-[var(--color-text-muted)]"> / {assignment.max_grade}</span>
                                            </p>
                                            {mySubmission.feedback && (
                                                <p className="mt-2 text-sm text-[var(--color-text-muted)] bg-white/5 p-2 rounded">{mySubmission.feedback}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-yellow-400 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />قيد التصحيح من قِبل المدرس
                                        </p>
                                    )}
                                </div>
                            ) : isOverdue ? (
                                <div className="flex items-center gap-2 text-red-400 p-4 bg-red-500/10 rounded-lg">
                                    <AlertCircle className="w-5 h-5" />
                                    انتهى موعد التسليم ولم تقم بالتسليم
                                </div>
                            ) : (
                                <div>
                                    <p className="text-[var(--color-text-muted)] mb-4">لم تسلّم بعد. اضغط للتسليم قبل انتهاء الموعد.</p>
                                    <button onClick={() => setShowModal(true)} className="btn-accent">
                                        <Upload className="w-5 h-5" />تسليم الواجب
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Instructor: submissions list */}
                    {isInstructor && (
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-[var(--color-accent)]" />
                                تسليمات الطلاب ({submissions.length})
                            </h2>
                            {submissions.length === 0 ? (
                                <p className="text-[var(--color-text-muted)] text-sm">لا توجد تسليمات بعد</p>
                            ) : (
                                <div className="space-y-3">
                                    {submissions.map(s => (
                                        <div key={s.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/30 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-[var(--color-accent)]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{s.student_name}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">{fmtDate(s.submitted_at || s.created_at)}</p>
                                                    </div>
                                                </div>
                                                {s.grade !== null ? (
                                                    <span className="text-sm font-bold text-green-400 bg-green-500/20 px-3 py-1 rounded-lg">
                                                        {s.grade}/{assignment.max_grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">لم يُصحَّح</span>
                                                )}
                                            </div>
                                            {s.content && (
                                                <p className="mt-3 text-sm bg-black/20 p-3 rounded whitespace-pre-wrap text-[var(--color-text-muted)]">
                                                    {s.content}
                                                </p>
                                            )}
                                            {s.file && (
                                                <a href={s.file} target="_blank" rel="noopener noreferrer"
                                                    className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline">
                                                    <Download className="w-3 h-3" />تحميل الملف
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="glass-card p-5">
                        <h3 className="font-semibold mb-4">تفاصيل التمرين</h3>
                        <div className="space-y-3">
                            <InfoRow icon={<Award className="w-4 h-4 text-[var(--color-accent)]" />}
                                label="الدرجة القصوى" value={`${assignment.max_grade} درجة`} />
                            <InfoRow icon={<Clock className="w-4 h-4 text-[var(--color-accent)]" />}
                                label="موعد التسليم" value={fmtDate(assignment.due_date)} />
                            <InfoRow icon={<User className="w-4 h-4 text-[var(--color-accent)]" />}
                                label="أنشئ بواسطة" value={assignment.created_by_name || 'غير محدد'} />
                            {isInstructor && (
                                <InfoRow icon={<Send className="w-4 h-4 text-[var(--color-accent)]" />}
                                    label="عدد التسليمات" value={`${submissions.length} تسليم`} />
                            )}
                        </div>
                    </div>

                    <div className={`glass-card p-5 border ${isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-400' : 'text-yellow-400'}`} />
                            <p className={`text-sm font-semibold ${isOverdue ? 'text-red-400' : 'text-yellow-400'}`}>
                                {isOverdue ? 'انتهى موعد التسليم' : 'موعد التسليم'}
                            </p>
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)]">{fmtDate(assignment.due_date)}</p>
                    </div>
                </div>
            </div>

            {/* Submit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold">تسليم الواجب</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg mb-4 text-sm">
                            <p className="font-medium">{assignment.title_ar}</p>
                            <p className="text-[var(--color-text-muted)]">الموعد: {fmtDate(assignment.due_date)}</p>
                        </div>
                        {submitError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />{submitError}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">الإجابة *</label>
                                <textarea required rows={6} className="input-field resize-none"
                                    placeholder="اكتب إجابتك هنا..." value={content}
                                    onChange={e => setContent(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">ملف مرفق (اختياري)</label>
                                <input type="file" className="input-field" onChange={e => setFile(e.target.files[0])} />
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">يمكنك إرفاق ملف PDF أو صورة</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={submitting} className="btn-accent flex-1 justify-center">
                                    {submitting ? <span className="spinner w-5 h-5 border-2"></span> : <Send className="w-5 h-5" />}
                                    تسليم
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-primary flex-1 justify-center">
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

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">{icon}</div>
            <div>
                <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}
