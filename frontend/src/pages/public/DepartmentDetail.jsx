import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, User, Calendar, GraduationCap, ChevronLeft, ArrowRight, Layers, Award } from 'lucide-react';
import api from '../../services/api';

export default function DepartmentDetail() {
    const { id } = useParams();
    const [department, setDepartment] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [courseSearch, setCourseSearch] = useState('');

    useEffect(() => {
        fetchDepartmentAndCourses();
    }, [id]);

    const fetchDepartmentAndCourses = async () => {
        try {
            setLoading(true);

            // 1. Fetch Department Details
            let deptData = null;
            try {
                const deptRes = await api.get(`/academic/departments/${id}/`);
                deptData = deptRes.data;
            } catch (err) {
                console.error('Error fetching department details:', err);
            }

            if (!deptData) {
                setDepartment(null);
                setLoading(false);
                return;
            }

            setDepartment(deptData);

            // 2. Fetch Courses
            try {
                const coursesRes = await api.get(`/academic/courses/?department=${id}`);
                setCourses(coursesRes.data.results || coursesRes.data || []);
            } catch (err) {
                console.error('Error fetching courses:', err);
                setCourses([]);
            }

        } catch (err) {
            console.error('Error in fetchDepartmentAndCourses:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(c =>
        c.name_ar.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(courseSearch.toLowerCase())
    );

    if (loading) {
        return (
            <div className="pt-32 min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!department) {
        return (
            <div className="pt-32 min-h-screen flex items-center justify-center">
                <div className="text-center glass-card p-12 max-w-md">
                    <BookOpen className="w-16 h-16 text-[var(--color-error)] mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">القسم غير موجود</h2>
                    <p className="text-[var(--color-text-muted)] mb-6">نأسف، لم نتمكن من العثور على القسم المطلوب أو أنه غير متاح حالياً.</p>
                    <Link to="/departments" className="btn-accent inline-flex items-center gap-2">
                        <ArrowRight className="w-5 h-5" />
                        العودة للأقسام
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-20 min-h-screen pb-20">
            {/* Header / Hero */}
            <section className="py-16 animated-bg border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link to="/departments" className="inline-flex items-center gap-2 text-[var(--color-accent)] mb-6 hover:underline">
                        <ArrowRight className="w-4 h-4" />
                        العودة للأقسام الأكاديمية
                    </Link>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 text-sm text-[var(--color-accent)] mb-3">
                                <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 font-medium">
                                    قسم أكاديمي
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold mb-4">{department.name_ar}</h1>
                            <p className="text-[var(--color-text-muted)] text-lg max-w-3xl">
                                {department.name}
                            </p>
                        </div>
                        {/* <div className="glass-card px-6 py-4 shrink-0 flex items-center gap-4 bg-white/5 border-white/10">
                            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                                <Layers className="w-6 h-6 text-[var(--color-accent)]" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{courses.length}</div>
                                <div className="text-xs text-[var(--color-text-muted)]">مادة دراسية معتمدة</div>
                            </div>
                        </div> */}
                    </div>
                </div>
            </section>

            {/* Department Body */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Right / Main Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Description Card */}
                            <div className="glass-card p-8">
                                <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-white/10">عن القسم</h2>
                                <p className="text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line text-lg">
                                    {department.description_ar || 'قسم أكاديمي متميز يقدم برامج دراسية وتطبيقية متقدمة تهدف إلى إعداد وتأهيل الطلاب بأحدث المهارات المطلوبة لسوق العمل المحلي والإقليمي.'}
                                </p>
                            </div>

                            {/* Courses List Section */}
                            <div>
                                {/* <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold">المواد الدراسية</h2>
                                        <p className="text-sm text-[var(--color-text-muted)] mt-1">المواد والمناهج المعتمدة في هذا القسم</p>
                                    </div>
                                    <div className="w-full sm:w-72">
                                        <input
                                            type="text"
                                            placeholder="البحث باسم أو رمز المادة..."
                                            className="input-field w-full"
                                            value={courseSearch}
                                            onChange={(e) => setCourseSearch(e.target.value)}
                                        />
                                    </div>
                                </div> */}

                                {/* {filteredCourses.length > 0 ? (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {filteredCourses.map((c) => (
                                            <div key={c.id} className="glass-card p-5 card-hover border border-white/5 hover:border-[var(--color-accent)]/20 transition-all flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start gap-2 mb-3">
                                                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-[var(--color-accent)]">
                                                            {c.code}
                                                        </span>
                                                        <span className="text-xs text-[var(--color-text-muted)]">
                                                            الساعات المعتمدة: {c.credit_hours || 3}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-lg mb-2 text-white">{c.name_ar}</h3>
                                                    {c.name && <p className="text-xs text-[var(--color-text-muted)] mb-4">{c.name}</p>}
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-[var(--color-text-muted)] border-t border-white/5 pt-3 mt-3">
                                                    <span>السنة {c.academic_year || 1}</span>
                                                    <span>الفصل {c.semester || 1}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="glass-card p-12 text-center border border-dashed border-white/10">
                                        <BookOpen className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                                        <p className="text-[var(--color-text-muted)]">لا توجد مواد مطابقة للبحث حالياً.</p>
                                    </div>
                                )} */}
                            </div>
                        </div>

                        {/* Left / Sidebar Info */}
                        <div className="space-y-6">
                            {/* Management details */}
                            <div className="glass-card p-6">
                                <h3 className="font-bold text-lg mb-4 pb-2 border-b border-white/10">إدارة القسم</h3>

                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-[var(--color-primary)]" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-[var(--color-text-muted)]">رئيس القسم</div>
                                            <div className="font-semibold text-sm text-white">{department.department_manager_name || 'لم يحدد بعد'}</div>
                                            {/* {department.department_manager_details?.email && (
                                                <div className="text-xs text-[var(--color-text-muted)]">{department.department_manager_details.email}</div>
                                            )} */}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-light)]/10 flex items-center justify-center shrink-0">
                                            <Award className="w-5 h-5 text-[var(--color-primary-light)]" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-[var(--color-text-muted)]">مشرف القسم</div>
                                            <div className="font-semibold text-sm text-white">{department.supervisor_details?.full_name_ar || 'لم يحدد بعد'}</div>
                                            {/* {department.supervisor_details?.email && (
                                                <div className="text-xs text-[var(--color-text-muted)]">{department.supervisor_details.email}</div>
                                            )} */}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information */}
                            {/* <div className="glass-card p-6 bg-gradient-to-br from-white/[0.02] to-white/[0.01]">
                                <h3 className="font-bold text-lg mb-4 pb-2 border-b border-white/10">معلومات إضافية</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[var(--color-text-muted)]">تاريخ التأسيس:</span>
                                        <span className="text-white">{new Date(department.created_at || Date.now()).toLocaleDateString('ar-SD')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--color-text-muted)]">الاعتماد الأكاديمي:</span>
                                        <span className="text-[var(--color-success)] font-semibold">معتمد بالكامل</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--color-text-muted)]">لغة الدراسة:</span>
                                        <span className="text-white">العربية / الإنجليزية</span>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
