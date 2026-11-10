"use client"
import React, { useState } from 'react';
import { BookOpenCheck, Calendar, ChevronDown, ChevronUp, ExternalLink, Bell, Star, Search, Zap, Shield, Gift, RotateCw } from 'lucide-react';

const WhatIsNew = () => {
  const [expandedUpdates, setExpandedUpdates] = useState<{ [key: string]: boolean }>({
    'update-1': true,
    'update-2': true,
    'update-3': true,
  });

  const toggleUpdate = (id: string) => {
    setExpandedUpdates({
      ...expandedUpdates,
      [id]: !expandedUpdates[id]
    });
  };

  // Updates data structure
  const updates = [
    {
      id: 'update-1',
      version: '3.5.0',
      date: 'April 1, 2025',
      title: 'Enhanced Search Experience & New UI',
      icon: <Search className="w-10 h-10 text-blue-500" />,
      highlights: [
        'Completely redesigned search interface with faster loading times',
        'Advanced filtering capabilities for more precise search results',
        'New "Quick Search" sidebar for accessing recent searches',
        'Voice search capability now available on all devices'
      ],
      details: `Our latest update focuses on making your search experience faster and more intuitive.
                The redesigned interface not only looks better but also loads 35% faster than before.
                We've also added powerful new filtering options so you can narrow down results by date range,
                content type, sources, and more. The new Quick Search sidebar remembers your most recent searches
                and allows you to quickly return to previous results without starting over.`,
      tags: ['Search', 'UI/UX', 'Performance']
    },
    {
      id: 'update-2',
      version: '3.4.0',
      date: 'March 15, 2025',
      title: 'Personalized Dashboard & Alerts',
      icon: <Bell className="w-10 h-10 text-purple-500" />,
      highlights: [
        'Custom dashboards tailored to your search interests',
        'Real-time alerts for new content matching your saved searches',
        'Weekly digest emails summarizing new findings',
        'Topic following with smart recommendations'
      ],
      details: `Stay on top of the information that matters most to you with our new personalization features.
                Your dashboard now automatically organizes content based on your search patterns and saved topics.
                Set up alerts to be notified when new content matching your criteria appears, and receive weekly
                digest emails that summarize the most important updates. Our new topic following system will also
                suggest related areas of interest based on your activity.`,
      tags: ['Personalization', 'Alerts', 'Dashboard']
    },
    {
      id: 'update-3',
      version: '3.3.0',
      date: 'February 28, 2025',
      title: 'AI-Powered Research Assistant',
      icon: <Zap className="w-10 h-10 text-yellow-500" />,
      highlights: [
        'Intelligent summaries of search results',
        'Automated research paths to guide your exploration',
        'Context-aware suggestions during search sessions',
        'Natural language query improvements'
      ],
      details: `Meet your new research companion! Our AI assistant now helps you make sense of complex search
                results by providing concise summaries and highlighting key information. When you're researching
                a topic, the assistant will suggest logical next steps and related queries to deepen your
                understanding. The improved natural language processing means you can ask questions in plain
                English and get more accurate results than ever before.`,
      tags: ['AI', 'Research Tools', 'Productivity']
    },
    {
      id: 'update-4',
      version: '3.2.0',
      date: 'January 20, 2025',
      title: 'Enhanced Security & Privacy Controls',
      icon: <Shield className="w-10 h-10 text-green-500" />,
      highlights: [
        'End-to-end encryption for all search history',
        'Granular privacy controls for saved searches',
        'Scheduled history clearing options',
        'Anonymous search mode improvements'
      ],
      details: `Your privacy matters to us. This update introduces enhanced security features including
                end-to-end encryption for your search history and saved content. We've added more detailed
                privacy controls that let you decide exactly what gets saved and for how long. The improved
                anonymous search mode now leaves absolutely no trace of your research sessions when enabled.`,
      tags: ['Security', 'Privacy', 'Data Protection']
    },
    {
      id: 'update-5',
      version: '3.1.0',
      date: 'December 12, 2024',
      title: 'Collaboration & Sharing Tools',
      icon: <ExternalLink className="w-10 h-10 text-indigo-500" />,
      highlights: [
        'Share search results and collections with team members',
        'Real-time collaborative research spaces',
        'Comment and annotation features for shared content',
        'Export options in multiple formats (PDF, Excel, CSV)'
      ],
      details: `Working with a team? Our new collaboration tools make it easy to share your findings and
                work together on research projects. Create shared research spaces where team members can
                contribute in real-time, leave comments on specific results, and annotate content for others.
                The enhanced export options let you take your data anywhere in formats that work with your
                existing tools.`,
      tags: ['Collaboration', 'Sharing', 'Teamwork']
    },
    {
      id: 'update-6',
      version: '3.0.0',
      date: 'November 5, 2024',
      title: 'Major Platform Overhaul',
      icon: <RotateCw className="w-10 h-10 text-red-500" />,
      highlights: [
        'Complete architectural rebuild for 2x faster performance',
        'Mobile-first design approach with responsive interfaces',
        'Dark mode and customizable themes',
        'Expanded data sources covering 40% more content'
      ],
      details: `This landmark update represents a complete rebuild of our platform from the ground up.
                The new architecture delivers twice the speed while using fewer resources. We've adopted a
                mobile-first approach to ensure a seamless experience across all your devices. Dark mode and
                customizable themes let you personalize the visual experience. Most importantly, we've expanded
                our data sources to include 40% more content across specialized fields and niche topics.`,
      tags: ['Performance', 'Mobile', 'Design', 'Content']
    }
  ];

  // Function to format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <BookOpenCheck className="w-8 h-8 mr-3" />
            <h1 className="text-3xl font-bold">What&apos;s New</h1>
          </div>
          <p className="text-xl opacity-90">
            Stay updated with the latest features and improvements to our Portal web search platform
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Latest Updates & Improvements
          </h2>
          <p className="text-gray-600">
            We&apos;re constantly working to improve your search experience with new features and refinements.
            Check back regularly to discover what&apos;s new and learn how to make the most of our platform.
          </p>
        </div>

        {/* Timeline of Updates */}
        <div className="space-y-6">
          {updates.map((update, index) => (
            <div key={update.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleUpdate(update.id)}
              >
                <div className="flex items-center">
                  <div className="mr-4 flex-shrink-0 bg-blue-50 p-2 rounded-lg">
                    {update.icon}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-blue-600 mr-2">v{update.version}</span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {update.date}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mt-1">{update.title}</h3>
                  </div>
                </div>
                <div>
                  {expandedUpdates[update.id] ?
                    <ChevronUp className="w-5 h-5 text-gray-500" /> :
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  }
                </div>
              </div>

              {expandedUpdates[update.id] && (
                <div className="p-4 pt-0 border-t border-gray-100">
                  <ul className="mt-4 space-y-2">
                    {update.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start">
                        <Star className="w-4 h-4 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 text-gray-600 bg-gray-50 p-4 rounded-md">
                    {update.details}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {update.tags.map((tag, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Invitation to provide feedback */}
        <div className="mt-12 bg-blue-50 border border-blue-100 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-blue-800 mb-2">We value your feedback</h3>
          <p className="text-blue-700 mb-4">
            Your input helps us improve the platform. Let us know what features you&apos;d like to see next!
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatIsNew;
