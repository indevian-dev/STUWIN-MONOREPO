"use client";

import Image
  from 'next/image';
import {
  useState,
  useEffect
} from 'react';
import { useTranslations } from 'next-intl';
import { useGlobalCategoryContext } from '@/app/[locale]/(global)/(context)/GlobalSubjectsContext';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { BaseModalProps } from '@/types';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface Card {
  id: number;
  [key: string]: any;
}

interface FieldDifference {
  fieldName: string;
  current: any;
  published: any;
  hasChanged: boolean;
}

interface CardOption {
  type: 'STATIC' | 'DYNAMIC';
  option_id?: number;
  option_group_id?: number;
  dynamic_value?: string;
}

interface OptionGroup {
  id: number;
  title: string;
  options?: Array<{
    id: number;
    title: string;
  }>;
}

interface Category {
  id: number;
  title?: string;
  children?: Category[];
}

interface StaffCardDetailsModalWidgetProps extends BaseModalProps {
  selectedCard: Card | null;
  onApprove: (cardId: number) => void;
  onReject: (cardId: number) => void;
  loading: boolean;
  onCardDataUpdate?: (card: Card) => void;
}

export function StaffCardDetailsModalWidget({ selectedCard, isOpen, onClose, onApprove, onReject, loading, onCardDataUpdate }: StaffCardDetailsModalWidgetProps) {
  const t = useTranslations('Console Cards');
  const { categoriesHierarchy } = useGlobalCategoryContext();
  const [optionsGroups, setOptionsGroups] = useState<OptionGroup[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
  const [differences, setDifferences] = useState<FieldDifference[]>([]);

  // Helper function to detect differences between current and published values
  const detectFieldDifference = (currentValue: any, publishedValue: any, fieldName: string): FieldDifference | null => {
    // Handle null/undefined comparisons
    if (currentValue === null && publishedValue === null) return null;
    if (currentValue === undefined && publishedValue === undefined) return null;

    // For JSON objects and arrays, use JSON string comparison
    if (typeof currentValue === 'object' && typeof publishedValue === 'object') {
      const currentStr = JSON.stringify(currentValue);
      const publishedStr = JSON.stringify(publishedValue);
      if (currentStr !== publishedStr) {
        return {
          fieldName,
          current: currentValue,
          published: publishedValue,
          hasChanged: true
        };
      }
    } else if (currentValue !== publishedValue) {
      return {
        fieldName,
        current: currentValue,
        published: publishedValue,
        hasChanged: true
      };
    }
    return null;
  };

  // Calculate differences when card changes
  useEffect(() => {
    if (selectedCard) {
      const newDifferences: FieldDifference[] = [];

      if (selectedCard.published_data) {
        const fieldsToCompare = [
          'title',
          'body',
          'price',
          'location',
          'images',
          'video',
          'categories',
          'options'
        ];

        fieldsToCompare.forEach(field => {
          const diff = detectFieldDifference(
            selectedCard[field],
            selectedCard.published_data[field],
            field
          );
          if (diff) {
            newDifferences.push(diff);
          }
        });
      }

      setDifferences(newDifferences);
    }
  }, [selectedCard]);

  // Fetch options when card changes
  useEffect(() => {
    if (selectedCard) {
      // Collect all category IDs from both current and published categories
      const allCategoryIds: number[] = [];

      if (selectedCard.categories && selectedCard.categories.length > 0) {
        allCategoryIds.push(...selectedCard.categories);
      }

      if (selectedCard.published_data?.categories && selectedCard.published_data.categories.length > 0) {
        allCategoryIds.push(...selectedCard.published_data.categories);
      }

      // Remove duplicates and fetch options for all categories
      const uniqueCategoryIds = [...new Set(allCategoryIds)];
      if (uniqueCategoryIds.length > 0) {
        fetchOptionsForCategories(uniqueCategoryIds);
      }
    }
  }, [selectedCard]);

  const fetchOptionsForCategories = async (categoryIds: number[]) => {
    if (!categoryIds || categoryIds.length === 0) return;

    setLoadingOptions(true);
    try {
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/categories/options-groups?category_id=${categoryIds.join(',')}`,
        params: {},
        body: {}
      });

      if (response.status === 200) {
        setOptionsGroups(response.data.options_groups || []);
      } else {
        ConsoleLogger.error('Error fetching options:', response.data);
        setOptionsGroups([]);
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching options:', error);
      setOptionsGroups([]);
    }
    setLoadingOptions(false);
  };

  // Function to find category by ID from the hierarchy
  const findCategoryById = (categories: Category[], id: number): Category | null => {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.children && category.children.length > 0) {
        const found = findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Function to map category IDs to category titles
  const getCategoryTitles = (categoryIds: number[] | undefined): string => {
    if (!categoryIds || !Array.isArray(categoryIds) || categoriesHierarchy.length === 0) {
      return 'No categories';
    }

    const categoryTitles = categoryIds
      .map(categoryId => {
        const category = findCategoryById(categoriesHierarchy, categoryId);
        return category ? category.title : `ID: ${categoryId}`;
      })
      .filter(title => title !== null);

    return categoryTitles.length > 0 ? categoryTitles.join(', ') : 'No categories';
  };

  // Function to find option details by option ID
  const findOptionById = (optionId: number) => {
    for (const group of optionsGroups) {
      if (group.options) {
        const option = group.options.find(opt => opt.id === optionId);
        if (option) {
          return {
            option,
            group
          };
        }
      }
    }
    return null;
  };

  // Function to find option group by ID
  const findOptionGroupById = (groupId: number): OptionGroup | null => {
    return optionsGroups.find(group => group.id === groupId) || null;
  };

  // Function to render options with proper titles
  const renderOptions = (cardOptions: CardOption[] | undefined, isNew = false) => {
    if (!cardOptions || cardOptions.length === 0) {
      return <p className="text-gray-500">{isNew ? t('no-changes') : t('no-options')}</p>;
    }

    if (loadingOptions) {
      return <p className="text-gray-500">Loading options...</p>;
    }

    return (
      <div className="space-y-2">
        {cardOptions.map((cardOption, index) => {
          // Handle both STATIC and DYNAMIC option types
          let optionDetails = null;
          let groupDetails = null;

          if (cardOption.type === 'STATIC' && cardOption.option_id) {
            optionDetails = findOptionById(cardOption.option_id);
          }

          if (cardOption.option_group_id) {
            groupDetails = findOptionGroupById(cardOption.option_group_id);
          }

          return (
            <div
              key={index}
              className={`p-3 rounded text-sm border ${isNew
                ? 'bg-blue-50 border-2 border-blue-300'
                : 'bg-slate-100 border border-slate-300'
                }`}
            >
              {/* Option Group */}
              <div className={`font-medium mb-1 ${isNew ? 'text-blue-800' : 'text-slate-800'
                }`}>
                {optionDetails ? optionDetails.group.title :
                  groupDetails ? groupDetails.title :
                    `${t('group-id')}: ${cardOption.option_group_id || 'Unknown'}`}
              </div>

              {/* Option Value */}
              <div className={`${isNew ? 'text-blue-600' : 'text-slate-600'
                }`}>
                {cardOption.type === 'DYNAMIC' ? (
                  <div>
                    <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded mr-2">
                      DYNAMIC
                    </span>
                    {cardOption.dynamic_value || t('no-value')}
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                      STATIC
                    </span>
                    {optionDetails ? optionDetails.option.title :
                      `${t('option-id')}: ${cardOption.option_id}`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper function to render field values
  const renderFieldValue = (value: any, fieldName: string, isCurrent = false, isChanged = false) => {
    const baseClass = `p-3 rounded break-words ${isChanged && isCurrent
      ? 'bg-orange-50 border-2 border-orange-200 text-orange-900'
      : isCurrent
        ? 'bg-blue-50 border-2 border-blue-200'
        : 'bg-green-50 border-2 border-green-200'
      }`;

    if (fieldName === 'images' || fieldName === 'video') {
      return (
        <div className={baseClass}>
          {Array.isArray(value) ? (
            <div className="flex flex-wrap gap-2">
              {value.length > 0 ? (
                value.map((img: string, idx: number) => (
                  <div key={idx} className="relative">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_S3_PREFIX}/cards/${selectedCard?.storage_prefix}/${img}`}
                      alt={`Image ${idx + 1}`}
                      width={80}
                      height={80}
                      className={`object-cover rounded ${isChanged && isCurrent ? 'border-2 border-orange-300' : isCurrent ? 'border-2 border-blue-300' : 'border-2 border-green-300'}`}
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500">{t('no-images')}</p>
              )}
            </div>
          ) : (
            <p>{value || t('no-value')}</p>
          )}
        </div>
      );
    }

    if (fieldName === 'categories') {
      return (
        <div className={baseClass}>
          <p>{getCategoryTitles(value)}</p>
        </div>
      );
    }

    if (fieldName === 'options') {
      return (
        <div className={baseClass}>
          {renderOptions(value, isChanged && isCurrent)}
        </div>
      );
    }

    if (fieldName === 'location') {
      return (
        <div className={baseClass}>
          <p>
            {value ? `Lat: ${value.lat}, Lng: ${value.lng}` : t('no-location')}
          </p>
        </div>
      );
    }

    if (fieldName === 'body') {
      return (
        <div className={`${baseClass} min-h-[120px] whitespace-pre-wrap overflow-auto`}>
          {value || t('no-description')}
        </div>
      );
    }

    return (
      <div className={baseClass}>
        {value || t('no-value')}
      </div>
    );
  };

  if (!isOpen) return null;

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex justify-start items-start z-50 overflow-hidden">
        <div className="bg-white w-full h-full overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">{t('loading-card-details')}</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>
          <div className="flex justify-center items-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-xl text-gray-600">{t('loading')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no card data
  if (!selectedCard) {
    return (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex justify-start items-start z-50 overflow-hidden">
        <div className="bg-white w-full h-full overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-red-600">{t('error-loading-card')}</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>
          <div className="text-center py-24">
            <p className="text-xl text-gray-600 mb-4">{t('failed-to-load')}</p>
            <button
              onClick={onClose}
              className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if card has pending changes
  const hasPendingChanges = !selectedCard.is_approved || (selectedCard.published_data && differences.length > 0);

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex justify-start items-start z-50 overflow-hidden">
      <div className="bg-white w-full h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">
              Card Details - ID: {selectedCard.id}
              {hasPendingChanges && (
                <span className="text-orange-600 ml-3 text-lg">
                  ⚠️ Pending Changes
                </span>
              )}
              {selectedCard.is_published && (
                <span className="text-green-600 ml-3 text-lg">
                  ✓ Published
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Status Alert */}
        {hasPendingChanges && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mx-6 mt-4 rounded">
            <div className="flex items-start">
              <div className="text-2xl mr-3">⚠️</div>
              <div>
                <p className="text-sm font-bold text-orange-900">
                  {selectedCard.is_approved ? 'Card has pending updates' : 'Card awaiting initial approval'}
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  {differences.length > 0
                    ? `${differences.length} field(s) have changed compared to published version. Review and approve or reject changes.`
                    : 'This card is pending your approval.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6 p-6 min-h-screen">
          {/* Left Side: Card Data Comparison */}
          <div className="flex-1 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 border-b pb-2">
              Card Data {hasPendingChanges && <span className="text-orange-600 ml-2">⚠️ Has Changes</span>}
            </h3>

            {/* Fields Comparison */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-3">Title:</h4>
                {differences.some(d => d.fieldName === 'title') ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-orange-700 block mb-2">Current (Changed):</label>
                      {renderFieldValue(selectedCard.title, 'title', true, true)}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-green-700 block mb-2">Published:</label>
                      {renderFieldValue(selectedCard.published_data?.title, 'title', false, true)}
                    </div>
                  </div>
                ) : (
                  renderFieldValue(selectedCard.title, 'title', true, false)
                )}
              </div>

              {/* Price */}
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-3">Price:</h4>
                {differences.some(d => d.fieldName === 'price') ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-orange-700 block mb-2">Current (Changed):</label>
                      {renderFieldValue(selectedCard.price, 'price', true, true)}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-green-700 block mb-2">Published:</label>
                      {renderFieldValue(selectedCard.published_data?.price, 'price', false, true)}
                    </div>
                  </div>
                ) : (
                  renderFieldValue(selectedCard.price, 'price', true, false)
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-3">Description:</h4>
                {differences.some(d => d.fieldName === 'body') ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-orange-700 block mb-2">Current (Changed):</label>
                      {renderFieldValue(selectedCard.body, 'body', true, true)}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-green-700 block mb-2">Published:</label>
                      {renderFieldValue(selectedCard.published_data?.body, 'body', false, true)}
                    </div>
                  </div>
                ) : (
                  renderFieldValue(selectedCard.body, 'body', true, false)
                )}
              </div>

              {/* Location */}
              {(selectedCard.location || selectedCard.published_data?.location) && (
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">Location:</h4>
                  {differences.some(d => d.fieldName === 'location') ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-orange-700 block mb-2">Current (Changed):</label>
                        {renderFieldValue(selectedCard.location, 'location', true, true)}
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-green-700 block mb-2">Published:</label>
                        {renderFieldValue(selectedCard.published_data?.location, 'location', false, true)}
                      </div>
                    </div>
                  ) : (
                    renderFieldValue(selectedCard.location, 'location', true, false)
                  )}
                </div>
              )}

              {/* Categories */}
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-3">Categories:</h4>
                {differences.some(d => d.fieldName === 'categories') ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-orange-700 block mb-2">Current (Changed):</label>
                      {renderFieldValue(selectedCard.categories, 'categories', true, true)}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-green-700 block mb-2">Published:</label>
                      {renderFieldValue(selectedCard.published_data?.categories, 'categories', false, true)}
                    </div>
                  </div>
                ) : (
                  renderFieldValue(selectedCard.categories, 'categories', true, false)
                )}
              </div>

              {/* Options */}
              {(selectedCard.options?.length > 0 || selectedCard.published_data?.options?.length > 0) && (
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">Options:</h4>
                  {differences.some(d => d.fieldName === 'options') ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-orange-700 block mb-2">Current (Changed):</label>
                        {renderFieldValue(selectedCard.options, 'options', true, true)}
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-green-700 block mb-2">Published:</label>
                        {renderFieldValue(selectedCard.published_data?.options, 'options', false, true)}
                      </div>
                    </div>
                  ) : (
                    renderFieldValue(selectedCard.options, 'options', true, false)
                  )}
                </div>
              )}

              {/* Images */}
              {(selectedCard.images?.length > 0 || selectedCard.published_data?.images?.length > 0) && (
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">Images:</h4>
                  {differences.some(d => d.fieldName === 'images') ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-orange-700 block mb-2">Current (Changed):</label>
                        {renderFieldValue(selectedCard.images, 'images', true, true)}
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-green-700 block mb-2">Published:</label>
                        {renderFieldValue(selectedCard.published_data?.images, 'images', false, true)}
                      </div>
                    </div>
                  ) : (
                    renderFieldValue(selectedCard.images, 'images', true, false)
                  )}
                </div>
              )}

              {/* Video */}
              {(selectedCard.video || selectedCard.published_data?.video) && (
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">Video:</h4>
                  {differences.some(d => d.fieldName === 'video') ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-orange-700 block mb-2">Current (Changed):</label>
                        {renderFieldValue(selectedCard.video, 'video', true, true)}
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-green-700 block mb-2">Published:</label>
                        {renderFieldValue(selectedCard.published_data?.video, 'video', false, true)}
                      </div>
                    </div>
                  ) : (
                    renderFieldValue(selectedCard.video, 'video', true, false)
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="w-full lg:w-80 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 border-b pb-2">Actions</h3>

            {/* Card Overview */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Card Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block">Card ID:</label>
                  <div className="p-2 bg-white rounded border text-sm">{selectedCard.id}</div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block">Posted By:</label>
                  <div className="p-2 bg-white rounded border text-sm">
                    {selectedCard.store_display_name || 'Individual User'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block">Status:</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-white rounded border">
                    {selectedCard.is_active ? (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        Inactive
                      </span>
                    )}

                    {selectedCard.is_approved ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Approved
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
                        Pending Approval
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block">Dates:</label>
                  <div className="p-2 bg-white rounded border space-y-1 text-xs">
                    <p>Created: {new Date(selectedCard.created_at).toLocaleString()}</p>
                    {selectedCard.updated_at && (
                      <p>Updated: {new Date(selectedCard.updated_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Actions</h4>
              <div className="space-y-3">
                {hasPendingChanges && (
                  <>
                    <button
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm"
                      onClick={() => onApprove(selectedCard.id)}
                    >
                      ✓ Approve All Changes
                    </button>
                    <button
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm"
                      onClick={() => onReject(selectedCard.id)}
                    >
                      ✕ Reject All Changes
                    </button>
                  </>
                )}

                <button
                  className="w-full bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors text-sm"
                  onClick={onClose}
                >
                  Close Modal
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
