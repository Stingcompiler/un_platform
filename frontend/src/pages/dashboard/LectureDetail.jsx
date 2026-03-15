import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Video, FileText, Download, ExternalLink, ArrowRight,
    Clock, User, BookOpen, Play, Link2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function LectureDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [lecture, setLecture] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLecture();
    }, [id]);

    const fetchLecture = async () => {
        try {
            const res = await api.get(`/academic/lectures/${id}/`);
            setLecture(res.data);
        } catch (error) {
            console.error('Error fetching lecture:', error);
        } finally {
            setLoading(false);
        }
    };

    // Convert YouTube/Vimeo URL to embed URL
    const getEmbedUrl = (url) => {
        if (!url) return null;

        // YouTube
        const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (ytMatch) {
            return `https://www.youtube.com/embed/${ytMatch[1]}`;
        }

        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        return url;
    };

    const canEdit = user?.role === 'system_manager' || user?.role === 'department_manager' || user?.role === 'supervisor' ||
        user?.role === 'teacher' || user?.role === 'ta';

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!lecture) {
        return (
            <div className="glass-card p-12 text-center">
                <Video className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">المحاضرة غير موجودة</h3>
                <p className="text-[var(--color-text-muted)] mb-4">لم يتم العثور على هذه المحاضرة</p>
                <button onClick={() => navigate(-1)} className="btn-accent">
                    <ArrowRight className="w-5 h-5" />
                    العودة
                </button>
            </div>
        );
    }

    // Video priority: Bunny Stream > external YouTube/Vimeo URL
    const bunnyVideoUrl = lecture.bunny_video_url;
    const embedUrl = getEmbedUrl(lecture.video_url);
    const hasVideo = bunnyVideoUrl || embedUrl;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-lg hover:bg-white/10"
                >
                    <ArrowRight className="w-6 h-6" />
                </button>
                <div>
                    <span className={`text-xs px-2 py-0.5 rounded ${lecture.lecture_type === 'theory'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-green-500/20 text-green-400'
                        }`}>
                        {lecture.lecture_type === 'theory' ? 'نظري' : 'عملي'}
                    </span>
                    <h1 className="text-2xl font-bold mt-1">{lecture.title_ar || lecture.title}</h1>
                    <p className="text-[var(--color-text-muted)]">
                        {lecture.course_name}
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Video Player */}
                    {hasVideo && (
                        <div className="glass-card p-0 overflow-hidden">
                            <div className="aspect-video bg-black">
                                {bunnyVideoUrl ? (
                                    /* Bunny Stream embed player */
                                    <iframe
                                        src={bunnyVideoUrl}
                                        className="w-full h-full"
                                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                                        allowFullScreen
                                        title={lecture.title_ar || lecture.title}
                                        style={{ border: 'none' }}
                                    />
                                ) : embedUrl && (
                                    /* YouTube / Vimeo */
                                    <iframe
                                        src={embedUrl}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={lecture.title_ar}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* No Video Placeholder */}
                    {!hasVideo && (
                        <div className="glass-card p-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center mx-auto mb-4">
                                <Video className="w-10 h-10 text-[var(--color-text-muted)]" />
                            </div>
                            <p className="text-[var(--color-text-muted)]">لا يوجد فيديو لهذه المحاضرة</p>
                        </div>
                    )}

                    {/* Lecture Content */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
                            محتوى المحاضرة
                        </h2>
                        <div className="prose prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-[var(--color-text)]">
                                {lecture.content || 'لا يوجد محتوى نصي لهذه المحاضرة'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Info Card */}
                    <div className="glass-card p-6">
                        <h3 className="font-semibold mb-4">معلومات المحاضرة</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-[var(--color-accent)]" />
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--color-text-muted)]">أنشئ بواسطة</p>
                                    <p className="font-medium">{lecture.created_by_name || 'غير محدد'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-[var(--color-accent)]" />
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--color-text-muted)]">تاريخ الإنشاء</p>
                                    <p className="font-medium">
                                        {new Date(lecture.created_at).toLocaleDateString('ar-SD')}
                                    </p>
                                </div>
                            </div>
                            {lecture.order > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center">
                                        <span className="text-[var(--color-accent)] font-bold">{lecture.order}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--color-text-muted)]">ترتيب المحاضرة</p>
                                        <p className="font-medium">المحاضرة رقم {lecture.order}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Downloads & Links */}
                    <div className="glass-card p-6">
                        <h3 className="font-semibold mb-4">الملفات والروابط</h3>
                        <div className="space-y-3">
                            {/* PDF / Attachment file */}
                            {lecture.file && (
                                <a
                                    href={lecture.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">ملف المحاضرة</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {lecture.file.split('/').pop()}
                                        </p>
                                    </div>
                                    <Download className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" />
                                </a>
                            )}

                            {/* Bunny Stream video link (if embedded above, show as sidebar info) */}
                            {lecture.bunny_video_id && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <Play className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">فيديو Bunny Stream</p>
                                        <p className="text-xs text-purple-400">مشغّل مضمّن في الأعلى</p>
                                    </div>
                                </div>
                            )}

                            {/* External YouTube/Vimeo */}
                            {lecture.video_url && (
                                <a
                                    href={lecture.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                        <Video className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">مشاهدة على YouTube</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">رابط خارجي</p>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" />
                                </a>
                            )}

                            {lecture.reference_url && (
                                <a
                                    href={lecture.reference_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                        <Link2 className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">المراجع</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">رابط خارجي</p>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" />
                                </a>
                            )}

                            {!lecture.file && !lecture.bunny_video_id && !lecture.video_url && !lecture.reference_url && (
                                <div className="text-center py-4 text-[var(--color-text-muted)]">
                                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">لا توجد ملفات أو روابط</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
