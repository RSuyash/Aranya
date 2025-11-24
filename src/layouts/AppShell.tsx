import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export const AppShell: React.FC = () => {
    return (
        <div className="min-h-screen bg-bg-app text-text-main font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6 ml-64 overflow-auto">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
