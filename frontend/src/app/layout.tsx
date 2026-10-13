import React from 'react';

export const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {children}
    </div>
  );
};

export default RootLayout;
