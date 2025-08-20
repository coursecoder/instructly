'use client';

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createProjectSchema } from '@instructly/shared/schemas';
import type { ProjectSettings } from '@instructly/shared/types';

interface CreateProjectFormData {
  title: string;
  description: string;
  targetAudience: string;
  estimatedDuration: number;
  settings: ProjectSettings;
}

interface CreateProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateProjectForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: CreateProjectFormProps) {
  const [formData, setFormData] = useState<CreateProjectFormData>({
    title: '',
    description: '',
    targetAudience: '',
    estimatedDuration: 60, // Default 1 hour
    settings: {
      brandingOptions: {
        organizationName: '',
        primaryColor: '',
        logoUrl: '',
      },
      defaultAccessibilityLevel: 'AA',
      approvalWorkflow: false,
      stakeholderAccess: false,
    },
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form data
    const validation = createProjectSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on successful submission
      setFormData({
        title: '',
        description: '',
        targetAudience: '',
        estimatedDuration: 60,
        settings: {
          brandingOptions: {
            organizationName: '',
            primaryColor: '',
            logoUrl: '',
          },
          defaultAccessibilityLevel: 'AA',
          approvalWorkflow: false,
          stakeholderAccess: false,
        },
      });
      onClose();
    } catch (err) {
      // Error handling is done in the parent component
      console.error('Project creation failed:', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingPath = name.split('.');
      if (settingPath.length === 2) {
        const settingKey = settingPath[1] as keyof ProjectSettings;
        setFormData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            [settingKey]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
          },
        }));
      } else if (settingPath.length === 3 && settingPath[1] === 'brandingOptions') {
        const brandingKey = settingPath[2] as keyof ProjectSettings['brandingOptions'];
        setFormData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            brandingOptions: {
              ...prev.settings.brandingOptions,
              [brandingKey]: value,
            },
          },
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value,
      }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div>
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Project</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Set up a new instructional design project to organize your lessons and content.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Project Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.title ? 'border-red-300' : ''
                  }`}
                  placeholder="Enter project title"
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Describe the purpose and goals of this project"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
                  Target Audience *
                </label>
                <input
                  type="text"
                  name="targetAudience"
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.targetAudience ? 'border-red-300' : ''
                  }`}
                  placeholder="e.g., New employees, Managers, Customer service team"
                />
                {validationErrors.targetAudience && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.targetAudience}</p>
                )}
              </div>

              {/* Estimated Duration */}
              <div>
                <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700">
                  Estimated Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="estimatedDuration"
                  id="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  min="1"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.estimatedDuration ? 'border-red-300' : ''
                  }`}
                />
                {validationErrors.estimatedDuration && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.estimatedDuration}</p>
                )}
              </div>

              {/* Organization Name */}
              <div>
                <label htmlFor="settings.brandingOptions.organizationName" className="block text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <input
                  type="text"
                  name="settings.brandingOptions.organizationName"
                  id="settings.brandingOptions.organizationName"
                  value={formData.settings.brandingOptions.organizationName || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Your organization name"
                />
              </div>

              {/* Accessibility Level */}
              <div>
                <label htmlFor="settings.defaultAccessibilityLevel" className="block text-sm font-medium text-gray-700">
                  Accessibility Level
                </label>
                <select
                  name="settings.defaultAccessibilityLevel"
                  id="settings.defaultAccessibilityLevel"
                  value={formData.settings.defaultAccessibilityLevel}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="AA">WCAG 2.1 Level AA</option>
                  <option value="AAA">WCAG 2.1 Level AAA</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      name="settings.approvalWorkflow"
                      id="settings.approvalWorkflow"
                      checked={formData.settings.approvalWorkflow}
                      onChange={handleInputChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="settings.approvalWorkflow" className="font-medium text-gray-700">
                      Enable approval workflow
                    </label>
                    <p className="text-gray-500">Require approval before publishing lessons</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      name="settings.stakeholderAccess"
                      id="settings.stakeholderAccess"
                      checked={formData.settings.stakeholderAccess}
                      onChange={handleInputChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="settings.stakeholderAccess" className="font-medium text-gray-700">
                      Allow stakeholder access
                    </label>
                    <p className="text-gray-500">Give stakeholders view-only access to review progress</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}