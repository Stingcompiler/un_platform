import { useState, useEffect, useCallback } from 'react';
import {
    BarChart2, BookOpen, FileText, Users, GraduationCap, TrendingUp,
    Award, Calendar, Upload, Clock, AlertCircle, CheckCircle,
    Download, RefreshCw, ChevronUp, ChevronDown, Info
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ── Stat Card ────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function StatCard({ icon: IconComponent, label, value, sub, color = 'accent', trend }) {
    const palette = {
        accent: { bg: 'bg-[var(--color-accent)]/10', border: 'border-[var(--color-accent)]/25', icon: 'text-[var(--color-accent)]', num: 'text-white' },
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/25', icon: 'text-blue-400', num: 'text-white' },
        green: { bg: 'bg-green-500/10', border: 'border-green-500/25', icon: 'text-green-400', num: 'text-white' },
        purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/25', icon: 'text-purple-400', num: 'text-white' },
        orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/25', icon: 'text-orange-400', num: 'text-white' },
        pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/25', icon: 'text-pink-400', num: 'text-white' },
        teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/25', icon: 'text-teal-400', num: 'text-white' },
    };
    const c = palette[color] || palette.accent;
    return (
        <div className={`glass-card p-5 border ${c.border} hover:-translate-y-0.5 transition-transform group`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${c.icon}`} />
                </div>
                {trend !== undefined && (
                    <span className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trend >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <p className={`text-2xl font-bold mb-1 ${c.num}`}>{value ?? '—'}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
            {sub && <p className="text-xs text-[var(--color-text-muted)]/60 mt-1">{sub}</p>}
        </div>
    );
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function MiniChart({ data, color = '#60a5fa' }) {
    if (!data || data.length === 0) return (
        <div className="flex items-center justify-center h-24 text-[var(--color-text-muted)] text-sm">لا بيانات</div>
    );
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="flex items-end gap-1 h-24 w-full">
            {data.map((d, i) => (
                <div key={i} className="flex-1 relative group">
                    <div
                        className="w-full rounded-t-sm transition-all"
                        style={{ height: `${Math.max(3, (d.count / max) * 100)}%`, backgroundColor: `${color}55` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {d.date}: {d.count}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = 'var(--color-accent)' }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/10">
                <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
            <span className="text-xs text-[var(--color-text-muted)] w-8 text-right">{pct}%</span>
        </div>
    );
}

// ── Section Header ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function SectionHeader({ icon: IconComponent, title, subtitle }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/15 flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
                <h2 className="font-bold text-lg">{title}</h2>
                {subtitle && <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
            </div>
        </div>
    );
}

// ── Sort Icon (outside main component to avoid create-during-render) ────────
function SortIconDisplay({ field, sortField, sortDir }) {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === 'desc'
        ? <ChevronDown className="w-3 h-3 text-[var(--color-accent)]" />
        : <ChevronUp className="w-3 h-3 text-[var(--color-accent)]" />;
}

export default function ReportsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'system_manager';
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortField, setSortField] = useState('lecture_count');
    const [sortDir, setSortDir] = useState('desc');
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');

    const loadReport = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = selectedDept ? `?department=${selectedDept}` : '';
            const res = await api.get(`/academic/department-report/${params}`);
            setReport(res.data);
        } catch (e) {
            setError(e.response?.data?.error || 'حدث خطأ أثناء تحميل التقرير');
        } finally {
            setLoading(false);
        }
    }, [selectedDept]);

    useEffect(() => {
        if (isAdmin) {
            api.get('/academic/departments/').then(r => setDepartments(r.data.results || r.data)).catch(() => {});
        }
        loadReport();
    }, [isAdmin, loadReport]);

    const sortedCourses = report?.course_details
        ? [...report.course_details].sort((a, b) => {
            const va = a[sortField] ?? 0;
            const vb = b[sortField] ?? 0;
            return sortDir === 'desc' ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
        })
        : [];

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortField(field); setSortDir('desc'); }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="spinner"></div>
        </div>
    );

    if (error) return (
        <div className="glass-card p-12 text-center">
            <AlertCircle className="w-16 h-16 text-[var(--color-error)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">خطأ في تحميل التقرير</h3>
            <p className="text-[var(--color-text-muted)] mb-4">{error}</p>
            <button onClick={loadReport} className="btn-accent">
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
            </button>
        </div>
    );

    if (!report) return null;

    const cs = report.course_stats;
    const ls = report.lecture_stats;
    const ds = report.department_stats;
    const deptName = report.department?.name || 'جميع الأقسام';

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-1">تقارير القسم</h1>
                    <p className="text-[var(--color-text-muted)]">
                        تحليلات تفصيلية وإحصائيات أكاديمية — <span className="text-[var(--color-accent)]">{deptName}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && departments.length > 0 && (
                        <select
                            value={selectedDept}
                            onChange={e => setSelectedDept(e.target.value)}
                            className="input-field w-48"
                        >
                            <option value="">جميع الأقسام</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name_ar}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={loadReport}
                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                        title="تحديث التقرير"
                    >
                        <RefreshCw className="w-4 h-4" />
                        تحديث
                    </button>
                </div>
            </div>

            {/* ── Section 1: Course Statistics ──────────────────────────────── */}
            <div className="mb-8">
                <SectionHeader icon={BookOpen} title="إحصائيات المواد" subtitle="نظرة عامة على المواد الدراسية في القسم" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard icon={BookOpen} label="إجمالي المواد" value={cs.total} color="accent" />
                    <StatCard icon={CheckCircle} label="مواد بمحاضرات" value={cs.with_lectures} sub={cs.total > 0 ? `${Math.round((cs.with_lectures / cs.total) * 100)}% من الإجمالي` : '—'} color="green" />
                    <StatCard icon={AlertCircle} label="مواد بدون محاضرات" value={cs.without_lectures} color="orange" />
                </div>

                {/* Coverage bar */}
                {cs.total > 0 && (
                    <div className="glass-card p-5 mt-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">نسبة تغطية المحاضرات</span>
                            <span className="text-[var(--color-accent)] font-bold">
                                {Math.round((cs.with_lectures / cs.total) * 100)}%
                            </span>
                        </div>
                        <ProgressBar value={cs.with_lectures} max={cs.total} color="var(--color-accent)" />
                        <p className="text-xs text-[var(--color-text-muted)] mt-2">
                            {cs.with_lectures} من {cs.total} مادة تحتوي على محاضرات
                        </p>
                    </div>
                )}
            </div>

            {/* ── Section 2: Lecture Statistics ─────────────────────────────── */}
            <div className="mb-8">
                <SectionHeader icon={FileText} title="إحصائيات المحاضرات" subtitle="نشاط رفع المحاضرات وتفاصيلها" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                    <StatCard icon={FileText} label="إجمالي المحاضرات" value={ls.total} color="blue" />
                    <StatCard icon={Upload} label="ملفات مرفقة" value={ls.total_files} color="purple" />
                    <StatCard icon={TrendingUp} label="رفع (7 أيام)" value={ls.recent_7d} color="green" />
                    <StatCard icon={Calendar} label="رفع (30 يوم)" value={ls.recent_30d} color="teal" />
                    <StatCard icon={BarChart2} label="متوسط/مادة" value={ls.avg_per_course} color="orange" />
                    <StatCard icon={Clock} label="آخر رفع" value={ls.last_upload || '—'} color="pink" />
                    {ls.most_active && (
                        <StatCard
                            icon={Award}
                            label="الأكثر نشاطاً"
                            value={ls.most_active.code}
                            sub={`${ls.most_active.count} محاضرة — ${ls.most_active.name}`}
                            color="accent"
                        />
                    )}
                    {ls.least_active && ls.least_active.count === 0 && (
                        <StatCard
                            icon={AlertCircle}
                            label="الأقل نشاطاً"
                            value={ls.least_active.code}
                            sub={`${ls.least_active.count} محاضرة — ${ls.least_active.name}`}
                            color="orange"
                        />
                    )}
                </div>

                {/* Trend Chart */}
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
                        نشاط رفع المحاضرات — آخر 30 يوماً
                    </h3>
                    <MiniChart data={ls.upload_trends} color="#60a5fa" />
                    {ls.upload_trends.length === 0 && (
                        <p className="text-xs text-[var(--color-text-muted)] text-center mt-2">
                            لم يتم رفع أي محاضرات خلال الـ 30 يوم الماضية
                        </p>
                    )}
                </div>
            </div>

            {/* ── Section 3: Department Statistics ──────────────────────────── */}
            <div className="mb-8">
                <SectionHeader icon={Users} title="إحصائيات القسم" subtitle="المستخدمون والطلاب المرتبطون بالقسم" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard icon={GraduationCap} label="إجمالي الطلاب" value={ds.total_students} color="blue" />
                    <StatCard
                        icon={CheckCircle}
                        label="مسجلون في النظام"
                        value={ds.registered_students}
                        sub={ds.total_students > 0 ? `${Math.round((ds.registered_students / ds.total_students) * 100)}% من الإجمالي` : '—'}
                        color="green"
                    />
                    <StatCard icon={Users} label="المدرسون" value={ds.instructors} color="purple" />
                    <StatCard icon={Award} label="المشرفون" value={ds.total_supervisors} color="orange" />
                    <StatCard icon={BarChart2} label="مدراء الأقسام" value={ds.total_managers} color="teal" />
                </div>

                {/* Student registration progress */}
                {ds.total_students > 0 && (
                    <div className="glass-card p-5 mt-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">نسبة التسجيل في النظام</span>
                            <span className="text-green-400 font-bold">
                                {Math.round((ds.registered_students / ds.total_students) * 100)}%
                            </span>
                        </div>
                        <ProgressBar value={ds.registered_students} max={ds.total_students} color="#22c55e" />
                        <p className="text-xs text-[var(--color-text-muted)] mt-2">
                            {ds.registered_students} طالب مسجل من أصل {ds.total_students}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Section 4: Course Details Table ───────────────────────────── */}
            <div className="mb-8">
                <SectionHeader icon={BarChart2} title="تفاصيل المواد" subtitle="جدول مفصّل بكل مادة وإحصائياتها" />
                <div className="glass-card overflow-hidden">
                    {sortedCourses.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">رمز المادة</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">اسم المادة</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">السنة / الفصل</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">المدرس</th>
                                        <th
                                            className="text-right p-4 font-semibold text-[var(--color-text-muted)] cursor-pointer hover:text-white select-none"
                                            onClick={() => toggleSort('lecture_count')}
                                        >
                                            <span className="flex items-center gap-1">
                                                المحاضرات <SortIconDisplay field="lecture_count" sortField={sortField} sortDir={sortDir} />
                                            </span>
                                        </th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">آخر رفع</th>
                                        <th
                                            className="text-right p-4 font-semibold text-[var(--color-text-muted)] cursor-pointer hover:text-white select-none"
                                            onClick={() => toggleSort('completion_pct')}
                                        >
                                            <span className="flex items-center gap-1">
                                                الإكمال <SortIconDisplay field="completion_pct" sortField={sortField} sortDir={sortDir} />
                                            </span>
                                        </th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sortedCourses.map(course => (
                                        <tr key={course.id} className="hover:bg-white/4 transition-colors group">
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono font-medium">
                                                    {course.code}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium max-w-[200px]">
                                                <span className="line-clamp-1">{course.name}</span>
                                            </td>
                                            <td className="p-4 text-[var(--color-text-muted)]">
                                                السنة {course.year} / الفصل {course.semester}
                                            </td>
                                            <td className="p-4 text-[var(--color-text-muted)]">
                                                <span className="line-clamp-1">{course.supervisor}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-lg font-bold ${course.lecture_count > 0 ? 'text-white' : 'text-[var(--color-text-muted)]'}`}>
                                                    {course.lecture_count}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[var(--color-text-muted)]">
                                                {course.last_upload ? (
                                                    <span className="flex items-center gap-1 text-xs">
                                                        <Calendar className="w-3 h-3" />
                                                        {course.last_upload}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-[var(--color-error)]/70">لا يوجد</span>
                                                )}
                                            </td>
                                            <td className="p-4 min-w-[120px]">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-[var(--color-text-muted)]">{course.completion_pct}%</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-white/10">
                                                        <div
                                                            className="h-1.5 rounded-full transition-all"
                                                            style={{
                                                                width: `${course.completion_pct}%`,
                                                                backgroundColor: course.completion_pct >= 80 ? '#22c55e' : course.completion_pct >= 40 ? '#f59e0b' : '#ef4444'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {course.lecture_count > 0 ? (
                                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                                                        <CheckCircle className="w-3 h-3" /> نشط
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                                                        <AlertCircle className="w-3 h-3" /> فارغ
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <BookOpen className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">لا توجد مواد</h3>
                            <p className="text-[var(--color-text-muted)]">لم يتم إضافة أي مواد في هذا القسم بعد</p>
                        </div>
                    )}
                </div>
                {sortedCourses.length > 0 && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        نسبة الإكمال محسوبة على أساس 10 محاضرات كمعيار مرجعي
                    </p>
                )}
            </div>

            {/* Export hint */}
            <div className="glass-card p-4 border border-dashed border-white/20 text-center">
                <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)] text-sm">
                    <Download className="w-4 h-4" />
                    <span>تصدير التقارير قيد التطوير — PDF وExcel قادم قريباً</span>
                </div>
            </div>
        </div>
    );
}
