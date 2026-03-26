import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout, Header } from '../components/layout';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <Header title="Privacy Policy" onBackClick={() => navigate('/settings')} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-6">Last updated: March 5, 2026</p>

            <div className="prose prose-sm prose-gray max-w-none space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Overview</h2>
                <p className="text-gray-600">
                  Debate Dissector is a Progressive Web App designed for analyzing debates and
                  identifying logical fallacies. We are committed to protecting your privacy and
                  being transparent about our data practices.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Data We Collect</h2>
                <div className="space-y-3 text-gray-600">
                  <div>
                    <h3 className="font-medium text-gray-800">Local Storage</h3>
                    <p>
                      Your debates and documents are stored locally on your device using IndexedDB.
                      This data never leaves your device unless you explicitly choose to share a
                      document.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Shared Documents</h3>
                    <p>
                      When you share a document, the content is uploaded to our servers. Shared
                      documents are stored indefinitely unless removed for policy violations or
                      service changes.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Analytics</h3>
                    <p>
                      We use Umami, a privacy-focused analytics service, to collect anonymous usage
                      data. This includes page views and general feature usage. We do not track
                      personal information, and no cookies are used for tracking purposes.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Data We Don't Collect</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Personal identification information (unless you share it)</li>
                  <li>Email addresses (we don't have accounts)</li>
                  <li>Location data</li>
                  <li>Device identifiers</li>
                  <li>Third-party tracking cookies</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Third-Party Services</h2>
                <div className="space-y-3 text-gray-600">
                  <div>
                    <h3 className="font-medium text-gray-800">Hosting</h3>
                    <p>
                      Our app is hosted on Vercel and our API on Fly.io. These services may collect
                      server logs.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Rights</h2>
                <p className="text-gray-600">
                  Since most data is stored locally on your device, you have full control over it.
                  You can delete your local data at any time by clearing your browser's storage. For
                  shared documents, you can delete them through the sharing interface.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Changes to This Policy</h2>
                <p className="text-gray-600">
                  We may update this Privacy Policy from time to time. We will notify users of any
                  significant changes by updating the "Last updated" date at the top of this page.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact</h2>
                <p className="text-gray-600">
                  If you have questions about this Privacy Policy, please contact us through the
                  contact information provided in the Settings page.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};
