import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Header />
            <main className="flex-1 w-full pt-16 md:pt-20 pb-12">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
