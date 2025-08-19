'use client';

import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import type { Topic } from '@instructly/shared/types';

interface ClassificationPanelProps {
  topic: Topic;
  index: number;
  onAccept?: (topic: Topic) => void;
  onModify?: (topic: Topic) => void;
  className?: string;
}

export function ClassificationPanel({ 
  topic, 
  index, 
  onAccept, 
  onModify, 
  className = '' 
}: ClassificationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get classification color and icon based on type
  const getClassificationStyle = (classification: string) => {
    switch (classification) {
      case 'facts':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          badgeColor: 'bg-blue-100 text-blue-800'
        };
      case 'concepts':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          badgeColor: 'bg-green-100 text-green-800'
        };
      case 'processes':
        return {
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800',
          badgeColor: 'bg-purple-100 text-purple-800'
        };
      case 'procedures':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          badgeColor: 'bg-orange-100 text-orange-800'
        };
      case 'principles':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          badgeColor: 'bg-red-100 text-red-800'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          badgeColor: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircleIcon className="h-4 w-4" />;
    if (confidence >= 0.6) return <ExclamationTriangleIcon className="h-4 w-4" />;
    return <InformationCircleIcon className="h-4 w-4" />;
  };

  const style = getClassificationStyle(topic.classification);
  const confidencePercentage = Math.round(topic.aiAnalysis.confidence * 100);

  return (
    <div className={`border rounded-lg ${style.borderColor} ${style.bgColor} ${className}`}>
      {/* Header Section */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Topic Number and Content */}
            <div className="flex items-center gap-3 mb-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-white text-sm font-medium text-gray-500">
                {index}
              </span>
              <h3 className="text-lg font-medium text-gray-900 truncate" title={topic.content}>
                {topic.content}
              </h3>
            </div>

            {/* Classification and Confidence */}
            <div className="flex items-center gap-4 mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.badgeColor}`}>
                {topic.classification.charAt(0).toUpperCase() + topic.classification.slice(1)}
              </span>
              
              <div className={`flex items-center gap-1 text-sm ${getConfidenceColor(topic.aiAnalysis.confidence)}`}>
                {getConfidenceIcon(topic.aiAnalysis.confidence)}
                <span className="font-medium">
                  {confidencePercentage}% confidence
                </span>
              </div>

              <span className="text-sm text-gray-500">
                Model: {topic.aiAnalysis.modelUsed}
              </span>
            </div>

            {/* Content Type */}
            <p className={`text-sm ${style.textColor} mb-3`}>
              <span className="font-medium">Content Type:</span> {topic.aiAnalysis.contentType}
            </p>

            {/* Recommended Methods Preview */}
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">Recommended Methods: </span>
              <span className="text-sm text-gray-600">
                {topic.aiAnalysis.recommendedMethods.slice(0, 2).join(', ')}
                {topic.aiAnalysis.recommendedMethods.length > 2 && '...'}
              </span>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {onAccept && (
            <button
              type="button"
              onClick={() => onAccept(topic)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Accept
            </button>
          )}
          
          {onModify && (
            <button
              type="button"
              onClick={() => onModify(topic)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              Modify
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white p-4">
          {/* Detailed Rationale */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Classification Rationale
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {topic.aiAnalysis.rationale}
            </p>
          </div>

          {/* Complete Recommended Methods */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Recommended Instructional Methods
            </h4>
            <div className="grid gap-2">
              {topic.aiAnalysis.recommendedMethods.map((method, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="flex-shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-xs font-medium text-blue-600 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700">{method}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Metadata */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span>
                Generated: {new Date(topic.generatedAt).toLocaleString()}
              </span>
              <span>
                ID: {topic.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}