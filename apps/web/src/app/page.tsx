import { Button } from '@instructly/ui';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Instructly
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI-Powered Instructional Design Platform - Transform your lesson planning with evidence-based instructional design framework classification.
        </p>
        
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Button variant="primary" size="lg">
            Get Started
          </Button>
          <Button variant="secondary" size="lg">
            Learn More
          </Button>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI-Powered Analysis
            </h3>
            <p className="text-gray-600">
              Analyze topics using instructional design frameworks for evidence-based instructional design.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Professional Documentation
            </h3>
            <p className="text-gray-600">
              Generate comprehensive lesson plans and instructional design charts automatically.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Accessibility Compliant
            </h3>
            <p className="text-gray-600">
              Ensure WCAG 2.1 AA compliance with automated accessibility validation.
            </p>
          </div>
        </div>
      </div>
      
      {/* Health check status indicator */}
      <div className="mt-16 text-center">
        <Link href="/api/health" className="text-sm text-gray-500 hover:text-gray-700">
          System Status
        </Link>
      </div>
    </div>
  );
}