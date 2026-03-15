import { useState, useEffect } from 'react';
import { Award, BookOpen, Plus, Save, X, Users, Check, FileText, FileDown, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export default function ResultsPublish() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) fetchStudents();
    }, [selectedCourse]);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/academic/courses/');
            const data = res.data.results || res.data;
            setCourses(data);
            if (data.length > 0) setSelectedCourse(data[0]);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get(`/academic/results/?course=${selectedCourse.id}`);
            const data = res.data.results || res.data;
            const resultsMap = {};
            data.forEach(r => { resultsMap[r.student] = r; });
            setResults(resultsMap);

            // Get enrolled students
            const studentsRes = await api.get('/auth/users/?role=student');
            setStudents(studentsRes.data.results || studentsRes.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleSaveResult = async (studentId, data) => {
        setSaving(true);
        try {
            const existing = results[studentId];
            if (existing) {
                await api.patch(`/academic/results/${existing.id}/`, data);
            } else {
                await api.post('/academic/results/', {
                    ...data,
                    course: selectedCourse.id,
                    student: studentId,
                });
            }
            fetchStudents();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async (studentId) => {
        const result = results[studentId];
        if (result) {
            await api.patch(`/academic/results/${result.id}/`, { is_published: true });
            fetchStudents();
        }
    };

    const handleDeleteResult = async (resultId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه النتيجة؟')) return;
        try {
            await api.delete(`/academic/results/${resultId}/`);
            fetchStudents();
        } catch (error) {
            console.error('Error deleting result:', error);
        }
    };

    const getResultsData = () => {
        return students
            .filter(s => results[s.id])
            .map(s => {
                const r = results[s.id];
                return {
                    name: s.full_name_ar || s.username,
                    grade: r.total_grade ?? '-',
                    letter: r.letter_grade || '-',
                    passed: r.passed ? 'ناجح' : 'راسب',
                };
            });
    };

    const exportPDF = () => {
        const data = getResultsData();
        if (data.length === 0) return;

        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text(`Student Results`, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Course: ${selectedCourse.name_ar || selectedCourse.name_en} (${selectedCourse.code})`, 105, 30, { align: 'center' });
        doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 105, 38, { align: 'center' });

        autoTable(doc, {
            startY: 45,
            head: [['#', 'Student Name', 'Grade', 'Letter']],
            body: data.map((r, i) => [
                i + 1,
                r.name,
                r.grade,
                r.letter,
                r.passed,
            ]),
            styles: { fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 },
                2: { halign: 'center', cellWidth: 20 },
                3: { halign: 'center', cellWidth: 18 },
                4: { halign: 'center', cellWidth: 20 },
            },
        });

        doc.save(`results_${selectedCourse.code}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const exportWord = async () => {
        const data = getResultsData();
        if (data.length === 0) return;

        const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
        const cellBorders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

        const headerCells = ['#', 'Student Name', 'Grade', 'Letter',].map(text =>
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 22 })], alignment: AlignmentType.CENTER })],
                shading: { fill: '3B82F6' },
                borders: cellBorders,
                width: { size: text === 'Student Name' ? 3000 : 1200, type: WidthType.DXA },
            })
        );

        const tableRows = data.map((r, i) =>
            new TableRow({
                children: [
                    [String(i + 1), r.name, String(r.grade), r.letter, r.passed].map((text, ci) =>
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text, size: 20 })], alignment: ci === 1 ? AlignmentType.LEFT : AlignmentType.CENTER })],
                            borders: cellBorders,
                            shading: i % 2 === 1 ? { fill: 'F5F7FA' } : {},
                        })
                    ),
                ],
            })
        );

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ children: [new TextRun({ text: 'Student Results', bold: true, size: 36 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
                    new Paragraph({ children: [new TextRun({ text: `Course: ${selectedCourse.name_ar || selectedCourse.name_en} (${selectedCourse.code})`, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 50 } }),
                    new Paragraph({ children: [new TextRun({ text: `Date: ${new Date().toLocaleDateString('en-US')}`, size: 20, color: '666666' })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({ children: headerCells, tableHeader: true }),
                            ...tableRows,
                        ],
                    }),
                    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: `Total Students: ${data.length}`, size: 20, color: '666666' })] }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `results_${selectedCourse.code}_${new Date().toISOString().slice(0, 10)}.docx`);
    };

    if (loading) return <div className="flex justify-center py-20"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">نشر النتائج</h1>
                <p className="text-[var(--color-text-muted)]">إدخال ونشر النتائج النهائية للطلاب</p>
            </div>

            {courses.length > 0 ? (
                <>
                    <div className="glass-card p-4 mb-6">
                        <label className="block text-sm font-medium mb-2">اختر المادة</label>
                        <select
                            className="input-field"
                            value={selectedCourse?.id || ''}
                            onChange={(e) => setSelectedCourse(courses.find(c => c.id === parseInt(e.target.value)))}
                        >
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.name_ar} ({c.code})</option>
                            ))}
                        </select>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={exportPDF}
                            className="btn-primary flex items-center gap-2"
                            disabled={Object.keys(results).length === 0}
                        >
                            <FileDown className="w-4 h-4" />
                            تصدير PDF
                        </button>
                        <button
                            onClick={exportWord}
                            className="btn-primary flex items-center gap-2"
                            disabled={Object.keys(results).length === 0}
                        >
                            <FileText className="w-4 h-4" />
                            تصدير Word
                        </button>
                    </div>

                    {students.length > 0 ? (
                        <div className="glass-card overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-right p-4 text-[var(--color-text-muted)]">الطالب</th>
                                        <th className="text-right p-4 text-[var(--color-text-muted)]">الدرجة</th>
                                        <th className="text-right p-4 text-[var(--color-text-muted)]">التقدير</th>
                                        <th className="text-right p-4 text-[var(--color-text-muted)]">الحالة</th>
                                        <th className="text-right p-4 text-[var(--color-text-muted)]">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => {
                                        const result = results[student.id];
                                        return (
                                            <ResultRow
                                                key={student.id}
                                                student={student}
                                                result={result}
                                                onSave={(data) => handleSaveResult(student.id, data)}
                                                onPublish={() => handlePublish(student.id)}
                                                onDelete={() => result && handleDeleteResult(result.id)}
                                                userRole={user?.role}
                                            />
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="glass-card p-12 text-center">
                            <Users className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                            <h3 className="text-xl font-semibold">لا يوجد طلاب</h3>
                        </div>
                    )}
                </>
            ) : (
                <div className="glass-card p-12 text-center">
                    <BookOpen className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">لا توجد مواد</h3>
                </div>
            )}
        </div>
    );
}

function ResultRow({ student, result, onSave, onPublish, onDelete, userRole }) {
    const [editing, setEditing] = useState(false);
    const [grade, setGrade] = useState(result?.total_grade || '');
    const [letter, setLetter] = useState(result?.letter_grade || 'C');

    const handleSave = () => {
        if (!grade && grade !== 0) return;
        onSave({
            total_grade: parseFloat(grade),
            letter_grade: letter,
            passed: letter !== 'F',
        });
        setEditing(false);
    };

    return (
        <tr className="border-b border-white/5 hover:bg-white/5">
            <td className="p-4 font-medium">{student.full_name_ar || student.username}</td>
            <td className="p-4">
                {editing ? (
                    <input
                        type="number"
                        min="0"
                        max="100"
                        className="input-field w-20"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                    />
                ) : (
                    result?.total_grade || '-'
                )}
            </td>
            <td className="p-4">
                {editing ? (
                    <select className="input-field w-20" value={letter} onChange={(e) => setLetter(e.target.value)}>
                        {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                ) : (
                    result?.letter_grade || '-'
                )}
            </td>
            <td className="p-4">
                {result?.is_published ? (
                    <span className="text-[var(--color-success)]">منشور</span>
                ) : result ? (
                    <span className="text-[var(--color-accent)]">محفوظ</span>
                ) : (
                    <span className="text-[var(--color-text-muted)]">-</span>
                )}
            </td>
            <td className="p-4">
                <div className="flex gap-2">
                    {editing ? (
                        <>
                            <button onClick={handleSave} className="btn-accent py-1 px-3"><Save className="w-4 h-4" /></button>
                            <button onClick={() => setEditing(false)} className="btn-primary py-1 px-3"><X className="w-4 h-4" /></button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setEditing(true)} className="btn-primary py-1 px-3">تعديل</button>
                            {result && !result.is_published && (
                                <button onClick={onPublish} className="btn-accent py-1 px-3">نشر</button>
                            )}
                            {result && ['system_manager', 'department_manager'].includes(userRole) && (
                                <button onClick={onDelete} className="py-1 px-3 rounded-lg bg-[var(--color-error)] text-white hover:opacity-80 transition-opacity flex items-center gap-1">
                                    <Trash2 className="w-4 h-4" />
                                    حذف
                                </button>
                            )}
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}
