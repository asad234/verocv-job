"use client";
import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Card from "@/components/Dashboard/ReUsable/Card";
import Button from "@/components/Dashboard/ReUsable/Button";

const Privacy = () => {
  // State for visibility settings
  const [isProfileVisible, setIsProfileVisible] = useState(true);
  const [visibleToRecruiters, setVisibleToRecruiters] = useState(true);
  const [visibleToCompanies, setVisibleToCompanies] = useState(true);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [activeJobSeeker, setActiveJobSeeker] = useState(true);

  // privacy preferences
  const [allowDataAnalytics, setAllowDataAnalytics] = useState(true);
  const [allowThirdPartySharing, setAllowThirdPartySharing] = useState(false);
  const [saveSearchHistory, setSaveSearchHistory] = useState(true);

  // notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  //job application preferences
  const [showAppliedJobs, setShowAppliedJobs] = useState(true);
  const [notifyOnApplicationViewed, setNotifyOnApplicationViewed] = useState(true);

  // Account deletion confirmation
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);

  return (
    <div className="w-full flex justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Privacy & Visibility Settings</h1>
          <p className="text-gray-600">Manage your privacy preferences and control how you appear to recruiters and companies</p>
        </div>

        {/* Profile Visibility */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Profile Visibility</h2>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isProfileVisible}
                  onChange={() => setIsProfileVisible(!isProfileVisible)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {isProfileVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>

            <div className={isProfileVisible ? '' : 'opacity-50 pointer-events-none'}>
              <p className="text-gray-600 mb-4">Control who can see your profile and how your information is displayed.</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                  <div>
                    <h3 className="font-medium text-gray-800">Visible to Recruiters</h3>
                    <p className="text-sm text-gray-600">Allow recruiters to find and view your profile</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={visibleToRecruiters}
                      onChange={() => setVisibleToRecruiters(!visibleToRecruiters)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                  <div>
                    <h3 className="font-medium text-gray-800">Visible to Companies</h3>
                    <p className="text-sm text-gray-600">Allow companies to find and view your profile</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={visibleToCompanies}
                      onChange={() => setVisibleToCompanies(!visibleToCompanies)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                  <div>
                    <h3 className="font-medium text-gray-800">Show Contact Information</h3>
                    <p className="text-sm text-gray-600">Display your email and phone number on your profile</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={showContactInfo}
                      onChange={() => setShowContactInfo(!showContactInfo)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                  <div>
                    <h3 className="font-medium text-gray-800">Anonymous Mode</h3>
                    <p className="text-sm text-gray-600">Hide your name and personal details but keep skills visible</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={anonymousMode}
                      onChange={() => setAnonymousMode(!anonymousMode)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                  <div>
                    <h3 className="font-medium text-gray-800">Active Job Seeker</h3>
                    <p className="text-sm text-gray-600">Signal to recruiters that you&apos;re actively looking for positions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={activeJobSeeker}
                      onChange={() => setActiveJobSeeker(!activeJobSeeker)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Privacy Preferences */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Privacy Preferences</h2>
            <p className="text-gray-600 mb-6">Control how your data is used and shared on our platform.</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-800">Allow Data Analytics</h3>
                  <p className="text-sm text-gray-600">Allow us to use your data to improve your job recommendations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={allowDataAnalytics}
                    onChange={() => setAllowDataAnalytics(!allowDataAnalytics)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-800">Third-Party Data Sharing</h3>
                  <p className="text-sm text-gray-600">Allow sharing your profile data with trusted partners</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={allowThirdPartySharing}
                    onChange={() => setAllowThirdPartySharing(!allowThirdPartySharing)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-800">Save Search History</h3>
                  <p className="text-sm text-gray-600">Store your job search history to personalize your experience</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={saveSearchHistory}
                    onChange={() => setSaveSearchHistory(!saveSearchHistory)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Settings</h2>
            <p className="text-gray-600 mb-6">Control how and when you receive updates from us.</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-800">Email Notifications</h3>
                  <p className="text-sm text-gray-600">Receive job updates and messages via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={emailNotifications}
                    onChange={() => setEmailNotifications(!emailNotifications)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-800">Push Notifications</h3>
                  <p className="text-sm text-gray-600">Receive real-time alerts in your browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={pushNotifications}
                    onChange={() => setPushNotifications(!pushNotifications)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-800">SMS Notifications</h3>
                  <p className="text-sm text-gray-600">Receive urgent updates via text message</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={smsNotifications}
                    onChange={() => setSmsNotifications(!smsNotifications)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Application Preferences */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Application Preferences</h2>
            <p className="text-gray-600 mb-6">Control your job application settings and visibility.</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-800">Show Applied Jobs</h3>
                  <p className="text-sm text-gray-600">Display jobs you&apos;ve already applied for in search results</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={showAppliedJobs}
                    onChange={() => setShowAppliedJobs(!showAppliedJobs)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-800">Application Status Notifications</h3>
                  <p className="text-sm text-gray-600">Get notified when recruiters view your application</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifyOnApplicationViewed}
                    onChange={() => setNotifyOnApplicationViewed(!notifyOnApplicationViewed)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Save Changes */}
        <div className="flex justify-end mt-6">
          <Button className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700">
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
