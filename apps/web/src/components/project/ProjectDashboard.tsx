'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  FolderOpenIcon, 
  ChartBarIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { 
  FolderIcon, 
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/solid';
import type { Project } from '@instructly/shared/types';

interface ProjectDashboardProps {
  onCreateProject?: () => void;
  onSelectProject?: (project: Project) => void;
  className?: string;
}

interface ProjectStats {
  total: number;
  draft: number;
  inProgress: number;
  completed: number;
  archived: number;
}

export function ProjectDashboard({ 
  onCreateProject, 
  onSelectProject, 
  className = '' 
}: ProjectDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    draft: 0,
    inProgress: 0,
    completed: 0,
    archived: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development - will be replaced with tRPC calls
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        
        // TODO: Replace with actual tRPC calls
        // const projectsResult = await trpc.projects.getUserProjects.query();
        // const statsResult = await trpc.projects.getStats.query();
        
        // Mock data for now
        const mockProjects: Project[] = [
          {
            id: '1',
            title: 'Leadership Development Program',
            description: 'Comprehensive leadership training for middle management',
            targetAudience: 'Middle Management',
            estimatedDuration: 480, // 8 hours
            status: 'in_progress',
            ownerId: 'user-1',
            collaborators: ['user-2', 'user-3'],
            settings: {
              brandingOptions: { organizationName: 'ACME Corp' },
              defaultAccessibilityLevel: 'AA',
              approvalWorkflow: true,
              stakeholderAccess: false,
            },
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-20'),
          },
          {
            id: '2',
            title: 'Customer Service Excellence',
            description: 'Training program for customer-facing teams',
            targetAudience: 'Customer Service Representatives',
            estimatedDuration: 240, // 4 hours
            status: 'draft',
            ownerId: 'user-1',
            collaborators: [],
            settings: {
              brandingOptions: {},
              defaultAccessibilityLevel: 'AA',
              approvalWorkflow: false,
              stakeholderAccess: true,
            },
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-12'),
          }
        ];

        const mockStats: ProjectStats = {
          total: 2,
          draft: 1,
          inProgress: 1,
          completed: 0,
          archived: 0,
        };

        setProjects(mockProjects);
        setStats(mockStats);
      } catch (err) {
        setError('Failed to load projects');
        console.error('Error loading projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'review':
        return <DocumentTextIcon className="h-5 w-5 text-amber-500" />;
      case 'archived':
        return <FolderIcon className="h-5 w-5 text-gray-400" />;
      default: // draft
        return <FolderOpenIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: Project['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading projects</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your instructional design projects and lessons
          </p>
        </div>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.inProgress}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.completed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Draft</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.draft}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search projects..."
          />
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {filteredProjects.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <FolderOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'No projects match your search.' : 'Get started by creating your first project.'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <button
                    onClick={onCreateProject}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Project
                  </button>
                </div>
              )}
            </li>
          ) : (
            filteredProjects.map((project) => (
              <li key={project.id}>
                <div className="px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => onSelectProject?.(project)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {getStatusIcon(project.status)}
                      </div>
                      <div className="min-w-0 flex-1 ml-4">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {project.title}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {project.description}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                            <div className="flex items-center text-xs text-gray-500">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {formatDuration(project.estimatedDuration)}
                            </div>
                            {project.collaborators.length > 0 && (
                              <div className="flex items-center text-xs text-gray-500">
                                <UserGroupIcon className="h-4 w-4 mr-1" />
                                {project.collaborators.length}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getStatusText(project.status)}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{project.targetAudience}</span>
                          <span className="mx-2">•</span>
                          <span>Updated {project.updatedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 flex-shrink-0">
                      <button className="p-1 rounded-full text-gray-400 hover:text-gray-600">
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}