import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col overflow-x-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
