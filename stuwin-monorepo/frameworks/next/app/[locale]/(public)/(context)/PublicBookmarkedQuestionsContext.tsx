'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode
} from 'react';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { PublicBookmarksLimitsModalWidget } from '@/app/[locale]/(public)/(widgets)/PublicBookmarksLimitsModalWidget';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface PublicBookmarkedQuestionsContextType {
  bookmarkIds: Set<string>;
  isBookmarked: (questionId: string) => boolean;
  isToggleLoading: (questionId: string) => boolean;
  toggleBookmark: (questionId: string) => Promise<boolean>;
  refreshBookmarks: () => void;
  showLimitModal: boolean;
  setShowLimitModal: (show: boolean) => void;
  maxFavorites: number;
}

const PublicBookmarkedQuestionsContext = createContext<PublicBookmarkedQuestionsContextType | undefined>(undefined);

export const usePublicBookmarkedQuestionsContext = () => {
  const context = useContext(PublicBookmarkedQuestionsContext);
  if (!context) {
    throw new Error('usePublicBookmarkedQuestionsContext must be used within an PublicBookmarkedQuestionsProvider');
  }
  return context;
};

const MAX_FAVORITES = 200;
const STORAGE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface PublicBookmarkedQuestionsProviderProps {
  children: ReactNode;
}

export const PublicBookmarkedQuestionsProvider = ({ children }: PublicBookmarkedQuestionsProviderProps) => {
  const { userId, loading: authLoading } = useGlobalAuthProfileContext();

  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [toggleLoadingIds, setToggleLoadingIds] = useState<Set<string>>(new Set());
  const [showLimitModal, setShowLimitModal] = useState(false);

  const isFetchingRef = useRef(false);
  const accountIdRef = useRef<string | null>(null);

  const getStorageKey = useCallback((accountId: string) => {
    return accountId ? `stuwin.ai_bookmarks_${accountId}` : null;
  }, []);

  const loadFromStorage = useCallback((accountId: string) => {
    try {
      const key = getStorageKey(accountId);
      if (!key) return null;

      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < STORAGE_CACHE_DURATION) {
          return new Set<string>(parsed.ids || []);
        }
      }
    } catch (error) {
      ConsoleLogger.warn('Error loading bookmarks from storage:', error);
    }
    return null;
  }, [getStorageKey]);

  const saveToStorage = useCallback((accountId: string, ids: Set<string>) => {
    try {
      const key = getStorageKey(accountId);
      if (!key) return;

      const idsArray = Array.from(ids).slice(0, MAX_FAVORITES);
      localStorage.setItem(key, JSON.stringify({
        ids: idsArray,
        timestamp: Date.now()
      }));
    } catch (error) {
      ConsoleLogger.warn('Error saving bookmarks to storage:', error);
    }
  }, [getStorageKey]);

  const fetchFavorites = useCallback(async (accountId: string) => {
    if (isFetchingRef.current || !accountId) return;
    isFetchingRef.current = true;

    try {
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/dashboard/favorites?page=1&limit=${MAX_FAVORITES}`,
        params: {},
        body: {}
      });

      const idsPayload = response.data?.bookmarks || response.data?.favorites;
      if (response.status === 200 && idsPayload) {
        const ids = new Set<string>(idsPayload.map((id: any) => String(id)));
        setBookmarkIds(ids);
        saveToStorage(accountId, ids);
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching bookmarked questions:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [saveToStorage]);

  useEffect(() => {
    if (authLoading) return;

    const accountId = userId;

    if (accountId) {
      if (accountIdRef.current !== accountId) {
        accountIdRef.current = accountId;
        const cachedIds = loadFromStorage(accountId);
        if (cachedIds) {
          setBookmarkIds(cachedIds);
        }
        fetchFavorites(accountId);
      }
    } else {
      if (accountIdRef.current !== null) {
        accountIdRef.current = null;
        setBookmarkIds(new Set());
      }
    }
  }, [authLoading, userId, fetchFavorites, loadFromStorage]);

  const isBookmarked = useCallback((questionId: string) => {
    return bookmarkIds.has(String(questionId));
  }, [bookmarkIds]);

  const isToggleLoading = useCallback((questionId: string) => {
    return toggleLoadingIds.has(String(questionId));
  }, [toggleLoadingIds]);

  const toggleBookmark = useCallback(async (questionId: string) => {
    const questionIdKey = String(questionId);
    const accountId = userId;

    setToggleLoadingIds(prev => new Set([...prev, questionIdKey]));

    try {
      const isCurrentlyBookmarked = bookmarkIds.has(questionIdKey);

      if (isCurrentlyBookmarked) {
        const response = await apiCallForSpaHelper({
          method: 'DELETE',
          url: `/api/workspaces/dashboard/favorites/delete/${questionId}`,
          params: {},
          body: {}
        });

        if (response.status === 200) {
          setBookmarkIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(questionIdKey);
            if (accountId) saveToStorage(accountId, newSet);
            return newSet;
          });
          toast.success('Removed from bookmarks');
          return true;
        } else if (response.status === 401) {
          return false;
        } else {
          toast.error(response.data?.error || 'Failed to remove from bookmarks');
          return false;
        }
      } else {
        if (bookmarkIds.size >= MAX_FAVORITES) {
          setShowLimitModal(true);
          return false;
        }

        const response = await apiCallForSpaHelper({
          method: 'POST',
          url: `/api/workspaces/dashboard/favorites/create/${questionId}`,
          params: {},
          body: {}
        });

        if (response.status === 201) {
          setBookmarkIds(prev => {
            const newSet = new Set([...prev, questionIdKey]);
            if (accountId) saveToStorage(accountId, newSet);
            return newSet;
          });
          toast.success('Added to bookmarks');
          return true;
        } else if (response.status === 401) {
          return false;
        } else if (response.status === 409) {
          setBookmarkIds(prev => new Set([...prev, questionIdKey]));
          toast.info('Already bookmarked');
          return true;
        } else {
          toast.error(response.data?.error || 'Failed to add to bookmarks');
          return false;
        }
      }
    } catch (error) {
      ConsoleLogger.error('Error toggling favorite question:', error);
      toast.error('Something went wrong. Please try again.');
      return false;
    } finally {
      setToggleLoadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionIdKey);
        return newSet;
      });
    }
  }, [userId, bookmarkIds, saveToStorage]);

  const refreshBookmarks = useCallback(() => {
    const accountId = userId;
    if (accountId) {
      isFetchingRef.current = false;
      fetchFavorites(accountId);
    }
  }, [userId, fetchFavorites]);

  const value = useMemo(() => ({
    bookmarkIds,
    isBookmarked,
    isToggleLoading,
    toggleBookmark,
    refreshBookmarks,
    showLimitModal,
    setShowLimitModal,
    maxFavorites: MAX_FAVORITES
  }), [
    bookmarkIds,
    isBookmarked,
    isToggleLoading,
    toggleBookmark,
    refreshBookmarks,
    showLimitModal
  ]);

  return (
    <PublicBookmarkedQuestionsContext.Provider value={value}>
      {children}
      <PublicBookmarksLimitsModalWidget
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        maxFavorites={MAX_FAVORITES}
      />
    </PublicBookmarkedQuestionsContext.Provider>
  );
};
