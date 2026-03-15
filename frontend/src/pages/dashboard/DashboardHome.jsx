import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, FileText, Award, Clock, Calendar, TrendingUp, Users, MessageSquare } from 'lucide-react';
import api from '../../services/api';

export default function DashboardHome() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/academic/dashboard-stats/');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWelcomeMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'صباح الخير';
        if (hour < 18) return 'مساء الخير';
        return 'مساء الخير';
    };

    const getStatsDisplay = () => {
        if (!stats) return [];

        switch (user?.role) {
            case 'student':
                return [
                    { icon: BookOpen, label: 'المواد المسجلة', value: stats.enrolled_courses || 0, color: 'accent' },
                    { icon: FileText, label: 'الواجبات المطلوبة', value: stats.pending_assignments || 0, color: 'primary' },
                    { icon: Award, label: 'النتائج المنشورة', value: stats.completed_results || 0, color: 'success' },
                    { icon: Clock, label: 'الساعات المعتمدة', value: stats.credit_hours || 0, color: 'accent' },
                ];
            case 'teacher':
            case 'ta':
                return [
                    { icon: BookOpen, label: 'المواد', value: stats.courses || 0, color: 'accent' },
                    { icon: FileText, label: 'الواجبات', value: stats.assignments || 0, color: 'primary' },
                    { icon: TrendingUp, label: 'بانتظار التصحيح', value: stats.pending_grading || 0, color: 'success' },
                    { icon: Calendar, label: 'المحاضرات', value: stats.lectures || 0, color: 'accent' },
                ];
            case 'department_manager':
            case 'supervisor':
                return [
                    { icon: BookOpen, label: 'المواد', value: stats.courses || 0, color: 'accent' },
                    { icon: Users, label: 'المدرسين', value: stats.instructors || 0, color: 'primary' },
                    { icon: FileText, label: 'الواجبات', value: stats.assignments || 0, color: 'success' },
                    { icon: TrendingUp, label: 'تسليمات معلقة', value: stats.pending_submissions || 0, color: 'accent' },
                ];
            default: // system_manager
                return [
                    { icon: BookOpen, label: 'الأقسام', value: stats.departments || 0, color: 'accent' },
                    { icon: FileText, label: 'المواد', value: stats.courses || 0, color: 'primary' },
                    { icon: Users, label: 'الطلاب', value: stats.students || 0, color: 'success' },
                    { icon: MessageSquare, label: 'رسائل جديدة', value: stats.unread_messages || 0, color: 'accent' },
                ];
        }
    };

    const statsDisplay = getStatsDisplay();

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                    {getWelcomeMessage()}، <span className="gradient-text">{user?.role === 'student' ? (user?.full_name_ar || user?.username) : user?.username}</span>
                </h1>
                <p className="text-[var(--color-text-muted)]">
                    مرحباً بك في لوحة تحكم الكلية الإماراتية للعلوم والتكنولوجيا
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statsDisplay.map((stat, index) => (
                    <div key={index} className="glass-card p-5 card-hover">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-lg bg-[var(--color-${stat.color})]/10 flex items-center justify-center`}>
                                <stat.icon className={`w-5 h-5 text-[var(--color-${stat.color})]`} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                        <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
                <h2 className="text-xl font-bold mb-4">الإجراءات السريعة</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user?.role === 'student' && (
                        <>
                            <Link to="/dashboard/my-courses" className="btn-primary justify-center">عرض المواد</Link>
                            <Link to="/dashboard/results" className="btn-accent justify-center">النتائج</Link>
                        </>
                    )}
                    {(user?.role === 'teacher' || user?.role === 'ta') && (
                        <>
                            <Link to="/dashboard/my-courses" className="btn-primary justify-center">موادي</Link>
                            <Link to="/dashboard/grading" className="btn-accent justify-center">التصحيح</Link>
                            <Link to="/dashboard/publish-results" className="btn-primary justify-center">نشر النتائج</Link>
                        </>
                    )}
                    {(user?.role === 'system_manager' || user?.is_superuser) && (
                        <>
                            <Link to="/dashboard/departments" className="btn-primary justify-center">إدارة الأقسام</Link>
                            <Link to="/dashboard/students" className="btn-accent justify-center">إدارة الطلاب</Link>
                            <Link to="/dashboard/users" className="btn-primary justify-center">إدارة المستخدمين</Link>
                            <Link to="/dashboard/events" className="btn-accent justify-center">إدارة الفعاليات</Link>
                            <Link to="/dashboard/messages" className="btn-primary justify-center">عرض الرسائل {stats?.unread_messages > 0 && `(${stats.unread_messages})`}</Link>
                        </>
                    )}
                    {(user?.role === 'department_manager' || user?.role === 'supervisor') && (
                        <>
                            <Link to="/dashboard/courses" className="btn-primary justify-center">إدارة المواد</Link>
                            <Link to="/dashboard/instructors" className="btn-accent justify-center">تعيين مدرسين</Link>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Info */}
            {(user?.role === 'system_manager' || user?.is_superuser) && stats && (
                <div className="glass-card p-6 mt-6">
                    <h2 className="text-xl font-bold mb-4">ملخص النظام</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-white/5">
                            <p className="text-[var(--color-text-muted)] text-sm mb-1">إجمالي الطاقم</p>
                            <p className="text-2xl font-bold">{stats.staff || 0}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5">
                            <p className="text-[var(--color-text-muted)] text-sm mb-1">الفعاليات النشطة</p>
                            <p className="text-2xl font-bold">{stats.events || 0}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5">
                            <p className="text-[var(--color-text-muted)] text-sm mb-1">إجمالي الرسائل</p>
                            <p className="text-2xl font-bold">{stats.messages || 0}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5">
                            <p className="text-[var(--color-text-muted)] text-sm mb-1">رسائل غير مقروءة</p>
                            <p className="text-2xl font-bold text-[var(--color-accent)]">{stats.unread_messages || 0}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

