import { useState, useEffect, useMemo } from 'react';
import {
    Users, Search, Filter, X, ChevronLeft, ChevronRight,
    BookOpen, GraduationCap, Calendar
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PER_PAGE = 15;

export default function ProfessorsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'system_manager';
    const isManager = ['department_manager', 'supervisor'].includes(user?.role);

    const [professors, setProfessors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [dept, setDept] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const promises = [api.get('/academic/professors/')];
            if (isAdmin) {
                promises.push(api.get('/academic/departments/'));
            }
            const results = await Promise.all(promises);
            setProfessors(results[0].data || []);
            if (isAdmin && results[1]) {
                setDepartments(results[1].data.results || results[1].data || []);
            }
        } catch (e) {
            console.error('Error loading professors:', e);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering on the already-loaded data
    const filtered = useMemo(() => {
        let data = professors;
        if (dept) {
            data = data.filter(p => p.department_name?.includes(
                departments.find(d => String(d.id) === dept)?.name_ar || ''
            ));
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.assigned_subjects?.some(s => s.toLowerCase().includes(q))
            );
        }
        return data;
    }, [professors, dept, search, departments]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const activeCount = [dept, search].filter(Boolean).length;

    const reset = () => { setDept(''); setSearch(''); setPage(1); };
    const go = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    if (loading) return (
        <div className="flex justify-center py-20"><div className="spinner"></div></div>
    );

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">الأساتذة</h1>
                        <p className="text-[var(--color-text-muted)]">
                            {isAdmin
                                ? 'إدارة وتصفح جميع الأساتذة في الجامعة'
                                : 'أساتذة القسم والمواد المعينة لهم'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Dept context banner for managers */}
            {isManager && user?.department && (
                <div className="mb-4 px-4 py-2 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-sm flex items-center gap-2">
                    <span className="text-[var(--color-accent)] font-medium">القسم:</span>
                    <span>{user.department.name_ar}</span>
                    <span className="text-[var(--color-text-muted)] text-xs mr-auto">البيانات مقيدة بقسمك فقط</span>
                </div>
            )}

            {/* Filters */}
            <div className="glass-card p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[var(--color-accent)]" />
                        البحث والفلاتر
                        {activeCount > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-bold">{activeCount}</span>
                        )}
                    </span>
                    {activeCount > 0 && (
                        <button onClick={reset} className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors">
                            <X className="w-3 h-3" /> مسح الكل
                        </button>
                    )}
                </div>

                <div className={`grid gap-3 ${isAdmin ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
                    {/* Search bar */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            className="input-field pr-10"
                            placeholder="ابحث باسم الأستاذ..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    {/* Department filter — system_manager only */}
                    {isAdmin && (
                        <select
                            className="input-field"
                            value={dept}
                            onChange={e => { setDept(e.target.value); setPage(1); }}
                        >
                            <option value="">جميع الأقسام</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name_ar}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-[var(--color-text-muted)]">
                    {filtered.length === 0
                        ? 'لا توجد نتائج'
                        : `عرض ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} من ${filtered.length} أستاذ`
                    }
                </p>
                {totalPages > 1 && (
                    <p className="text-sm text-[var(--color-text-muted)]">صفحة {page} من {totalPages}</p>
                )}
            </div>

            {/* Table */}
            {paginated.length > 0 ? (
                <>
                    {/* Desktop Table */}
                    <div className="glass-card overflow-hidden hidden sm:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">ID</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">اسم الأستاذ</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">المواد المعينة</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">السنوات الدراسية</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">الفصول</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)]">القسم</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginated.map(prof => (
                                        <tr key={prof.id} className="hover:bg-white/4 transition-colors">
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-mono font-medium">
                                                    {prof.id}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                                                        <Users className="w-4 h-4 text-purple-400" />
                                                    </div>
                                                    <span>{prof.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1 max-w-[300px]">
                                                    {prof.assigned_subjects?.length > 0 ? (
                                                        prof.assigned_subjects.map((s, i) => (
                                                            <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)] whitespace-nowrap">
                                                                {s}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[var(--color-text-muted)] text-xs">لا يوجد</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {prof.study_years?.map(y => (
                                                        <span key={y} className="px-2 py-0.5 rounded-md text-xs bg-blue-500/10 text-blue-400 flex items-center gap-1">
                                                            <GraduationCap className="w-3 h-3" /> السنة {y}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {prof.semesters?.map(s => (
                                                        <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-green-500/10 text-green-400 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> الفصل {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-[var(--color-text-muted)]">
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    {prof.department_name || '—'}
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
                        {paginated.map(prof => (
                            <div key={prof.id} className="glass-card p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                                        <Users className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{prof.name}</p>
                                        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" /> {prof.department_name || '—'}
                                        </p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-mono">#{prof.id}</span>
                                </div>

                                {/* Subjects */}
                                {prof.assigned_subjects?.length > 0 && (
                                    <div>
                                        <p className="text-xs text-[var(--color-text-muted)] mb-1">المواد المعينة</p>
                                        <div className="flex flex-wrap gap-1">
                                            {prof.assigned_subjects.map((s, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Years & Semesters */}
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                                    {prof.study_years?.map(y => (
                                        <span key={y} className="px-2 py-0.5 rounded-md text-xs bg-blue-500/10 text-blue-400">السنة {y}</span>
                                    ))}
                                    {prof.semesters?.map(s => (
                                        <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-green-500/10 text-green-400">الفصل {s}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="glass-card p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-[var(--color-text-muted)]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">لا يوجد أساتذة</h3>
                    <p className="text-[var(--color-text-muted)] mb-4">لا يوجد أساتذة يطابقون الفلاتر المحددة</p>
                    {activeCount > 0 && (
                        <button onClick={reset} className="btn-accent">
                            <X className="w-4 h-4" /> مسح الفلاتر
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && <Pagination current={page} total={totalPages} onChange={go} />}
        </div>
    );
}

function PaginationBtn({ p, current, onChange }) {
    return (
        <button
            onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${p === current ? 'bg-[var(--color-accent)] text-[var(--color-bg)] shadow-md' : 'hover:bg-white/10 text-[var(--color-text-muted)]'}`}
        >
            {p}
        </button>
    );
}

function Pagination({ current, total, onChange }) {
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
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
