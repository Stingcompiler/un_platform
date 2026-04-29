import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Video, Filter, Search, ChevronLeft, ChevronRight, Play, Paperclip, X,
    BarChart2, BookOpen, FileText, Clock, TrendingUp, Upload, Calendar
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PER_PAGE = 9;

// ── Stat Card ────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
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
        <div className={`glass-card p-5 bg-gradient-to-br border ${colors[color]} group hover:-translate-y-0.5 transition-transform`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${colors[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{label}</p>
            {sub && <p className="text-xs text-[var(--color-text-muted)] mt-1 opacity-60">{sub}</p>}
        </div>
    );
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function TrendChart({ data }) {
    if (!data || data.length === 0) return (
        <div className="flex items-center justify-center h-20 text-[var(--color-text-muted)] text-sm">
            لا توجد بيانات خلال الـ 30 يوم الماضية
        </div>
    );
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="flex items-end gap-1 h-20 w-full">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                        className="w-full rounded-t-sm bg-[var(--color-accent)]/40 group-hover:bg-[var(--color-accent)] transition-colors"
                        style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
                    />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {d.date}: {d.count}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function LecturesPage() {
    const { user } = useAuth();
    const isManager = ['department_manager', 'supervisor'].includes(user?.role);
    const isAdmin = user?.role === 'system_manager';

    const [lectures, setLectures] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [lectureStats, setLectureStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);

    // Filters — dept filter only shown to system_manager
    const [dept, setDept] = useState('');
    const [semester, setSemester] = useState('');
    const [year, setYear] = useState('');
    const [course, setCourse] = useState('');
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
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
            // Only load all departments for system_manager
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

    const visibleCourses = useMemo(() => courses.filter(c => {
        if (dept && String(c.department) !== dept) return false;
        if (semester && String(c.semester) !== semester) return false;
        if (year && String(c.academic_year) !== year) return false;
        return true;
    }), [courses, dept, semester, year]);

    const vcIds = useMemo(() => new Set(visibleCourses.map(c => String(c.id))), [visibleCourses]);

    const filtered = useMemo(() => lectures.filter(l => {
        if (course && String(l.course) !== course) return false;
        if (!course && (dept || semester || year) && !vcIds.has(String(l.course))) return false;
        if (type && l.lecture_type !== type) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!(l.title_ar || '').toLowerCase().includes(q) &&
                !(l.title || '').toLowerCase().includes(q) &&
                !(l.course_name || '').toLowerCase().includes(q)) return false;
        }
        return true;
    }), [lectures, course, dept, semester, year, vcIds, type, search]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const years = [...new Set(courses.map(c => c.academic_year))].sort();
    const semesters = [...new Set(courses.map(c => c.semester))].sort();
    const activeCount = [dept, semester, year, course, search, type].filter(Boolean).length;

    const reset = () => { setDept(''); setSemester(''); setYear(''); setCourse(''); setSearch(''); setType(''); setPage(1); };
    const go = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    if (loading) return <div className="flex justify-center py-20"><div className="spinner"></div></div>;

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">المحاضرات</h1>
                <p className="text-[var(--color-text-muted)]">
                    {isAdmin
                        ? 'تصفح وفلترة جميع المحاضرات حسب القسم والسنة والفصل والمادة'
                        : isManager
                        ? 'محاضرات قسمك — مرتبة حسب الفلاتر المحددة'
                        : 'محاضراتي المرتبطة بالمواد المعينة'}
                </p>
            </div>

            {/* ── Statistics Section ──────────────────────────────────────────── */}
            {!statsLoading && lectureStats && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 className="w-5 h-5 text-[var(--color-accent)]" />
                        <h2 className="font-semibold text-lg">إحصائيات المحاضرات</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
                        <StatCard icon={Video} label="إجمالي المحاضرات" value={lectureStats.total_lectures} color="accent" />
                        <StatCard icon={FileText} label="ملفات مرفقة" value={lectureStats.total_files} color="blue" />
                        <StatCard icon={Play} label="محاضرات بفيديو" value={lectureStats.total_videos} color="purple" />
                        <StatCard icon={BookOpen} label="مواد بمحاضرات" value={lectureStats.courses_with_lectures} sub={`من ${lectureStats.total_courses} مادة`} color="green" />
                        <StatCard icon={Upload} label="رفع خلال 7 أيام" value={lectureStats.recent_uploads} color="orange" />
                        <StatCard icon={Clock} label="آخر رفع" value={lectureStats.last_upload || '—'} color="pink" />
                    </div>

                    {/* Type breakdown + trend */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        {/* Theory vs Lab */}
                        <div className="glass-card p-5">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-[var(--color-accent)]" />
                                توزيع أنواع المحاضرات
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-blue-400">نظري</span>
                                        <span className="text-[var(--color-text-muted)]">{lectureStats.theory_count}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/10">
                                        <div
                                            className="h-2 rounded-full bg-blue-500 transition-all"
                                            style={{ width: lectureStats.total_lectures ? `${(lectureStats.theory_count / lectureStats.total_lectures) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-green-400">عملي</span>
                                        <span className="text-[var(--color-text-muted)]">{lectureStats.lab_count}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/10">
                                        <div
                                            className="h-2 rounded-full bg-green-500 transition-all"
                                            style={{ width: lectureStats.total_lectures ? `${(lectureStats.lab_count / lectureStats.total_lectures) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                                {lectureStats.courses_without_lectures > 0 && (
                                    <p className="text-xs text-orange-400 mt-2">
                                        ⚠ {lectureStats.courses_without_lectures} مادة بدون محاضرات
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Upload trend chart */}
                        <div className="glass-card p-5">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
                                نشاط الرفع — آخر 30 يوماً
                                <span className="text-xs text-[var(--color-text-muted)] mr-auto">
                                    <Calendar className="w-3 h-3 inline ml-1" />
                                    {lectureStats.recent_uploads} في آخر 7 أيام
                                </span>
                            </h3>
                            <TrendChart data={lectureStats.upload_trends} />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
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

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                    <div className="lg:col-span-1 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input type="text" className="input-field pr-10" placeholder="ابحث عن محاضرة..."
                            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>

                    {/* Department filter — system_manager only */}
                    {isAdmin && (
                        <select className="input-field" value={dept} onChange={e => { setDept(e.target.value); setCourse(''); setPage(1); }}>
                            <option value="">جميع الأقسام</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
                        </select>
                    )}

                    <select className="input-field" value={year} onChange={e => { setYear(e.target.value); setCourse(''); setPage(1); }}>
                        <option value="">جميع السنوات</option>
                        {years.map(y => <option key={y} value={y}>السنة {y}</option>)}
                    </select>
                    <select className="input-field" value={semester} onChange={e => { setSemester(e.target.value); setCourse(''); setPage(1); }}>
                        <option value="">جميع الفصول</option>
                        {semesters.map(s => <option key={s} value={s}>الفصل {s}</option>)}
                    </select>
                    <select className="input-field" value={course} onChange={e => { setCourse(e.target.value); setPage(1); }}>
                        <option value="">جميع المواد</option>
                        {(dept || year || semester ? visibleCourses : courses).map(c => (
                            <option key={c.id} value={c.id}>{c.name_ar} ({c.code})</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        {[['', 'الكل'], ['theory', 'نظري'], ['lab', 'عملي']].map(([v, l]) => (
                            <button key={v} onClick={() => { setType(v); setPage(1); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === v ? 'bg-[var(--color-accent)] text-[var(--color-bg)]' : 'bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)]'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-[var(--color-text-muted)]">
                    {filtered.length === 0 ? 'لا توجد نتائج' : `عرض ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} من ${filtered.length} محاضرة`}
                </p>
                {totalPages > 1 && <p className="text-sm text-[var(--color-text-muted)]">صفحة {page} من {totalPages}</p>}
            </div>

            {/* Grid */}
            {paginated.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {paginated.map(l => <LectureCard key={l.id} lecture={l} />)}
                </div>
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

function LectureCard({ lecture }) {
    const isTheory = lecture.lecture_type === 'theory';
    return (
        <Link to={`/dashboard/lecture/${lecture.id}`}
            className="glass-card p-5 flex flex-col hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 group">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${isTheory ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                    <Video className={`w-6 h-6 ${isTheory ? 'text-blue-400' : 'text-green-400'}`} />
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isTheory ? 'bg-blue-500/15 text-blue-400' : 'bg-green-500/15 text-green-400'}`}>
                    {isTheory ? 'نظري' : 'عملي'}
                </span>
            </div>
            <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
                {lecture.title_ar || lecture.title}
            </h3>
            <p className="text-sm text-[var(--color-accent)]/80 mb-2 line-clamp-1">{lecture.course_name || '—'}</p>
            <p className="text-sm text-[var(--color-text-muted)] line-clamp-3 flex-1 mb-4">{lecture.content || 'لا يوجد وصف'}</p>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex gap-1.5">
                    {(lecture.video_file || lecture.video_url) && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                            <Play className="w-2.5 h-2.5" />فيديو
                        </span>
                    )}
                    {lecture.file && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                            <Paperclip className="w-2.5 h-2.5" />ملف
                        </span>
                    )}
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">م. {lecture.order}</span>
            </div>
        </Link>
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
