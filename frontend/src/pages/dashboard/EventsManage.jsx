import { useState, useEffect, useRef } from 'react';
import { Calendar, Plus, Edit, Trash2, X, Save, Eye, EyeOff, Upload, Image } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function EventsManage() {
    const { user } = useAuth();
    const canDelete = ['system_manager', 'department_manager'].includes(user?.role);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '',
        title_ar: '',
        description: '',
        description_ar: '',
        date: '',
        location: '',
        is_published: true,
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/public/events-manage/');
            setEvents(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('title_ar', formData.title_ar);
            data.append('description', formData.description);
            data.append('description_ar', formData.description_ar);
            data.append('date', formData.date);
            data.append('location', formData.location);
            data.append('is_published', formData.is_published);

            if (imageFile) {
                data.append('image', imageFile);
            }

            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            if (editingEvent) {
                await api.patch(`/public/events-manage/${editingEvent.id}/`, data, config);
            } else {
                await api.post('/public/events-manage/', data, config);
            }
            fetchEvents();
            closeModal();
        } catch (error) {
            console.error('Error saving event:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الفعالية؟')) {
            try {
                await api.delete(`/public/events-manage/${id}/`);
                fetchEvents();
            } catch (error) {
                console.error('Error deleting event:', error);
            }
        }
    };

    const togglePublish = async (event) => {
        try {
            await api.patch(`/public/events-manage/${event.id}/`, { is_published: !event.is_published });
            fetchEvents();
        } catch (error) {
            console.error('Error toggling publish:', error);
        }
    };

    const openModal = (event = null) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                title: event.title,
                title_ar: event.title_ar,
                description: event.description || '',
                description_ar: event.description_ar || '',
                date: event.date?.split('T')[0] || '',
                location: event.location || '',
                is_published: event.is_published,
            });
            setImagePreview(event.image);
        } else {
            setEditingEvent(null);
            setFormData({
                title: '',
                title_ar: '',
                description: '',
                description_ar: '',
                date: '',
                location: '',
                is_published: true,
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEvent(null);
        setImageFile(null);
        setImagePreview(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">إدارة الفعاليات</h1>
                    <p className="text-[var(--color-text-muted)]">إضافة وتعديل الفعاليات والأحداث</p>
                </div>
                <button onClick={() => openModal()} className="btn-accent">
                    <Plus className="w-5 h-5" />
                    إضافة فعالية
                </button>
            </div>

            {events.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div key={event.id} className="glass-card overflow-hidden card-hover">
                            <div className="aspect-video bg-[var(--color-bg-elevated)] flex items-center justify-center">
                                {event.image ? (
                                    <img src={event.image} alt={event.title_ar} className="w-full h-full object-cover" />
                                ) : (
                                    <Calendar className="w-12 h-12 text-[var(--color-text-muted)]" />
                                )}
                            </div>
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-[var(--color-accent)]">
                                        {new Date(event.date).toLocaleDateString('ar-SD')}
                                    </span>
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${event.is_published
                                            ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                                            : 'bg-[var(--color-text-muted)]/20 text-[var(--color-text-muted)]'
                                            }`}
                                    >
                                        {event.is_published ? 'منشور' : 'مخفي'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold mb-2 line-clamp-1">{event.title_ar}</h3>
                                <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-4">
                                    {event.description_ar}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => togglePublish(event)}
                                        className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]"
                                        title={event.is_published ? 'إخفاء' : 'نشر'}
                                    >
                                        {event.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => openModal(event)}
                                        className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)]"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-error)]"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <Calendar className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد فعاليات</h3>
                    <p className="text-[var(--color-text-muted)] mb-6">لم يتم إضافة أي فعاليات بعد</p>
                    <button onClick={() => openModal()} className="btn-accent">
                        <Plus className="w-5 h-5" />
                        إضافة أول فعالية
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="glass-card p-6 w-full max-w-lg my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">
                                {editingEvent ? 'تعديل الفعالية' : 'إضافة فعالية جديدة'}
                            </h2>
                            <button onClick={closeModal} className="p-2 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-2">صورة الفعالية</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-[var(--color-accent)]/50 transition-colors"
                                >
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-40 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                }}
                                                className="absolute top-2 left-2 p-1 bg-red-500 rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="py-6">
                                            <Image className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2" />
                                            <p className="text-sm text-[var(--color-text-muted)]">
                                                انقر لاختيار صورة
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">العنوان (عربي)</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.title_ar}
                                        onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Title (English)</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">التاريخ</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">المكان</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">الوصف (عربي)</label>
                                <textarea
                                    rows={3}
                                    className="input-field resize-none"
                                    value={formData.description_ar}
                                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description (English)</label>
                                <textarea
                                    rows={3}
                                    className="input-field resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_published"
                                    className="w-5 h-5 rounded border-white/20 bg-white/5"
                                    checked={formData.is_published}
                                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                />
                                <label htmlFor="is_published" className="text-sm">نشر الفعالية</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn-accent flex-1 justify-center">
                                    <Save className="w-5 h-5" />
                                    {editingEvent ? 'تحديث' : 'إضافة'}
                                </button>
                                <button type="button" onClick={closeModal} className="btn-primary flex-1 justify-center">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
