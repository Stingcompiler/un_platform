import { useState, useEffect } from 'react';
import {
    BarChart2, BookOpen, Users, GraduationCap,
    FileText, RefreshCw, ArrowLeft, ChevronLeft,
    AlertCircle, CheckCircle, Building2, Layers,
    Calendar, ClipboardList, Send, Download,
    Target, Award, TrendingUp, FlaskConical, BookMarked
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ── Small helpers (kept for sub-pages) ─────────────────────── */
function Kpi({ icon: Icon, label, value, color = 'accent' }) {
    const cols = {
        accent: 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/25 text-[var(--color-accent)]',
        blue:   'bg-blue-500/10 border-blue-500/25 text-blue-400',
        green:  'bg-green-500/10 border-green-500/25 text-green-400',
        red:    'bg-red-500/10 border-red-500/25 text-red-400',
        purple: 'bg-purple-500/10 border-purple-500/25 text-purple-400',
        orange: 'bg-orange-500/10 border-orange-500/25 text-orange-400',
        teal:   'bg-teal-500/10 border-teal-500/25 text-teal-400',
    };
    const c = cols[color] || cols.accent;
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

function SectionTitle({ icon: Icon, title, sub }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-accent)]/15 flex items-center justify-center">
                <Icon className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div>
                <h2 className="font-bold text-base">{title}</h2>
                {sub && <p className="text-xs text-[var(--color-text-muted)]">{sub}</p>}
            </div>
        </div>
    );
}

function Bar({ name, count, max, color }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-28 truncate text-[var(--color-text-muted)] text-left">{name}</span>
            <div className="flex-1 h-5 rounded-full bg-white/5 relative overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(4, (count / Math.max(max, 1)) * 100)}%`, backgroundColor: color }} />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium">{count}</span>
            </div>
        </div>
    );
}

function SimpleTable({ cols, rows, emptyMsg = 'لا توجد بيانات' }) {
    if (!rows?.length) return <p className="p-8 text-center text-[var(--color-text-muted)] text-sm">{emptyMsg}</p>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                        <th className="text-right p-3 text-[var(--color-text-muted)] font-semibold w-8">#</th>
                        {cols.map((c, i) => <th key={i} className="text-right p-3 text-[var(--color-text-muted)] font-semibold whitespace-nowrap">{c.label}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.03]">
                            <td className="p-3 text-[var(--color-text-muted)] text-xs">{idx + 1}</td>
                            {cols.map((c, i) => (
                                <td key={i} className={`p-3 ${i === 0 ? 'font-medium' : 'text-[var(--color-text-muted)]'}`}>
                                    {c.render ? c.render(row) : (row[c.key] ?? '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ── Sub-page content components ──────────────────────────── */

function SubpageCourses({ report, deptReport }) {
    const rows = deptReport?.course_details || [];
    const kpis = report?.kpis || {};
    const cs = deptReport?.course_stats || {};
    return (
        <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
                {[
                    { label: 'إجمالي المواد', value: cs.total || kpis.total_subjects, color: 'text-blue-400' },
                    { label: 'مواد لها محاضرات', value: cs.with_lectures, color: 'text-green-400' },
                    { label: 'مواد بدون محاضرات', value: cs.without_lectures, color: 'text-red-400' },
                ].map((item, i) => (
                    <div key={i} className="glass-card p-5 text-center">
                        <p className={`text-3xl font-bold ${item.color} mb-1`}>{item.value ?? '—'}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">{item.label}</p>
                    </div>
                ))}
            </div>
            <SectionTitle icon={BookOpen} title="تفاصيل المواد" sub={`${rows.length} مادة`} />
            <div className="glass-card overflow-hidden">
                <SimpleTable
                    cols={[
                        { key: 'name', label: 'المادة', render: r => <span>{r.name} <span className="text-xs text-[var(--color-accent)]">({r.code})</span></span> },
                        { key: 'year', label: 'السنة' },
                        { key: 'semester', label: 'الفصل', render: r => `الفصل ${r.semester}` },
                        { key: 'supervisor', label: 'المدرس' },
                        { key: 'lecture_count', label: 'المحاضرات' },
                        { key: 'last_upload', label: 'آخر رفع' },
                    ]}
                    rows={rows}
                    emptyMsg="لا توجد مواد"
                />
            </div>
        </div>
    );
}

function SubpageLectures({ report, deptReport }) {
    const ls = deptReport?.lecture_stats || {};
    const lb = report?.leaderboards || {};
    return (
        <div className="space-y-6">
            <SectionTitle icon={FileText} title="إحصائيات المحاضرات" sub="نشاط رفع المحاضرات وتفاصيلها" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <Kpi icon={FileText} label="إجمالي المحاضرات" value={ls.total} color="purple" />
                <Kpi icon={Download} label="الملفات المرفوعة" value={ls.total_files} color="blue" />
                <Kpi icon={TrendingUp} label="آخر 7 أيام" value={ls.recent_7d} color="green" />
                <Kpi icon={Calendar} label="آخر 30 يوم" value={ls.recent_30d} color="orange" />
            </div>
            <SectionTitle icon={Award} title="المواد الأكثر نشاطاً" sub="ترتيب حسب عدد المحاضرات" />
            <div className="glass-card overflow-hidden">
                <SimpleTable
                    cols={[
                        { key: 'name', label: 'المادة', render: r => <span>{r.name} <span className="text-xs text-[var(--color-accent)]">({r.code})</span></span> },
                        { key: 'lectures_count', label: 'المحاضرات' },
                        { key: 'department', label: 'القسم' },
                        { key: 'professor', label: 'المدرس' },
                        { key: 'assignments_count', label: 'الواجبات' },
                    ]}
                    rows={lb.advanced_subjects}
                    emptyMsg="لا توجد بيانات"
                />
            </div>
        </div>
    );
}

function SubpageTeachers({ report }) {
    const lb = report?.leaderboards || {};
    const kpis = report?.kpis || {};
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Kpi icon={ClipboardList} label="إجمالي الواجبات" value={kpis.total_assignments} color="orange" />
                <Kpi icon={Send} label="التسليمات" value={kpis.total_submissions} color="teal" />
                <Kpi icon={CheckCircle} label="المواد المُعيّنة" value={kpis.assigned_subjects} color="green" />
            </div>
            <SectionTitle icon={Award} title="الأساتذة الأكثر نشاطاً" sub="ترتيب حسب عدد الواجبات والتصحيحات" />
            <div className="glass-card overflow-hidden">
                <SimpleTable
                    cols={[
                        { key: 'name', label: 'الأستاذ' },
                        { key: 'subjects_count', label: 'المواد' },
                        { key: 'assignments_count', label: 'الواجبات' },
                        { key: 'graded_count', label: 'التصحيحات' },
                        { key: 'lectures_count', label: 'المحاضرات' },
                    ]}
                    rows={lb.active_professors}
                    emptyMsg="لا يوجد بيانات"
                />
            </div>
        </div>
    );
}

function SubpageStudents({ report }) {
    const dist = report?.student_distribution || {};
    const maxDept = Math.max(...(dist.per_department || []).map(d => d.count), 1);
    const maxLvl  = Math.max(...(dist.per_level    || []).map(d => d.count), 1);
    const maxSem  = Math.max(...(dist.per_semester  || []).map(d => d.count), 1);
    return (
        <div className="space-y-6">
            <SectionTitle icon={GraduationCap} title="توزيع الطلاب" sub="إحصائيات الطلاب حسب القسم والمستوى والفصل" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-400" />حسب القسم</h3>
                    <div className="space-y-2">{(dist.per_department || []).map((d, i) => <Bar key={i} name={d.name} count={d.count} max={maxDept} color="#60a5fa" />)}</div>
                </div>
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-green-400" />حسب المستوى</h3>
                    <div className="space-y-2">{(dist.per_level || []).map((d, i) => <Bar key={i} name={d.name} count={d.count} max={maxLvl} color="#34d399" />)}</div>
                </div>
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-400" />حسب الفصل</h3>
                    <div className="space-y-2">{(dist.per_semester || []).map((d, i) => <Bar key={i} name={d.name} count={d.count} max={maxSem} color="#a78bfa" />)}</div>
                </div>
            </div>
        </div>
    );
}

/* ── Report link card definitions ──────────────────────────── */
const REPORT_CARDS = [
    {
        id: 'courses',
        label: 'المواد',
        icon: BookOpen,
        description: 'تقارير تفصيلية عن المواد الدراسية',
        gradient: 'from-emerald-500/20 to-green-600/10',
        borderColor: 'border-emerald-500/30',
        iconColor: 'text-emerald-400',
        bgIcon: 'bg-emerald-500/15',
    },
    {
        id: 'lectures',
        label: 'سير المحاضرات',
        icon: FileText,
        description: 'إحصائيات ونشاط المحاضرات',
        gradient: 'from-blue-500/20 to-indigo-600/10',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400',
        bgIcon: 'bg-blue-500/15',
    },
    {
        id: 'teachers',
        label: 'الاساتذة',
        icon: Users,
        description: 'تقارير أداء ونشاط الأساتذة',
        gradient: 'from-purple-500/20 to-violet-600/10',
        borderColor: 'border-purple-500/30',
        iconColor: 'text-purple-400',
        bgIcon: 'bg-purple-500/15',
    },
    {
        id: 'students',
        label: 'الطلاب',
        icon: GraduationCap,
        description: 'إحصائيات وتوزيع الطلاب',
        gradient: 'from-amber-500/20 to-orange-600/10',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        bgIcon: 'bg-amber-500/15',
    },
];

/* ── Main page ───────────────────────────────────────────────── */
export default function ReportsPage() {
    const { user } = useAuth();
    const isAdmin   = user?.role === 'system_manager';
    const isManager = ['department_manager', 'supervisor'].includes(user?.role);

    const [activePage, setActivePage] = useState(null); // null = index / link cards
    const [report, setReport]         = useState(null);
    const [deptReport, setDeptReport] = useState(null);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState('');

    // Filters (used inside sub-pages)
    const [selectedDept, setSelectedDept]       = useState('');
    const [selectedLevel, setSelectedLevel]     = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [departments, setDepartments] = useState([]);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams();
            if (selectedDept)     params.append('department', selectedDept);
            if (selectedLevel)    params.append('level', selectedLevel);
            if (selectedSemester) params.append('semester', selectedSemester);
            const qs = params.toString() ? `?${params}` : '';
            const [r1, r2] = await Promise.all([
                api.get(`/academic/comprehensive-report/${qs}`),
                api.get(`/academic/department-report/${qs}`),
            ]);
            setReport(r1.data);
            setDeptReport(r2.data);
        } catch (e) {
            setError(e.response?.data?.error || 'حدث خطأ أثناء تحميل التقرير');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) api.get('/academic/departments/').then(r => setDepartments(r.data.results || r.data)).catch(() => {});
    }, [isAdmin]);

    // Load data when a sub-page is opened
    useEffect(() => {
        if (activePage) load();
    }, [activePage, selectedDept, selectedLevel, selectedSemester]);

    /* ── Render: Index (link cards) ── */
    if (!activePage) {
        return (
            <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 border border-[var(--color-accent)]/30 flex items-center justify-center">
                            <BarChart2 className="w-6 h-6 text-[var(--color-accent)]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">تقارير القسم</h1>
                            <p className="text-[var(--color-text-muted)]">
                                تحليلات تفصيلية وإحصائيات أكاديمية — <span className="text-[var(--color-accent)]">{user?.department?.name_ar || 'جميع الأقسام'}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dept banner for managers */}
                {isManager && user?.department && (
                    <div className="mb-5 px-4 py-2 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-sm flex items-center gap-2">
                        <span className="text-[var(--color-accent)] font-medium">القسم:</span>
                        <span>{user.department.name_ar}</span>
                        <span className="text-[var(--color-text-muted)] text-xs mr-auto">البيانات مقيدة بقسمك فقط</span>
                    </div>
                )}

                {/* Report Link Cards */}
                <div className="glass-card p-6 sm:p-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {REPORT_CARDS.map(card => (
                            <button
                                key={card.id}
                                onClick={() => setActivePage(card.id)}
                                className={`group relative overflow-hidden rounded-2xl border-2 ${card.borderColor} bg-gradient-to-br ${card.gradient} p-6 sm:p-8 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-black/20 active:scale-[0.98] cursor-pointer`}
                            >
                                {/* Background decoration */}
                                <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/[0.03] group-hover:bg-white/[0.06] transition-colors duration-300" />
                                <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/[0.02] group-hover:bg-white/[0.04] transition-colors duration-300" />

                                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${card.bgIcon} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <card.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${card.iconColor}`} />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{card.label}</h3>
                                <p className="text-xs text-[var(--color-text-muted)] hidden sm:block">{card.description}</p>

                                {/* Arrow indicator */}
                                <div className={`mt-3 flex items-center justify-center gap-1 ${card.iconColor} text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                                    <span>عرض التقرير</span>
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    /* ── Render: Sub-page ── */
    const currentCard = REPORT_CARDS.find(c => c.id === activePage);

    return (
        <div>
            {/* Header with back button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setActivePage(null)}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" />
                    </button>
                    <div className={`w-12 h-12 rounded-xl ${currentCard?.bgIcon || 'bg-[var(--color-accent)]/15'} flex items-center justify-center`}>
                        {currentCard && <currentCard.icon className={`w-6 h-6 ${currentCard.iconColor}`} />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{currentCard?.label || 'التقرير'}</h1>
                        <p className="text-[var(--color-text-muted)] text-sm">
                            {currentCard?.description} — <span className="text-[var(--color-accent)]">{deptReport?.department?.name || user?.department?.name_ar || 'جميع الأقسام'}</span>
                        </p>
                    </div>
                </div>
                <button onClick={load} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                    <RefreshCw className="w-4 h-4" /> تحديث
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-5 mb-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {isAdmin && (
                        <select className="input-field" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                            <option value="">جميع الأقسام</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
                        </select>
                    )}
                    <select className="input-field" value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}>
                        <option value="">جميع المستويات</option>
                        {[1,2,3,4,5].map(y => <option key={y} value={y}>المستوى {y}</option>)}
                    </select>
                    <select className="input-field" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                        <option value="">جميع الفصول</option>
                        {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s} value={s}>الفصل {s}</option>)}
                    </select>
                </div>
            </div>

            {/* Dept banner for managers */}
            {isManager && user?.department && (
                <div className="mb-5 px-4 py-2 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-sm flex items-center gap-2">
                    <span className="text-[var(--color-accent)] font-medium">القسم:</span>
                    <span>{user.department.name_ar}</span>
                    <span className="text-[var(--color-text-muted)] text-xs mr-auto">البيانات مقيدة بقسمك فقط</span>
                </div>
            )}

            {/* Loading / Error */}
            {loading && <div className="flex justify-center py-24"><div className="spinner" /></div>}
            {!loading && error && (
                <div className="glass-card p-12 text-center">
                    <AlertCircle className="w-14 h-14 text-[var(--color-error)] mx-auto mb-4" />
                    <p className="text-[var(--color-text-muted)] mb-4">{error}</p>
                    <button onClick={load} className="btn-accent"><RefreshCw className="w-4 h-4" /> إعادة المحاولة</button>
                </div>
            )}

            {/* Sub-page content */}
            {!loading && !error && report && (
                <>
                    {activePage === 'courses'  && <SubpageCourses report={report} deptReport={deptReport} />}
                    {activePage === 'lectures' && <SubpageLectures report={report} deptReport={deptReport} />}
                    {activePage === 'teachers' && <SubpageTeachers report={report} />}
                    {activePage === 'students' && <SubpageStudents report={report} />}
                </>
            )}
        </div>
    );
}
