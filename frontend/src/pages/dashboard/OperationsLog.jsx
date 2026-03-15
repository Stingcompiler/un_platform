import { useState, useEffect } from 'react';
import { Activity, Filter, User, Clock, Search, BookOpen, FileText, Award, GraduationCap, Plus, Edit, Trash2, Send, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const ACTION_CONFIG = {
    create: { label: 'إنشاء', color: '#22c55e', icon: Plus },
    update: { label: 'تعديل', color: '#f59e0b', icon: Edit },
    delete: { label: 'حذف', color: '#ef4444', icon: Trash2 },
    publish: { label: 'نشر', color: '#3b82f6', icon: Send },
    grade: { label: 'تصحيح', color: '#8b5cf6', icon: CheckCircle },
};

const ROLE_LABELS = {
    supervisor: 'مشرف',
    teacher: 'مدرس',
    ta: 'معيد',
};

export default function OperationsLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [filterAction]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterAction) params.action = filterAction;
            const response = await api.get('/auth/activity-logs/', { params });
            const data = response.data;
            setLogs(Array.isArray(data) ? data : (data.results || []));
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            log.user_name?.toLowerCase().includes(q) ||
            log.target_name?.toLowerCase().includes(q) ||
            log.target_type?.toLowerCase().includes(q)
        );
    });

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        if (days < 7) return `منذ ${days} يوم`;
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <Activity className="w-7 h-7 text-[var(--color-accent)]" />
                    سجل العمليات
                </h1>
                <p className="text-[var(--color-text-muted)] mt-1">
                    جميع العمليات التي تمت بواسطة المشرفين والمدرسين والمعيدين
                </p>
            </div>

            {/* Filters */}
            <div className="glass-card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو العنصر..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pr-10 w-full"
                        />
                    </div>

                    {/* Action Filter */}
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="input-field min-w-[160px]"
                    >
                        <option value="">جميع العمليات</option>
                        <option value="create">إنشاء</option>
                        <option value="update">تعديل</option>
                        <option value="delete">حذف</option>
                        <option value="publish">نشر</option>
                        <option value="grade">تصحيح</option>
                    </select>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(ACTION_CONFIG).map(([key, conf]) => {
                    const count = logs.filter(l => l.action === key).length;
                    const Icon = conf.icon;
                    return (
                        <div
                            key={key}
                            onClick={() => setFilterAction(filterAction === key ? '' : key)}
                            className={`glass-card p-3 cursor-pointer transition-all hover:scale-[1.02] ${filterAction === key ? 'ring-2 ring-[var(--color-accent)]' : ''
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className="w-4 h-4" style={{ color: conf.color }} />
                                <span className="text-xs text-[var(--color-text-muted)]">{conf.label}</span>
                            </div>
                            <p className="text-xl font-bold" style={{ color: conf.color }}>{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Logs List */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-[var(--color-text-muted)]">جاري التحميل...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Activity className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3 opacity-50" />
                        <p className="text-[var(--color-text-muted)]">لا توجد عمليات بعد</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/10">
                        {filteredLogs.map((log) => {
                            const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.create;
                            const ActionIcon = config.icon;
                            return (
                                <div key={log.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {/* Action Icon */}
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: config.color + '20' }}
                                        >
                                            <ActionIcon className="w-5 h-5" style={{ color: config.color }} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium">{log.user_name}</span>
                                                <span
                                                    className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{
                                                        backgroundColor: config.color + '20',
                                                        color: config.color
                                                    }}
                                                >
                                                    {log.action_display}
                                                </span>
                                                <span className="text-[var(--color-text-muted)] text-sm">
                                                    {log.target_type}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1 text-[var(--color-text-secondary)]">
                                                {log.target_name}
                                            </p>
                                            {log.details && (
                                                <p className="text-xs mt-1 text-[var(--color-text-muted)]">
                                                    {log.details}
                                                </p>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="text-left shrink-0 space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDate(log.created_at)}
                                            </div>
                                            <div className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-center">
                                                {ROLE_LABELS[log.user_role] || log.user_role}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
