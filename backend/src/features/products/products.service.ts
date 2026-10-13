import redis from '../../config/redis.js';
import { buildCacheKey } from '../../utils/cacheKey.js';
import db from '../../../config/db.js';

export const ProductsService = {
  async getCachedProjects() {
    const key = buildCacheKey('projects', 'all');
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    const projects = await db.projects.find();
    await redis.set(key, JSON.stringify(projects), 60);
    return projects;
  },
};
