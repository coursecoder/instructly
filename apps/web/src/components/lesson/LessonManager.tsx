'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
  SortableContext as SortableContextType,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  UserGroupIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleSolid,
  ClockIcon as ClockSolid,
  DocumentTextIcon as DocumentTextSolid 
} from '@heroicons/react/24/solid';
import type { Lesson, Topic, Project } from '@instructly/shared/types';
import { TopicAnalyzer } from './TopicAnalyzer';
import { BulkOperations } from './BulkOperations';

interface LessonManagerProps {
  projectId: string;
  lessons: Lesson[];
  availableProjects?: Project[];
  onCreateLesson?: (lesson: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateLesson?: (lessonId: string, updates: Partial<Lesson>) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onReorderLessons?: (lessons: Lesson[]) => void;
  onBulkReorderLessons?: (lessons: Lesson[], selectedLessonIds: string[]) => void;
  onEditLesson?: (lesson: Lesson) => void;
  onBulkDuplicate?: (lessonIds: string[]) => Promise<void>;
  onBulkMove?: (lessonIds: string[], targetProjectId: string) => Promise<void>;
  onBulkArchive?: (lessonIds: string[]) => Promise<void>;
  onBulkDelete?: (lessonIds: string[]) => Promise<void>;
  className?: string;
}

interface SortableLessonItemProps {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onAddTopics?: (lesson: Lesson) => void;
  isSelected?: boolean;
  onToggleSelection?: (lessonId: string, event?: React.MouseEvent) => void;
  isOverlay?: boolean;
  selectedCount?: number; // For visual feedback when dragging multiple items
}

function SortableLessonItem({ lesson, onEdit, onDelete, onAddTopics, isSelected = false, onToggleSelection, isOverlay = false, selectedCount = 0 }: SortableLessonItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const getStatusIcon = (status: Lesson['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircleSolid className="h-5 w-5 text-green-500" />;
      case 'reviewed':
        return <DocumentTextSolid className="h-5 w-5 text-blue-500" />;
      case 'generated':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
      case 'generating':
        return <ClockSolid className="h-5 w-5 text-amber-500" />;
      default: // draft
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Lesson['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'generated':
        return 'bg-emerald-100 text-emerald-800';
      case 'generating':
        return 'bg-amber-100 text-amber-800';
      default: // draft
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Lesson['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
        isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
      } ${isOverlay ? 'rotate-3 shadow-xl' : ''} relative`}
    >
      {/* Bulk drag indicator */}
      {isOverlay && selectedCount > 1 && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-indigo-600 text-white text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
            {selectedCount}
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Selection Checkbox */}
            {onToggleSelection && (
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelection?.(lesson.id)}
                  onClick={(e) => onToggleSelection?.(lesson.id, e)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  aria-label={`Select lesson: ${lesson.title}. Hold Ctrl to toggle, Shift to select range`}
                />
              </div>
            )}
            
            {/* Drag Handle */}
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              tabIndex={0}
              role="button"
              aria-label={`Drag to reorder lesson: ${lesson.title}`}
            >
              <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            {/* Status Icon */}
            <div className="flex-shrink-0 pt-1">
              {getStatusIcon(lesson.status)}
            </div>

            {/* Lesson Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {lesson.title}
                </h3>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onEdit(lesson)}
                    className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                    aria-label={`Edit lesson: ${lesson.title}`}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {onAddTopics && (
                    <button
                      onClick={() => onAddTopics(lesson)}
                      className="p-1 text-gray-400 hover:text-green-600 rounded"
                      aria-label={`Add topics to lesson: ${lesson.title}`}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(lesson.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    aria-label={`Delete lesson: ${lesson.title}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {lesson.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {lesson.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDuration(lesson.estimatedDuration)}
                  </div>
                  
                  <div className="flex items-center">
                    <BookOpenIcon className="h-4 w-4 mr-1" />
                    {lesson.topics.length} topics
                  </div>

                  <div className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    {lesson.deliveryFormat.replace('_', ' ')}
                  </div>
                </div>

                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lesson.status)}`}>
                  {getStatusText(lesson.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LessonManager({
  projectId,
  lessons,
  availableProjects = [],
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  onReorderLessons,
  onBulkReorderLessons,
  onEditLesson,
  onBulkDuplicate,
  onBulkMove,
  onBulkArchive,
  onBulkDelete,
  className = '',
}: LessonManagerProps) {
  const [localLessons, setLocalLessons] = useState<Lesson[]>(lessons);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showTopicAnalyzer, setShowTopicAnalyzer] = useState(false);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    estimatedDuration: 60,
    deliveryFormat: 'instructor_led' as Lesson['deliveryFormat'],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local lessons when props change
  useEffect(() => {
    setLocalLessons(lessons);
  }, [lessons]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const draggedLessonId = active.id as string;
      const oldIndex = localLessons.findIndex((lesson) => lesson.id === draggedLessonId);
      const newIndex = localLessons.findIndex((lesson) => lesson.id === over.id);

      // Check if dragged lesson is part of a selection
      const isDraggedLessonSelected = selectedLessonIds.includes(draggedLessonId);
      const hasMultipleSelected = selectedLessonIds.length > 1;

      if (isDraggedLessonSelected && hasMultipleSelected) {
        // Bulk drag operation - maintain relative order of selected lessons
        const selectedLessons = selectedLessonIds.map(id => 
          localLessons.find(lesson => lesson.id === id)
        ).filter(Boolean) as Lesson[];

        // Create new array with selected lessons moved as a group
        const unselectedLessons = localLessons.filter(lesson => 
          !selectedLessonIds.includes(lesson.id)
        );

        // Insert selected lessons at the new position
        const reorderedLessons = [...unselectedLessons];
        reorderedLessons.splice(newIndex, 0, ...selectedLessons);

        setLocalLessons(reorderedLessons);
        
        // Use bulk reorder API if available
        if (onBulkReorderLessons) {
          onBulkReorderLessons(reorderedLessons, selectedLessonIds);
        } else {
          // Fallback to regular reorder
          onReorderLessons?.(reorderedLessons);
        }
      } else {
        // Single lesson drag operation
        const reorderedLessons = arrayMove(localLessons, oldIndex, newIndex);
        setLocalLessons(reorderedLessons);
        onReorderLessons?.(reorderedLessons);
      }
    }

    setActiveId(null);
  };

  const handleCreateLesson = () => {
    if (!newLesson.title.trim()) return;

    const lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> = {
      title: newLesson.title,
      description: newLesson.description,
      projectId,
      topics: [],
      status: 'draft',
      estimatedDuration: newLesson.estimatedDuration,
      deliveryFormat: newLesson.deliveryFormat,
      accessibilityCompliance: {
        complianceLevel: 'AA',
        overallScore: 0,
        violations: [],
        recommendations: [],
        auditTrail: [],
      },
    };

    onCreateLesson?.(lessonData);
    setNewLesson({
      title: '',
      description: '',
      estimatedDuration: 60,
      deliveryFormat: 'instructor_led',
    });
    setShowCreateForm(false);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    onEditLesson?.(lesson);
  };

  const handleAddTopics = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setShowTopicAnalyzer(true);
  };

  const handleTopicsAnalyzed = (analysisResult: any) => {
    if (editingLesson && analysisResult.topics) {
      const updatedLesson = {
        ...editingLesson,
        topics: [...editingLesson.topics, ...analysisResult.topics],
        status: 'generating' as Lesson['status'],
      };
      onUpdateLesson?.(editingLesson.id, updatedLesson);
      setShowTopicAnalyzer(false);
      setEditingLesson(null);
    }
  };

  const handleToggleSelection = (lessonId: string, event?: React.MouseEvent) => {
    const lesson = localLessons.find(l => l.id === lessonId);
    if (!lesson) return;

    // Handle keyboard shortcuts for multi-selection
    if (event) {
      // Ctrl+Click: Toggle individual selection
      if (event.ctrlKey || event.metaKey) {
        setSelectedLessonIds(prev =>
          prev.includes(lessonId)
            ? prev.filter(id => id !== lessonId)
            : [...prev, lessonId]
        );
        return;
      }

      // Shift+Click: Select range
      if (event.shiftKey && selectedLessonIds.length > 0) {
        const lastSelectedId = selectedLessonIds[selectedLessonIds.length - 1];
        const lastSelectedIndex = localLessons.findIndex(l => l.id === lastSelectedId);
        const currentIndex = localLessons.findIndex(l => l.id === lessonId);
        
        if (lastSelectedIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastSelectedIndex, currentIndex);
          const end = Math.max(lastSelectedIndex, currentIndex);
          const rangeIds = localLessons.slice(start, end + 1).map(l => l.id);
          
          // Merge with existing selection
          const newSelection = new Set([...selectedLessonIds, ...rangeIds]);
          setSelectedLessonIds(Array.from(newSelection));
          return;
        }
      }
    }

    // Default toggle behavior (no modifier keys)
    setSelectedLessonIds(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const handleClearSelection = () => {
    setSelectedLessonIds([]);
  };

  const selectedLessons = localLessons.filter(lesson => 
    selectedLessonIds.includes(lesson.id)
  );

  const activeLesson = localLessons.find(lesson => lesson.id === activeId);

  const getLessonStats = () => {
    const stats = localLessons.reduce(
      (acc, lesson) => {
        acc.total++;
        acc[lesson.status]++;
        acc.totalDuration += lesson.estimatedDuration;
        acc.totalTopics += lesson.topics.length;
        return acc;
      },
      {
        total: 0,
        draft: 0,
        generating: 0,
        generated: 0,
        reviewed: 0,
        approved: 0,
        archived: 0,
        totalDuration: 0,
        totalTopics: 0,
      }
    );
    return stats;
  };

  const stats = getLessonStats();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Lesson Management</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Lesson
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{Math.floor(stats.totalDuration / 60)}h {stats.totalDuration % 60}m</div>
            <div className="text-sm text-gray-500">Total Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.totalTopics}</div>
            <div className="text-sm text-gray-500">Total Topics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
        </div>
      </div>

      {/* Create Lesson Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Lesson</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="lesson-title" className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Title
              </label>
              <input
                type="text"
                id="lesson-title"
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter lesson title"
              />
            </div>

            <div>
              <label htmlFor="lesson-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="lesson-description"
                value={newLesson.description}
                onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter lesson description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lesson-duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  id="lesson-duration"
                  value={newLesson.estimatedDuration}
                  onChange={(e) => setNewLesson({ ...newLesson, estimatedDuration: parseInt(e.target.value, 10) || 60 })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="lesson-format" className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Format
                </label>
                <select
                  id="lesson-format"
                  value={newLesson.deliveryFormat}
                  onChange={(e) => setNewLesson({ ...newLesson, deliveryFormat: e.target.value as Lesson['deliveryFormat'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="instructor_led">Instructor Led</option>
                  <option value="self_paced">Self Paced</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="virtual_classroom">Virtual Classroom</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLesson}
                disabled={!newLesson.title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Operations */}
      <BulkOperations
        selectedLessons={selectedLessons}
        availableProjects={availableProjects}
        onDuplicateLessons={onBulkDuplicate}
        onMoveLessons={onBulkMove}
        onArchiveLessons={onBulkArchive}
        onDeleteLessons={onBulkDelete}
        onClearSelection={handleClearSelection}
      />

      {/* Lessons List */}
      <div className="space-y-4">
        {localLessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No lessons yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first lesson for this project.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Lesson
              </button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={localLessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {localLessons.map((lesson) => (
                  <SortableLessonItem
                    key={lesson.id}
                    lesson={lesson}
                    onEdit={handleEditLesson}
                    onDelete={onDeleteLesson || (() => {})}
                    onAddTopics={handleAddTopics}
                    isSelected={selectedLessonIds.includes(lesson.id)}
                    onToggleSelection={(lessonId, event) => handleToggleSelection(lessonId, event)}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeLesson ? (
                <SortableLessonItem
                  lesson={activeLesson}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isOverlay
                  selectedCount={
                    selectedLessonIds.includes(activeLesson.id) && selectedLessonIds.length > 1 
                      ? selectedLessonIds.length 
                      : 0
                  }
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Topic Analyzer Modal */}
      {showTopicAnalyzer && editingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Topics to &quot;{editingLesson.title}&quot;
                </h2>
                <button
                  onClick={() => {
                    setShowTopicAnalyzer(false);
                    setEditingLesson(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <TopicAnalyzer
                onAnalysisComplete={handleTopicsAnalyzed}
                className="border-0 shadow-none p-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}