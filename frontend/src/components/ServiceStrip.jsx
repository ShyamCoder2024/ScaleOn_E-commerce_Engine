import { Truck, ShieldHeadphones, RefreshCw, ChevronLeft, ChevronRight, Search, Filter, CheckCircle, ThumbsUp, ShieldCheck, Headphones, Lock, Calendar, Clock, ExternalLink, Eye, Ban, ChevronDown } from "lucide-react";

const ServiceStrip = () => {
    const services = [
        {
            icon: <Truck size={28} />,
            title: "Free Shipping",
            desc: "On all orders over $50"
        },
        {
            icon: <ShieldCheck size={28} />,
            title: "Secure Payment",
            desc: "100% protected payments"
        },
        {
            icon: <RefreshCw size={28} />,
            title: "Easy Returns",
            desc: "30-day return policy"
        },
        {
            icon: <Headphones size={28} />,
            title: "24/7 Support",
            desc: "Dedicated support team"
        }
    ];

    return (
        <section className="py-4 md:py-12 bg-gray-50">
            <div className="container-custom">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-10">
                    <div className="grid grid-cols-4 gap-2 md:gap-8">
                        {services.map((service, index) => (
                            <div key={index} className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-1 md:gap-3 group hover:transform hover:translate-y-[-2px] transition-transform duration-300">
                                <div className="p-2 md:p-3 bg-primary-50 text-primary-600 rounded-full group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                                    <div className="scale-75 md:scale-100 transform origin-center">
                                        {service.icon}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-[10px] md:text-base mb-0 leading-tight">
                                        {service.title}
                                    </h3>
                                    <p className="text-gray-500 text-[10px] md:text-sm leading-tight hidden md:block">
                                        {service.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ServiceStrip;
