'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Plus, GripVertical, Search, ArrowLeft, X,
    ChevronDown, ChevronUp, Dumbbell, Calendar, List,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Exercise, RoutineDayExercise } from '@/types';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates,
    verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/context/AuthContext';

const MUSCLE_GROUPS = [
    'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
    'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Cardio',
];

const WEEK_DAYS = [
    { day: 'Mon', label: 'Day 1' },
    { day: 'Tue', label: 'Day 2' },
    { day: 'Wed', label: 'Day 3' },
    { day: 'Thu', label: 'Day 4' },
    { day: 'Fri', label: 'Day 5' },
    { day: 'Sat', label: 'Day 6' },
    { day: 'Sun', label: 'Day 7' },
];

const DAY_COLORS = ['#FF6B35', '#4A9EFF', '#A8FF3E', '#BF5FFF', '#FFD166', '#5A6175', '#5A6175'];

const DAY_PRESETS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Rest', 'Cardio', 'Full Body', 'Custom'];

interface DayState {
    day: string;
    label: string;
    name: string;
    color: string;
    active: boolean;
    exercises: RoutineDayExercise[];
    collapsed: boolean;
}

// ─── Sortable exercise row ────────────────────────────────────────────────────
function SortableExerciseItem({
    ex, updateExercise, removeExercise
}: {
    ex: RoutineDayExercise;
    updateExercise: (id: string, field: keyof RoutineDayExercise, value: string | number) => void;
    removeExercise: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: ex.exercise_id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const [expanded, setExpanded] = useState(false);

    const parseTargetArray = (val: string | number, len: number) => {
        const parts = String(val).split(',').map(s => s.trim());
        return Array.from({ length: len }, (_, i) => parts[i] !== undefined ? parts[i] : (parts[0] || '0'));
    };

    const updateSpecificSet = (field: 'target_reps' | 'target_weight', index: number, newVal: string) => {
        const arr = parseTargetArray(ex[field], ex.target_sets);
        arr[index] = newVal;
        updateExercise(ex.exercise_id, field, arr.join(', '));
    };

    const repArray = parseTargetArray(ex.target_reps, ex.target_sets);
    const weightArray = parseTargetArray(ex.target_weight, ex.target_sets);

    return (
        <div ref={setNodeRef} style={{ ...style, background: '#161B22', borderRadius: 14, padding: '12px 14px', border: '1px solid #252B36' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#5A6175', touchAction: 'none', display: 'flex' }}>
                        <GripVertical size={15} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.exercise_name}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    {ex.target_sets > 1 && (
                        <button onClick={() => setExpanded(!expanded)} style={{ background: 'rgba(255,107,53,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#FF6B35', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600 }}>
                            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {expanded ? 'Simple' : 'Per Set'}
                        </button>
                    )}
                    <button onClick={() => removeExercise(ex.exercise_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6175', padding: 4, display: 'flex' }}>
                        <X size={14} />
                    </button>
                </div>
            </div>

            {!expanded ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {[
                        { label: 'Sets', field: 'target_sets' as const, value: ex.target_sets },
                        { label: 'Reps', field: 'target_reps' as const, value: ex.target_reps },
                        { label: 'Weight kg', field: 'target_weight' as const, value: ex.target_weight },
                    ].map(({ label, field, value }) => (
                        <div key={field}>
                            <p style={{ fontSize: '0.6rem', color: '#8A91A8', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{label}</p>
                            <input
                                type={field === 'target_sets' ? 'number' : 'text'}
                                style={{ background: '#0D1117', border: '1px solid #252B36', borderRadius: 8, padding: '6px 8px', color: '#fff', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                                value={value}
                                {...(field === 'target_sets' ? { min: 0 } : {})}
                                onChange={(e) => {
                                    const val = field === 'target_sets' ? Number(e.target.value) : e.target.value;
                                    updateExercise(ex.exercise_id, field, val);
                                }}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                         <p style={{ width: 40, fontSize: '0.6rem', color: '#8A91A8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Sets</p>
                         <input type="number" min={0} value={ex.target_sets} onChange={(e) => updateExercise(ex.exercise_id, 'target_sets', Number(e.target.value))} style={{ background: '#0D1117', border: '1px solid #252B36', borderRadius: 8, padding: '6px 8px', color: '#fff', fontSize: '0.82rem', width: 60, boxSizing: 'border-box', textAlign: 'center' }} />
                    </div>
                    {Array.from({ length: ex.target_sets }).map((_, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#8A91A8', fontWeight: 600 }}>Set {i+1}</span>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: '#5A6175' }}>reps</span>
                                <input
                                    type="text"
                                    value={repArray[i] || ''}
                                    style={{ background: '#0D1117', border: '1px solid #252B36', borderRadius: 8, padding: '6px 24px 6px 8px', color: '#fff', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
                                    onChange={(e) => updateSpecificSet('target_reps', i, e.target.value)}
                                />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: '#5A6175' }}>kg</span>
                                <input
                                    type="text"
                                    value={weightArray[i] || ''}
                                    style={{ background: '#0D1117', border: '1px solid #252B36', borderRadius: 8, padding: '6px 20px 6px 8px', color: '#fff', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
                                    onChange={(e) => updateSpecificSet('target_weight', i, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Custom Exercise Modal ─────────────────────────────────────────────────────
function CustomExerciseModal({ onClose, onCreated }: {
    onClose: () => void;
    onCreated: (ex: Exercise) => void;
}) {
    const [name, setName] = useState('');
    const [muscleGroup, setMuscleGroup] = useState('');
    const [equipment, setEquipment] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleCreate() {
        if (!name.trim()) { setError('Exercise name is required.'); return; }
        setSaving(true);
        const { data, error: err } = await supabase
            .from('exercises')
            .insert({ name: name.trim(), muscle_group: muscleGroup || null, equipment: equipment || null, category: 'Custom' })
            .select()
            .single();
        if (err || !data) { setError('Failed to create exercise.'); setSaving(false); return; }
        onCreated(data as Exercise);
    }

    const inputStyle: React.CSSProperties = {
        background: '#161B22', border: '1px solid #252B36', borderRadius: 12,
        padding: '11px 14px', color: '#fff', fontSize: '0.88rem',
        width: '100%', boxSizing: 'border-box', outline: 'none',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: '0.72rem', color: '#8A91A8', textTransform: 'uppercase',
        letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6, display: 'block',
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', background: '#1E2430', borderRadius: '24px 24px 0 0', padding: 24, paddingBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Create Custom Exercise</h2>
                    <button onClick={onClose} style={{ background: '#252B36', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
                        <X size={16} color="#8A91A8" />
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={labelStyle}>Exercise Name *</label>
                        <input style={inputStyle} placeholder="e.g. Cable Rope Curl" value={name} onChange={e => setName(e.target.value)} autoFocus />
                    </div>
                    <div>
                        <label style={labelStyle}>Muscle Group</label>
                        <select style={{ ...inputStyle, appearance: 'none' }} value={muscleGroup} onChange={e => setMuscleGroup(e.target.value)}>
                            <option value="">Select muscle group</option>
                            {MUSCLE_GROUPS.filter(m => m !== 'All').map(m => <option key={m} value={m}>{m}</option>)}
                            <option value="Rear Delts">Rear Delts</option>
                            <option value="Lower Back">Lower Back</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Equipment (optional)</label>
                        <input style={inputStyle} placeholder="e.g. Cable, Dumbbell, Barbell…" value={equipment} onChange={e => setEquipment(e.target.value)} />
                    </div>
                    {error && <p style={{ fontSize: '0.82rem', color: '#FF4545', margin: 0 }}>{error}</p>}
                    <button
                        onClick={handleCreate} disabled={saving}
                        style={{ background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 14, padding: '13px', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', marginTop: 4 }}
                    >
                        {saving ? 'Creating…' : 'Create Exercise'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Exercise Library Panel ────────────────────────────────────────────────────
function ExerciseLibrary({
    exercises, loading, selectedIds, onAdd, onShowCustom,
}: {
    exercises: Exercise[];
    loading: boolean;
    selectedIds: Set<string>;
    onAdd: (ex: Exercise) => void;
    onShowCustom: () => void;
}) {
    const [search, setSearch] = useState('');
    const [muscleFilter, setMuscleFilter] = useState('All');

    const filtered = exercises.filter(e => {
        const matchesMuscle = muscleFilter === 'All' || e.muscle_group === muscleFilter || e.muscle_group?.includes(muscleFilter);
        const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.muscle_group?.toLowerCase().includes(search.toLowerCase());
        return matchesMuscle && matchesSearch;
    });

    const inputStyle: React.CSSProperties = {
        background: '#161B22', border: '1px solid #252B36', borderRadius: 12,
        padding: '10px 14px', color: '#fff', fontSize: '0.88rem',
        width: '100%', boxSizing: 'border-box', outline: 'none',
    };

    return (
        <div>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
                <Search size={15} color="#8A91A8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input style={{ ...inputStyle, paddingLeft: 36 }} placeholder="Search exercises…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Muscle group filter chips */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                {MUSCLE_GROUPS.map(mg => (
                    <button
                        key={mg}
                        onClick={() => setMuscleFilter(mg)}
                        style={{
                            padding: '5px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                            fontSize: '0.7rem', fontWeight: 600, flexShrink: 0,
                            background: muscleFilter === mg ? '#FF6B35' : '#161B22',
                            color: muscleFilter === mg ? '#fff' : '#8A91A8',
                        }}
                    >
                        {mg}
                    </button>
                ))}
            </div>

            {/* Exercise list */}
            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, scrollbarWidth: 'thin' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#8A91A8', fontSize: '0.85rem', padding: 20 }}>Loading exercises…</p>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <p style={{ color: '#8A91A8', fontSize: '0.85rem', margin: '0 0 10px' }}>No exercises found</p>
                        <button
                            onClick={onShowCustom}
                            style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)', color: '#FF6B35', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                        >
                            + Create &quot;{search || 'Custom'}&quot; Exercise
                        </button>
                    </div>
                ) : (
                    filtered.map(exercise => {
                        const isAdded = selectedIds.has(exercise.id);
                        return (
                            <button
                                key={exercise.id}
                                onClick={() => !isAdded && onAdd(exercise)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '9px 12px', borderRadius: 10, cursor: isAdded ? 'default' : 'pointer',
                                    background: isAdded ? 'rgba(255,107,53,0.08)' : '#161B22',
                                    border: `1px solid ${isAdded ? 'rgba(255,107,53,0.25)' : '#252B36'}`,
                                    textAlign: 'left',
                                }}
                            >
                                <div>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: isAdded ? '#FF6B35' : '#fff', display: 'block' }}>{exercise.name}</span>
                                    <span style={{ fontSize: '0.68rem', color: '#5A6175' }}>
                                        {exercise.muscle_group}{exercise.equipment ? ` · ${exercise.equipment}` : ''}
                                    </span>
                                </div>
                                {isAdded
                                    ? <span style={{ fontSize: '0.68rem', color: '#FF6B35', fontWeight: 600, flexShrink: 0 }}>Added ✓</span>
                                    : <Plus size={14} color="#5A6175" style={{ flexShrink: 0 }} />}
                            </button>
                        );
                    })
                )}
            </div>

            {/* Always-visible Create Custom button */}
            <button
                onClick={onShowCustom}
                style={{
                    width: '100%', marginTop: 10, padding: '10px', borderRadius: 12,
                    background: 'transparent', border: '1px dashed #252B36',
                    color: '#5A6175', cursor: 'pointer', fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
            >
                <Plus size={13} /> Create Custom Exercise
            </button>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function CreateWorkoutForm() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showCustomModal, setShowCustomModal] = useState(false);

    // Mode: 'simple' = flat list, 'weekly' = per-day split
    const [mode, setMode] = useState<'simple' | 'weekly'>('simple');

    // Simple mode state
    const [simpleExercises, setSimpleExercises] = useState<RoutineDayExercise[]>([]);

    // Weekly mode state
    const [days, setDays] = useState<DayState[]>(() =>
        WEEK_DAYS.map((d, i) => ({
            ...d,
            color: DAY_COLORS[i],
            active: i < 5,
            name: ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Rest', 'Rest'][i],
            exercises: [],
            collapsed: false,
        }))
    );
    const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

    useEffect(() => {
        async function init() {
            setLoading(true);
            const { data } = await supabase.from('exercises').select('*').order('name');
            if (data) setExercises(data as Exercise[]);

            if (editId) {
                const { data: routineData } = await supabase
                    .from('routines')
                    .select('*')
                    .eq('id', editId)
                    .single();
                
                if (routineData) {
                    setName(routineData.name);
                    setDescription(routineData.description || '');
                    
                    const { data: exercisesData } = await supabase
                        .from('routine_exercises')
                        .select('*, exercise:exercises(name)')
                        .eq('routine_id', editId)
                        .order('order_index');
                        
                    if (routineData.schedule) {
                        setMode('weekly');
                        const savedDays = routineData.schedule as { day: string; active: boolean; name: string; color: string; exercises?: RoutineDayExercise[] }[];
                        
                        // Group exercises by their appearance order (since we flattened them, we can distribute them back to the active days in order)
                        // A more robust way is to just assign them to the days based on order. Wait, without a 'day' column in routine_exercises, how do we know which exercise went to which day if the counts differ?
                        // Well, this is a flaw in my original schema design. The easiest fix for the MVP without changing DB is to assume the user hasn't edited the DB directly.
                        // Actually, wait, let's just make it simpler: if we have exercises, let's just dump them into the *first* active day if we can't figure it out, OR let's just append `day: string` to the schedule JSON when saving!
                        // That means *past* routines won't load perfectly into days, but future ones will if we change `handleSave`. Since there are no past routines yet (user just asked), let's change `handleSave` to store `exercises` directly in `schedule` json!
                        
                        setDays(prev => prev.map(d => {
                            const savedDay = savedDays.find(sd => sd.day === d.day);
                            if (savedDay) {
                                return { 
                                    ...d, 
                                    active: savedDay.active, 
                                    name: savedDay.name, 
                                    color: savedDay.color,
                                    exercises: savedDay.exercises || [] // Load exercises from JSON!
                                };
                            }
                            return d;
                        }));
                    } else {
                        setMode('simple');
                        if (exercisesData) {
                            setSimpleExercises(exercisesData.map((e: { exercise_id: string; exercise?: { name: string }; target_sets?: number; target_reps?: string | number; target_weight?: string | number }) => ({
                                exercise_id: e.exercise_id,
                                exercise_name: e.exercise?.name || 'Unknown',
                                target_sets: e.target_sets || 3,
                                target_reps: e.target_reps ? String(e.target_reps) : '10',
                                target_weight: e.target_weight || 0
                            })));
                        }
                    }
                }
            }
            setLoading(false);
        }
        init();
    }, [editId]);

    // ── Simple mode helpers ──────────────────────────────────────────────────
    function addSimpleExercise(ex: Exercise) {
        if (simpleExercises.some(e => e.exercise_id === ex.id)) return;
        setSimpleExercises(prev => [...prev, { exercise_id: ex.id, exercise_name: ex.name, target_sets: 3, target_reps: '10', target_weight: 0 }]);
    }
    function removeSimpleExercise(id: string) { setSimpleExercises(prev => prev.filter(e => e.exercise_id !== id)); }
    function updateSimpleExercise(id: string, field: keyof RoutineDayExercise, value: string | number) {
        setSimpleExercises(prev => prev.map(e => e.exercise_id === id ? { ...e, [field]: value } : e));
    }

    // ── Weekly mode helpers ──────────────────────────────────────────────────
    function toggleDayActive(i: number) {
        setDays(prev => prev.map((d, idx) => idx === i ? { ...d, active: !d.active } : d));
    }
    function setDayName(i: number, newName: string) {
        setDays(prev => prev.map((d, idx) => idx === i ? { ...d, name: newName } : d));
    }
    function addDayExercise(dayIndex: number, ex: Exercise) {
        setDays(prev => prev.map((d, i) => i !== dayIndex ? d : {
            ...d,
            exercises: d.exercises.some(e => e.exercise_id === ex.id)
                ? d.exercises
                : [...d.exercises, { exercise_id: ex.id, exercise_name: ex.name, target_sets: 3, target_reps: '10', target_weight: 0 }]
        }));
    }
    function removeDayExercise(dayIndex: number, exId: string) {
        setDays(prev => prev.map((d, i) => i !== dayIndex ? d : { ...d, exercises: d.exercises.filter(e => e.exercise_id !== exId) }));
    }
    function updateDayExercise(dayIndex: number, exId: string, field: keyof RoutineDayExercise, value: string | number) {
        setDays(prev => prev.map((d, i) => i !== dayIndex ? d : {
            ...d, exercises: d.exercises.map(e => e.exercise_id === exId ? { ...e, [field]: value } : e)
        }));
    }
    function toggleDayCollapsed(i: number) {
        setDays(prev => prev.map((d, idx) => idx === i ? { ...d, collapsed: !d.collapsed } : d));
    }

    // DnD (simple mode)
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSimpleExercises(items => {
                const oldIndex = items.findIndex(i => i.exercise_id === active.id);
                const newIndex = items.findIndex(i => i.exercise_id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    // Custom exercise created
    function handleCustomCreated(ex: Exercise) {
        setExercises(prev => [...prev, ex].sort((a, b) => a.name.localeCompare(b.name)));
        setShowCustomModal(false);
        if (mode === 'simple') {
            addSimpleExercise(ex);
        } else if (activeDayIndex !== null) {
            addDayExercise(activeDayIndex, ex);
        }
    }

    // ── Save ─────────────────────────────────────────────────────────────────
    async function handleSave() {
        if (!name.trim()) { setError('Please enter a routine name.'); return; }

        const hasExercises = mode === 'simple'
            ? simpleExercises.length > 0
            : days.some(d => d.active && d.exercises.length > 0 && d.name !== 'Rest');

        if (!hasExercises) { setError('Please add at least one exercise.'); return; }

        setSaving(true); setError('');

        // Build schedule JSON for weekly mode. AND SAVE EXERCISES IN IT so we can load them easily!
        const schedule = mode === 'weekly'
            ? days.map(d => ({ 
                day: d.day, label: d.label, name: d.name, color: d.color, active: d.active,
                exercises: d.active && d.name !== 'Rest' ? d.exercises : [] 
              }))
            : null;

        let routineId = editId;

        if (editId) {
            const { error: updateErr } = await supabase
                .from('routines')
                .update({ name: name.trim(), description: description.trim() || null, schedule })
                .eq('id', editId);
            if (updateErr) { setError('Failed to update routine.'); setSaving(false); return; }
            
            // Delete old exercises
            await supabase.from('routine_exercises').delete().eq('routine_id', editId);
        } else {
            if (!user) return;
            const { data: routine, error: routineErr } = await supabase
                .from('routines')
                .insert({ user_id: user.id, name: name.trim(), description: description.trim() || null, schedule })
                .select()
                .single();

            if (routineErr || !routine) { setError('Failed to create routine.'); setSaving(false); return; }
            routineId = routine.id;
        }

        // Insert routine_exercises
        const allExercises: { exercise_id: string; order_index: number; target_sets: number; target_reps: string | number; target_weight: string | number | null }[] = [];

        if (mode === 'simple') {
            simpleExercises.forEach((e, idx) => allExercises.push({
                exercise_id: e.exercise_id, order_index: idx,
                target_sets: e.target_sets, target_reps: e.target_reps,
                target_weight: e.target_weight || null,
            }));
        } else {
            let orderIdx = 0;
            days.forEach(d => {
                if (!d.active || d.name === 'Rest') return;
                d.exercises.forEach(e => allExercises.push({
                    exercise_id: e.exercise_id, order_index: orderIdx++,
                    target_sets: e.target_sets, target_reps: e.target_reps,
                    target_weight: e.target_weight || null,
                }));
            });
        }

        if (allExercises.length > 0 && routineId) {
            await supabase.from('routine_exercises').insert(allExercises.map(e => ({ ...e, routine_id: routineId })));
        }

        router.push('/workouts');
    }

    const inputStyle: React.CSSProperties = {
        background: '#1E2430', border: '1px solid #252B36', borderRadius: 14,
        padding: '12px 16px', color: '#fff', fontSize: '0.9rem',
        outline: 'none', width: '100%', boxSizing: 'border-box',
    };

    const simpleSelectedIds = new Set(simpleExercises.map(e => e.exercise_id));

    return (
        <div style={{ padding: '0 16px 120px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 24, paddingBottom: 16 }}>
                <button onClick={() => router.back()} style={{ background: '#1E2430', border: '1px solid #252B36', borderRadius: 12, padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#fff' }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                        {editId ? 'Edit Routine' : 'Create Routine'}
                    </h1>
                    <p style={{ fontSize: '0.8rem', color: '#8A91A8', margin: 0 }}>
                        {editId ? 'Update your workout plan' : 'Build your workout plan'}
                    </p>
                </div>
            </div>

            {/* Routine Details */}
            <div className="card" style={{ padding: 16, marginBottom: 14, borderRadius: 20 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <label style={{ fontSize: '0.72rem', color: '#8A91A8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Routine Name *</label>
                        <input style={inputStyle} placeholder="e.g. 5-Day PPL, Push Day…" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.72rem', color: '#8A91A8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Description</label>
                        <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} placeholder="Describe your routine…" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {([['simple', List, 'Single List'], ['weekly', Calendar, 'Weekly Split']] as const).map(([m, Icon, label]) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                            flex: 1, padding: '10px 8px', borderRadius: 14, border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            fontSize: '0.82rem', fontWeight: 600,
                            background: mode === m ? '#FF6B35' : '#1E2430',
                            color: mode === m ? '#fff' : '#8A91A8',
                        }}
                    >
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {/* ── SIMPLE MODE ─────────────────────────────────────────────── */}
            {mode === 'simple' && (
                <>
                    {/* Exercise Library */}
                    <div className="card" style={{ padding: 16, marginBottom: 14, borderRadius: 20 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Exercise Library</p>
                        <ExerciseLibrary
                            exercises={exercises}
                            loading={loading}
                            selectedIds={simpleSelectedIds}
                            onAdd={addSimpleExercise}
                            onShowCustom={() => { setActiveDayIndex(null); setShowCustomModal(true); }}
                        />
                    </div>

                    {/* Selected exercises */}
                    {simpleExercises.length > 0 && (
                        <div className="card" style={{ padding: 16, marginBottom: 14, borderRadius: 20 }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                                Routine ({simpleExercises.length} exercise{simpleExercises.length !== 1 ? 's' : ''})
                            </p>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={simpleExercises.map(e => e.exercise_id)} strategy={verticalListSortingStrategy}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {simpleExercises.map(ex => (
                                            <SortableExerciseItem key={ex.exercise_id} ex={ex} updateExercise={updateSimpleExercise} removeExercise={removeSimpleExercise} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}
                </>
            )}

            {/* ── WEEKLY SPLIT MODE ──────────────────────────────────────── */}
            {mode === 'weekly' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {days.map((day, i) => (
                        <div
                            key={day.day}
                            style={{
                                borderRadius: 20, border: `1px solid ${day.active ? day.color + '44' : '#252B36'}`,
                                background: '#1E2430', overflow: 'hidden',
                            }}
                        >
                            {/* Day header row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                                {/* Toggle active */}
                                <button
                                    onClick={() => toggleDayActive(i)}
                                    style={{
                                        width: 22, height: 22, borderRadius: 6, border: 'none', flexShrink: 0, cursor: 'pointer',
                                        background: day.active ? day.color : '#252B36',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    {day.active && <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
                                </button>

                                {/* Day label */}
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: day.active ? day.color : '#5A6175', width: 30, flexShrink: 0 }}>{day.day}</span>

                                {/* Day name (editable if active) */}
                                {day.active ? (
                                    <select
                                        value={DAY_PRESETS.includes(day.name) ? day.name : 'Custom'}
                                        onChange={e => setDayName(i, e.target.value === 'Custom' ? '' : e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', flex: 1, outline: 'none' }}
                                    >
                                        {DAY_PRESETS.map(p => <option key={p} value={p} style={{ background: '#1E2430' }}>{p}</option>)}
                                    </select>
                                ) : (
                                    <span style={{ fontSize: '0.88rem', color: '#5A6175', flex: 1, fontWeight: 600 }}>{day.name || 'Rest'}</span>
                                )}

                                {day.active && day.name !== 'Rest' && (
                                    <>
                                        <span style={{ fontSize: '0.7rem', color: '#5A6175', flexShrink: 0 }}>
                                            {day.exercises.length > 0 ? `${day.exercises.length} ex` : ''}
                                        </span>
                                        <button
                                            onClick={() => toggleDayCollapsed(i)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6175', display: 'flex', padding: 4 }}
                                        >
                                            {day.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Day body */}
                            {day.active && day.name !== 'Rest' && !day.collapsed && (
                                <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${day.color}22` }}>
                                    {/* Exercise Library for this day */}
                                    <div style={{ marginBottom: 10 }}>
                                        <ExerciseLibrary
                                            exercises={exercises}
                                            loading={loading}
                                            selectedIds={new Set(day.exercises.map(e => e.exercise_id))}
                                            onAdd={ex => addDayExercise(i, ex)}
                                            onShowCustom={() => { setActiveDayIndex(i); setShowCustomModal(true); }}
                                        />
                                    </div>

                                    {/* Selected exercises for this day */}
                                    {day.exercises.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: day.color, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0 4px' }}>
                                                {day.name} · {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                                            </p>
                                            {day.exercises.map(ex => (
                                                <SortableExerciseItem
                                                    key={ex.exercise_id}
                                                    ex={ex}
                                                    updateExercise={(id, field, val) => updateDayExercise(i, id, field, val)}
                                                    removeExercise={id => removeDayExercise(i, id)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(255,69,69,0.1)', border: '1px solid rgba(255,69,69,0.25)', borderRadius: 14, margin: '14px 0', fontSize: '0.85rem', color: '#FF4545' }}>
                    {error}
                </div>
            )}

            {/* Save button */}
            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    width: '100%', marginTop: 16, padding: '14px', borderRadius: 16, border: 'none',
                    background: saving ? '#252B36' : '#FF6B35', color: '#fff',
                    fontWeight: 700, fontSize: '0.95rem', cursor: saving ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
            >
                <Dumbbell size={16} />
                {saving ? 'Saving…' : 'Save Routine'}
            </button>

            {/* Custom Exercise Modal */}
            {showCustomModal && (
                <CustomExerciseModal
                    onClose={() => setShowCustomModal(false)}
                    onCreated={handleCustomCreated}
                />
            )}
        </div>
    );
}

export default function CreateWorkoutPage() {

    return (
        <Suspense fallback={<div style={{ padding: 24, color: '#8A91A8', textAlign: 'center' }}>Loading editor...</div>}>
            <CreateWorkoutForm />
        </Suspense>
    );
}
