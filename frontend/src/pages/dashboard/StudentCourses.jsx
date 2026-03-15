import { useState, useEffect } from 'react';
import { BookOpen, Clock, User } from 'lucide-react';
import api from '../../services/api';

export default function StudentCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/academic/courses/')
            .then(res => setCourses(res.data.results || res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">موادي الدراسية</h1>
                <p className="text-[var(--color-text-muted)]">عرض جميع المواد المسجلة في هذا الفصل</p>
            </div>

            {courses.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-6">
                    {courses.map((course) => (
                        <div key={course.id} className="glass-card p-6 card-hover">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-7 h-7 text-[var(--color-accent)]" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-sm text-[var(--color-accent)]">{course.code}</span>
                                    <h3 className="text-xl font-semibold mb-2">{course.name_ar}</h3>
                                    <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {course.credit_hours} ساعات
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            الفصل {course.semester}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {course.instructors && course.instructors.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-sm text-[var(--color-text-muted)] mb-2">المدرسون:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {course.instructors.map((inst) => (
                                            <span key={inst.id} className="px-3 py-1 rounded-full bg-white/5 text-sm">
                                                {inst.name} ({inst.role_display})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button className="btn-primary w-full mt-4 justify-center">
                                فتح المادة
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <BookOpen className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد مواد مسجلة</h3>
                    <p className="text-[var(--color-text-muted)]">لم يتم تسجيلك في أي مواد بعد</p>
                </div>
            )}
        </div>
    );
}
