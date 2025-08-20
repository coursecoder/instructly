'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import type { Project, Lesson } from '@instructly/shared/types';

interface SearchFilterProps {
  projects: Project[];
  lessons: Lesson[];
  onFilteredResults: (projects: Project[], lessons: Lesson[]) => void;
  className?: string;
}

interface FilterOptions {
  projectStatus: Project['status'][];
  lessonStatus: Lesson['status'][];
  deliveryFormat: Lesson['deliveryFormat'][];
  complianceLevel: ('A' | 'AA' | 'AAA')[];
}

export function SearchFilter({
  projects,
  lessons,
  onFilteredResults,
  className = '',
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    projectStatus: [],
    lessonStatus: [],
    deliveryFormat: [],
    complianceLevel: [],
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter projects and lessons based on search and filters
  const { filteredProjects, filteredLessons } = useMemo(() => {
    let resultProjects = projects;
    let resultLessons = lessons;

    // Apply text search
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase().trim();
      
      resultProjects = projects.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query) ||
          project.targetAudience.toLowerCase().includes(query)
      );

      resultLessons = lessons.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(query) ||
          lesson.description.toLowerCase().includes(query) ||
          lesson.topics.some(topic => 
            topic.content.toLowerCase().includes(query) ||
            topic.classification.toLowerCase().includes(query)
          )
      );
    }

    // Apply status filters for projects
    if (filters.projectStatus.length > 0) {
      resultProjects = resultProjects.filter((project) =>
        filters.projectStatus.includes(project.status)
      );
    }

    // Apply status filters for lessons
    if (filters.lessonStatus.length > 0) {
      resultLessons = resultLessons.filter((lesson) =>
        filters.lessonStatus.includes(lesson.status)
      );
    }

    // Apply delivery format filters for lessons
    if (filters.deliveryFormat.length > 0) {
      resultLessons = resultLessons.filter((lesson) =>
        filters.deliveryFormat.includes(lesson.deliveryFormat)
      );
    }

    // Apply compliance level filters for lessons
    if (filters.complianceLevel.length > 0) {
      resultLessons = resultLessons.filter((lesson) =>
        filters.complianceLevel.includes(lesson.accessibilityCompliance.complianceLevel)
      );
    }

    return { filteredProjects: resultProjects, filteredLessons: resultLessons };
  }, [projects, lessons, debouncedQuery, filters]);

  // Call callback when results change
  useEffect(() => {
    onFilteredResults(filteredProjects, filteredLessons);
  }, [filteredProjects, filteredLessons, onFilteredResults]);

  const handleFilterChange = (
    filterType: keyof FilterOptions,
    value: string,
    checked: boolean
  ) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked
        ? [...prev[filterType], value]
        : prev[filterType].filter(v => v !== value),
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      projectStatus: [],
      lessonStatus: [],
      deliveryFormat: [],
      complianceLevel: [],
    });
    setSearchQuery('');
  };

  const hasActiveFilters = 
    Object.values(filters).some(filterArray => filterArray.length > 0) ||
    searchQuery.trim().length > 0;

  const activeFilterCount = Object.values(filters).reduce(
    (count, filterArray) => count + filterArray.length,
    0
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search projects and lessons..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filter Toggle and Clear */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {activeFilterCount}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Project Status Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Project Status</h4>
                <div className="space-y-2">
                  {(['draft', 'in_progress', 'review', 'completed', 'archived'] as Project['status'][]).map((status) => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.projectStatus.includes(status)}
                        onChange={(e) =>
                          handleFilterChange('projectStatus', status, e.target.checked)
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Lesson Status Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Lesson Status</h4>
                <div className="space-y-2">
                  {(['draft', 'generating', 'generated', 'reviewed', 'approved'] as Lesson['status'][]).map((status) => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.lessonStatus.includes(status)}
                        onChange={(e) =>
                          handleFilterChange('lessonStatus', status, e.target.checked)
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {status}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Delivery Format Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Delivery Format</h4>
                <div className="space-y-2">
                  {(['instructor_led', 'self_paced', 'hybrid', 'virtual_classroom'] as Lesson['deliveryFormat'][]).map((format) => (
                    <label key={format} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.deliveryFormat.includes(format)}
                        onChange={(e) =>
                          handleFilterChange('deliveryFormat', format, e.target.checked)
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Compliance Level Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Accessibility</h4>
                <div className="space-y-2">
                  {(['A', 'AA', 'AAA'] as ('A' | 'AA' | 'AAA')[]).map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.complianceLevel.includes(level)}
                        onChange={(e) =>
                          handleFilterChange('complianceLevel', level, e.target.checked)
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        WCAG {level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {filteredProjects.length} projects and {filteredLessons.length} lessons
            </div>
            {debouncedQuery && (
              <div>
                Results for &quot;{debouncedQuery}&quot;
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}