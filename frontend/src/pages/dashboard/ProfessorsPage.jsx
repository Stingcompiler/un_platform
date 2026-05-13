import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Search, X, ChevronLeft, ChevronRight,
    Building2, FlaskConical, BookMarked, Hash, GraduationCap,
    Calendar, FileText, AlertCircle, Eye
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PER_PAGE = 15;
const TAB_ALL  = 'all';
const TAB_DEPT = 'dept';

export default function ProfessorsPage() {
    const { user } = useAuth();
    const navigate  = useNavigate();
    const isAdmin   = user?.role === 'system_manager';
    const isManager = ['department_manager', 'supervisor'].includes(user?.role);

    const [professors,   setProfessors]   = useState([]);
    const [departments,  setDepartments]  = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [activeTab,    setActiveTab]    = useState(TAB_ALL);
    const [deptFilter,   setDeptFilter]   = useState('');
    const [search,       setSearch]       = useState('');
    const [page,         setPage]         = useState(1);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const promises = [api.get('/academic/professors/')];
            if (isAdmin) promises.push(api.get('/academic/departments/'));
            const results = await Promise.all(promises);
            setProfessors(results[0].data || []);
            if (isAdmin && results[1])
                setDepartments(results[1].data.results || results[1].data || []);
        } catch (e) {
            console.error('Error loading professors:', e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        let data = professors;

        // Tab 2 dept filter for admins
        if (activeTab === TAB_DEPT && isAdmin && deptFilter) {
            const deptName = departments.find(d => String(d.id) === deptFilter)?.name_ar || '';
            data = data.filter(p => p.department_name?.includes(deptName));
        }

        // Text search
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.department_name?.toLowerCase().includes(q) ||
                p.assigned_subjects?.some(s => s.toLowerCase().includes(q))
            );
        }
        return data;
    }, [professors, activeTab, deptFilter, search, departments, isAdmin]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const switchTab = (tab) => { setActiveTab(tab); setPage(1); setSearch(''); setDeptFilter(''); };
    const go        = (p)   => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const openDetail = (id) => navigate(`/dashboard/professors/${id}`);

    if (loading) return (
        <div className="flex justify-center py-20"><div className="spinner"></div></div>
    );

    const TABS = [
        { id: TAB_ALL,  label: 'جميع الأساتذة', icon: Users,     reportLabel: 'Report Type: Details of Teachers Found Now' },
        { id: TAB_DEPT, label: 'أساتذة القسم',   icon: Building2, reportLabel: 'Report Type: Teachers Related to This Department' },
    ];
    const currentTab = TABS.find(t => t.id === activeTab);
    const deptBadge  = isManager && user?.department ? user.department.name_ar : null;

    return (
        <div>
            {/* ── Page Header ───────────────────────────────────── */}
            <div className="mb-8 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">الأساتذة</h1>
                    <p className="text-[var(--color-text-muted)]">
                        {isAdmin ? 'إدارة وتصفح جميع الأساتذة في الجامعة' : 'أساتذة القسم والمواد المعينة لهم'}
                    </p>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────── */}
            <div className="flex gap-1 mb-5 p-1 glass-card rounded-xl">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => switchTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            activeTab === tab.id
                                ? 'bg-[var(--color-accent)] text-[var(--color-bg)] shadow-md'
                                : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Report Type Banner ───────────────────────────── */}
            <div className="mb-5 px-4 py-2.5 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center flex-wrap gap-x-3 gap-y-1">
                <FileText className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                <span className="text-sm font-semibold text-[var(--color-accent)]">
                    {currentTab?.reportLabel}
                </span>
                {activeTab === TAB_DEPT && deptBadge && (
                    <span className="text-sm text-[var(--color-text-muted)]">— {deptBadge}</span>
                )}
            </div>

            {/* ── Dept selector (Admin, Tab 2 only) ───────────── */}
            {isAdmin && activeTab === TAB_DEPT && (
                <div className="mb-5">
                    <select
                        className="input-field"
                        value={deptFilter}
                        onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">— اختر القسم للتصفية —</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name_ar}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* ── Search ───────────────────────────────────────── */}
            <div className="glass-card p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold flex items-center gap-2 text-sm">
                        <Search className="w-4 h-4 text-[var(--color-accent)]" />
                        البحث في الأساتذة
                    </span>
                    {search && (
                        <button
                            onClick={() => { setSearch(''); setPage(1); }}
                            className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                        >
                            <X className="w-3 h-3" /> مسح
                        </button>
                    )}
                </div>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        className="input-field pr-10"
                        placeholder="ابحث باسم الأستاذ، القسم، أو المادة... ثم اضغط على العين لعرض التفاصيل"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                {/* Search hint: show detail link when exactly one result */}
                {search.trim() && filtered.length === 1 && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="text-[var(--color-text-muted)]">تم العثور على نتيجة واحدة —</span>
                        <button
                            onClick={() => openDetail(filtered[0].id)}
                            className="flex items-center gap-1.5 text-[var(--color-accent)] hover:underline font-medium"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            عرض تفاصيل {filtered[0].name}
                        </button>
                    </div>
                )}
            </div>

            {/* ── Count summary ────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--color-text-muted)]">
                    {filtered.length === 0
                        ? 'لا توجد نتائج'
                        : `عرض ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} من ${filtered.length} أستاذ`}
                </p>
                {totalPages > 1 && (
                    <p className="text-sm text-[var(--color-text-muted)]">صفحة {page} من {totalPages}</p>
                )}
            </div>

            {/* ── Table / Cards ────────────────────────────────── */}
            {paginated.length > 0 ? (
                <>
                    {/* Desktop Table */}
                    <div className="glass-card overflow-hidden hidden sm:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">
                                            اسم الأستاذ
                                        </th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">
                                            تفاصيل القسم
                                        </th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">
                                            <span className="flex items-center gap-1.5">
                                                <Hash className="w-3.5 h-3.5 text-purple-400" />
                                                عدد المواد
                                            </span>
                                        </th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">
                                            <span className="flex items-center gap-1.5">
                                                <FlaskConical className="w-3.5 h-3.5 text-orange-400" />
                                                محاضرات عملية
                                            </span>
                                        </th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">
                                            <span className="flex items-center gap-1.5">
                                                <BookMarked className="w-3.5 h-3.5 text-blue-400" />
                                                محاضرات نظرية
                                            </span>
                                        </th>
                                        <th className="text-center p-4 font-semibold text-[var(--color-text-muted)] w-16">
                                            تفاصيل
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginated.map(prof => (
                                        <tr key={prof.id} className="hover:bg-white/[0.04] transition-colors">
                                            {/* Teacher Name */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/25 to-blue-500/25 flex items-center justify-center shrink-0">
                                                        <Users className="w-4 h-4 text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{prof.name}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)] font-mono">#{prof.id}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Department Details */}
                                            <td className="p-4">
                                                <div className="space-y-1.5">
                                                    <span className="flex items-center gap-1.5 text-sm font-medium">
                                                        <Building2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                                                        {prof.department_name || '—'}
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {prof.study_years?.map(y => (
                                                            <span key={y} className="px-1.5 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 flex items-center gap-0.5">
                                                                <GraduationCap className="w-2.5 h-2.5" /> {y}
                                                            </span>
                                                        ))}
                                                        {prof.semesters?.map(s => (
                                                            <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-green-500/10 text-green-400 flex items-center gap-0.5">
                                                                <Calendar className="w-2.5 h-2.5" /> ف{s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Courses Number */}
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 font-bold text-base">
                                                    {prof.courses_count ?? prof.assigned_subjects?.length ?? 0}
                                                </span>
                                            </td>

                                            {/* Practical */}
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 font-semibold">
                                                    <FlaskConical className="w-3.5 h-3.5" />
                                                    {prof.practical_count ?? 0}
                                                </span>
                                            </td>

                                            {/* Theoretical */}
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-semibold">
                                                    <BookMarked className="w-3.5 h-3.5" />
                                                    {prof.theoretical_count ?? 0}
                                                </span>
                                            </td>

                                            {/* Eye / Detail Action */}
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => openDetail(prof.id)}
                                                    title="عرض تفاصيل الأستاذ"
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 hover:scale-110 transition-all duration-200"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3">
                        {paginated.map(prof => (
                            <div key={prof.id} className="glass-card p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                                        <Users className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{prof.name}</p>
                                        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> {prof.department_name || '—'}
                                        </p>
                                    </div>
                                    {/* Eye icon on mobile */}
                                    <button
                                        onClick={() => openDetail(prof.id)}
                                        title="عرض تفاصيل الأستاذ"
                                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-all shrink-0"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                                    <div>
                                        <p className="text-xs text-[var(--color-text-muted)] mb-1">عدد المواد</p>
                                        <p className="font-bold text-purple-400 text-lg">
                                            {prof.courses_count ?? prof.assigned_subjects?.length ?? 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-orange-400 mb-1">عملية</p>
                                        <p className="font-bold text-orange-400 text-lg">{prof.practical_count ?? 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-400 mb-1">نظرية</p>
                                        <p className="font-bold text-blue-400 text-lg">{prof.theoretical_count ?? 0}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1 pt-1">
                                    {prof.study_years?.map(y => (
                                        <span key={y} className="px-1.5 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400">السنة {y}</span>
                                    ))}
                                    {prof.semesters?.map(s => (
                                        <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-green-500/10 text-green-400">ف{s}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="glass-card p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-[var(--color-text-muted)]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">لا يوجد أساتذة</h3>
                    <p className="text-[var(--color-text-muted)] mb-4">
                        {activeTab === TAB_DEPT && isAdmin && !deptFilter
                            ? 'اختر قسماً من القائمة لعرض أساتذته'
                            : 'لا يوجد أساتذة يطابقون الفلاتر المحددة'}
                    </p>
                    {search && (
                        <button onClick={() => { setSearch(''); setPage(1); }} className="btn-accent">
                            <X className="w-4 h-4" /> مسح البحث
                        </button>
                    )}
                </div>
            )}

            {/* ── Pagination ───────────────────────────────────── */}
            {totalPages > 1 && <Pagination current={page} total={totalPages} onChange={go} />}
        </div>
    );
}

/* ── Pagination ─────────────────────────────────────────────────────── */
function PaginationBtn({ p, current, onChange }) {
    return (
        <button
            onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                p === current
                    ? 'bg-[var(--color-accent)] text-[var(--color-bg)] shadow-md'
                    : 'hover:bg-white/10 text-[var(--color-text-muted)]'
            }`}
        >
            {p}
        </button>
    );
}

function Pagination({ current, total, onChange }) {
    let start = Math.max(1, current - 2);
    let end   = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    return (
        <div className="flex items-center justify-center gap-1.5 mt-10">
            <button onClick={() => onChange(current - 1)} disabled={current === 1}
                className="p-2.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-5 h-5" />
            </button>
            {start > 1 && <><PaginationBtn p={1} current={current} onChange={onChange} />{start > 2 && <span className="text-[var(--color-text-muted)]">...</span>}</>}
            {pages.map(p => <PaginationBtn key={p} p={p} current={current} onChange={onChange} />)}
            {end < total && <>{end < total - 1 && <span className="text-[var(--color-text-muted)]">...</span>}<PaginationBtn p={total} current={current} onChange={onChange} /></>}
            <button onClick={() => onChange(current + 1)} disabled={current === total}
                className="p-2.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-5 h-5" />
            </button>
        </div>
    );
}
