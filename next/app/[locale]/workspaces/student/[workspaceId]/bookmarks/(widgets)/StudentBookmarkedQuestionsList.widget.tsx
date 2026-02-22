"use client";

import {
  useState,
  useEffect
} from 'react';
import Image
  from 'next/image';
import { toast } from 'react-toastify';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { useRouter } from 'next/navigation';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';
import { GlobalImagePlaceholderTile } from '@/app/[locale]/(global)/(tiles)/GlobalImagePlaceholder.tile';
interface FavoriteCard {
  favorite_id: number;
  id: number;
  store_id: number | null;
  images: string[];
  storage_prefix: string;
  title: string;
  favorited_at: string;
  price: number | null;
}

interface Pagination {
  totalPages: number;
  total: number;
  hasNext: boolean;
}

export function StudentBookmarkedQuestionsListWidget() {
  const [favorites, setFavorites] = useState<FavoriteCard[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    totalPages: 0,
    total: 0,
    hasNext: false
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const limit = 20;

  useEffect(() => {
    fetchFavorites();
  }, [page]);

  const fetchFavorites = async () => {
    setLoading(true);

    try {
      const response = await fetchApiUtil<any>({
        method: 'GET',
        url: `/api/workspaces/dashboard/favorites?page=${page}&limit=${limit}`,
        params: {},
        body: {}
      });

      if (response.status === 200) {
        setFavorites(response.data.favorites);
        setPagination(response.data.pagination);
      } else {
        ConsoleLogger.error('Error fetching favorites:', response.data?.error);
        toast.error(response.data?.error || 'Failed to load favorites');
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (cardId: number) => {
    if (!confirm('Are you sure you want to remove this card from your favorites?')) {
      return;
    }

    try {
      const response = await fetchApiUtil<any>({
        method: 'DELETE',
        url: `/api/workspaces/dashboard/favorites/delete/${cardId}`,
        params: {},
        body: {}
      });

      if (response.status === 200) {
        // Refresh the favorites list
        fetchFavorites();
        toast.success(response.data?.message || 'Card removed from favorites');
      } else {
        ConsoleLogger.error('Error removing favorite:', response.data?.error);
        toast.error(response.data?.error || 'Failed to remove favorite');
      }
    } catch (error) {
      ConsoleLogger.error('Error removing favorite:', error);
      toast.error('Failed to remove favorite');
    }
  };

  const handleViewCard = (cardId: number) => {
    router.push(`/cards/${cardId}`);
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-app-dark-blue dark:text-white mb-2">My Favorites</h1>
        <p className="text-gray-600">Manage your favorite cards</p>
      </div>

      {loading ? <GlobalLoaderTile message="Loading favorites..." /> : favorites.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">❤️</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">No favorites yet</h2>
          <p className="text-gray-500 mb-6">Start exploring and add some cards to your favorites!</p>
          <button
            onClick={() => router.push('/')}
            className="bg-app-bright-green hover:bg-red-600 text-white px-6 py-3 rounded-app-primary font-semibold transition-colors"
          >
            Browse Cards
          </button>
        </div>
      ) : (
        <>
          <div className="w-full bg-white text-sm grid grid-cols-12 gap-4 mb-8">
            {favorites.map((favorite) => (
              <div key={favorite.favorite_id} className="grid col-span-6 md:col-span-4 lg:col-span-3 w-full relative rounded bg-white">
                {/* Store Badge */}
                {(favorite.store_id !== null) ? (
                  <span className='bg-app-bright-green-light text-app-dark-blue dark:text-white px-2 py-1 rounded absolute top-2 left-2 z-[2] font-bold'>
                    Store
                  </span>
                ) : ('')}

                {/* Card Image */}
                <div className="relative row-span-6 col-span-12 w-full justify-center items-start px-6 aspect-square">
                  {favorite.images && favorite.images.length > 0 ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_S3_PREFIX}/cards/${favorite.storage_prefix}/${favorite.images[0]}`}
                      alt={favorite.title}
                      fill
                      className="rounded w-full"
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <GlobalImagePlaceholderTile
                      error={false}
                      shimmer={true}
                      aspect="aspect-square"
                      className="rounded"
                    />
                  )}

                  {/* Favorite Date */}
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    Added {new Date(favorite.favorited_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Card Content */}
                <div className="grid font-bold row-span-4 grid-rows-7 bottom-0 left-0 py-3 md:py-5 px-2 md:px-3 lg:px-4 col-span-12 justify-start items text-app-dark-blue dark:text-white rounded-b-app-primary">
                  <p className='text-md lg:text-lg flex items-center font-black text-app-bright-green self-start row-span-2'>
                    {favorite.price && favorite.price}
                    <span className="pl-1 text-xs font-light text-app-bright-green/50">AZN</span>
                  </p>
                  <p className='text-sm lg:text-md line-clamp-2 self-start row-span-3'>{favorite.title || "No Title"}</p>
                  <p className='w-full text-sm font-light self-end row-span-2'>{new Date(favorite.favorited_at).toLocaleDateString()}</p>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-1 z-[2]">
                  <button
                    onClick={() => handleViewCard(favorite.id)}
                    className="bg-app-bright-green hover:bg-red-600 text-white py-1 px-2 rounded text-xs font-semibold transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleRemoveFavorite(favorite.id)}
                    className="bg-app-bright-green-danger hover:bg-red-600 text-white py-1 px-2 rounded text-xs font-semibold transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || loading}
                className="px-4 py-2 border border-app-light rounded-app-primary text-app-dark-blue dark:text-white bg-white hover:bg-app-bright-green-light disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="text-gray-600">
                Page {page} of {pagination.totalPages}
                {pagination.total > 0 && (
                  <span className="ml-2 text-sm">
                    ({pagination.total} total favorites)
                  </span>
                )}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext || loading}
                className="px-4 py-2 border border-app-light rounded-app-primary text-app-dark-blue dark:text-white bg-white hover:bg-app-bright-green-light disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}