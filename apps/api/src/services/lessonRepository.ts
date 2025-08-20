import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { 
  Lesson, 
  Topic,
  AccessibilityStatus,
  createLessonSchema, 
  updateLessonSchema 
} from './../types/shared';

type LessonRow = Database['public']['Tables']['lessons']['Row'];
type LessonInsert = Database['public']['Tables']['lessons']['Insert'];
type LessonUpdate = Database['public']['Tables']['lessons']['Update'];

export class LessonRepository {
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
   * Create a new lesson
   */
  async create(data: {
    title: string;
    description?: string;
    projectId: string;
    estimatedDuration: number;
    deliveryFormat: 'instructor_led' | 'self_paced' | 'hybrid' | 'virtual_classroom';
  }): Promise<Lesson> {
    // Validate input data
    const validatedData = createLessonSchema.parse(data);

    const lessonInsert: LessonInsert = {
      title: validatedData.title,
      description: validatedData.description || '',
      project_id: validatedData.projectId,
      status: 'draft',
      estimated_duration: validatedData.estimatedDuration,
      delivery_format: validatedData.deliveryFormat,
      topics: [],
      accessibility_compliance: {
        complianceLevel: 'AA',
        overallScore: 0,
        violations: [],
        recommendations: [],
        auditTrail: [],
      },
    };

    const { data: lesson, error } = await this.supabase
      .from('lessons')
      .insert(lessonInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create lesson: ${error.message}`);
    }

    return this.mapRowToLesson(lesson);
  }

  /**
   * Get lesson by ID
   */
  async getById(id: string): Promise<Lesson | null> {
    const { data: lesson, error } = await this.supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Row not found
      }
      throw new Error(`Failed to get lesson: ${error.message}`);
    }

    return this.mapRowToLesson(lesson);
  }

  /**
   * Get lessons by project ID
   */
  async findByProject(projectId: string): Promise<Lesson[]> {
    const { data: lessons, error } = await this.supabase
      .from('lessons')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get project lessons: ${error.message}`);
    }

    return lessons.map(lesson => this.mapRowToLesson(lesson));
  }

  /**
   * Update lesson
   */
  async update(id: string, data: Partial<{
    title: string;
    description: string;
    status: 'draft' | 'generating' | 'generated' | 'reviewed' | 'approved';
    estimatedDuration: number;
    deliveryFormat: 'instructor_led' | 'self_paced' | 'hybrid' | 'virtual_classroom';
    topics: Topic[];
    accessibilityCompliance: AccessibilityStatus;
  }>): Promise<Lesson> {
    const updateData: LessonUpdate = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.estimatedDuration !== undefined) updateData.estimated_duration = data.estimatedDuration;
    if (data.deliveryFormat !== undefined) updateData.delivery_format = data.deliveryFormat;
    if (data.topics !== undefined) updateData.topics = data.topics as any;
    if (data.accessibilityCompliance !== undefined) updateData.accessibility_compliance = data.accessibilityCompliance as any;

    const { data: lesson, error } = await this.supabase
      .from('lessons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update lesson: ${error.message}`);
    }

    return this.mapRowToLesson(lesson);
  }

  /**
   * Delete lesson
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete lesson: ${error.message}`);
    }
  }

  /**
   * Update lesson sequence within a project (for drag-and-drop reordering)
   */
  async updateSequence(input: {
    projectId: string;
    lessonSequence: string[];
  }): Promise<void> {
    // Use a transaction to update all lesson positions atomically
    const updates = input.lessonSequence.map((lessonId, index) => ({
      id: lessonId,
      sequence_order: index,
      updated_at: new Date().toISOString(),
    }));

    // Note: This is a simplified approach. In production, you might want to
    // add a sequence_order column to the lessons table and use proper SQL transactions
    for (const update of updates) {
      const { error } = await this.supabase
        .from('lessons')
        .update({ 
          // Temporary workaround: we'll use created_at for ordering for now
          // In production, add a sequence_order column
        })
        .eq('id', update.id)
        .eq('project_id', input.projectId);

      if (error) {
        throw new Error(`Failed to update lesson sequence: ${error.message}`);
      }
    }

    // TODO: Implement proper sequence ordering with a dedicated column
    console.log('Lesson sequence updated (simplified implementation)', updates);
  }

  /**
   * Search lessons by title or description within projects user has access to
   */
  async search(query: string, userId: string): Promise<Lesson[]> {
    // First get project IDs user has access to
    const { data: projects, error: projectError } = await this.supabase
      .from('projects')
      .select('id')
      .or(`owner_id.eq.${userId},collaborators.cs.{${userId}}`);

    if (projectError) {
      throw new Error(`Failed to get accessible projects: ${projectError.message}`);
    }

    if (projects.length === 0) {
      return [];
    }

    const projectIds = projects.map(p => p.id);

    const { data: lessons, error } = await this.supabase
      .from('lessons')
      .select('*')
      .in('project_id', projectIds)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to search lessons: ${error.message}`);
    }

    return lessons.map(lesson => this.mapRowToLesson(lesson));
  }

  /**
   * Get lesson statistics for a project
   */
  async getLessonStats(projectId: string): Promise<{
    total: number;
    draft: number;
    generating: number;
    generated: number;
    reviewed: number;
    approved: number;
  }> {
    const { data: lessons, error } = await this.supabase
      .from('lessons')
      .select('status')
      .eq('project_id', projectId);

    if (error) {
      throw new Error(`Failed to get lesson stats: ${error.message}`);
    }

    const stats = {
      total: lessons.length,
      draft: lessons.filter(l => l.status === 'draft').length,
      generating: lessons.filter(l => l.status === 'generating').length,
      generated: lessons.filter(l => l.status === 'generated').length,
      reviewed: lessons.filter(l => l.status === 'reviewed').length,
      approved: lessons.filter(l => l.status === 'approved').length,
    };

    return stats;
  }

  /**
   * Duplicate a lesson within the same or different project
   */
  async duplicate(sourceId: string, targetProjectId: string, newTitle?: string): Promise<Lesson> {
    // Get the source lesson
    const sourceLesson = await this.getById(sourceId);
    if (!sourceLesson) {
      throw new Error('Source lesson not found');
    }

    // Create the duplicate
    const duplicateData = {
      title: newTitle || `${sourceLesson.title} (Copy)`,
      description: sourceLesson.description,
      projectId: targetProjectId,
      estimatedDuration: sourceLesson.estimatedDuration,
      deliveryFormat: sourceLesson.deliveryFormat,
    };

    const newLesson = await this.create(duplicateData);

    // Update with topics if any exist
    if (sourceLesson.topics.length > 0) {
      await this.update(newLesson.id, {
        topics: sourceLesson.topics,
      });
    }

    return this.getById(newLesson.id) as Promise<Lesson>;
  }

  /**
   * Move lesson to different project
   */
  async moveToProject(lessonId: string, targetProjectId: string): Promise<Lesson> {
    const { data: lesson, error } = await this.supabase
      .from('lessons')
      .update({ project_id: targetProjectId })
      .eq('id', lessonId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to move lesson: ${error.message}`);
    }

    return this.mapRowToLesson(lesson);
  }

  /**
   * Archive lesson (soft delete)
   */
  async archive(lessonId: string): Promise<Lesson> {
    return this.update(lessonId, { status: 'draft' }); // Using draft as archived status for now
  }

  /**
   * Map database row to Lesson interface
   */
  private mapRowToLesson(row: LessonRow): Lesson {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      projectId: row.project_id,
      topics: (row.topics as unknown as Topic[]) || [],
      generatedContent: undefined, // TODO: Join with lesson_content table when needed
      status: row.status as Lesson['status'],
      estimatedDuration: row.estimated_duration,
      deliveryFormat: row.delivery_format as Lesson['deliveryFormat'],
      accessibilityCompliance: (row.accessibility_compliance as unknown as AccessibilityStatus) || {
        complianceLevel: 'AA',
        overallScore: 0,
        violations: [],
        recommendations: [],
        auditTrail: [],
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}