import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileService, validateProfile, validateStudyPreferences } from '../src/features/profile/service.ts';
import { LocalProfileRepository, defaultProfile, defaultStudyPreferences, type AvatarRepository, type ProfileRepository } from '../src/features/profile/repository.ts';
import type { StudentProfile, StudyPreferences } from '../src/features/profile/models.ts';
import type { Subject } from '../src/features/academics/models.ts';

const subject = (id: string, strengthLevel: Subject['strengthLevel']): Subject => ({ id, name: id, code: id, facultyName: '', credits: 3, difficulty: 'Medium', strengthLevel, attendanceTarget: 75, colour: '', createdAt: '', updatedAt: '' });
const subjects = [subject('strong', 'Strong'), subject('weak', 'Weak')];
const validProfile = (): StudentProfile => ({ ...defaultProfile(), fullName: 'Yash Student', email: 'yash@example.com', studentId: 'S100', college: 'Campus College', course: 'BSc', department: 'IT', semester: '5' });

class MemoryProfileRepository implements ProfileRepository {
  profile = defaultProfile(); preferences = defaultStudyPreferences();
  async getProfile() { return this.profile; } async saveProfile(value: StudentProfile) { this.profile = value; return value; }
  async getStudyPreferences() { return this.preferences; } async saveStudyPreferences(value: StudyPreferences) { this.preferences = value; return value; }
  subscribe() { return () => undefined; }
}
class MemoryAvatarRepository implements AvatarRepository { files = new Map<string, Blob>(); async save(file: File) { this.files.set('avatar-1', file); return 'avatar-1'; } async get(id: string) { return this.files.get(id) ?? null; } async delete(id: string) { this.files.delete(id); } }

test('profile validation rejects missing required fields and accepts valid values', () => {
  assert.throws(() => validateProfile(defaultProfile()), /required/); assert.doesNotThrow(() => validateProfile(validProfile()));
});

test('profile and preferences save through repositories', async () => {
  const repository = new MemoryProfileRepository(); const service = new ProfileService(repository, new MemoryAvatarRepository());
  assert.equal((await service.saveProfile(validProfile())).fullName, 'Yash Student');
  const value = { ...defaultStudyPreferences(), strongSubjectIds: ['strong'], weakSubjectIds: ['weak'], attendanceTargetPercent: 80 };
  assert.equal((await service.savePreferences(value, subjects)).attendanceTargetPercent, 80);
});

test('study preferences reject invalid targets and unknown subject IDs', () => {
  assert.throws(() => validateStudyPreferences({ ...defaultStudyPreferences(), attendanceTargetPercent: 101 }, subjects), /between 1 and 100/);
  assert.throws(() => validateStudyPreferences({ ...defaultStudyPreferences(), strongSubjectIds: ['unknown'] }, subjects), /unknown subject/);
});

test('AI suggestions remain separate until the student explicitly saves', async () => {
  const repository = new MemoryProfileRepository(); const service = new ProfileService(repository, new MemoryAvatarRepository()); const suggestion = service.suggestPreferences(subjects);
  assert.deepEqual(suggestion.strongSubjectIds, ['strong']); assert.deepEqual((await repository.getStudyPreferences()).strongSubjectIds, []);
});

test('local profile storage rejects avatar base64 and stores file IDs only', async () => {
  const values = new Map<string, string>(); Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { length: 0, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } });
  const repository = new LocalProfileRepository(); await assert.rejects(() => repository.saveProfile({ ...validProfile(), avatarFileId: 'data:image/png;base64,abc' }), /file IDs/);
  await repository.saveProfile({ ...validProfile(), avatarFileId: 'avatar-1' }); assert.doesNotMatch(values.get('campusflow_profile') ?? '', /base64/);
});

