"use client";

import {
    useState,
    useEffect,
    ReactNode
} from 'react';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface ModalProps {
    title: string;
    children: ReactNode;
    onClose: () => void;
}

// Simple Modal Component
const Modal = ({ title, children, onClose }: ModalProps) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-4 rounded">
            <h4 className="text-lg font-medium">{title}</h4>
            {children}
            <button onClick={onClose} className="mt-2 px-4 py-2 bg-red-500 text-white rounded">Close</button>
        </div>
    </div>
);

interface FilterOption {
    id: number;
    title: string;
    title_en?: string;
    title_ru?: string;
}

interface Filter {
    id: number;
    title: string;
    type: string;
    subject_filter_options: FilterOption[];
    [key: string]: any;
}

interface StaffSubjectFiltersEditWidgetProps {
    subjectId: number;
}

export function StaffSubjectFiltersEditWidget({ subjectId }: StaffSubjectFiltersEditWidgetProps) {
    const [filters, setFilters] = useState<Filter[]>([]);
    const [newFilterTitle, setNewFilterTitle] = useState<string>('');
    const [newFilterTitleEn, setNewFilterTitleEn] = useState<string>('');
    const [newFilterTitleRu, setNewFilterTitleRu] = useState<string>('');

    const [newOptionTitle, setNewOptionTitle] = useState<string>('');
    const [newOptionTitleEn, setNewOptionTitleEn] = useState<string>('');
    const [newOptionTitleRu, setNewOptionTitleRu] = useState<string>('');

    const [filterType, setFilterType] = useState<string>('DYNAMIC');
    const [selectedFilterId, setSelectedFilterId] = useState<number | null>(null);

    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [showOptionModal, setShowOptionModal] = useState<boolean>(false);

    useEffect(() => {
        fetchFilters();
    }, [subjectId]);

    const fetchFilters = async () => {
        try {
            const response = await apiCallForSpaHelper({ method: 'GET', url: '/api/workspaces/staff/subjects/' + subjectId + '/filters', params: {}, body: {} });

            if (response.status === 200) {
                setFilters(response.data.filters);
            }
        } catch (error) {
            ConsoleLogger.error('Error fetching filters:', error instanceof Error ? error.message : String(error));
        }
    };

    const addFilter = async () => {
        try {
            const response = await apiCallForSpaHelper({ method: 'POST', url: '/api/workspaces/staff/subjects/' + subjectId + '/filters/create', params: {}, body: { title: newFilterTitle, title_en: newFilterTitleEn, title_ru: newFilterTitleRu, type: filterType } });

            if (response.status === 200) {
                setNewFilterTitle('');
                setFilterType('DYNAMIC');
                fetchFilters();
            }
        } catch (error) {
            ConsoleLogger.error('Error adding filter:', error instanceof Error ? error.message : String(error));
        }
    };

    const deleteFilter = async (filterId: number) => {
        try {
            const response = await apiCallForSpaHelper({ method: 'DELETE', url: '/api/workspaces/staff/subjects/' + subjectId + '/filters/' + filterId + '/delete', params: {}, body: {} });

            if (response.status === 200) {
                fetchFilters(); // Refresh the filters list after deletion
            }
        } catch (error) {
            ConsoleLogger.error('Error deleting filter:', error instanceof Error ? error.message : String(error));
        }
    };

    const addOption = async () => {
        try {
            const response = await apiCallForSpaHelper({ method: 'POST', url: '/api/workspaces/staff/subjects/' + subjectId + '/filters/' + selectedFilterId + '/options/create', params: {}, body: { title: newOptionTitle, title_en: newOptionTitleEn, title_ru: newOptionTitleRu } });

            if (response.status === 200) {
                setNewOptionTitle('');
                fetchFilters();
            }
        } catch (error) {
            ConsoleLogger.error('Error adding option:', error instanceof Error ? error.message : String(error));
        }
    };

    const deleteOption = async (optionId: number) => {
        try {
            const response = await apiCallForSpaHelper({ method: 'DELETE', url: '/api/workspaces/staff/subjects/' + subjectId + '/filters/' + selectedFilterId + '/options/' + optionId + '/delete', params: {}, body: {} });

            if (response.status === 200) {
                fetchFilters(); // Refresh the filters list to reflect the deleted option
            }
        } catch (error) {
            ConsoleLogger.error('Error deleting option:', error instanceof Error ? error.message : String(error));
        }
    };

    return (
        <div className=' bg-gray-200 rounded-lg my-4 p-4'>
            <h3 className="text-lg font-medium p-4">Filters</h3>
            {filters.map(filter => (
                <div key={filter.id} className="mb-4 p-4 bg-white ">
                    <div className='p-4'>
                        Filter id: {filter.id} - Adi <span className='font-bold'>{filter.title}</span> novu -({filter.type})
                        <button onClick={() => deleteFilter(filter.id)} className="ml-2 px-2 py-1 bg-gray-600 text-white rounded">Delete Filter</button>
                    </div>
                    <ul className='grid grid-cols-1 gap-4 p-4 border border-gray-200 rounded-lg'>
                        {filter.subject_filter_options.map((option: FilterOption) => (
                            <li className="bg-gray-300 text-black p-3 rounded-lg" key={option.id}>
                                Option id{option.id}: Adi <span className='font-bold'>{option.title}</span>
                                <button onClick={() => deleteOption(option.id)} className="ml-2 px-2 py-1 bg-gray-600 text-white rounded">Delete Option</button>
                            </li>
                        ))}
                    </ul>
                    {filter.type === 'STATIC' && (
                        <button type="button" onClick={() => { setSelectedFilterId(filter.id); setShowOptionModal(true); }} className="mt-2 px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600">Add Option</button>
                    )}
                </div>
            ))}
            <button type="button" onClick={() => setShowFilterModal(true)} className="mt-2 px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600">Add New Filter</button>

            {/* Filter Modal */}
            {showFilterModal && (
                <Modal title="Add New Filter" onClose={() => setShowFilterModal(false)}>
                    <input
                        type="text"
                        value={newFilterTitle}
                        onChange={(e) => setNewFilterTitle(e.target.value)}
                        placeholder="Filter Title"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
                    />
                    <input
                        type="text"
                        value={newFilterTitleEn}
                        onChange={(e) => setNewFilterTitleEn(e.target.value)}
                        placeholder="Title En"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
                    />
                    <input
                        type="text"
                        value={newFilterTitleRu}
                        onChange={(e) => setNewFilterTitleRu(e.target.value)}
                        placeholder="Title Ru"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
                    />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
                    >
                        <option value="DYNAMIC">DYNAMIC</option>
                        <option value="STATIC">STATIC</option>
                    </select>
                    <button type='button'
                        onClick={() => { addFilter(); setShowFilterModal(false); }}
                        className="mt-2 px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                    >
                        Add Filter
                    </button>
                </Modal>
            )}

            {/* Option Modal */}
            {showOptionModal && (
                <Modal title="Add New Option" onClose={() => setShowOptionModal(false)}>
                    <input
                        type="text"
                        value={newOptionTitle}
                        onChange={(e) => setNewOptionTitle(e.target.value)}
                        placeholder="Option Title"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
                    />
                    <input
                        type="text"
                        value={newOptionTitleEn}
                        onChange={(e) => setNewOptionTitleEn(e.target.value)}
                        placeholder="Title En"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
                    />
                    <input
                        type="text"
                        value={newOptionTitleRu}
                        onChange={(e) => setNewOptionTitleRu(e.target.value)}
                        placeholder="Title Ru "
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
                    />
                    <button type='button'
                        onClick={() => { addOption(); setShowOptionModal(false); }}
                        className="mt-2 px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600"
                    >
                        Add Option
                    </button>
                </Modal>
            )}
        </div>
    );
}

