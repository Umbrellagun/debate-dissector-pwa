import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout, Header } from '../components/layout';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <Header title="Privacy Policy" onBackClick={() => navigate('/settings')} />

      <div id="privacy-policy-content" data-role="page-content" className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-6">Last updated: July 11, 2026</p>

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
                <div className="space-y-4 text-gray-600">
                  <div>
                    <h3 className="font-medium text-gray-800">1. Local storage (on your device)</h3>
                    <br></br>
                    <p>
                      Your debates and documents are stored locally on your device using IndexedDB.
                      This data never leaves your device unless you explicitly choose to share a
                      document.
                    </p>
                    <br></br>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <strong>Debate documents:</strong> id, title, content (transcript text),
                        annotations (fallacy, rhetoric, and structural markup), comments, speakers
                        (id, name, color, shortName), argument links, thesis mark ids, hidden
                        annotation ids, tags, createdAt, updatedAt.
                      </li>
                      <li>
                        <strong>Document versions:</strong> id, documentId, title, content,
                        annotations, timestamp, label.
                      </li>
                      <li>
                        <strong>User preferences:</strong> theme, fontSize, autoSave,
                        autoSaveInterval, showFallacyPanel, left/right sidebar state, expanded
                        category lists, pinned fallacies/rhetoric, custom annotation colors, custom
                        speaker colors, lastEditedDocumentId, and analytics opt-out preference.
                      </li>
                      <li>
                        <strong>PWA install prompt:</strong> the timestamp when you last dismissed
                        the "Add to Home Screen" prompt.
                      </li>
                      <li>
                        <strong>Sync queue (reserved):</strong> documentId, action, timestamp,
                        synced status (not currently active; reserved for future cloud sync).
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-800">
                      2. Shared documents (on our servers)
                    </h3>
                    <br></br>
                    <p>
                      When you click Share, the following document data is uploaded to our
                      PocketBase backend:
                    </p>
                    <br></br>
                    <ul className="list-disc list-inside space-y-1">
                      <li>title</li>
                      <li>content (transcript text)</li>
                      <li>annotations</li>
                      <li>
                        server-generated record fields: id, created, updated. The backend collection
                        also has optional fields for authorName, expiresAt, passwordHash, viewCount,
                        reportCount, and isBlocked, but the current app UI does not send them.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-800">3. Analytics (Umami)</h3>
                    <br></br>
                    <p>
                      We use Umami, a privacy-focused analytics service, to collect anonymous usage
                      data. Page views are tracked automatically. The app also sends the following
                      event categories and associated data:
                    </p>
                    <br></br>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <strong>Document lifecycle:</strong> document created, deleted, version
                        created, version restored (document/version ids, title).
                      </li>
                      <li>
                        <strong>Annotations:</strong> annotation applied/removed, fallacy/rhetoric/
                        structural selected, visibility toggled, pinned/unpinned, color
                        changed/reset (annotation type, id, name, category, action).
                      </li>
                      <li>
                        <strong>Speakers:</strong> speaker assigned/created/edited/deleted and
                        speaker color changed/reset (speakerId, speakerName, speakerIndex).
                      </li>
                      <li>
                        <strong>Comments:</strong> comment created/edited/deleted/resolved/replied
                        (commentId, parentId).
                      </li>
                      <li>
                        <strong>Sharing:</strong> share link created, shared document
                        viewed/imported (documentId, shareId).
                      </li>
                      <li>
                        <strong>Argument map:</strong> map view opened, link created/deleted, thesis
                        toggled, undo/redo (mark ids, link type, linkId, action).
                      </li>
                      <li>
                        <strong>Search and stats:</strong> search query and result count, stats
                        panel opened, stats tab switched, stats breakdown clicked (query, tab, type,
                        id, name).
                      </li>
                      <li>
                        <strong>PWA install:</strong> install prompt shown/dismissed, app installed.
                      </li>
                      <li>
                        <strong>Performance:</strong> web vitals (CLS, FID, FCP, LCP, TTFB values).
                      </li>
                      <br></br>
                    </ul>
                    <p>
                      We do not track personal information, and no cookies are used for tracking
                      purposes.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Analytics Opt-Out</h2>
                <p className="text-gray-600">
                  You can disable analytics at any time by turning on the "Disable Analytics" toggle
                  in Settings. When disabled, the app stops sending page-view and event data to
                  Umami. Your local data and shared documents are unaffected.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Data We Don't Collect</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Personal identification information (unless you share it in a document)</li>
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
                      server logs such as IP address, request URL, timestamp, and user-agent as part
                      of normal hosting operations.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Analytics</h3>
                    <p>
                      Umami is self-hosted. The Umami server receives page-view and event data and
                      standard HTTP metadata. It does not use cookies.
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
