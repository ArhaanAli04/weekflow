import {
  getWeekId,
  getWeekLabel,
  generateEmptyWeek,
  getDatesInWeek,
  getDayLabel,
  isCurrentWeek,
  getPreviousWeekId,
  getNextWeekId,
  calculateCompletionRate,
  calculateWeekScore,
} from '../weekUtils';
import type { Task, Week, Report } from '../../types';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeTask(done: boolean): Task {
  return {
    id: Math.random().toString(),
    week_id: '2025-05-19',
    user_id: 'u1',
    title: 'task',
    category: 'Work',
    priority: 'Medium',
    estimated_hours: 1,
    done,
    done_at: done ? '2025-05-20T10:00:00.000Z' : null,
    carried_over_from: null,
    created_at: '2025-05-19T00:00:00.000Z',
  };
}

function makeWeek(overrides: Partial<Week> = {}): Week {
  return {
    id: '2025-05-19',
    user_id: 'u1',
    label: 'May 19 – May 25, 2025',
    intention: null,
    energy_start: null,
    energy_end: null,
    focus_hours: 0,
    timer_running: false,
    timer_started_at: null,
    report_generated: false,
    created_at: '2025-05-19T00:00:00.000Z',
    ...overrides,
  };
}

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'r1',
    week_id: '2025-05-19',
    user_id: 'u1',
    overall_score: 75,
    grade: 'B',
    headline: 'Solid week',
    wins: [],
    improvements: [],
    capacity_insight: '',
    focus_suggestion: '',
    next_week_goal: '',
    motivational_note: '',
    raw_json: {},
    created_at: '2025-05-26T10:00:00.000Z',
    ...overrides,
  };
}

// ─── getWeekId ───────────────────────────────────────────────────────────────

describe('getWeekId', () => {
  it('returns the same Monday for a Monday input', () => {
    expect(getWeekId(new Date(2025, 4, 19))).toBe('2025-05-19'); // Mon
  });

  it('snaps a Tuesday back to its Monday', () => {
    expect(getWeekId(new Date(2025, 4, 20))).toBe('2025-05-19'); // Tue → Mon
  });

  it('snaps a Wednesday back to its Monday', () => {
    expect(getWeekId(new Date(2025, 4, 21))).toBe('2025-05-19'); // Wed → Mon
  });

  it('snaps a Sunday back 6 days to Monday', () => {
    expect(getWeekId(new Date(2025, 4, 25))).toBe('2025-05-19'); // Sun → Mon
  });

  it('handles a Saturday correctly', () => {
    expect(getWeekId(new Date(2025, 4, 24))).toBe('2025-05-19'); // Sat → Mon
  });

  it('crosses month boundaries correctly', () => {
    // Thursday June 5 → Monday June 2
    expect(getWeekId(new Date(2025, 5, 5))).toBe('2025-06-02');
  });

  it('crosses year boundaries correctly', () => {
    // Wednesday Jan 1 2025 → Monday Dec 30 2024
    expect(getWeekId(new Date(2025, 0, 1))).toBe('2024-12-30');
  });

  it('defaults to the current week when called with no argument', () => {
    const result = getWeekId();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(result + 'T00:00:00').getDay()).toBe(1); // always a Monday
  });
});

// ─── getWeekLabel ─────────────────────────────────────────────────────────────

describe('getWeekLabel', () => {
  it('formats a week within a single month', () => {
    expect(getWeekLabel('2025-05-19')).toBe('May 19 – May 25, 2025');
  });

  it('formats a week that crosses a month boundary', () => {
    expect(getWeekLabel('2025-05-26')).toBe('May 26 – Jun 1, 2025');
  });

  it('formats a week that crosses a year boundary', () => {
    expect(getWeekLabel('2024-12-30')).toBe('Dec 30 – Jan 5, 2025');
  });
});

// ─── generateEmptyWeek ───────────────────────────────────────────────────────

describe('generateEmptyWeek', () => {
  const week = generateEmptyWeek('2025-05-19', 'user-abc');

  it('sets id to weekId', () => {
    expect(week.id).toBe('2025-05-19');
  });

  it('sets user_id', () => {
    expect(week.user_id).toBe('user-abc');
  });

  it('sets label from getWeekLabel', () => {
    expect(week.label).toBe(getWeekLabel('2025-05-19'));
  });

  it('initialises all nullable fields to null', () => {
    expect(week.intention).toBeNull();
    expect(week.energy_start).toBeNull();
    expect(week.energy_end).toBeNull();
    expect(week.timer_started_at).toBeNull();
  });

  it('initialises numeric and boolean defaults', () => {
    expect(week.focus_hours).toBe(0);
    expect(week.timer_running).toBe(false);
    expect(week.report_generated).toBe(false);
  });

  it('sets created_at to a valid ISO string', () => {
    expect(() => new Date(week.created_at)).not.toThrow();
    expect(new Date(week.created_at).toISOString()).toBe(week.created_at);
  });
});

// ─── getDatesInWeek ──────────────────────────────────────────────────────────

describe('getDatesInWeek', () => {
  const dates = getDatesInWeek('2025-05-19');

  it('returns exactly 7 dates', () => {
    expect(dates).toHaveLength(7);
  });

  it('first date is a Monday', () => {
    expect(dates[0].getDay()).toBe(1);
  });

  it('last date is a Sunday', () => {
    expect(dates[6].getDay()).toBe(0);
  });

  it('dates are sequential (one day apart)', () => {
    for (let i = 1; i < 7; i++) {
      const diff = dates[i].getTime() - dates[i - 1].getTime();
      expect(diff).toBe(24 * 60 * 60 * 1000);
    }
  });

  it('works across a month boundary', () => {
    const crossMonth = getDatesInWeek('2025-05-26');
    expect(crossMonth[0].getMonth()).toBe(4); // May (0-indexed)
    expect(crossMonth[6].getMonth()).toBe(5); // June
    expect(crossMonth[6].getDate()).toBe(1);
  });
});

// ─── getDayLabel ─────────────────────────────────────────────────────────────

describe('getDayLabel', () => {
  const cases: [number, string][] = [
    [0, 'Sunday'],
    [1, 'Monday'],
    [2, 'Tuesday'],
    [3, 'Wednesday'],
    [4, 'Thursday'],
    [5, 'Friday'],
    [6, 'Saturday'],
  ];

  cases.forEach(([dayIndex, label]) => {
    it(`returns ${label} for getDay() === ${dayIndex}`, () => {
      const dates = getDatesInWeek('2025-05-19'); // Mon–Sun
      // dates[0]=Mon(1), dates[6]=Sun(0); map index to correct day
      const dayMap: Record<number, Date> = {};
      dates.forEach((d) => { dayMap[d.getDay()] = d; });
      expect(getDayLabel(dayMap[dayIndex])).toBe(label);
    });
  });
});

// ─── isCurrentWeek ───────────────────────────────────────────────────────────

describe('isCurrentWeek', () => {
  it('returns true for the current week', () => {
    expect(isCurrentWeek(getWeekId())).toBe(true);
  });

  it('returns false for a past week', () => {
    expect(isCurrentWeek('2020-01-06')).toBe(false);
  });

  it('returns false for a future week', () => {
    expect(isCurrentWeek('2099-01-04')).toBe(false);
  });
});

// ─── getPreviousWeekId ───────────────────────────────────────────────────────

describe('getPreviousWeekId', () => {
  it('returns the Monday 7 days earlier', () => {
    expect(getPreviousWeekId('2025-05-19')).toBe('2025-05-12');
  });

  it('crosses a month boundary correctly', () => {
    expect(getPreviousWeekId('2025-05-05')).toBe('2025-04-28');
  });

  it('crosses a year boundary correctly', () => {
    expect(getPreviousWeekId('2025-01-06')).toBe('2024-12-30');
  });
});

// ─── getNextWeekId ───────────────────────────────────────────────────────────

describe('getNextWeekId', () => {
  it('returns the Monday 7 days later', () => {
    expect(getNextWeekId('2025-05-19')).toBe('2025-05-26');
  });

  it('crosses a month boundary correctly', () => {
    expect(getNextWeekId('2025-05-26')).toBe('2025-06-02');
  });

  it('crosses a year boundary correctly', () => {
    expect(getNextWeekId('2024-12-30')).toBe('2025-01-06');
  });

  it('is the inverse of getPreviousWeekId', () => {
    const weekId = '2025-05-19';
    expect(getNextWeekId(getPreviousWeekId(weekId))).toBe(weekId);
    expect(getPreviousWeekId(getNextWeekId(weekId))).toBe(weekId);
  });
});

// ─── calculateCompletionRate ─────────────────────────────────────────────────

describe('calculateCompletionRate', () => {
  it('returns 0 for an empty task list', () => {
    expect(calculateCompletionRate([])).toBe(0);
  });

  it('returns 100 when all tasks are done', () => {
    expect(calculateCompletionRate([makeTask(true), makeTask(true), makeTask(true)])).toBe(100);
  });

  it('returns 0 when no tasks are done', () => {
    expect(calculateCompletionRate([makeTask(false), makeTask(false)])).toBe(0);
  });

  it('returns 50 for half done', () => {
    expect(calculateCompletionRate([makeTask(true), makeTask(false)])).toBe(50);
  });

  it('rounds to nearest integer (1 of 3 → 33)', () => {
    expect(calculateCompletionRate([makeTask(true), makeTask(false), makeTask(false)])).toBe(33);
  });

  it('rounds to nearest integer (2 of 3 → 67)', () => {
    expect(calculateCompletionRate([makeTask(true), makeTask(true), makeTask(false)])).toBe(67);
  });
});

// ─── calculateWeekScore ──────────────────────────────────────────────────────

describe('calculateWeekScore', () => {
  it('returns report.overall_score directly when a report is provided', () => {
    expect(calculateWeekScore(makeWeek(), [], makeReport({ overall_score: 88 }))).toBe(88);
  });

  it('returns report.overall_score regardless of tasks when report present', () => {
    const tasks = [makeTask(false), makeTask(false)];
    expect(calculateWeekScore(makeWeek(), tasks, makeReport({ overall_score: 42 }))).toBe(42);
  });

  it('scores a perfect week at 100 (all done, max energy, max focus)', () => {
    const tasks = [makeTask(true), makeTask(true), makeTask(true)];
    const week = makeWeek({ energy_end: 5, focus_hours: 10 });
    // completionPoints = 80, energyPoints = 10, focusPoints = 10 → 100
    expect(calculateWeekScore(week, tasks)).toBe(100);
  });

  it('does not exceed 100 even with very high focus hours', () => {
    const tasks = [makeTask(true)];
    const week = makeWeek({ energy_end: 5, focus_hours: 100 });
    expect(calculateWeekScore(week, tasks)).toBeLessThanOrEqual(100);
  });

  it('scores zero tasks with neutral defaults correctly', () => {
    const week = makeWeek({ energy_end: null, energy_start: null, focus_hours: 0 });
    // doneRatio=0, energyEnd=3 → energyPoints=6, focusPoints=0 → round(6) = 6
    expect(calculateWeekScore(week, [])).toBe(6);
  });

  it('uses energy_start as fallback when energy_end is null', () => {
    const week = makeWeek({ energy_start: 5, energy_end: null, focus_hours: 0 });
    const scoreWithFallback = calculateWeekScore(week, []);
    const weekExplicit = makeWeek({ energy_start: 5, energy_end: 5, focus_hours: 0 });
    expect(scoreWithFallback).toBe(calculateWeekScore(weekExplicit, []));
  });

  it('caps focus points at 10 (i.e., more than 10h does not add more points)', () => {
    const w10 = makeWeek({ energy_end: 3, focus_hours: 10 });
    const w20 = makeWeek({ energy_end: 3, focus_hours: 20 });
    expect(calculateWeekScore(w10, [])).toBe(calculateWeekScore(w20, []));
  });

  it('80% completion gives a B-range score with neutral energy and no focus', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => makeTask(i < 4)); // 4 of 5 done
    const week = makeWeek({ energy_end: 3, focus_hours: 0 });
    // completionPoints = 0.8*80 = 64, energyPoints = 6, focusPoints = 0 → 70
    const score = calculateWeekScore(week, tasks);
    expect(score).toBeGreaterThanOrEqual(65); // B threshold
    expect(score).toBeLessThan(80);           // below A
  });
});
