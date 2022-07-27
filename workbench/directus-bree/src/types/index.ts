import type { Job } from 'bree/types';

export type BreeAction = 'enable' | 'disable' | 'start' | 'stop' | 'restart' | 'run';
export type BreeStatus = 'done' | 'enabled' | 'delayed' | 'waiting' | 'disabled' | 'active';
export type BreeJob = Job & { status: BreeStatus };
