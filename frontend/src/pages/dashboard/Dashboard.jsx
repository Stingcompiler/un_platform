import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, BookOpen, Users, FileText,
    Calendar, Settings, GraduationCap, ClipboardList,
    Award, MessageSquare, LogOut, Home, Menu, X, User, Activity
} from 'lucide-react';
import { useState } from 'react';

// Dashboard Components
import DashboardHome from './DashboardHome';
import CoursesList from './CoursesList';
import StudentCourses from './StudentCourses';
import DepartmentsManage from './DepartmentsManage';
import UsersManage from './UsersManage';
import StudentsManage from './StudentsManage';
import EventsManage from './EventsManage';
import MessagesView from './MessagesView';
import TeacherCourses from './TeacherCourses';
import GradingPage from './GradingPage';
import StudentCoursesView from './StudentCoursesView';
import StudentResults from './StudentResults';
import ResultsPublish from './ResultsPublish';
import ProfilePage from './ProfilePage';
import LectureDetail from './LectureDetail';
import OperationsLog from './OperationsLog';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Define menu items based on role
    const getMenuItems = () => {
        const baseItems = [
            { path: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية', exact: true },
        ];

        switch (user?.role) {
            case 'system_manager':
                return [
                    ...baseItems,
                    { path: '/dashboard/departments', icon: BookOpen, label: 'الأقسام' },
                    { path: '/dashboard/students', icon: GraduationCap, label: 'الطلاب' },
                    { path: '/dashboard/users', icon: Users, label: 'المستخدمين' },
                    { path: '/dashboard/events', icon: Calendar, label: 'الفعاليات' },
                    { path: '/dashboard/messages', icon: MessageSquare, label: 'الرسائل' },
                ];
            case 'department_manager':
                return [
                    ...baseItems,
                    { path: '/dashboard/courses', icon: BookOpen, label: 'المواد' },
                    { path: '/dashboard/students', icon: GraduationCap, label: 'طلاب القسم' },
                    { path: '/dashboard/publish-results', icon: Award, label: 'النتائج' },
                    { path: '/dashboard/operations', icon: Activity, label: 'سجل العمليات' },
                    { path: '/dashboard/my-courses', icon: BookOpen, label: 'موادي' },
                ];
            case 'supervisor':
                return [
                    ...baseItems,
                    { path: '/dashboard/courses', icon: BookOpen, label: 'المواد' },
                    { path: '/dashboard/students', icon: GraduationCap, label: 'طلاب القسم' },
                    { path: '/dashboard/publish-results', icon: Award, label: 'النتائج' },
                    { path: '/dashboard/my-courses', icon: BookOpen, label: 'موادي' },
                ];
            case 'teacher':
            case 'ta':
                return [
                    ...baseItems,
                    { path: '/dashboard/my-courses', icon: BookOpen, label: 'موادي' },
                    { path: '/dashboard/grading', icon: ClipboardList, label: 'التصحيح' },
                    { path: '/dashboard/publish-results', icon: Award, label: 'نشر النتائج' },
                ];
            case 'student':
                return [
                    ...baseItems,
                    { path: '/dashboard/my-courses', icon: BookOpen, label: 'موادي' },
                    { path: '/dashboard/results', icon: Award, label: 'النتائج' },
                ];
            default:
                return baseItems;
        }
    };

    const menuItems = getMenuItems();

    const getRoleLabel = () => {
        const labels = {
            system_manager: 'مدير النظام',
            department_manager: 'مدير القسم',
            supervisor: 'مشرف القسم',
            teacher: 'مدرس',
            ta: 'معيد',
            student: 'طالب',
        };
        return labels[user?.role] || 'مستخدم';
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Dashboard Header */}
            <header className="glass-card sticky top-0 z-50 border-b border-white/10 rounded-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Brand */}
                        <div className="flex items-center gap-4">
                            <Link to="/" className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] flex items-center justify-center">
                                    <GraduationCap className="w-6 h-6 text-[var(--color-bg)]" />
                                </div>
                                <span className="font-bold text-lg hidden sm:block">كلية الإمارات</span>
                            </Link>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] transition-colors">
                                <Home className="w-4 h-4" />
                                <span>الموقع الرئيسي</span>
                            </Link>
                            <div className="h-6 w-px bg-white/20"></div>
                            <div className="flex items-center gap-3">
                                <Link to="/dashboard/profile" className="text-left hover:opacity-80 transition-opacity">
                                    <p className="font-medium text-sm">{user?.role === 'student' ? (user?.full_name_ar || user?.username) : user?.username}</p>
                                    <p className="text-xs text-[var(--color-accent)]">{getRoleLabel()}</p>
                                </Link>
                                <Link
                                    to="/dashboard/profile"
                                    className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-accent)] transition-colors"
                                    title="الملف الشخصي"
                                >
                                    <User className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-error)] transition-colors"
                                    title="تسجيل الخروج"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-white/10"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Navigation Tabs - Desktop */}
                    <nav className="hidden md:flex items-center gap-1 pb-3 overflow-x-auto">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${(item.exact ? location.pathname === item.path : isActive(item.path))
                                    ? 'bg-[var(--color-accent)] text-[var(--color-bg)] font-medium'
                                    : 'hover:bg-white/10 text-[var(--color-text-muted)]'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-white/10 px-4 py-4 space-y-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${(item.exact ? location.pathname === item.path : isActive(item.path))
                                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                                    : 'hover:bg-white/5 text-[var(--color-text-muted)]'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[var(--color-text-muted)]">
                                <Home className="w-5 h-5" />
                                <span>الموقع الرئيسي</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-[var(--color-error)]"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>تسجيل الخروج</span>
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <div className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        <Route index element={<DashboardHome />} />
                        {/* System Manager Routes */}
                        <Route path="departments" element={<DepartmentsManage />} />
                        <Route path="students" element={<StudentsManage />} />
                        <Route path="users" element={<UsersManage />} />
                        <Route path="events" element={<EventsManage />} />
                        <Route path="messages" element={<MessagesView />} />
                        {/* Dept Manager Routes */}
                        <Route path="courses" element={<CoursesList />} />
                        <Route path="instructors" element={<CoursesList />} />
                        <Route path="operations" element={<OperationsLog />} />
                        {/* Teacher/TA Routes */}
                        <Route path="my-courses" element={user?.role === 'student' ? <StudentCoursesView /> : <TeacherCourses />} />
                        <Route path="grading" element={<GradingPage />} />
                        <Route path="publish-results" element={<ResultsPublish />} />
                        {/* Student Routes */}
                        <Route path="results" element={<StudentResults />} />
                        {/* Common Routes */}
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="lecture/:id" element={<LectureDetail />} />
                        <Route path="*" element={<DashboardHome />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
}

