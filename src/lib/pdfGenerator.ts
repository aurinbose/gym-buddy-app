import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Routine, RoutineDayExercise } from '../types';

export function downloadRoutinePDF(routine: Routine) {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text(routine.name, 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100);
    if (routine.description) {
        doc.text(routine.description, 14, 32);
    }
    
    let startY = routine.description ? 42 : 32;

    if (routine.schedule && routine.schedule.length > 0) {
        routine.schedule.forEach(day => {
            if (day.name !== 'Rest' && day.exercises && day.exercises.length > 0) {
                // Determine format
                const isWeekly = routine.schedule!.length > 1;
                const title = isWeekly ? `${day.day} - ${day.name}` : `Exercises`;
                
                doc.setFontSize(14);
                doc.setTextColor(0);
                doc.text(title, 14, startY);
                
                const tableData = day.exercises.map((ex: RoutineDayExercise) => [
                    ex.exercise_name,
                    ex.target_sets.toString(),
                    String(ex.target_reps),
                    ex.target_weight ? String(ex.target_weight) : '-'
                ]);

                autoTable(doc, {
                    startY: startY + 6,
                    head: [['Exercise', 'Sets', 'Reps', 'Weight (kg)']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [255, 107, 53] }
                });

                startY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY + 14;
            }
        });
    }

    doc.save(`${routine.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_routine.pdf`);
}
