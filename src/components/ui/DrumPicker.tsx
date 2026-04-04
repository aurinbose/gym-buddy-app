'use client';

import { useRef, useEffect, useCallback } from 'react';

interface DrumPickerProps {
    values: (string | number)[];
    selected: string | number;
    onChange: (value: string | number) => void;
    itemHeight?: number;
    visibleCount?: number;
    unit?: string;
}

export default function DrumPicker({
    values,
    selected,
    onChange,
    itemHeight = 44,
    visibleCount = 5,
    unit,
}: DrumPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isScrolling = useRef(false);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedIndex = values.findIndex(v => String(v) === String(selected));
    const containerHeight = itemHeight * visibleCount;
    const padding = itemHeight * Math.floor(visibleCount / 2);

    const snapToIndex = useCallback(
        (index: number) => {
            const el = containerRef.current;
            if (!el) return;
            el.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
            onChange(values[index]);
        },
        [values, itemHeight, onChange]
    );

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollTop = selectedIndex * itemHeight;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleScroll = () => {
        const el = containerRef.current;
        if (!el) return;
        isScrolling.current = true;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            isScrolling.current = false;
            const rawIndex = el.scrollTop / itemHeight;
            const idx = Math.round(rawIndex);
            const clampedIdx = Math.max(0, Math.min(idx, values.length - 1));
            snapToIndex(clampedIdx);
        }, 150);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: containerHeight, userSelect: 'none' }}>
            {/* Selection highlight */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: itemHeight,
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,107,53,0.12)',
                    borderTop: '1px solid rgba(255,107,53,0.35)',
                    borderBottom: '1px solid rgba(255,107,53,0.35)',
                    borderRadius: 8,
                    pointerEvents: 'none',
                    zIndex: 2,
                }}
            />
            {/* Top fade */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: padding,
                    background: 'linear-gradient(to bottom, #161B22 30%, transparent)',
                    zIndex: 3,
                    pointerEvents: 'none',
                }}
            />
            {/* Bottom fade */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: padding,
                    background: 'linear-gradient(to top, #161B22 30%, transparent)',
                    zIndex: 3,
                    pointerEvents: 'none',
                }}
            />
            {/* Scrollable list */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                style={{
                    height: '100%',
                    overflowY: 'scroll',
                    scrollbarWidth: 'none',
                    paddingTop: padding,
                    paddingBottom: padding,
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'y mandatory',
                }}
            >
                {values.map((val, i) => {
                    const isSelected = String(val) === String(selected);
                    const distance = Math.abs(i - selectedIndex);
                    const opacity = distance === 0 ? 1 : distance === 1 ? 0.55 : 0.25;
                    const scale = distance === 0 ? 1 : distance === 1 ? 0.88 : 0.75;

                    return (
                        <div
                            key={val}
                            onClick={() => snapToIndex(i)}
                            style={{
                                height: itemHeight,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                cursor: 'pointer',
                                scrollSnapAlign: 'start',
                                transition: 'all 0.15s ease',
                                opacity,
                                transform: `scale(${scale})`,
                            }}
                        >
                            <span style={{
                                fontSize: isSelected ? '1.25rem' : '1rem',
                                fontWeight: isSelected ? 700 : 400,
                                color: isSelected ? '#fff' : '#8A91A8',
                                transition: 'all 0.15s ease',
                            }}>
                                {val}
                            </span>
                            {unit && isSelected && (
                                <span style={{ fontSize: '0.75rem', color: '#FF6B35', fontWeight: 600 }}>
                                    {unit}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
