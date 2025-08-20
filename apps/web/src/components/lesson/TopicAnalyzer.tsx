'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useAIStore } from '../../stores/aiStore';
import { ClassificationPanel } from '../ai/ClassificationPanel';
import type { Topic, TopicAnalysisResponse } from '@instructly/shared/types';

interface TopicAnalyzerProps {
  onAnalysisComplete?: (analysis: TopicAnalysisResponse) => void;
  className?: string;
}

export function TopicAnalyzer({ onAnalysisComplete, className = '' }: TopicAnalyzerProps) {
  const [topics, setTopics] = useState<string[]>(['']);
  const [analysisType, setAnalysisType] = useState<'instructional_design' | 'bloom_taxonomy' | 'instructional_methods'>('instructional_design');
  
  // Use AI store
  const {
    analysisResults,
    isAnalyzing,
    analysisError,
    analyzeTopics,
    clearAnalysisResults,
    clearError,
    monthlyCost,
    costLimit,
    withinCostLimits,
    getMonthlyCost
  } = useAIStore();

  // Load cost information on mount
  useEffect(() => {
    getMonthlyCost();
  }, [getMonthlyCost]);

  const addTopic = () => {
    if (topics.length < 10) {
      setTopics([...topics, '']);
    }
  };

  const removeTopic = (index: number) => {
    if (topics.length > 1) {
      const newTopics = topics.filter((_, i) => i !== index);
      setTopics(newTopics);
    }
  };

  const updateTopic = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const handleAnalyze = async () => {
    const validTopics = topics.filter(topic => topic.trim().length > 0);
    
    if (validTopics.length === 0) {
      return;
    }

    if (!withinCostLimits) {
      return;
    }

    clearError();

    try {
      const result = await analyzeTopics({
        topics: validTopics,
        analysisType
      });
      
      onAnalysisComplete?.(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const resetAnalysis = () => {
    clearAnalysisResults();
    setTopics(['']);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI Topic Analysis
        </h2>
        <p className="text-gray-600">
          Enter topics to analyze using instructional design frameworks. Get evidence-based 
          classification and recommended teaching methods.
        </p>
      </div>

      {!analysisResults ? (
        <div className="space-y-6">
          {/* Analysis Type Selection */}
          <div>
            <label htmlFor="analysis-type" className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Framework
            </label>
            <select
              id="analysis-type"
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as typeof analysisType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isAnalyzing}
            >
              <option value="instructional_design">Instructional Design Framework</option>
              <option value="bloom_taxonomy">Bloom&apos;s Taxonomy</option>
              <option value="instructional_methods">Teaching Methods</option>
            </select>
          </div>

          {/* Topic Input Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Topics to Analyze (1-10 topics)
            </label>
            <div className="space-y-3">
              {topics.map((topic, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => updateTopic(index, e.target.value)}
                      placeholder={`Topic ${index + 1}`}
                      maxLength={1000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isAnalyzing}
                      aria-label={`Topic ${index + 1} input`}
                    />
                  </div>
                  {topics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTopic(index)}
                      disabled={isAnalyzing}
                      className="px-3 py-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Remove topic ${index + 1}`}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Topic Button */}
            {topics.length < 10 && (
              <button
                type="button"
                onClick={addTopic}
                disabled={isAnalyzing}
                className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Topic
              </button>
            )}
          </div>

          {/* Cost Status Display */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Monthly AI Usage:</span>
              <span className={`font-medium ${withinCostLimits ? 'text-green-600' : 'text-red-600'}`}>
                ${monthlyCost.toFixed(2)} / ${costLimit.toFixed(2)}
              </span>
            </div>
            {!withinCostLimits && (
              <p className="text-xs text-red-600 mt-1">
                Monthly limit reached. Analysis temporarily disabled.
              </p>
            )}
          </div>

          {/* Error Display */}
          {analysisError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Analysis Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {analysisError}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || topics.every(topic => topic.trim().length === 0) || !withinCostLimits}
              className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Topics...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Analyze Topics
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Analysis Results */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Analysis Results
            </h3>
            <button
              type="button"
              onClick={resetAnalysis}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Analyze New Topics
            </button>
          </div>

          <div className="space-y-4">
            {analysisResults.map((topic, index) => (
              <ClassificationPanel
                key={topic.id}
                topic={topic}
                index={index + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}