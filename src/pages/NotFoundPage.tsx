import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout, Header } from '../components/layout';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <Header title="Page Not Found" />
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-8xl font-bold text-violet-200 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </MainLayout>
  );
};
