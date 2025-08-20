'use client';

import React, { useState } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { Lesson, Project } from '@instructly/shared/types';

interface BulkOperationsProps {
  selectedLessons: Lesson[];
  availableProjects: Project[];
  onDuplicateLessons?: (lessonIds: string[]) => Promise<void>;
  onMoveLessons?: (lessonIds: string[], targetProjectId: string) => Promise<void>;
  onArchiveLessons?: (lessonIds: string[]) => Promise<void>;
  onDeleteLessons?: (lessonIds: string[]) => Promise<void>;
  onClearSelection?: () => void;
  className?: string;
}

interface BulkOperation {
  type: 'duplicate' | 'move' | 'archive' | 'delete';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'danger';
  confirmRequired: boolean;
}

const bulkOperations: BulkOperation[] = [
  {
    type: 'duplicate',
    title: 'Duplicate Lessons',
    description: 'Create copies of selected lessons',
    icon: DocumentDuplicateIcon,
    variant: 'secondary',
    confirmRequired: false,
  },
  {
    type: 'move',
    title: 'Move to Project',
    description: 'Move lessons to a different project',
    icon: ArrowRightIcon,
    variant: 'secondary',
    confirmRequired: true,
  },
  {
    type: 'archive',
    title: 'Archive Lessons',
    description: 'Archive completed lessons',
    icon: ArchiveBoxIcon,
    variant: 'secondary',
    confirmRequired: true,
  },
  {
    type: 'delete',
    title: 'Delete Lessons',
    description: 'Permanently delete selected lessons',
    icon: TrashIcon,
    variant: 'danger',
    confirmRequired: true,
  },
];

export function BulkOperations({
  selectedLessons,
  availableProjects,
  onDuplicateLessons,
  onMoveLessons,
  onArchiveLessons,
  onDeleteLessons,
  onClearSelection,
  className = '',
}: BulkOperationsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<BulkOperation | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationProgress, setOperationProgress] = useState(0);

  if (selectedLessons.length === 0) {
    return null;
  }

  const handleOperationClick = (operation: BulkOperation) => {
    setPendingOperation(operation);
    if (operation.confirmRequired) {
      setShowConfirmDialog(true);
    } else {
      executeOperation(operation);
    }
  };

  const executeOperation = async (operation: BulkOperation) => {
    setIsProcessing(true);
    setOperationProgress(0);
    
    try {
      const lessonIds = selectedLessons.map(lesson => lesson.id);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setOperationProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      switch (operation.type) {
        case 'duplicate':
          await onDuplicateLessons?.(lessonIds);
          break;
        case 'move':
          if (targetProjectId) {
            await onMoveLessons?.(lessonIds, targetProjectId);
          }
          break;
        case 'archive':
          await onArchiveLessons?.(lessonIds);
          break;
        case 'delete':
          await onDeleteLessons?.(lessonIds);
          break;
      }

      clearInterval(progressInterval);
      setOperationProgress(100);
      
      // Brief success state
      setTimeout(() => {
        setIsProcessing(false);
        setOperationProgress(0);
        setShowConfirmDialog(false);
        setPendingOperation(null);
        setTargetProjectId('');
        onClearSelection?.();
      }, 500);
      
    } catch (error) {
      setIsProcessing(false);
      setOperationProgress(0);
      console.error('Bulk operation failed:', error);
      // Error handling would show toast/notification in real app
    }
  };

  const getOperationButtonClass = (variant: BulkOperation['variant']) => {
    const baseClass = "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    switch (variant) {
      case 'primary':
        return `${baseClass} text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
      case 'secondary':
        return `${baseClass} text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500 border border-gray-300`;
      case 'danger':
        return `${baseClass} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
      default:
        return baseClass;
    }
  };

  return (
    <>
      <div className={`bg-indigo-50 border border-indigo-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CheckIcon className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">
              {selectedLessons.length} lesson{selectedLessons.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <button
            onClick={onClearSelection}
            className="p-1 text-indigo-400 hover:text-indigo-600 rounded"
            aria-label="Clear selection"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {bulkOperations.map((operation) => {
            const IconComponent = operation.icon;
            return (
              <button
                key={operation.type}
                onClick={() => handleOperationClick(operation)}
                className={getOperationButtonClass(operation.variant)}
                disabled={isProcessing}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {operation.title}
              </button>
            );
          })}
        </div>

        {/* Progress Indicator */}
        {isProcessing && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-indigo-700 mb-2">
              <span>Processing operation...</span>
              <span>{operationProgress}%</span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${operationProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm {pendingOperation.title}
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {pendingOperation.description} for {selectedLessons.length} lesson
                {selectedLessons.length !== 1 ? 's' : ''}?
              </p>

              {/* Selected Lessons List */}
              <div className="mb-4 max-h-32 overflow-y-auto">
                <div className="text-xs font-medium text-gray-700 mb-2">Selected lessons:</div>
                <ul className="space-y-1">
                  {selectedLessons.map(lesson => (
                    <li key={lesson.id} className="text-xs text-gray-600 truncate">
                      • {lesson.title}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Target Project Selection for Move Operation */}
              {pendingOperation.type === 'move' && (
                <div className="mb-4">
                  <label htmlFor="target-project" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Project
                  </label>
                  <select
                    id="target-project"
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a project...</option>
                    {availableProjects
                      .filter(project => !selectedLessons.some(lesson => lesson.projectId === project.id))
                      .map(project => (
                        <option key={project.id} value={project.id}>
                          {project.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Warning for destructive operations */}
              {pendingOperation.variant === 'danger' && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    ⚠️ This action cannot be undone. All lesson data will be permanently deleted.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setPendingOperation(null);
                    setTargetProjectId('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeOperation(pendingOperation)}
                  disabled={
                    isProcessing || 
                    (pendingOperation.type === 'move' && !targetProjectId)
                  }
                  className={getOperationButtonClass(pendingOperation.variant)}
                >
                  {isProcessing ? 'Processing...' : `Confirm ${pendingOperation.title}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}