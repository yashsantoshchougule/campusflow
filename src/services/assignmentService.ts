import { academicsService } from '../features/academics/service.ts';
import type { AssignmentInput } from '../types/dashboard';

export const createAssignment = async (input: AssignmentInput) => {
  const subjects = await academicsService.getSubjects();
  const requested = input.subject?.trim().toLowerCase();
  const subject = requested ? subjects.find((item) => item.name.toLowerCase() === requested || item.code.toLowerCase() === requested) : subjects[0];
  if (!subject) throw new Error(requested ? 'Use an existing subject name or code.' : 'Create a subject in Academics first.');
  return academicsService.createAssignment({
    subjectId: subject.id, title: input.title, description: input.description ?? '', deadline: input.dueAt,
    estimatedMinutes: 30, difficulty: 'Medium', priority: 'Medium',
  });
};
export const completeAssignment = (id: string) => academicsService.completeAssignment(id);
export const getAssignments = () => academicsService.getAssignments();
