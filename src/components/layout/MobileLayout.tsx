import { Outlet, NavLink } from 'react-router-dom';
import { Plane, ReceiptText, User } from 'lucide-react';

export default function MobileLayout() {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F4F1EE] shadow-2xl shadow-black/10 overflow-hidden relative">
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <Outlet />
      </main>
    </div>
  );
}
