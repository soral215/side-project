import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Model3DJobStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';

export interface Model3DJob {
  id: string;
  status: Model3DJobStatus;
  provider: string;
  inputImageUrls: string[];
  outputModelUrl?: string | null;
  errorMessage?: string | null;
  texturePrompt?: string | null;
  textureImageUrl?: string | null;
  enablePbr?: boolean;
  shouldRemesh?: boolean;
  targetPolycount?: number | null;
  symmetryMode?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Model3DJobState {
  jobs: Record<string, Model3DJob>;
  lastUpdatedAt: number;
  upsertJob: (job: Model3DJob) => void;
  removeJob: (jobId: string) => void;
  clearFinished: () => void;
}

export const useModel3DJobStore = create<Model3DJobState>()(
  persist(
    (set, get) => ({
      jobs: {},
      lastUpdatedAt: Date.now(),
      upsertJob: (job) => {
        set((state) => ({
          jobs: {
            ...state.jobs,
            [job.id]: job,
          },
          lastUpdatedAt: Date.now(),
        }));
      },
      removeJob: (jobId) => {
        set((state) => {
          const next = { ...state.jobs };
          delete next[jobId];
          return { jobs: next, lastUpdatedAt: Date.now() };
        });
      },
      clearFinished: () => {
        const jobs = get().jobs;
        const next: Record<string, Model3DJob> = {};
        for (const [id, job] of Object.entries(jobs)) {
          if (job.status === 'PROCESSING' || job.status === 'PENDING') {
            next[id] = job;
          }
        }
        set({ jobs: next, lastUpdatedAt: Date.now() });
      },
    }),
    {
      name: 'model3d-job-store',
      partialize: (state) => ({
        jobs: state.jobs,
      }),
    }
  )
);


