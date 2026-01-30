"use client";

import {
  useState,
  ChangeEvent,
  FormEvent
} from 'react';
import { toast } from 'react-toastify';

type PublicLeadFormWidgetProps = {
  onClose?: () => void;
};

export default function PublicLeadFormWidget({ onClose }: PublicLeadFormWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder submit handler; integrate with backend when ready
    toast.success('Mesajınız göndərildi!');
    setLoading(false);
    if (onClose) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ad Soyad"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:outline-none"
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:outline-none"
          required
        />
      </div>
      <input
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Telefon"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:outline-none"
      />
      <textarea
        name="message"
        value={formData.message}
        onChange={handleChange}
        placeholder="Mesajınız"
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:outline-none resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-60 transition"
        >
          {loading ? 'Göndərilir...' : 'Göndər'}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Bağla
          </button>
        )}
      </div>
    </form>
  );
}

