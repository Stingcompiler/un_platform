import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, ChevronLeft, Shield, Users, Book, Scale, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const policyTypes = {
    privacy: { icon: Shield, title: 'سياسة الخصوصية', titleEn: 'Privacy Policy' },
    terms: { icon: Scale, title: 'شروط الاستخدام', titleEn: 'Terms of Use' },
    academic: { icon: Book, title: 'اللوائح الأكاديمية', titleEn: 'Academic Regulations' },
    conduct: { icon: Users, title: 'قواعد السلوك', titleEn: 'Code of Conduct' },
};

export default function Policies() {
    const { type } = useParams();
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (type) {
            fetchPolicy();
        }
    }, [type]);

    const fetchPolicy = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/public/policies/${type}/`);
            setPolicy(res.data);
        } catch (error) {
            console.error('Error fetching policy:', error);
            // Use fallback content
            setPolicy(getFallbackPolicy(type));
        } finally {
            setLoading(false);
        }
    };

    const getFallbackPolicy = (policyType) => {
        const content = {
            privacy: {
                content_ar: `
# سياسة الخصوصية

## جمع المعلومات
تلتزم الكلية الإماراتية للعلوم والتكنولوجيا بحماية خصوصية المستخدمين. نقوم بجمع المعلومات الضرورية فقط لتقديم الخدمات التعليمية.

## استخدام المعلومات
نستخدم معلوماتك الشخصية للأغراض التالية:
- تسجيل الدخول والتحقق من الهوية
- إدارة السجلات الأكاديمية
- التواصل بشأن الأنشطة الجامعية
- تحسين خدماتنا التعليمية

## حماية البيانات
نلتزم بتطبيق أعلى معايير الأمان لحماية بياناتك الشخصية من الوصول غير المصرح به.

## حقوقك
يحق لك طلب الوصول إلى بياناتك أو تعديلها أو حذفها في أي وقت.
        `
            },
            terms: {
                content_ar: `
# شروط الاستخدام

## القبول بالشروط
باستخدامك لهذا الموقع، فإنك توافق على الالتزام بهذه الشروط والأحكام.

## استخدام الموقع
- يجب استخدام الموقع لأغراض تعليمية مشروعة فقط
- يحظر أي محاولة للوصول غير المصرح به إلى النظام
- يجب الحفاظ على سرية بيانات تسجيل الدخول

## حقوق الملكية الفكرية
جميع المحتويات والمواد التعليمية محمية بموجب قوانين حقوق النشر.

## إخلاء المسؤولية
تحتفظ الكلية بحق تعديل هذه الشروط في أي وقت.
        `
            },
            academic: {
                content_ar: `
# اللوائح الأكاديمية

## نظام التسجيل
- يجب على الطلاب إكمال التسجيل في المواعيد المحددة
- الحد الأدنى للتسجيل 12 ساعة معتمدة في الفصل الدراسي
- الحد الأقصى 21 ساعة معتمدة

## نظام الدرجات
| التقدير | النسبة |
|---------|--------|
| A | 90-100 |
| B | 80-89 |
| C | 70-79 |
| D | 60-69 |
| F | أقل من 60 |

## الحضور والغياب
- نسبة الحضور المطلوبة 75% على الأقل
- تجاوز نسبة الغياب يؤدي للحرمان من المادة

## الامتحانات
- لا يُسمح بدخول الامتحان بعد مرور 15 دقيقة من بدايته
- يُحظر الغش أو محاولته ويعرض الطالب للفصل
        `
            },
            conduct: {
                content_ar: `
# قواعد السلوك

## السلوك الأكاديمي
- الالتزام بالنزاهة الأكاديمية في جميع الأعمال
- عدم نسخ أعمال الآخرين أو انتحالها
- احترام الملكية الفكرية

## السلوك العام
- احترام جميع أعضاء المجتمع الجامعي
- الحفاظ على بيئة تعليمية آمنة
- الالتزام بقواعد اللباس اللائق

## المخالفات والعقوبات
تتضمن العقوبات:
- الإنذار الشفهي أو الكتابي
- الحرمان من الامتحانات
- الفصل المؤقت أو النهائي

## الإبلاغ عن المخالفات
يُشجع جميع الطلاب على الإبلاغ عن أي مخالفات مع ضمان السرية التامة.
        `
            }
        };
        return content[policyType] || { content_ar: 'محتوى السياسة غير متوفر' };
    };

    // If no type selected, show list of policies
    if (!type) {
        return (
            <div className="pt-24 pb-16 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-4">السياسات واللوائح</h1>
                        <p className="text-lg text-[var(--color-text-muted)]">
                            تعرف على سياساتنا ولوائحنا الأكاديمية والإدارية
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        {Object.entries(policyTypes).map(([key, value]) => {
                            const Icon = value.icon;
                            return (
                                <Link
                                    key={key}
                                    to={`/policies/${key}`}
                                    className="glass-card p-6 card-hover group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Icon className="w-7 h-7 text-[var(--color-accent)]" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold mb-1">{value.title}</h2>
                                            <p className="text-sm text-[var(--color-text-muted)]">{value.titleEn}</p>
                                        </div>
                                    </div>
                                    <ChevronLeft className="w-5 h-5 text-[var(--color-text-muted)] absolute left-6 top-1/2 -translate-y-1/2 group-hover:text-[var(--color-accent)] transition-colors" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Show specific policy
    const policyInfo = policyTypes[type];

    if (loading) {
        return (
            <div className="pt-24 pb-16 min-h-screen flex justify-center items-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!policyInfo) {
        return (
            <div className="pt-24 pb-16 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <AlertTriangle className="w-16 h-16 text-[var(--color-error)] mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-4">السياسة غير موجودة</h1>
                    <Link to="/policies" className="btn-accent">
                        العودة إلى السياسات
                    </Link>
                </div>
            </div>
        );
    }

    const Icon = policyInfo.icon;

    return (
        <div className="pt-24 pb-16 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/policies" className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline mb-4">
                        <ChevronLeft className="w-4 h-4" />
                        العودة إلى السياسات
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center">
                            <Icon className="w-7 h-7 text-[var(--color-accent)]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{policyInfo.title}</h1>
                            <p className="text-[var(--color-text-muted)]">{policyInfo.titleEn}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="glass-card p-8">
                    <div
                        className="prose prose-invert max-w-none prose-headings:text-[var(--color-text)] prose-p:text-[var(--color-text-muted)] prose-strong:text-[var(--color-accent)] prose-li:text-[var(--color-text-muted)]"
                        style={{ whiteSpace: 'pre-line' }}
                    >
                        {policy?.content_ar}
                    </div>
                </div>
            </div>
        </div>
    );
}
