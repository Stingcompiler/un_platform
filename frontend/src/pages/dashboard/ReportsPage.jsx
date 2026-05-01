import { useState, useEffect, useCallback } from 'react';
import {
    BarChart2, BookOpen, FileText, Users, GraduationCap, TrendingUp,
    Award, Calendar, Upload, Clock, AlertCircle, CheckCircle,
    Download, RefreshCw, ChevronUp, ChevronDown, Info, Layers,
    Target, ClipboardList, Send, Building2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: IconComponent, label, value, sub, color = 'accent' }) {
    const palette = {
        accent: { bg: 'bg-[var(--color-accent)]/10', border: 'border-[var(--color-accent)]/25', icon: 'text-[var(--color-accent)]' },
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/25', icon: 'text-blue-400' },
        green: { bg: 'bg-green-500/10', border: 'border-green-500/25', icon: 'text-green-400' },
        purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/25', icon: 'text-purple-400' },
        orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/25', icon: 'text-orange-400' },
        pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/25', icon: 'text-pink-400' },
        teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/25', icon: 'text-teal-400' },
        red: { bg: 'bg-red-500/10', border: 'border-red-500/25', icon: 'text-red-400' },
    };
    const c = palette[color] || palette.accent;
    return (
        <div className={`glass-card p-5 border ${c.border} hover:-translate-y-0.5 transition-transform group`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${c.icon}`} />
                </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{value ?? '—'}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
            {sub && <p className="text-xs text-[var(--color-text-muted)]/60 mt-1">{sub}</p>}
        </div>
    );
}

// ── Section Header ────────────────────────────────────────────────────────────
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

// ── Distribution Bar Chart ────────────────────────────────────────────────────
function DistributionChart({ data, color = '#60a5fa' }) {
    if (!data || data.length === 0) return (
        <div className="flex items-center justify-center h-20 text-[var(--color-text-muted)] text-sm">لا توجد بيانات</div>
    );
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="space-y-2">
            {data.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-[var(--color-text-muted)] w-24 truncate text-left">{d.name}</span>
                    <div className="flex-1 h-6 rounded-full bg-white/5 overflow-hidden relative">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(3, (d.count / max) * 100)}%`, backgroundColor: color }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium">{d.count}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Leaderboard Table ─────────────────────────────────────────────────────────
function LeaderboardTable({ columns, data, emptyMsg = 'لا توجد بيانات' }) {
    if (!data || data.length === 0) return (
        <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">{emptyMsg}</div>
    );
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                        <th className="text-right p-3 font-semibold text-[var(--color-text-muted)] w-8">#</th>
                        {columns.map((col, i) => (
                            <th key={i} className="text-right p-3 font-semibold text-[var(--color-text-muted)] whitespace-nowrap">{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/4 transition-colors">
                            <td className="p-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                                    : idx === 1 ? 'bg-blue-500/20 text-blue-400'
                                        : idx === 2 ? 'bg-green-500/20 text-green-400'
                                            : 'bg-white/10 text-[var(--color-text-muted)]'
                                    }`}>
                                    {idx + 1}
                                </span>
                            </td>
                            {columns.map((col, i) => (
                                <td key={i} className={`p-3 ${i === 0 ? 'font-medium' : 'text-[var(--color-text-muted)]'}`}>
                                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function ReportsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'system_manager';
    const isManager = ['department_manager', 'supervisor'].includes(user?.role);

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);

    // Filters
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    const loadReport = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (selectedDept) params.append('department', selectedDept);
            if (selectedLevel) params.append('level', selectedLevel);
            if (selectedSemester) params.append('semester', selectedSemester);
            if (selectedSubject) params.append('subject', selectedSubject);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await api.get(`/academic/comprehensive-report/${qs}`);
            setReport(res.data);
        } catch (e) {
            setError(e.response?.data?.error || 'حدث خطأ أثناء تحميل التقرير');
        } finally {
            setLoading(false);
        }
    }, [selectedDept, selectedLevel, selectedSemester, selectedSubject]);

    useEffect(() => {
        if (isAdmin) {
            api.get('/academic/departments/').then(r => setDepartments(r.data.results || r.data)).catch(() => { });
            api.get('/academic/courses/').then(r => setCourses(r.data.results || r.data)).catch(() => { });
        } else {
            api.get('/academic/courses/').then(r => setCourses(r.data.results || r.data)).catch(() => { });
        }
        loadReport();
    }, [isAdmin, loadReport]);

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

    const kpis = report.kpis || {};
    const dist = report.student_distribution || {};
    const lb = report.leaderboards || {};
    const deptName = report.department?.name || 'جميع الأقسام';

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 border border-[var(--color-accent)]/30 flex items-center justify-center">
                        <BarChart2 className="w-6 h-6 text-[var(--color-accent)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">التقارير الشاملة</h1>
                        <p className="text-[var(--color-text-muted)]">
                            تحليلات تفصيلية وإحصائيات أكاديمية — <span className="text-[var(--color-accent)]">{deptName}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadReport}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                    title="تحديث التقرير"
                >
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                </button>
            </div>

            {/* Dept context banner for managers */}
            {isManager && user?.department && (
                <div className="mb-6 px-4 py-2 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-sm flex items-center gap-2">
                    <span className="text-[var(--color-accent)] font-medium">القسم:</span>
                    <span>{user.department.name_ar}</span>
                    <span className="text-[var(--color-text-muted)] text-xs mr-auto">البيانات مقيدة بقسمك فقط</span>
                </div>
            )}

            {/* ── Filters ──────────────────────────────────────────────────── */}
            <div className="glass-card p-5 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="w-4 h-4 text-[var(--color-accent)]" />
                    <span className="font-semibold">الفلاتر</span>
                </div>
                <div className={`grid gap-3 ${isAdmin ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
                    {/* Department — admin only */}
                    {isAdmin && (
                        <select className="input-field" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                            <option value="">جميع الأقسام</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
                        </select>
                    )}
                    <select className="input-field" value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}>
                        <option value="">جميع المستويات</option>
                        {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>المستوى {y}</option>)}
                    </select>
                    <select className="input-field" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                        <option value="">جميع الفصول</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <option key={s} value={s}>الفصل {s}</option>)}
                    </select>
                    {(isAdmin || isManager) && courses.length > 0 && (
                        <select className="input-field" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                            <option value="">جميع المواد</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name_ar} ({c.code})</option>)}
                        </select>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                 SECTION 1: Quick Overview KPIs
                ═══════════════════════════════════════════════════════════════ */}
            <div className="mb-10">
                <SectionHeader icon={Target} title="نظرة عامة سريعة" subtitle="مؤشرات الأداء الرئيسية" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                    <StatCard icon={Building2} label="الأقسام" value={kpis.total_departments} color="accent" />
                    <StatCard icon={BookOpen} label="إجمالي المواد" value={kpis.total_subjects} color="blue" />
                    <StatCard icon={CheckCircle} label="مواد مُعيّنة" value={kpis.assigned_subjects} color="green" />
                    <StatCard icon={AlertCircle} label="مواد غير مُعيّنة" value={kpis.unassigned_subjects} color="red" />
                    <StatCard icon={FileText} label="المحاضرات" value={kpis.total_lectures} color="purple" />
                    <StatCard icon={ClipboardList} label="الواجبات" value={kpis.total_assignments} color="orange" />
                    <StatCard icon={Send} label="التسليمات" value={kpis.total_submissions} color="teal" />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                 SECTION 2: Student Distribution Stats
                ═══════════════════════════════════════════════════════════════ */}
            <div className="mb-10">
                <SectionHeader icon={GraduationCap} title="توزيع الطلاب" subtitle="توزيع الطلاب حسب القسم والمستوى والفصل" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Per Department */}
                    <div className="glass-card p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-400" />
                            حسب القسم
                        </h3>
                        <DistributionChart data={dist.per_department} color="#60a5fa" />
                    </div>

                    {/* Per Level */}
                    <div className="glass-card p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-green-400" />
                            حسب المستوى الدراسي
                        </h3>
                        <DistributionChart data={dist.per_level} color="#34d399" />
                    </div>

                    {/* Per Semester */}
                    <div className="glass-card p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            حسب الفصل الدراسي
                        </h3>
                        <DistributionChart data={dist.per_semester} color="#a78bfa" />
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                 SECTION 3: Leaderboards & Activity Metrics
                ═══════════════════════════════════════════════════════════════ */}
            <div className="mb-10">
                <SectionHeader icon={Award} title="لوحات المتصدرين" subtitle="الأكثر نشاطاً وتقدماً" />

                {/* Most Active Professors */}
                <div className="glass-card overflow-hidden mb-5">
                    <div className="p-5 border-b border-white/10">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-[var(--color-accent)]" />
                            الأساتذة الأكثر نشاطاً
                        </h3>
                    </div>
                    <LeaderboardTable
                        columns={[
                            { key: 'name', label: 'الأستاذ' },
                            { key: 'subjects_count', label: 'المواد' },
                            { key: 'lectures_count', label: 'المحاضرات' },
                            { key: 'assignments_count', label: 'الواجبات' },
                            { key: 'graded_count', label: 'التصحيحات' },
                        ]}
                        data={lb.active_professors}
                        emptyMsg="لا يوجد أساتذة"
                    />
                </div>

                {/* Most Advanced Subjects */}
                <div className="glass-card overflow-hidden mb-5">
                    <div className="p-5 border-b border-white/10">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-400" />
                            المواد الأكثر تقدماً
                        </h3>
                    </div>
                    <LeaderboardTable
                        columns={[
                            { key: 'name', label: 'المادة', render: (r) => <span>{r.name} <span className="text-xs text-[var(--color-accent)]">({r.code})</span></span> },
                            { key: 'lectures_count', label: 'المحاضرات' },
                            { key: 'department', label: 'القسم' },
                            { key: 'professor', label: 'الأستاذ' },
                            { key: 'assignments_count', label: 'الواجبات' },
                            { key: 'submissions_count', label: 'التسليمات' },
                        ]}
                        data={lb.advanced_subjects}
                        emptyMsg="لا توجد مواد"
                    />
                </div>

                {/* Bottom row: Dept, Level, Semester */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Most Active Department */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-white/10">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-green-400" />
                                الأقسام الأكثر نشاطاً
                            </h3>
                        </div>
                        <LeaderboardTable
                            columns={[
                                { key: 'name', label: 'القسم' },
                                { key: 'subjects', label: 'المواد' },
                                { key: 'lectures', label: 'المحاضرات' },
                            ]}
                            data={lb.active_departments}
                            emptyMsg="لا توجد بيانات"
                        />
                    </div>

                    {/* Most Active Level */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-white/10">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Layers className="w-4 h-4 text-orange-400" />
                                المستويات الأكثر نشاطاً
                            </h3>
                        </div>
                        <LeaderboardTable
                            columns={[
                                { key: 'name', label: 'المستوى' },
                                { key: 'subjects', label: 'المواد' },
                                { key: 'lectures', label: 'المحاضرات' },
                            ]}
                            data={lb.active_levels}
                            emptyMsg="لا توجد بيانات"
                        />
                    </div>

                    {/* Most Active Semester */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-white/10">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-400" />
                                الفصول الأكثر نشاطاً
                            </h3>
                        </div>
                        <LeaderboardTable
                            columns={[
                                { key: 'name', label: 'الفصل' },
                                { key: 'subjects', label: 'المواد' },
                                { key: 'lectures', label: 'المحاضرات' },
                            ]}
                            data={lb.active_semesters}
                            emptyMsg="لا توجد بيانات"
                        />
                    </div>
                </div>
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
