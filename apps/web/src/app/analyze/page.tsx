'use client';

import React from 'react';
import { TopicAnalyzer } from '../../components/lesson/TopicAnalyzer';
import type { TopicAnalysisResponse } from '@instructly/shared/types';

export default function AnalyzePage() {
  const handleAnalysisComplete = (analysis: TopicAnalysisResponse) => {
    console.log('Analysis completed:', analysis);
    // Here you could save results to a store, navigate to another page, etc.
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Topic Analysis
          </h1>
          <p className="mt-2 text-gray-600">
            Use AI to analyze topics according to instructional design frameworks and get 
            evidence-based recommendations for teaching methods.
          </p>
        </div>

        <TopicAnalyzer 
          onAnalysisComplete={handleAnalysisComplete}
          className="mb-8"
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Classification Framework</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><span className="font-medium text-blue-600">Facts:</span> Specific information and data points</li>
                <li><span className="font-medium text-green-600">Concepts:</span> Abstract ideas and theories</li>
                <li><span className="font-medium text-purple-600">Processes:</span> Natural phenomena and systems</li>
                <li><span className="font-medium text-orange-600">Procedures:</span> Step-by-step methods</li>
                <li><span className="font-medium text-red-600">Principles:</span> Rules and guidelines</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Benefits</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Evidence-based instructional design</li>
                <li>• Personalized teaching method recommendations</li>
                <li>• Consistent classification across topics</li>
                <li>• AI-powered confidence scoring</li>
                <li>• Cost-optimized analysis with caching</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}