'use client'

import { useState } from 'react';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import dynamic
    from 'next/dynamic';
import PublicLeadFormWidget
    from '@/app/[locale]/(public)/(widgets)/PublicLeadFormWidget';


const PublicMapBoxWidget = dynamic(() => import('@/app/[locale]/(public)/(widgets)/PublicMapBoxWidget'), { ssr: false });

export default function PublicContactWidget() {

    const containerHeight = "50vh"; // Set the container height dynamically or statically

    const [showOverlay, setShowOverlay] = useState(true);


    const handleClose = () => {
        ConsoleLogger.log('close');
    };


    const handleOverlayToggle = () => {
        setShowOverlay(!showOverlay);
    };

    return (
        <>
            <section className='w-full bg-surface text-sm text-ink grid grid-cols-1 py-28'>
                <div className='w-full max-w-7xl mx-auto grid grid-cols-12 px-4 md:px-8 lg:px-12 relative justify-center items-center gap-4 lg:gap-8'>
                    <div className='col-span-12 lg:col-span-5 gap-5 grid grid-cols-1'>
                        <div className="">
                            <p className="text-3xl block font-bold text-ink hover:text-brand pb-1">
                                Address:
                            </p>
                            <p className="text-sm block text-ink-muted">
                                Azerbaijan, Baku
                            </p>
                        </div>
                        <div className="">
                            <p className="text-3xl block font-bold text-ink hover:text-brand pb-1">
                                Contact Us
                            </p>
                            <p>
                                <a
                                    href="tel:+1-780-214-9191"
                                    className="mb-1 inline-block text-base text-ink-muted duration-300 hover:text-brand"
                                >
                                    +994-70-390-60-93 - Baku<br></br>
                                </a>
                            </p>
                            <p>
                                <a
                                    href="tel:+1-780-233-7318"
                                    className="mb-1 inline-block text-base text-ink-muted duration-300 hover:text-brand"
                                >
                                    +994-70-390-60-93 - Baku
                                </a>
                            </p>
                            <p>
                                <a
                                    href="tel:+1-403-707-3247"
                                    className="mb-1 inline-block text-base text-ink-muted duration-300 hover:text-brand"
                                >
                                    +994-70-390-60-93 - Baku
                                </a>
                            </p>
                            <p>
                                <a className='text-sm text-ink-muted hover:text-brand' href="mailto:info@stuwin.ai.az">info@stuwin.ai.az</a>
                            </p>
                        </div>

                        <div className="pb-1 flex flex-wrap justify-start lg:justify-start">
                            <p className='w-full text-3xl font-bold text-ink'>Follow us</p>
                            <ul className="grid grid-cols-5 lg:grid-cols-5 justify-end gap-2 py-2">
                                {/* <li className="flex justify-center col-span-1">
                                <a target="_blank" href="https://www.youtube.com/@ssssss" className="text-2xl flex justify-center items-center lg:justify-start font-bold text-white hover:text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 27 21" fill="none">
                                        <path d="M18.079 10.5135C18.0744 10.4818 18.0366 10.4941 18.0366 10.5262C18.0366 10.5582 18.0744 10.5706 18.079 10.5388C18.0802 10.5304 18.0802 10.5219 18.079 10.5135Z" fill="#000000" />
                                        <path d="M13.5939 0.67334C1.07404 0.67334 0.843262 1.77778 0.843262 10.5552C0.843262 19.3326 1.07404 20.4371 13.5939 20.4371C26.1138 20.4371 26.3446 19.3326 26.3446 10.5552C26.4023 1.77778 26.1715 0.67334 13.5939 0.67334ZM17.6903 11.1946L11.9208 13.9848C11.4592 14.2173 10.9399 13.8685 10.9399 13.3454V7.88128C10.9399 7.35813 11.4592 7.00936 11.9208 7.24187L17.6903 9.91578C17.8925 10.0176 18.0061 10.1641 18.07 10.3552C18.0883 10.4101 18.0942 10.4682 18.0942 10.5261C18.0942 10.584 18.088 10.642 18.0707 10.6973C18.0069 10.9003 17.8932 11.0924 17.6903 11.1946Z" fill="#000000" />
                                    </svg>
                                </a>
                            </li> */}

                                <li className="flex justify-center col-span-1 ">
                                    <a target="_blank" href="https://www.instagram.com/steko_inc" className="text-2xl flex justify-center items-center lg:justify-start font-bold text-brand hover:text-brand-dark">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 26 25" fill="none">
                                            <path d="M0.900909 7.69377C0.900849 7.07524 0.958608 6.45708 1.08725 5.85208C1.26031 5.0382 1.47773 4.2271 1.93939 3.50827C3.32408 1.18313 5.5165 0.311198 8.0551 0.253069C11.5168 0.194941 14.9208 0.194941 18.3826 0.253069C20.6904 0.311198 22.7674 1.06687 24.2098 3.10137C25.1329 4.43833 25.4791 5.89154 25.4791 7.46101C25.5368 10.7743 25.5368 14.0877 25.4791 17.4591C25.4214 20.133 24.4983 22.4001 22.0174 23.7951C20.8634 24.4346 19.5942 24.7252 18.3249 24.7252C14.9208 24.7833 11.5168 24.7833 8.17048 24.7252C5.63188 24.6671 3.43947 23.7951 1.99709 21.47C1.52279 20.7315 1.30627 19.8956 1.13082 19.0593C1.01309 18.4982 0.953926 17.9262 0.946533 17.3529C0.904862 14.1213 0.901226 10.9249 0.900909 7.69377ZM13.19 2.57821C11.5168 2.57821 9.84365 2.52008 8.11279 2.57821C5.45881 2.63634 3.84333 3.85704 3.38177 6.18218C3.26638 6.64721 3.20869 7.17037 3.20869 7.6354C3.20869 10.8325 3.151 14.0877 3.20869 17.2847C3.26639 20.4818 4.88185 22.1675 7.9397 22.2838C11.4014 22.4001 14.8631 22.4001 18.3249 22.2838C20.8635 22.2257 22.3635 20.9468 22.8828 18.738C22.9982 18.3311 23.0559 17.9242 23.0559 17.5173C23.0559 13.8552 23.2867 10.1931 22.9405 6.53096C22.7674 4.3802 21.325 2.92698 19.1903 2.63634C17.171 2.46195 15.2093 2.63634 13.19 2.57821Z" fill="currentColor" />
                                            <path d="M19.5366 12.5183C19.5366 15.9479 16.7095 18.7962 13.1901 18.8543C9.67066 18.9124 6.78589 16.006 6.78589 12.4602C6.78589 8.97245 9.72835 6.06602 13.1901 6.12415C16.7095 6.18228 19.5366 9.03058 19.5366 12.5183ZM17.171 12.5183C17.171 10.3094 15.3825 8.50742 13.1901 8.50742C10.9977 8.50742 9.1514 10.3094 9.1514 12.5183C9.1514 14.7272 10.94 16.5292 13.1324 16.5292C15.3248 16.471 17.171 14.6691 17.171 12.5183Z" fill="currentColor" />
                                            <path d="M19.7096 4.43848C20.575 4.43848 21.2674 5.13602 21.2674 5.94982C21.2674 6.76362 20.5751 7.46116 19.7673 7.46116C18.9019 7.46116 18.2096 6.82175 18.1519 5.94982C18.1519 5.13602 18.8442 4.43848 19.7096 4.43848Z" fill="currentColor" />
                                        </svg>
                                    </a>
                                </li>
                                {/* <li className="flex justify-center col-span-1 ">
                                <a target="_blank" href="https://www.linkedin.com/company/ssssss/" className="text-2xl flex justify-center items-center lg:justify-start  font-bold text-white hover:text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 21 21" fill="none">
                                        <path d="M4.76668 2.45986C4.76668 3.68056 4.01664 4.66875 2.57426 4.66875C1.24727 4.66875 0.381836 3.68056 0.381836 2.57612C0.381836 1.35542 1.24727 0.250977 2.57426 0.250977C3.90125 0.250977 4.76668 1.29729 4.76668 2.45986Z" fill="#000000" />
                                        <path d="M4.76668 17.9383V7.96537C4.76668 6.75453 3.7851 5.77295 2.57426 5.77295C1.36342 5.77295 0.381836 6.75453 0.381836 7.96537V17.9383C0.381836 19.1491 1.36342 20.1307 2.57426 20.1307C3.7851 20.1307 4.76668 19.1491 4.76668 17.9383Z" fill="#000000" />
                                        <path d="M15.2673 6.00537C12.9929 6.00537 11.6711 7.30389 11.1363 8.17609C11.1216 8.19997 11.096 8.21426 11.068 8.21426C11.0279 8.21426 10.9941 8.18437 10.9892 8.14457L10.8824 7.2842C10.8165 6.75299 10.3651 6.35414 9.82985 6.35414H8.92661C7.77628 6.35414 6.85901 7.28641 6.90479 8.43583C6.93248 9.13117 6.95914 9.87327 6.95914 10.6557V17.9382C6.95914 19.149 7.94072 20.1306 9.15157 20.1306C10.3624 20.1306 11.344 19.149 11.344 17.9382V12.2833C11.344 11.8182 11.344 11.5276 11.4594 11.1788C11.8055 10.4231 12.3248 9.43496 13.5364 9.43496C15.0942 9.43496 15.7288 10.7719 15.7288 12.5158V17.9382C15.7288 19.149 16.7104 20.1306 17.9213 20.1306C19.1321 20.1306 20.1137 19.149 20.1137 17.9382V11.9926C20.056 7.86549 17.979 6.00537 15.2673 6.00537Z" fill="#000000" />
                                    </svg>
                                </a>
                            </li> */}
                                <li className="flex justify-center col-span-1 ">
                                    <a target="_blank" href="https://www.facebook.com/people/STEKO-Windows-and-Doors/100092376357628/" className=" flex justify-center items-center text-2xl lg:justify-start font-bold text-brand hover:text-brand-dark">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 28" fill="none">
                                            <path d="M12.5172 5.66645C13.728 5.66645 14.7096 4.68487 14.7096 3.47403V3.28317C14.7096 1.96693 13.6426 0.899902 12.3263 0.899902H11.4209C6.80532 0.899902 4.55521 3.69007 4.55521 7.64282V9.60378C4.55521 10.6075 3.74153 11.4212 2.73781 11.4212C1.73409 11.4212 0.92041 12.2349 0.92041 13.2386V14.1378C0.92041 15.1415 1.73409 15.9552 2.73781 15.9552C3.74153 15.9552 4.55521 16.7689 4.55521 17.7726V24.753C4.55521 26.2506 5.76927 27.4647 7.26689 27.4647C8.76451 27.4647 9.97857 26.2506 9.97857 24.753V17.92C9.97857 16.8028 10.8842 15.8971 12.0015 15.8971C12.9447 15.8971 13.7627 15.2452 13.9733 14.3258L14.0712 13.8982C14.3685 12.6005 13.3824 11.363 12.051 11.363C10.9064 11.363 9.97857 10.4352 9.97857 9.29057V8.28223C10.0363 7.0034 10.7286 5.66645 12.5172 5.66645Z" fill="currentColor" />
                                        </svg>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="col-span-12 lg:col-span-7 p-4 my-8 bg-white rounded">
                        <PublicLeadFormWidget onClose={handleClose} />
                    </div>
                    <div className='col-span-12 relative'>
                        <PublicMapBoxWidget containerHeight={containerHeight} />
                        <div
                            className={`transform transition duration-1000 overlay h-full w-full absolute top-0 left-0 z-10 bg-brand/40 ${showOverlay ? 'translate-y-0' : 'translate-y-full'}`}
                            onClick={handleOverlayToggle}
                        >
                        </div>
                        <button className={`transform transition duration-1000 overlay-button absolute top-0 left-0 z-10 bg-brand/50 ${!showOverlay ? 'scale-100' : 'scale-0'}`} onClick={handleOverlayToggle}>
                            <svg viewBox="0 0 24 24" className="h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="white" stroke="white"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
            </section>
        </>

    );
}