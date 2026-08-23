import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { ToastContainer } from '../ui/Toast';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideFooter = false }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CartDrawer />
      <ToastContainer />
      <main className="flex-1 animate-fade-in">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};
