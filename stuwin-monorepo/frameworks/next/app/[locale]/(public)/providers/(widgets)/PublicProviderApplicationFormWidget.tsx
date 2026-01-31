"use client";

import {
  useState
} from 'react';
import { useTranslations } from 'next-intl';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { toast } from 'react-toastify';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import {
  FiHome,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiFileText
} from 'react-icons/fi';

interface FormData {
  Provider_name: string;
  contact_name: string;
  email: string;
  phone: string;
  voen: string;
  Provider_address: string;
  description: string;
}

interface FormErrors {
  Provider_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  voen?: string;
  Provider_address?: string;
}

export function PublicProviderApplicationFormWidget() {
  const t = useTranslations('Global');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    Provider_name: '',
    contact_name: '',
    email: '',
    phone: '',
    voen: '',
    Provider_address: '',
    description: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.Provider_name.trim()) {
      newErrors.Provider_name = 'Təşkilat adı mütləqdir';
    }

    if (!formData.contact_name.trim()) {
      newErrors.contact_name = 'Əlaqə şəxsinin adı mütləqdir';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email mütləqdir';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Düzgün email daxil edin';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon nömrəsi mütləqdir';
    }

    if (!formData.voen.trim()) {
      newErrors.voen = 'VÖEN mütləqdir';
    } else if (!/^\d{10}$/.test(formData.voen)) {
      newErrors.voen = 'VÖEN 10 rəqəmdən ibarət olmalıdır';
    }

    if (!formData.Provider_address.trim()) {
      newErrors.Provider_address = 'Ünvan mütləqdir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Zəhmət olmasa bütün xanaları doldurun');
      return;
    }

    setLoading(true);

    try {
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: '/api/providers/applications/create',
        body: formData
      });

      if (response.status === 200 || response.status === 201) {
        setSubmitted(true);
        toast.success('Müraciətiniz uğurla göndərildi!');
        // Reset form
        setFormData({
          Provider_name: '',
          contact_name: '',
          email: '',
          phone: '',
          voen: '',
          Provider_address: '',
          description: ''
        });
      } else {
        toast.error(response.data?.error || 'Xəta baş verdi');
      }
    } catch (error) {
      ConsoleLogger.error('Error submitting application:', error);
      toast.error('Xəta baş verdi. Yenidən cəhd edin');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-green-900 mb-2">
          Müraciət Göndərildi!
        </h3>
        <p className="text-green-700 mb-6">
          Müraciətiniz qeydə alındı. Ən qısa zamanda sizinlə əlaqə saxlanılacaq.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
        >
          Yeni müraciət göndər
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Təhsil Təşkilatı Müraciəti
      </h2>
      <p className="text-gray-600 mb-6">
        Təhsil təşkilatınızı platformamıza əlavə etmək üçün aşağıdakı formu doldurun
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FiHome size={16} />
            Təşkilatın adı *
          </label>
          <input
            type="text"
            name="Provider_name"
            value={formData.Provider_name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent ${errors.Provider_name ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Məktəbin və ya təhsil mərkəzinin adı"
          />
          {errors.Provider_name && (
            <p className="mt-1 text-sm text-red-600">{errors.Provider_name}</p>
          )}
        </div>

        {/* Contact Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FiUser size={16} />
            Əlaqə şəxsinin adı *
          </label>
          <input
            type="text"
            name="contact_name"
            value={formData.contact_name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent ${errors.contact_name ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Tam ad və soyad"
          />
          {errors.contact_name && (
            <p className="mt-1 text-sm text-red-600">{errors.contact_name}</p>
          )}
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FiMail size={16} />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="info@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FiPhone size={16} />
              Telefon *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="+994XXXXXXXXX"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* VOEN */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FiFileText size={16} />
            VÖEN *
          </label>
          <input
            type="text"
            name="voen"
            value={formData.voen}
            onChange={handleChange}
            maxLength={10}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent ${errors.voen ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="1234567890"
          />
          {errors.voen && (
            <p className="mt-1 text-sm text-red-600">{errors.voen}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FiMapPin size={16} />
            Ünvan *
          </label>
          <input
            type="text"
            name="Provider_address"
            value={formData.Provider_address}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent ${errors.Provider_address ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Tam ünvan"
          />
          {errors.Provider_address && (
            <p className="mt-1 text-sm text-red-600">{errors.Provider_address}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FiFileText size={16} />
            Ətraflı məlumat
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder="Təşkilatınız haqqında ətraflı məlumat"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Göndərilir...' : 'Müraciət göndər'}
          </button>
        </div>
      </form>
    </div>
  );
}

