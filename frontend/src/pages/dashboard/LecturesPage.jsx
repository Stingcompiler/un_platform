import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Video, Filter, Search, ChevronLeft, ChevronRight, X,
    BookOpen, FileText, Play, BarChart2, Upload, Clock, TrendingUp, Calendar, Layers
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PER_PAGE = 20;

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'accent', sub }) {
    const colors = {
        accent: 'from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 border-[var(--color-accent)]/30 text-[var(--color-accent)]',
        blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
        green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
        purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
        orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400',
        pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400',
    };
    return (
        <div className={`glass-card p-4 bg-gradient-to-br border ${colors[color]} group hover:-translate-y-0.5 transition-transform`}>
            <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${colors[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <p className="text-xl font-bold text-white">{value ?? '—'}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{label}</p>
            {sub && <p className="text-xs text-[var(--color-text-muted)] mt-0.5 opacity-60">{sub}</p>}
        </div>
    );
}

export default function LecturesPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'system_manager';
    const isManager = ['department_manager', 'supervisor'].includes(user?.role);
    const isProfessor = ['teacher', 'ta'].includes(user?.role);

    const [lectures, setLectures] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [lectureStats, setLectureStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);

    // Role-based filters
    const [dept, setDept] = useState('');
    const [level, setLevel] = useState('');
    const [semester, setSemester] = useState('');
    const [subjectSearch, setSubjectSearch] = useState('');
    const [lectureSearch, setLectureSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        load();
        loadStats();
    }, []);

    const load = async () => {
        try {
            const promises = [
                api.get('/academic/courses/'),
                api.get('/academic/lectures/'),
            ];
            if (isAdmin) {
                promises.unshift(api.get('/academic/departments/'));
            }

            if (isAdmin) {
                const [d, c, l] = await Promise.all(promises);
                setDepartments(d.data.results || d.data);
                setCourses(c.data.results || c.data);
                setLectures(l.data.results || l.data);
            } else {
                const [c, l] = await Promise.all(promises);
                setCourses(c.data.results || c.data);
                setLectures(l.data.results || l.data);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadStats = async () => {
        try {
            const res = await api.get('/academic/lecture-stats/');
            setLectureStats(res.data);
        } catch (e) { console.error(e); }
        finally { setStatsLoading(false); }
    };

    // Build a map for course ID -> course details
    const courseMap = useMemo(() => {
        const m = {};
        courses.forEach(c => { m[c.id] = c; });
        return m;
    }, [courses]);

    // Count lectures per course
    const courseLectureCounts = useMemo(() => {
        const counts = {};
        lectures.forEach(l => {
            if (l.course) {
                counts[l.course] = (counts[l.course] || 0) + 1;
            }
        });
        return counts;
    }, [lectures]);

    // Enrich lectures with course data
    const enrichedLectures = useMemo(() => lectures.map(l => {
        const c = courseMap[l.course] || {};
        return {
            ...l,
            subject_id: c.code || '—',
            subject_name: c.name_ar || l.course_name || '—',
            subject_type: l.lecture_type === 'theory' ? 'نظري' : l.lecture_type === 'lab' ? 'عملي' : '—',
            level: c.academic_year || '—',
            semester_val: c.semester || '—',
            professor_name: c.instructors?.map(i => i.name).join(', ') || l.created_by_name || '—',
            department_id: c.department,
            subject_lecture_count: courseLectureCounts[l.course] || 0,
        };
    }), [lectures, courseMap, courseLectureCounts]);

    // Filtered results
    const filtered = useMemo(() => enrichedLectures.filter(l => {
        if (dept && String(l.department_id) !== dept) return false;
        if (level && String(l.level) !== level) return false;
        if (semester && String(l.semester_val) !== semester) return false;
        if (subjectSearch) {
            const q = subjectSearch.toLowerCase();
            if (!l.subject_name.toLowerCase().includes(q) &&
                !l.subject_id.toLowerCase().includes(q)) return false;
        }
        // Lecture title search — not available for professors
        if (lectureSearch && !isProfessor) {
            const q = lectureSearch.toLowerCase();
            if (!(l.title_ar || '').toLowerCase().includes(q) &&
                !(l.title || '').toLowerCase().includes(q)) return false;
        }
        return true;
    }), [enrichedLectures, dept, level, semester, subjectSearch, lectureSearch, isProfessor]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const activeCount = [dept, level, semester, subjectSearch, lectureSearch].filter(Boolean).length;

    const reset = () => { setDept(''); setLevel(''); setSemester(''); setSubjectSearch(''); setLectureSearch(''); setPage(1); };

    const go = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    if (loading) return <div className="flex justify-center py-20"><div className="spinner"></div></div>;

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">المحاضرات</h1>
                        <p className="text-[var(--color-text-muted)]">
                            {isAdmin
                                ? 'تصفح وفلترة جميع المحاضرات حسب القسم والمستوى والفصل'
                                : isManager
                                    ? 'محاضرات قسمك — مرتبة حسب الفلاتر المحددة'
                                    : 'محاضراتي المرتبطة بالمواد المعينة'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Quick Stats (condensed) ───────────────────────────────────── */}
            {!statsLoading && lectureStats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <StatCard icon={Video} label="إجمالي المحاضرات" value={lectureStats.total_lectures} color="accent" />
                    <StatCard icon={FileText} label="ملفات مرفقة" value={lectureStats.total_files} color="blue" />
                    <StatCard icon={Play} label="محاضرات بفيديو" value={lectureStats.total_videos} color="purple" />
                    <StatCard icon={BookOpen} label="مواد بمحاضرات" value={lectureStats.courses_with_lectures} sub={`من ${lectureStats.total_courses}`} color="green" />
                    <StatCard icon={Upload} label="رفع (7 أيام)" value={lectureStats.recent_uploads} color="orange" />
                    <StatCard icon={Clock} label="آخر رفع" value={lectureStats.last_upload || '—'} color="pink" />
                </div>
            )}

            {/* ── Dept context banner for managers ─────────────────────────── */}
            {isManager && user?.department && (
                <div className="mb-4 px-4 py-2 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-sm flex items-center gap-2">
                    <span className="text-[var(--color-accent)] font-medium">القسم:</span>
                    <span>{user.department.name_ar}</span>
                    <span className="text-[var(--color-text-muted)] text-xs mr-auto">البيانات مقيدة بقسمك فقط</span>
                </div>
            )}

            {/* ── Filters ──────────────────────────────────────────────────── */}
            <div className="glass-card p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[var(--color-accent)]" />
                        الفلاتر
                        {activeCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-bold">{activeCount}</span>}
                    </span>
                    {activeCount > 0 && (
                        <button onClick={reset} className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors">
                            <X className="w-3 h-3" /> مسح الكل
                        </button>
                    )}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Subject Name Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input type="text" className="input-field pr-10" placeholder="ابحث باسم المادة..."
                            value={subjectSearch} onChange={e => { setSubjectSearch(e.target.value); setPage(1); }} />
                    </div>

                    {/* Lecture Title Search — hidden from professor */}
                    {!isProfessor && (
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                            <input type="text" className="input-field pr-10" placeholder="ابحث بعنوان المحاضرة..."
                                value={lectureSearch} onChange={e => { setLectureSearch(e.target.value); setPage(1); }} />
                        </div>
                    )}

                    {/* Department filter — system_manager only */}
                    {isAdmin && (
                        <select className="input-field" value={dept} onChange={e => { setDept(e.target.value); setPage(1); }}>
                            <option value="">جميع الأقسام</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
                        </select>
                    )}

                    {/* Level (1-5) */}
                    <select className="input-field" value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}>
                        <option value="">جميع المستويات</option>
                        {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>المستوى {y}</option>)}
                    </select>

                    {/* Semester (1-10) */}
                    <select className="input-field" value={semester} onChange={e => { setSemester(e.target.value); setPage(1); }}>
                        <option value="">جميع الفصول</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <option key={s} value={s}>الفصل {s}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-[var(--color-text-muted)]">
                    {filtered.length === 0 ? 'لا توجد نتائج' : `عرض ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} من ${filtered.length} محاضرة`}
                </p>
                {totalPages > 1 && <p className="text-sm text-[var(--color-text-muted)]">صفحة {page} من {totalPages}</p>}
            </div>

            {/* ── Data Table (Desktop) ─────────────────────────────────────── */}
            {paginated.length > 0 ? (
                <>
                    <div className="glass-card overflow-hidden hidden sm:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)] whitespace-nowrap">رمز المادة</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)] whitespace-nowrap">اسم المادة</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)] whitespace-nowrap">النوع</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)] whitespace-nowrap">المستوى</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)] whitespace-nowrap">الفصل</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)] whitespace-nowrap">المحاضرات</th>
                                        <th className="text-right p-4 font-semibold text-[var(--color-text-muted)] whitespace-nowrap">الأستاذ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginated.map(l => (
                                        <tr key={l.id} className="hover:bg-white/4 transition-colors group cursor-pointer">
                                            <td className="p-4">
                                                <Link to={`/dashboard/lecture/${l.id}`} className="block">
                                                    <span className="px-2 py-1 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono font-medium">
                                                        {l.subject_id}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                <Link to={`/dashboard/lecture/${l.id}`} className="block">
                                                    <p className="font-medium group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">{l.subject_name}</p>
                                                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-1 mt-0.5">{l.title_ar || l.title || '—'}</p>
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${l.lecture_type === 'theory'
                                                    ? 'bg-blue-500/15 text-blue-400'
                                                    : l.lecture_type === 'lab'
                                                        ? 'bg-green-500/15 text-green-400'
                                                        : 'bg-white/10 text-[var(--color-text-muted)]'
                                                    }`}>
                                                    {l.subject_type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[var(--color-text-muted)]">
                                                <span className="flex items-center gap-1">
                                                    <Layers className="w-3.5 h-3.5" /> {l.level}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[var(--color-text-muted)]">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" /> {l.semester_val}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[var(--color-text-muted)]">
                                                <span className="flex items-center gap-1">
                                                    <Video className="w-3.5 h-3.5" /> {l.subject_lecture_count}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[var(--color-text-muted)]">
                                                <span className="line-clamp-1">{l.professor_name}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Mobile Cards ──────────────────────────────────────── */}
                    <div className="sm:hidden space-y-3">
                        {paginated.map(l => (
                            <Link key={l.id} to={`/dashboard/lecture/${l.id}`}
                                className="glass-card p-4 block hover:bg-white/5 transition-all active:scale-[0.98]">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono">{l.subject_id}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.lecture_type === 'theory' ? 'bg-blue-500/15 text-blue-400' : 'bg-green-500/15 text-green-400'}`}>
                                            {l.subject_type}
                                        </span>
                                    </div>
                                    <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                        <Layers className="w-3 h-3" /> {l.level} • <Calendar className="w-3 h-3" /> {l.semester_val}
                                    </span>
                                </div>
                                <p className="font-semibold mb-1">{l.subject_name}</p>
                                <p className="text-xs text-[var(--color-text-muted)] mb-2 line-clamp-1">{l.title_ar || l.title || '—'}</p>
                                <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 pt-2 border-t border-white/10">
                                    <BookOpen className="w-3 h-3" /> {l.professor_name}
                                    <span className="mx-1">•</span>
                                    <Video className="w-3 h-3" /> {l.subject_lecture_count} محاضرات
                                </p>
                            </Link>
                        ))}
                    </div>
                </>
            ) : (
                <div className="glass-card p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center mx-auto mb-4">
                        <Video className="w-10 h-10 text-[var(--color-text-muted)]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">لا توجد محاضرات</h3>
                    <p className="text-[var(--color-text-muted)] mb-4">لا توجد محاضرات تطابق الفلاتر المحددة</p>
                    {activeCount > 0 && <button onClick={reset} className="btn-accent"><X className="w-4 h-4" />مسح الفلاتر</button>}
                </div>
            )}

            {totalPages > 1 && <Pagination current={page} total={totalPages} onChange={go} />}
        </div>
    );
}

function PaginationBtn({ p, current, onChange }) {
    return (
        <button onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${p === current ? 'bg-[var(--color-accent)] text-[var(--color-bg)] shadow-md' : 'hover:bg-white/10 text-[var(--color-text-muted)]'}`}>
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
