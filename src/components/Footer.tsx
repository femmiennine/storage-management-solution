import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            © {currentYear} Frances Femille Fogarty. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Powered by Storease
          </p>
        </div>
      </div>
    </footer>
  );
}