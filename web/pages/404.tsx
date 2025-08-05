import Head from 'next/head';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Home, ArrowLeft } from 'lucide-react';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | Feedblock</title>
      </Head>
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 p-8 lg:p-12">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center py-16">
              <div className="mb-8">
                <div className="w-24 h-24 mx-auto mb-6 p-6 rounded-full bg-[#83785f] shadow-xl">
                  <Home className="w-12 h-12 text-[#f8f6f0] mx-auto" />
                </div>
                <h1 className="text-6xl font-bold text-gray-800 mb-4">
                  404
                </h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Page Not Found
                </h2>
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
              </div>
              
              <div className="space-y-4">
                <Link
                  href="/"
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 shadow-md"
                  style={{ background: '#22262b', color: '#ffffff' }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Go Back Home</span>
                </Link>
                
                <div className="text-sm text-gray-500">
                  Or try one of these pages:
                </div>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/feedback"
                    className="px-6 py-3 rounded-lg font-medium hover:shadow-md transition-all"
                    style={{ background: '#cfc7b5', color: '#22262b' }}
                  >
                    View Feedback
                  </Link>
                  <Link
                    href="/org"
                    className="px-6 py-3 rounded-lg font-medium hover:shadow-md transition-all"
                    style={{ background: '#cfc7b5', color: '#22262b' }}
                  >
                    My Organizations
                  </Link>
                  <Link
                    href="/feedback/new"
                    className="px-6 py-3 rounded-lg font-medium hover:shadow-md transition-all"
                    style={{ background: '#cfc7b5', color: '#22262b' }}
                  >
                    Send Feedback
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 