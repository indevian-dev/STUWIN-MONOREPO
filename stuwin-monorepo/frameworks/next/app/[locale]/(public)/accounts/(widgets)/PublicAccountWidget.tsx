"use client";

import {
  useState,
  useEffect,
  ChangeEvent
} from 'react';
import {
  FiEdit3,
  FiSave
} from 'react-icons/fi';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
type Account = {
  id: number;
  name: string;
  last_name: string;
  phone: string;
  avatar: string;
  [key: string]: any;
};

function PublicAccountWidget() {
  const [account, setUser] = useState<Account | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLastName, setIsEditingLastName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const toggleEditName = () => setIsEditingName(!isEditingName);
  const toggleEditPhone = () => setIsEditingPhone(!isEditingPhone);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiCallForSpaHelper({
          method: 'GET',
          url: '/api/workspaces/my/account'
        });
        if (response.status !== 200) throw new Error('Failed to fetch account data');
        setUser(response.data);
      } catch (error) {
        ConsoleLogger.error('Error fetching account data:', error instanceof Error ? error.message : 'Unknown error');
      }
    };

    fetchData();
  }, []);

  if (!account) return <div>Loading...</div>;

  const handleSaveName = async () => {
    await updateProfile('name', account.name);
    setIsEditingName(false); // Turn off edit mode after save
  };

  const handleSaveLastName = async () => {
    await updateProfile('last_name', account.last_name);
    setIsEditingLastName(false); // Turn off edit mode after save
  };

  const handleSavePhone = async () => {
    await updateProfile('phone', account.phone);
    setIsEditingPhone(false); // Turn off edit mode after save
  };

  const updateProfile = async (field: string, value: string) => {
    try {
      const body = { [field]: value }; // Dynamic key based on the field to update
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: '/api/workspaces/my/account/update',
        body: body
      });
      if (response.status !== 200) throw new Error('Failed to update profile');
      // Update was successful
      ConsoleLogger.log('Profile updated successfully');
      setUser((prev) => prev ? ({ ...prev, [field]: value }) : null); // Update local state to reflect changes
    } catch (error) {
      ConsoleLogger.error('Error updating profile:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const updateProfilePhoto = async (blob: Blob) => {
    if (!account) return;

    try {
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/workspaces/my/account/avatar/${account.id}`,
        body: {
          files: [{
            fieldName: 'avatar',
            file: blob,
            fileName: 'profile-photo.webp'
          }]
        }
      });

      if (response.status === 200) {
        ConsoleLogger.log('Profile photo updated successfully', response.data);

        // Assuming 'data' includes a property with the URL of the new avatar
        // Update the account state with the new avatar URL to trigger UI refresh
        setUser(prevUser => prevUser ? ({
          ...prevUser,
          avatar: response.data['url'] // Adjust the property name based on your actual API response
        }) : null);
      } else {
        throw new Error(`Failed to update profile photo: ${response.statusText || 'Unknown error'}`);
      }
    } catch (error) {
      ConsoleLogger.error('Error updating profile photo:', error instanceof Error ? error.message : 'Unknown error');
    }
  };


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      ConsoleLogger.error('No file selected.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);

          // Convert the canvas to a WebP blob
          canvas.toBlob((blob) => {
            if (blob) {
              // Now call updateProfilePhoto with the blob
              ConsoleLogger.log('Converted to WebP', blob);
              updateProfilePhoto(blob);
            }
          }, 'image/webp');
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };


  const handleChange = (field: string, value: string) => {
    setUser((prev) => prev ? ({ ...prev, [field]: value }) : null);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="text-left">
        {/* Avatar */}
        <div className='relative'>
          <img
            src={`https://s3.tebi.io/stuwin.ai/avatars/${account.id}/${account.avatar}`}
            alt=" "
            className="rounded-full w-32 h-32 object-cover bg-gray-100"
          />
          <div className="mt-6 absolute bottom-0 z-10">
            <label htmlFor="profilePhoto" className="cursor-pointer bg-blue-700">
              <FiEdit3 className="ml-2 cursor-pointer" />
            </label>
            <input
              id="profilePhoto"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
        {/* Name with Edit/Save Icon */}
        <div className="mt-4 flex items-center">
          {isEditingName ? (
            <>
              <input
                type="text"
                value={account.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="text-xl font-semibold text-gray-800 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <FiSave onClick={handleSaveName} className="ml-2 cursor-pointer" />
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-800 cursor-pointer" onClick={() => setIsEditingName(true)}>
                {account.name}
              </h1>
              <FiEdit3 onClick={() => setIsEditingName(true)} className="ml-2 cursor-pointer" />
            </>
          )}
        </div>

        {/* Last Name with Edit/Save Icon */}
        <div className="mt-4 flex items-center">
          {isEditingLastName ? (
            <>
              <input
                type="text"
                value={account.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="text-xl font-semibold text-gray-800 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <FiSave onClick={handleSaveLastName} className="ml-2 cursor-pointer" />
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-800 cursor-pointer" onClick={() => setIsEditingLastName(true)}>
                {account.last_name}
              </h1>
              <FiEdit3 onClick={() => setIsEditingLastName(true)} className="ml-2 cursor-pointer" />
            </>
          )}
        </div>

        {/* Phone Number with Edit/Save Icon */}
        <div className="mt-6 flex items-center">
          {isEditingPhone ? (
            <>
              <input
                type="tel"
                value={account.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="text-md text-gray-800 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <FiSave onClick={handleSavePhone} className="ml-2 cursor-pointer" />
            </>
          ) : (
            <>
              <p className="text-md text-gray-800 cursor-pointer" onClick={toggleEditPhone}>
                Phone: {account.phone}
              </p>
              <FiEdit3 onClick={toggleEditPhone} className="ml-2 cursor-pointer" />
            </>
          )}
        </div>

        {/* Links */}
        <ul className="mt-6 space-y-2">
          {account.store_id ? (
            < li > <a href={`/my/store/`} className="text-blue-600 hover:underline">Store MAnagment</a></li>
          ) : ('')}
          < li > <a href="#" className="text-blue-600 hover:underline">My Cards</a></li>
          <li><a href="#" className="text-blue-600 hover:underline">My Favorites</a></li>
          <li><a href="#" className="text-blue-600 hover:underline">My Bookmarks</a></li>
          {/* <LogoutButton /> */}
        </ul>
      </div>
    </div >
  );
}

export default PublicAccountWidget;
