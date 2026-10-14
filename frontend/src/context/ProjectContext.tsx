import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { emitInstantNotification, triggerNotificationRefresh } from '../utils/notificationBus';

export interface Task {
  _id: string;
  projectId: string;
  title: string;
  description: string;
  column: 'backlog' | 'in_progress' | 'in_review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId: string;
  reporterId: string;
  estimateHours: number;
  tags: string[];
  comments?: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    createdAt: string;
  }>;
  rejectionHistory?: Array<{
    id: string;
    rejectedById: string;
    rejectedByName: string;
    rejectedAt: string;
    reason: string;
    category?: 'Functional bug' | 'Regression' | 'Performance' | 'Other';
  }>;
  rejectionActive?: boolean;
  assignee?: { _id: string; name: string; avatar: string; role: string } | null;
  reporter?: { _id: string; name: string; avatar: string } | null;
}

export interface Project {
  _id: string;
  title: string;
  key: string;
  description: string;
  category: string;
  status: string;
  progress: number;
  totalTasks?: number;
  completedTasks?: number;
  tags: string[];
  lead?: { name: string; avatar: string; title: string } | null;
}

const STORAGE_ACTIVE_PROJ_KEY = 'pulsedev_active_project_id';
const STORAGE_TASKS_CACHE_PREFIX = 'pulsedev_tasks_cache_';
const STORAGE_PROJECTS_CACHE = 'pulsedev_projects_cache';

const INITIAL_PROJECTS: Project[] = [
  {
    _id: '66b2cf8912e3d4c5b6a78010',
    title: 'Global Checkout & Payment Engine v2',
    key: 'PAY',
    description: 'High-throughput distributed payment gateway with idempotency keys and sub-50ms fraud scoring.',
    category: 'Backend Architecture',
    status: 'active',
    progress: 75,
    tags: ['Payments', 'Stripe', 'Checkout', 'PCI-DSS'],
  },
  {
    _id: '66b2cf8912e3d4c5b6a78020',
    title: 'Mobile Experience & Offline Sync Engine',
    key: 'MOB',
    description: 'Optimistic local-first state synchronization engine with conflict-free replicated data types.',
    category: 'Fullstack Platform',
    status: 'active',
    progress: 60,
    tags: ['Mobile', 'OfflineSync', 'DesignSystem', 'Performance'],
  },
  {
    _id: '66b2cf8912e3d4c5b6a78030',
    title: 'Cloud Infrastructure & Auto-Scaling Cluster',
    key: 'OPS',
    description: 'Zero-downtime multi-region container orchestration and automated failover pipelines.',
    category: 'DevOps & Cloud',
    status: 'active',
    progress: 45,
    tags: ['Kubernetes', 'Cloud', 'CanaryRelease', 'HighAvailability'],
  },
];

function loadCachedProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_CACHE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_PROJECTS;
}

function loadCachedTasks(projectId: string): Task[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_TASKS_CACHE_PREFIX + projectId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveCachedTasks(projectId: string, tasksList: Task[]) {
  try {
    localStorage.setItem(STORAGE_TASKS_CACHE_PREFIX + projectId, JSON.stringify(tasksList));
  } catch {
    // ignore
  }
}

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  tasks: Task[];
  analytics: any | null;
  loading: boolean;
  setActiveProject: (project: Project) => void;
  loadProjects: () => Promise<void>;
  loadProjectTasks: (projectId: string) => Promise<void>;
  createTask: (data: any) => Promise<void>;
  updateTaskColumn: (
    taskId: string,
    newColumn: 'backlog' | 'in_progress' | 'in_review' | 'completed',
    overrideQa?: boolean
  ) => Promise<void>;
  updateTaskDetails: (taskId: string, updates: Partial<Task>) => Promise<void>;
  rejectTask: (taskId: string, reason: string, category?: string) => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
  createProject: (data: any) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(() => loadCachedProjects());
  
  const [activeProject, setActiveProjectState] = useState<Project | null>(() => {
    const cachedProjects = loadCachedProjects();
    const savedId = localStorage.getItem(STORAGE_ACTIVE_PROJ_KEY);
    if (savedId) {
      const found = cachedProjects.find((p) => p._id === savedId);
      if (found) return found;
    }
    return cachedProjects[0] || INITIAL_PROJECTS[0];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const defaultProjId = activeProject?._id || INITIAL_PROJECTS[0]._id;
    const cached = loadCachedTasks(defaultProjId);
    return cached || [];
  });

  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const activeProjectIdRef = useRef<string>(activeProject?._id || INITIAL_PROJECTS[0]._id);

  const setActiveProject = useCallback((project: Project) => {
    if (!project) return;
    activeProjectIdRef.current = project._id;
    localStorage.setItem(STORAGE_ACTIVE_PROJ_KEY, project._id);
    setActiveProjectState(project);
    // Instant restore from cache if exists
    const cached = loadCachedTasks(project._id);
    if (cached) {
      setTasks(cached);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await api.projects.getAll();
      if (res.success && Array.isArray(res.projects) && res.projects.length > 0) {
        setProjects(res.projects);
        try {
          localStorage.setItem(STORAGE_PROJECTS_CACHE, JSON.stringify(res.projects));
        } catch {}

        setActiveProjectState((prev) => {
          const savedId = localStorage.getItem(STORAGE_ACTIVE_PROJ_KEY);
          if (savedId) {
            const foundSaved = res.projects.find((p: Project) => p._id === savedId);
            if (foundSaved) {
              activeProjectIdRef.current = foundSaved._id;
              return foundSaved;
            }
          }
          if (!prev) {
            activeProjectIdRef.current = res.projects[0]._id;
            return res.projects[0];
          }
          const updated = res.projects.find((p: Project) => p._id === prev._id);
          const chosen = updated || res.projects[0];
          activeProjectIdRef.current = chosen._id;
          return chosen;
        });
      }
    } catch {
      // Keep cached projects smoothly
    }
  }, []);

  const loadProjectTasks = useCallback(async (projectId: string) => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await api.projects.getTasks(projectId);
      if (res.success && Array.isArray(res.tasks)) {
        setTasks(res.tasks);
        saveCachedTasks(projectId, res.tasks);
      }
    } catch {
      // Keep existing or cached tasks
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await api.projects.getAnalytics();
      if (res.success) {
        setAnalytics(res);
      }
    } catch {
      // Ignore analytics error silently
    }
  }, []);

  // Sync projects and analytics on startup or token refresh
  useEffect(() => {
    loadProjects();
    loadAnalytics();
  }, [token, loadProjects, loadAnalytics]);

  // Load project tasks whenever active project changes or on initial mount
  useEffect(() => {
    if (activeProject?._id) {
      loadProjectTasks(activeProject._id);
    }
  }, [activeProject?._id, loadProjectTasks]);

  const createTask = async (data: any) => {
    if (!user) {
      throw new Error('Authentication required: Please sign in before creating an issue.');
    }
    const targetProjectId = activeProject?._id || projects[0]?._id || '66b2cf8912e3d4c5b6a78010';
    const res = await api.tasks.create({
      ...data,
      projectId: targetProjectId,
    });
    if (!res.success) {
      throw new Error(res.message || 'Could not create issue.');
    }
    triggerNotificationRefresh();
    await loadProjectTasks(targetProjectId);
    await loadProjects();
    await loadAnalytics();
  };

  const updateTaskColumn = async (
    taskId: string,
    newColumn: 'backlog' | 'in_progress' | 'in_review' | 'completed',
    overrideQa = false
  ) => {
    if (!user) {
      throw new Error('Authentication required: Please sign in to update tasks.');
    }
    await api.tasks.update(taskId, {
      column: newColumn,
      ...(overrideQa ? { overrideQa: true } : {}),
    });
    triggerNotificationRefresh();
    if (activeProject?._id) {
      await loadProjectTasks(activeProject._id);
    }
    await loadProjects();
    await loadAnalytics();
  };

  const deleteTask = async (taskId: string) => {
    if (!user) {
      throw new Error('Authentication required: Please sign in to delete tasks.');
    }
    await api.tasks.delete(taskId);
    triggerNotificationRefresh();
    if (activeProject?._id) {
      await loadProjectTasks(activeProject._id);
    }
    await loadProjects();
    await loadAnalytics();
  };

  const addComment = async (taskId: string, text: string) => {
    if (!user) {
      throw new Error('Authentication required: Please sign in to comment.');
    }
    await api.tasks.addComment(taskId, text);
    triggerNotificationRefresh();
    if (activeProject?._id) {
      await loadProjectTasks(activeProject._id);
    }
  };

  const rejectTask = async (taskId: string, reason: string, category?: string) => {
    if (!user) {
      throw new Error('Authentication required: Please sign in before rejecting an issue.');
    }
    await api.tasks.reject(taskId, reason, category);
    triggerNotificationRefresh();
    if (activeProject?._id) {
      await loadProjectTasks(activeProject._id);
    }
    await loadProjects();
    await loadAnalytics();
  };

  const approveTask = async (taskId: string) => {
    if (!user) {
      throw new Error('Authentication required: Please sign in before approving an issue.');
    }
    await api.tasks.approve(taskId);
    triggerNotificationRefresh();
    if (activeProject?._id) {
      await loadProjectTasks(activeProject._id);
    }
    await loadProjects();
    await loadAnalytics();
  };

  const updateTaskDetails = async (taskId: string, updates: Partial<Task>) => {
    if (!user) {
      throw new Error('Authentication required: Please sign in to update tasks.');
    }
    const editableUpdates = {
      ...(updates.column !== undefined ? { column: updates.column } : {}),
      ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
      ...(updates.title !== undefined ? { title: updates.title } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.estimateHours !== undefined ? { estimateHours: updates.estimateHours } : {}),
      ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
      ...(updates.assigneeId !== undefined ? { assigneeId: updates.assigneeId } : {}),
    };
    await api.tasks.update(taskId, editableUpdates);
    triggerNotificationRefresh();
    if (activeProject?._id) {
      await loadProjectTasks(activeProject._id);
    }
  };

  const createProject = async (data: any) => {
    const actorName = user?.name || 'Admin';
    const actorAvatar =
      user?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80';

    const optimisticProject: Project = {
      _id: `proj-${Date.now()}`,
      title: data.title || 'Untitled Initiative',
      key: (data.key || 'INIT').toUpperCase(),
      description: data.description || '',
      category: data.category || 'Fullstack Platform',
      status: 'active',
      progress: 0,
      tags: Array.isArray(data.tags) ? data.tags : [],
    };

    setProjects((prev) => {
      const updated = [optimisticProject, ...prev];
      try {
        localStorage.setItem(STORAGE_PROJECTS_CACHE, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setActiveProject(optimisticProject);

    emitInstantNotification({
      title: `New Initiative: ${optimisticProject.key}`,
      message: `${actorName} launched initiative "${optimisticProject.title}".`,
      type: 'project',
      actorName,
      actorAvatar,
    });

    try {
      const res = await api.projects.create(data);
      if (res.success && res.project) {
        triggerNotificationRefresh();
        await loadProjects();
        setActiveProject(res.project);
      }
    } catch {
      // Keep optimistic project in workspace state
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        tasks,
        analytics,
        loading,
        setActiveProject,
        loadProjects,
        loadProjectTasks,
        createTask,
        updateTaskColumn,
        updateTaskDetails,
        rejectTask,
        approveTask,
        deleteTask,
        addComment,
        createProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;
