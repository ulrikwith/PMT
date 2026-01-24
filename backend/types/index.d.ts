// Common type definitions for PMT backend

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Task {
  id: string;
  text: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  relationships?: Relationship[];
  metadata?: TaskMetadata;
  deletedAt?: string | null;
}

export interface TaskMetadata {
  workType?: string;
  targetOutcome?: string;
  activities?: Activity[];
  resources?: Record<string, any>;
  position?: { x: number; y: number };
  gridPosition?: { x: number; y: number };
  deletedAt?: string | null;
}

export interface Activity {
  id: string;
  name: string;
  [key: string]: any;
}

export interface Relationship {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: string;
  label?: string | null;
  createdAt: string;
}

export interface ParsedTaskText {
  description: string;
  metadata: TaskMetadata;
}

export interface RelationshipServiceInterface {
  generateRelationshipId(): string;
  detectCircularDependency(
    fromTaskId: string,
    toTaskId: string,
    allTasks: Task[]
  ): Promise<boolean>;
  createTaskRelationship(
    fromTaskId: string,
    toTaskId: string,
    type: string,
    label?: string | null
  ): Promise<ApiResponse<Relationship>>;
  getAllRelationships(): Promise<ApiResponse<Relationship[]>>;
  getTaskRelationships(taskId: string): Promise<ApiResponse<Relationship[]>>;
  deleteRelationship(relationshipId: string): Promise<ApiResponse<void>>;
}
