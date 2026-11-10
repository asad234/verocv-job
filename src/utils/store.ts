import { create } from 'zustand';

interface ProfileState {
  showDragDrop: boolean;
  setShowDragDrop: (show: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  showDragDrop: false,
  setShowDragDrop: (show) => set({ showDragDrop: show }),
}));


interface LanguageState {
  searchTerm: string;
  selectedLanguage: string;
  isDropdownOpen: boolean;
  showProfileDetail: boolean;
  setSearchTerm: (term: string) => void;
  setSelectedLanguage: (language: string) => void;
  setIsDropdownOpen: (isOpen: boolean) => void;
  setShowProfileDetail: (show: boolean) => void;
  reset: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  searchTerm: '',
  selectedLanguage: '',
  isDropdownOpen: false,
  showProfileDetail: false,
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedLanguage: (language) => set({ selectedLanguage: language }),
  setIsDropdownOpen: (isOpen) => set({ isDropdownOpen: isOpen }),
  setShowProfileDetail: (show) => set({ showProfileDetail: show }),
  reset: () => set({ 
    searchTerm: '', 
    selectedLanguage: '', 
    isDropdownOpen: false, 
    showProfileDetail: false 
  }),
}));