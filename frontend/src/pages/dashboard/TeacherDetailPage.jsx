import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowRight, Users, Building2, BookOpen, Hash,
    FlaskConical, BookMarked, GraduationCap, Calendar,
    AlertCircle, Loader2, Mail, BadgeCheck, Layers
} from 'lucide-react';
import api from '../../services/api';

/* ── helpers ─────────────────────────────────────────────── */
function StatBadge({ icon: Icon, value, color }) {
    const palette = {
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        blue:   'bg-blue-500/10   text-blue-400   border-blue-500/20',
        green:  'bg-green-500/10  text-green-400  border-green-500/20',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-sm ${palette[color] || palette.purple}`}>
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {value}
        </span>
    );
}

function KpiCard({ icon: Icon, label, value, color = 'accent' }) {
    const map = {
        accent: 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/25 text-[var(--color-accent)]',
        purple: 'bg-purple-500/10 border-purple-500/25 text-purple-400',
        orange: 'bg-orange-500/10 border-orange-500/25 text-orange-400',
        blue:   'bg-blue-500/10 border-blue-500/25 text-blue-400',
    };
    const c = map[color] || map.accent;
    return (
        <div className={`glass-card p-5 border ${c} hover:-translate-y-0.5 transition-transform`}>
            <div className={`w-10 h-10 rounded-xl ${c} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{value ?? '—'}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
        </div>
    );
}

/* ── Main Page ───────────────────────────────────────────── */
export default function TeacherDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.get(`/academic/professors/${id}/`)
            .then(r => setTeacher(r.data))
            .catch(e => setError(e.response?.data?.error || 'حدث خطأ أثناء تحميل بيانات المدرس'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center py-32">
            <Loader2 className="w-10 h-10 text-[var(--color-accent)] animate-spin" />
        </div>
    );

    if (error) return (
        <div className="glass-card p-16 text-center">
            <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">تعذّر تحميل البيانات</h3>
            <p className="text-[var(--color-text-muted)] mb-6">{error}</p>
            <button onClick={() => navigate(-1)} className="btn-accent">
                <ArrowRight className="w-4 h-4" /> العودة
            </button>
        </div>
    );

    if (!teacher) return null;

    const courses = teacher.courses || [];

    return (
        <div className="space-y-8">

            {/* ── Back Button ─────────────────────────────────────────── */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white transition-colors group"
            >
                <ArrowRight className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                العودة إلى قائمة الأساتذة
            </button>

            {/* ── Teacher Header Card ──────────────────────────────────── */}
            <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <Users className="w-10 h-10 text-purple-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold">{teacher.name}</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                                {teacher.role === 'teacher' ? 'مدرس' : teacher.role === 'ta' ? 'معيد' : teacher.role}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
                            {teacher.email && (
                                <span className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" />
                                    {teacher.email}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <BadgeCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                                @{teacher.username}
                            </span>
                        </div>
                    </div>

                    {/* Quick stats pills */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                        <StatBadge icon={Hash} value={`${teacher.courses_count} مادة`} color="purple" />
                        <StatBadge icon={FlaskConical} value={`${teacher.practical_count} عملي`} color="orange" />
                        <StatBadge icon={BookMarked} value={`${teacher.theoretical_count} نظري`} color="blue" />
                    </div>
                </div>
            </div>

            {/* ── KPI Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <KpiCard icon={BookOpen}     label="إجمالي المواد"       value={teacher.courses_count}     color="purple" />
                <KpiCard icon={FlaskConical} label="محاضرات عملية"       value={teacher.practical_count}   color="orange" />
                <KpiCard icon={BookMarked}   label="محاضرات نظرية"       value={teacher.theoretical_count} color="blue"   />
            </div>

            {/* ── Report Banner ────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                <GraduationCap className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                <p className="text-sm font-semibold text-[var(--color-accent)]">
                    تفاصيل المواد المُسندة للأستاذ: <span className="text-white">{teacher.name}</span>
                </p>
            </div>

            {/* ── Courses Table ────────────────────────────────────────── */}
            {courses.length > 0 ? (
                <>
                    {/* Desktop Table */}
                    <div className="glass-card overflow-hidden hidden sm:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)] w-8">#</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">
                                            اسم المادة
                                        </th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">
                                            <span className="flex items-center gap-1.5">
                                                <Layers className="w-3.5 h-3.5 text-green-400" />
                                                الدرجة / السنة
                                            </span>
                                        </th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                                الفصل
                                            </span>
                                        </th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">
                                            <span className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                                                اسم القسم
                                            </span>
                                        </th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">
                                            <span className="flex items-center gap-1.5">
                                                <FlaskConical className="w-3.5 h-3.5 text-orange-400" />
                                                عملي
                                            </span>
                                        </th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">
                                            <span className="flex items-center gap-1.5">
                                                <BookMarked className="w-3.5 h-3.5 text-blue-400" />
                                                نظري
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {courses.map((course, idx) => (
                                        <tr key={course.id} className="hover:bg-white/[0.04] transition-colors">
                                            <td className="p-4 text-[var(--color-text-muted)] text-xs">{idx + 1}</td>

                                            {/* Course Name */}
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-semibold">{course.name}</p>
                                                    <p className="text-xs text-[var(--color-accent)] font-mono mt-0.5">{course.code}</p>
                                                </div>
                                            </td>

                                            {/* Grade / Academic Year */}
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-sm font-semibold border border-green-500/20">
                                                    <GraduationCap className="w-3 h-3" />
                                                    السنة {course.academic_year}
                                                </span>
                                            </td>

                                            {/* Semester */}
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-semibold border border-blue-500/20">
                                                    <Calendar className="w-3 h-3" />
                                                    الفصل {course.semester}
                                                </span>
                                            </td>

                                            {/* Department */}
                                            <td className="p-4">
                                                <span className="flex items-center gap-1.5 text-sm font-medium">
                                                    <Building2 className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                                                    {course.department}
                                                </span>
                                            </td>

                                            {/* Practical */}
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 font-semibold text-sm">
                                                    <FlaskConical className="w-3 h-3" />
                                                    {course.practical_lectures}
                                                </span>
                                            </td>

                                            {/* Theoretical */}
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-semibold text-sm">
                                                    <BookMarked className="w-3 h-3" />
                                                    {course.theoretical_lectures}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3">
                        {courses.map((course, idx) => (
                            <div key={course.id} className="glass-card p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold">{course.name}</p>
                                        <p className="text-xs text-[var(--color-accent)] font-mono mt-0.5">{course.code}</p>
                                    </div>
                                    <span className="text-xs text-[var(--color-text-muted)] shrink-0">#{idx + 1}</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                                    <Building2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                                    {course.department}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold">
                                        <GraduationCap className="w-3 h-3" /> السنة {course.academic_year}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold">
                                        <Calendar className="w-3 h-3" /> الفصل {course.semester}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                                    <div className="text-center">
                                        <p className="text-xs text-orange-400 mb-1">عملي</p>
                                        <p className="font-bold text-orange-400 text-lg">{course.practical_lectures}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-blue-400 mb-1">نظري</p>
                                        <p className="font-bold text-blue-400 text-lg">{course.theoretical_lectures}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="glass-card p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-10 h-10 text-[var(--color-text-muted)]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">لا توجد مواد مُسندة</h3>
                    <p className="text-[var(--color-text-muted)]">لم يتم تعيين أي مواد لهذا الأستاذ بعد</p>
                </div>
            )}
        </div>
    );
}
