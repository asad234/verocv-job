import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

const ProfileDetail = ({ scrollToProfile }: { scrollToProfile: boolean }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState({
    name: "English",
    code: "gb",
    icon: "twemoji:flag-united-kingdom",
  });

  // Form state
  const [firstName, setFirstName] = useState("Abdullahi");
  const [surname, setSurname] = useState("Asad");
  const [title, setTitle] = useState("Software Developer");
  const [presentationProfessional, setPresentationProfessional] = useState(
    "Passionate about technology and AI development."
  );
  const [presentationPersonal, setPresentationPersonal] = useState(
    "Enjoys coding, problem-solving, and building startups."
  );

  // Backup for cancel function
  const originalState = useRef({
    firstName,
    surname,
    title,
    presentationProfessional,
    presentationPersonal,
  });

  const profileDetailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollToProfile && profileDetailRef.current) {
      profileDetailRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [scrollToProfile]);

  // Save changes
  const handleSave = () => {
    setIsEditing(false);
  };

  // Cancel changes (restore old values)
  const handleCancel = () => {
    setFirstName(originalState.current.firstName);
    setSurname(originalState.current.surname);
    setTitle(originalState.current.title);
    setPresentationProfessional(originalState.current.presentationProfessional);
    setPresentationPersonal(originalState.current.presentationPersonal);
    setIsEditing(false);
  };

  return (
    <div ref={profileDetailRef} className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Navbar */}
      <div className="flex items-center justify-between bg-white p-4 shadow-md rounded-lg">
        {/* Left: Profile & Selected Language Flag */}
        <div className="flex items-center gap-2">
          <Icon icon={selectedLanguage.icon} className="w-6 h-6" />
          <h2 className="text-lg font-medium">Profile</h2>
        </div>

        {/* Right: Import a CV & Menu */}
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Import a CV
          </button>

          {/* Menu Button */}
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              <Icon icon="tabler:dots-vertical" className="w-6 h-6 text-gray-600" />
            </button>

            {/* Menu Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-md">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                  Expand all
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                  Collapse all
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                  Remove translation
                </button>
                <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">
                  Remove profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Translation Board */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Translation</h3>
          <Icon icon="tabler:plus" className="w-6 h-6 text-gray-600 cursor-pointer" />
        </div>

        {/* Selected Language Button */}
        <button className="flex items-center gap-2 mt-4 px-4 py-2 bg-gray-100 rounded-lg">
          <Icon icon={selectedLanguage.icon} className="w-5 h-5" />
          {selectedLanguage.name}
        </button>
      </div>

      {/* Presentation Card */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        {/* Header: Presentation + Dropdown */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="tabler:user" className="w-6 h-6 text-gray-600" />
            <h3 className="text-lg font-medium">Presentation</h3>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button onClick={() => setIsEditing(false)}>
                <Icon icon="tabler:x" className="w-6 h-6 text-gray-600" />
              </button>
            )}
            <button onClick={() => setIsExpanded(!isExpanded)}>
              <Icon
                icon={isExpanded ? "tabler:chevron-up" : "tabler:chevron-down"}
                className="w-6 h-6 text-gray-600"
              />
            </button>
          </div>
        </div>

        {/* Editable Form */}
        {isEditing ? (
          <div className="mt-4 space-y-4">
            {/* Name Fields */}
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-gray-600 text-sm">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                />
              </div>
              <div className="w-1/2">
                <label className="text-gray-600 text-sm">Surname</label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-gray-600 text-sm">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg"
              />
            </div>

            {/* Professional Presentation */}
            <div>
              <label className="text-gray-600 text-sm">Presentation (professional)</label>
              <textarea
                value={presentationProfessional}
                onChange={(e) => setPresentationProfessional(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg h-20"
              ></textarea>
            </div>

            {/* Personal Presentation */}
            <div>
              <label className="text-gray-600 text-sm">Presentation (personal)</label>
              <textarea
                value={presentationPersonal}
                onChange={(e) => setPresentationPersonal(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg h-20"
              ></textarea>
            </div>

            {/* Save & Cancel Buttons */}
            <div className="flex justify-start gap-4 mt-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          isExpanded && (
            <div className="mt-4">
              <p className="text-gray-800 text-lg font-semibold">
                {firstName} {surname}
              </p>
              <p className="text-gray-600">{title}</p>

              {/* Professional Presentation */}
              <div className="mt-4">
                <p className="text-gray-600 font-medium">Presentation (professional)</p>
                <p className="text-gray-800">{presentationProfessional}</p>
              </div>

              {/* Personal Presentation */}
              <div className="mt-4">
                <p className="text-gray-600 font-medium">Presentation (personal)</p>
                <p className="text-gray-800">{presentationPersonal}</p>
              </div>

              {/* Edit Button */}
              <div className="flex justify-end mt-4">
                <Icon
                  icon="tabler:pencil"
                  className="w-5 h-5 text-gray-500 cursor-pointer"
                  onClick={() => {
                    originalState.current = {
                      firstName,
                      surname,
                      title,
                      presentationProfessional,
                      presentationPersonal,
                    };
                    setIsEditing(true);
                  }}
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ProfileDetail;
