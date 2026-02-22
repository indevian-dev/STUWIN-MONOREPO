"use client";

import {
    useState,
    useEffect
} from 'react';
import {
    useRouter,
    useParams
} from 'next/navigation';
import { toast } from 'react-toastify';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import supabase
    from '@/lib/integrations/supabase/Pgsql.client';
import PublicSectionTitleWidget
    from '@/app/[locale]/(public)/(tiles)/PublicSectionTitle.tile';

export default function PublicDeactivationFormWidget() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        comment: '', // Added comment field
    });
    const router = useRouter();
    const params = useParams();

    const locale = params?.locale ? String(params.locale) : 'az';
    const [previousUrl, setPreviousUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPreviousUrl(document.referrer);
        }
    }, []);

    ConsoleLogger.log('locale', locale);
    ConsoleLogger.log('previousUrl', previousUrl);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Assuming you want to continue with user sign-in and also submit to deactivation_requests
        try {
            // Insert into deactivation_requests table
            const { data, error } = await supabase
                .from('deactivation_requests')
                .insert([{
                    phone: formData.phone,
                    email: formData.email,
                    comment: formData.comment,
                }]);

            if (error) throw error;

            toast.success('Request submission successful!');
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (error) {
            const err = error as Error;
            toast.error(`Error: ${err.message || 'something gone wrong'}`);
            ConsoleLogger.log(error);
        }
    };

    return (
        <section className="w-full">
            <div className='container max-w-screen-xl mx-auto grid grid-cols-12 p-4 md:p-8 lg:p-12 gap-6 md:gap-8'>
                <div className='col-span-12'>
                    <PublicSectionTitleWidget sectionTitle="Account Deactivation" />
                </div>
                <div className="col-span-12 lg:col-span-7">
                    <h2 className="text-xl font-semibold">Deactivate Your Account</h2>
                    <p className="text-lg text-gray-600 mt-4">
                        When you deactivate your account, all your contact information such as email and phone numbers will be removed. However, data related to transactions, completed tasks, and offers will remain, as this information is also related to other parties if you are a client, provider, or executor. This ensures that historical data integrity is maintained.
                    </p>
                </div>
                <div className="col-span-12 lg:col-span-5 border-[1px] border-primary rounded-app">
                    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded p-4">
                        <div className="">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                                Name
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                                id="name"
                                type="name"
                                name="name"
                                placeholder="Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                                Email
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                                Phone
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                                id="phone"
                                type="phone"
                                name="phone"
                                placeholder="+994 XX XXX XX XX"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {/* Additional field for comment */}
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comment">
                                Comment
                            </label>
                            <textarea
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="comment"
                                name="comment"
                                placeholder="Your comment"
                                value={formData.comment}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {/* Submit button and the rest of the form remains unchanged */}
                        <div className="flex items-center justify-between">
                            <button
                                className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                type="submit"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div >
            </div>

        </section >
    );
}