import { chatWithAssistant } from './api';
import api from './api';
import type { AssistantChatRequest } from '../types';

export const sendAssistantMessage = (input: AssistantChatRequest) => chatWithAssistant(input).then(({ data }) => data);
export const askCampusFlow = (question: string) => api.post('/api/assistant/dashboard-question', { question }).then(({ data }) => data);
