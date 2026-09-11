/**
 * Adapted from 75 Club lib/attendance.ts (MIT), commit
 * 0b53ecd3c6cddadd786bf09a4379595e05bd41a2. See THIRD_PARTY_NOTICES.md.
 */
import type {
  AttendanceForecast, AttendanceRecord, AttendanceRisk, AttendanceStats,
  AttendanceDecision, AttendanceSubjectContext, AttendanceSubjectSummary, DateRangeProjection, TimetableAttendanceLink,
} from './models';

const clampCount = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;

export function getAttendancePercentage(present: number, total: number): number {
  const conducted = clampCount(total);
  if (conducted === 0) return 0;
  return Math.min(100, clampCount(present) / conducted * 100);
}

export function getSafeBunks(present: number, total: number, threshold: number): number {
  if (total <= 0 || threshold <= 0 || threshold > 100) return 0;
  const [target, scale] = ratio(threshold);
  return Math.max(0, Math.floor((clampCount(present) * 100 * scale - target * clampCount(total)) / target));
}

export function getRecoveryClasses(present: number, total: number, threshold: number): number | null {
  if (threshold <= 0 || threshold > 100) return 0;
  const [target, scale] = ratio(threshold);
  if (clampCount(present) * 100 * scale >= target * clampCount(total)) return 0;
  if (threshold === 100) return null;
  return Math.max(0, Math.ceil((target * clampCount(total) - clampCount(present) * 100 * scale) / (100 * scale - target)));
}

export const getRequiredClasses = getRecoveryClasses;

export function getAttendanceStatus(present: number, total: number, threshold: number): AttendanceRisk {
  if (total <= 0) return 'warning';
  if (getAttendancePercentage(present, total) < threshold) return 'danger';
  return getSafeBunks(present, total, threshold) > 0 ? 'safe' : 'warning';
}

export function forecastAttendance(present: number, total: number, attended = 0, missed = 0, threshold = 75): AttendanceForecast {
  const nextPresent = clampCount(present) + clampCount(attended);
  const nextTotal = clampCount(total) + clampCount(attended) + clampCount(missed);
  return {
    presentClasses: nextPresent,
    totalClasses: nextTotal,
    percentage: getAttendancePercentage(nextPresent, nextTotal),
    safeBunks: getSafeBunks(nextPresent, nextTotal, threshold),
    recoveryClasses: getRecoveryClasses(nextPresent, nextTotal, threshold),
    status: getAttendanceStatus(nextPresent, nextTotal, threshold),
  };
}

export const attendanceAfterAttending = (present: number, total: number) => getAttendancePercentage(present + 1, total + 1);
export const attendanceAfterMissing = (present: number, total: number) => getAttendancePercentage(present, total + 1);

const ratio = (value: number): [number, number] => {
  const [, decimals = ''] = String(value).split('.');
  const scale = 10 ** decimals.length;
  return [Math.round(value * scale), scale];
};

export function getAttendanceDecision(present: number, total: number, threshold: number | null, safetyBuffer = 5, countable = true): AttendanceDecision {
  const empty = (status: AttendanceDecision['status'], reason: string): AttendanceDecision => ({ status, reason, currentPercentage: null, afterAttending: null, afterMissing: null, officialThreshold: threshold, safetyTarget: threshold === null ? null : Math.min(100, threshold + Math.max(0, safetyBuffer)) });
  if (!countable) return empty('NOT_COUNTABLE_OR_CANCELLED', 'This lecture is cancelled or is not confirmed as countable.');
  if (total <= 0 || threshold === null || threshold < 0 || threshold > 100) return empty('INSUFFICIENT_DATA', 'A countable attendance denominator and official threshold are required.');
  const [target, scale] = ratio(threshold);
  const safetyTarget = Math.min(100, threshold + Math.max(0, safetyBuffer));
  const [safeTarget, safeScale] = ratio(safetyTarget);
  const belowOfficial = clampCount(present) * 100 * scale < target * clampCount(total);
  const missBelowOfficial = clampCount(present) * 100 * scale < target * (clampCount(total) + 1);
  const missAboveBuffer = clampCount(present) * 100 * safeScale >= safeTarget * (clampCount(total) + 1);
  const values = { currentPercentage: getAttendancePercentage(present, total), afterAttending: attendanceAfterAttending(present, total), afterMissing: attendanceAfterMissing(present, total), officialThreshold: threshold, safetyTarget };
  if (belowOfficial) return { status: 'MUST_ATTEND', reason: 'Attendance is below the official threshold; missing increases the recovery required.', ...values };
  if (missBelowOfficial) return { status: 'ATTEND_RECOMMENDED', reason: 'Missing this lecture would move attendance below the official threshold.', ...values };
  if (missAboveBuffer) return { status: 'ABOVE_BUFFER', reason: 'Attendance is projected to remain above your selected safety buffer if you miss; attending may still be academically beneficial.', ...values };
  return { status: 'ATTEND_RECOMMENDED', reason: 'Missing this lecture would use the selected safety buffer.', ...values };
}

export function summarizeAttendance(subjects: AttendanceSubjectContext[], records: AttendanceRecord[]): AttendanceSubjectSummary[] {
  return subjects.map((subject) => {
    const related = records.filter((record) => record.subjectId === subject.subjectId);
    const presentClasses = related.filter((record) => record.status === 'present').length;
    const absentClasses = related.filter((record) => record.status === 'absent').length;
    const cancelledClasses = related.filter((record) => record.status === 'cancelled').length;
    const totalClasses = presentClasses + absentClasses;
    return {
      ...subject,
      totalClasses,
      presentClasses,
      absentClasses,
      cancelledClasses,
      percentage: getAttendancePercentage(presentClasses, totalClasses),
      safeBunks: getSafeBunks(presentClasses, totalClasses, subject.threshold),
      recoveryClasses: getRecoveryClasses(presentClasses, totalClasses, subject.threshold),
      status: getAttendanceStatus(presentClasses, totalClasses, subject.threshold),
      afterAttending: attendanceAfterAttending(presentClasses, totalClasses),
      afterMissing: attendanceAfterMissing(presentClasses, totalClasses),
    };
  });
}

export function getAggregateStats(subjects: Pick<AttendanceSubjectSummary, 'totalClasses' | 'presentClasses' | 'status'>[]): AttendanceStats {
  const totalClasses = subjects.reduce((sum, subject) => sum + clampCount(subject.totalClasses), 0);
  const totalPresent = subjects.reduce((sum, subject) => sum + Math.min(clampCount(subject.presentClasses), clampCount(subject.totalClasses)), 0);
  return {
    totalClasses,
    totalPresent,
    overallPercentage: getAttendancePercentage(totalPresent, totalClasses),
    atRiskCount: subjects.filter((subject) => subject.status === 'danger').length,
    safeCount: subjects.filter((subject) => subject.status === 'safe').length,
  };
}

export function getAttendanceRecommendation(subject: AttendanceSubjectSummary): string {
  if (subject.totalClasses === 0) return 'Attendance is not available yet because no countable classes are recorded.';
  if (subject.status === 'safe') return `${subject.safeBunks} future class${subject.safeBunks === 1 ? '' : 'es'} could be missed while the calculation remains at or above ${subject.threshold}%; attending may still be academically beneficial.`;
  if (subject.recoveryClasses === null) return 'A 100% target is no longer mathematically reachable without correcting attendance history.';
  if (subject.recoveryClasses > 0) return `Attend the next ${subject.recoveryClasses} class${subject.recoveryClasses === 1 ? '' : 'es'} to recover to ${subject.threshold}%.`;
  return 'Attend the next class to create a safe attendance buffer.';
}

const parseDate = (value: string) => new Date(`${value}T00:00:00`);
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function simulateDateRange(
  subjects: AttendanceSubjectSummary[], timetable: TimetableAttendanceLink[], records: AttendanceRecord[],
  from: string, to: string, assumption: 'present' | 'absent',
): DateRangeProjection[] {
  const start = parseDate(from); const end = parseDate(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) throw new Error('Choose a valid date range.');
  const recorded = new Set(records.filter((record) => record.timetableEntryId).map((record) => `${record.date}:${record.timetableEntryId}`));
  const counts = new Map<string, number>();
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const day = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    for (const entry of timetable.filter((item) => item.dayOfWeek === day)) {
      if (!recorded.has(`${dateKey(date)}:${entry.id}`)) counts.set(entry.subjectId, (counts.get(entry.subjectId) ?? 0) + 1);
    }
  }
  return subjects.map((subject) => {
    const scheduledClasses = counts.get(subject.subjectId) ?? 0;
    return {
      subjectId: subject.subjectId,
      subjectName: subject.name,
      scheduledClasses,
      ...forecastAttendance(subject.presentClasses, subject.totalClasses, assumption === 'present' ? scheduledClasses : 0, assumption === 'absent' ? scheduledClasses : 0, subject.threshold),
    };
  }).filter((projection) => projection.scheduledClasses > 0);
}
