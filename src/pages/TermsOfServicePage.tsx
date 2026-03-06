import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout, Header } from '../components/layout';

export const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <Header
        title="Terms of Service"
        onBackClick={() => navigate('/settings')}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-6">Last updated: March 5, 2026</p>

            <div className="prose prose-sm prose-gray max-w-none space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Acceptance of Terms</h2>
                <p className="text-gray-600">
                  By accessing or using Debate Dissector, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use the application.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description of Service</h2>
                <p className="text-gray-600">
                  Debate Dissector is a free tool for analyzing debates, identifying logical fallacies, 
                  and labeling rhetorical techniques. The service is provided "as is" without warranty of any kind.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">User Responsibilities</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>You are responsible for the content you create and share</li>
                  <li>You agree not to share content that is illegal, harmful, or infringes on others' rights</li>
                  <li>You agree not to attempt to disrupt or abuse the service</li>
                  <li>You agree not to use automated tools to scrape or overload the service</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Shared Content</h2>
                <p className="text-gray-600">
                  When you share a document publicly, you grant us a non-exclusive license to host and 
                  display that content. You retain ownership of your content and can delete it at any time. 
                  We reserve the right to remove content that violates these terms.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Intellectual Property</h2>
                <p className="text-gray-600">
                  The Debate Dissector application, including its design, code, and fallacy/rhetoric databases, 
                  is protected by intellectual property laws. You may use the application for personal and 
                  educational purposes. The fallacy and rhetoric definitions are provided for educational reference.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Limitation of Liability</h2>
                <p className="text-gray-600">
                  Debate Dissector is provided for educational and analytical purposes. We are not responsible 
                  for any decisions made based on analysis performed with this tool. The application is provided 
                  without warranties, and we are not liable for any damages arising from its use.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Data Loss</h2>
                <p className="text-gray-600">
                  While we strive to maintain data integrity, we are not responsible for data loss. 
                  Local data depends on your browser's storage, and shared documents may be removed 
                  for policy violations or service changes. We recommend keeping backups of important work.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Service Modifications</h2>
                <p className="text-gray-600">
                  We reserve the right to modify, suspend, or discontinue the service at any time, 
                  with or without notice. We may also update these terms, and continued use constitutes 
                  acceptance of any changes.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Termination</h2>
                <p className="text-gray-600">
                  We reserve the right to block access to users who violate these terms or abuse the service. 
                  Since we don't have user accounts, this would typically involve IP-based restrictions.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact</h2>
                <p className="text-gray-600">
                  If you have questions about these Terms of Service, please contact us through the 
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
