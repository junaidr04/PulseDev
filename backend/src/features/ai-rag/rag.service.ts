import { aiDeepAudit, aiGenerateSprint, aiInterviewQA } from '../../../controllers/aiController.js';

export const RagVectorService = {
  embedAndRetrieve: async (query: string) => {
    return {
      query,
      topK: 3,
      vectorDimension: 768,
      indexType: 'HNSW (pgvector)',
    };
  },
  aiDeepAudit,
  aiGenerateSprint,
  aiInterviewQA,
};
