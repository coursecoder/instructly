import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { 
  Project, 
  ProjectSettings, 
  createProjectSchema, 
  updateProjectSchema 
} from './../types/shared';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export class ProjectRepository {
  private supabase: SupabaseClient<Database>;

  constructor() {
    // Environment variables defined in /home/coleens/dev/instructly/.env
    // For reference, see docs/SUPABASE_QUICK_REFERENCE.md
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Create a new project
   */
  async create(data: {
    title: string;
    description?: string;
    targetAudience: string;
    estimatedDuration: number;
    ownerId: string;
    settings?: ProjectSettings;
  }): Promise<Project> {
    // Validate input data
    const validatedData = createProjectSchema.parse({
      title: data.title,
      description: data.description,
      targetAudience: data.targetAudience,
      estimatedDuration: data.estimatedDuration,
      settings: data.settings,
    });

    const projectInsert: ProjectInsert = {
      title: validatedData.title,
      description: validatedData.description || '',
      target_audience: validatedData.targetAudience,
      estimated_duration: validatedData.estimatedDuration,
      status: 'draft',
      owner_id: data.ownerId,
      collaborators: [],
      settings: validatedData.settings || {
        brandingOptions: {},
        defaultAccessibilityLevel: 'AA',
        approvalWorkflow: false,
        stakeholderAccess: false,
      },
    };

    const { data: project, error } = await this.supabase
      .from('projects')
      .insert(projectInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return this.mapRowToProject(project);
  }

  /**
   * Get project by ID
   */
  async getById(id: string, userId?: string): Promise<Project | null> {
    let query = this.supabase
      .from('projects')
      .select('*')
      .eq('id', id);

    // Apply RLS if userId is provided
    if (userId) {
      query = query.or(`owner_id.eq.${userId},collaborators.cs.{${userId}}`);
    }

    const { data: project, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Row not found
      }
      throw new Error(`Failed to get project: ${error.message}`);
    }

    return this.mapRowToProject(project);
  }

  /**
   * Get projects by owner
   */
  async findByOwner(ownerId: string): Promise<Project[]> {
    const { data: projects, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user projects: ${error.message}`);
    }

    return projects.map(project => this.mapRowToProject(project));
  }

  /**
   * Get projects where user is owner or collaborator
   */
  async findByUserAccess(userId: string): Promise<Project[]> {
    const { data: projects, error } = await this.supabase
      .from('projects')
      .select('*')
      .or(`owner_id.eq.${userId},collaborators.cs.{${userId}}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get accessible projects: ${error.message}`);
    }

    return projects.map(project => this.mapRowToProject(project));
  }

  /**
   * Update project
   */
  async update(id: string, data: Partial<{
    title: string;
    description: string;
    targetAudience: string;
    estimatedDuration: number;
    status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived';
    collaborators: string[];
    settings: ProjectSettings;
  }>, userId?: string): Promise<Project> {
    const updateData: ProjectUpdate = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.targetAudience !== undefined) updateData.target_audience = data.targetAudience;
    if (data.estimatedDuration !== undefined) updateData.estimated_duration = data.estimatedDuration;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.collaborators !== undefined) updateData.collaborators = data.collaborators;
    if (data.settings !== undefined) updateData.settings = data.settings as any;

    let query = this.supabase
      .from('projects')
      .update(updateData)
      .eq('id', id);

    // Apply RLS if userId is provided
    if (userId) {
      query = query.eq('owner_id', userId);
    }

    const { data: project, error } = await query
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return this.mapRowToProject(project);
  }

  /**
   * Delete project
   */
  async delete(id: string, userId?: string): Promise<void> {
    let query = this.supabase
      .from('projects')
      .delete()
      .eq('id', id);

    // Apply RLS if userId is provided  
    if (userId) {
      query = query.eq('owner_id', userId);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Search projects by title or description
   */
  async search(query: string, userId: string): Promise<Project[]> {
    const { data: projects, error } = await this.supabase
      .from('projects')
      .select('*')
      .or(`owner_id.eq.${userId},collaborators.cs.{${userId}}`)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to search projects: ${error.message}`);
    }

    return projects.map(project => this.mapRowToProject(project));
  }

  /**
   * Get project statistics for dashboard
   */
  async getProjectStats(userId: string): Promise<{
    total: number;
    draft: number;
    inProgress: number;
    completed: number;
    archived: number;
  }> {
    const { data: projects, error } = await this.supabase
      .from('projects')
      .select('status')
      .eq('owner_id', userId);

    if (error) {
      throw new Error(`Failed to get project stats: ${error.message}`);
    }

    const stats = {
      total: projects.length,
      draft: projects.filter(p => p.status === 'draft').length,
      inProgress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      archived: projects.filter(p => p.status === 'archived').length,
    };

    return stats;
  }

  /**
   * Map database row to Project interface
   */
  private mapRowToProject(row: ProjectRow): Project {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      targetAudience: row.target_audience || '',
      estimatedDuration: row.estimated_duration,
      status: row.status as Project['status'],
      ownerId: row.owner_id,
      collaborators: row.collaborators || [],
      settings: row.settings as unknown as ProjectSettings,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}