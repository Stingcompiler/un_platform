import { useState, useEffect } from 'react';
import { Award, BookOpen, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../services/api';

export default function StudentResults() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await api.get('/academic/results/');
            setResults(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (letter) => {
        const colors = {
            'A+': 'var(--color-success)',
            'A': 'var(--color-success)',
            'B+': 'var(--color-accent)',
            'B': 'var(--color-accent)',
            'C+': 'var(--color-text)',
            'C': 'var(--color-text)',
            'D': 'var(--color-text-muted)',
            'F': 'var(--color-error)',
        };
        return colors[letter] || 'var(--color-text)';
    };

    if (loading) {
        return <div className="flex justify-center py-20"><div className="spinner"></div></div>;
    }


    console.log('res', results)

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">نتائجي</h1>
                <p className="text-[var(--color-text-muted)]">عرض النتائج النهائية للمواد</p>
            </div>

            {results.length > 0 ? (
                <div className="space-y-4">
                    {results.map((result) => (
                        <div key={result.id} className="glass-card p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center">
                                        <BookOpen className="w-7 h-7 text-[var(--color-accent)]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{result.course_name}</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">{result.course?.code}</p>
                                    </div>
                                </div>

                                <div className="text-center">
                                    {result.is_published ? (
                                        <>
                                            <p className="text-3xl font-bold" style={{ color: getGradeColor(result.letter_grade) }}>
                                                {result.letter_grade}
                                            </p>
                                            <p className="text-sm text-[var(--color-text-muted)]">{result.total_grade}%</p>
                                            <span className={`flex items-center gap-1 mt-2 text-sm ${result.passed ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                                                {result.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                {result.passed ? 'ناجح' : 'راسب'}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-text-muted)]/20 text-[var(--color-text-muted)]">
                                            <Clock className="w-4 h-4" />
                                            قيد المراجعة
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <Award className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد نتائج</h3>
                    <p className="text-[var(--color-text-muted)]">لم يتم نشر أي نتائج بعد</p>
                </div>
            )}
        </div>
    );
}
