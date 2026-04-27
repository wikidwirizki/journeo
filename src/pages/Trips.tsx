import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, MapPin, Calendar, Compass, Image as ImageIcon, LogOut, LogIn } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getTrips, getAllTrips, saveTrip, fileToBase64 } from '../store/db';
import { Trip } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isGuest, logout } = useAuth();
  const isViewOnly = searchParams.get('viewOnly') === 'true' || (isGuest && !user);

  useEffect(() => {
    if (user || isGuest) {
      loadTrips();
    }
  }, [user, isGuest]);

  const loadTrips = async () => {
    if (isGuest && !user) {
      const data = await getAllTrips();
      setTrips(data);
    } else if (user) {
      const data = await getTrips(user.uid);
      setTrips(data);
    }
  };

  const handleAddTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    
    // A simple placeholder cover based on destination if we wanted, but we'll use a standard gradient
    const newTrip: Trip = {
      id: uuidv4(),
      userId: user.uid,
      name: formData.get('name') as string,
      destination: formData.get('destination') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      budget: Number(formData.get('budget')) || 0,
      currency: formData.get('currency') as string || 'USD',
      coverImage,
    };

    await saveTrip(newTrip);
    setShowAddModal(false);
    setCoverImage(undefined);
    loadTrips();
    navigate(`/trip/${newTrip.id}`);
  };

  return (
    <div className="min-h-full bg-[#F4F1EE] flex flex-col relative pb-6">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 bg-[#F4F1EE] border-b border-[#0C2B4E]/5 shrink-0 flex justify-between items-end">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#288C78] mb-1 block">Your Upcoming</span>
          <h1 className="text-4xl font-serif italic tracking-tight text-[#0C2B4E]">Journeo</h1>
        </div>
        {isGuest && !user ? (
          <button onClick={logout} className="flex items-center gap-2 p-2 px-3 bg-[#0C2B4E]/5 rounded-xl text-[#0C2B4E] hover:bg-[#0C2B4E]/10 transition-colors font-bold text-xs uppercase tracking-widest" title="Sign In">
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        ) : !isViewOnly ? (
          <button onClick={logout} className="p-2 text-[#0C2B4E]/50 hover:text-[#0C2B4E] transition-colors" title="Log out">
            <LogOut className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      {/* Trips List */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6">
        {trips.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
            <div className="w-16 h-16 bg-[#288C78]/10 rounded-full flex items-center justify-center mb-4">
              <Compass className="w-8 h-8 text-[#288C78]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0C2B4E]">No trips planned yet</h3>
            <p className="text-neutral-500 text-sm mt-2 max-w-[250px]">Time to start planning your next great adventure!</p>
          </div>
        ) : (
          trips.map(trip => (
            <Link 
              key={trip.id} 
              to={isViewOnly ? `/trip/${trip.id}?viewOnly=true` : `/trip/${trip.id}`}
              className="bg-white rounded-[24px] shadow-sm border border-[#0C2B4E]/5 overflow-hidden block active:scale-[0.98] transition-transform"
            >
              <div className="h-32 bg-neutral-200 relative">
                {trip.coverImage && (
                  <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
                )}
                {!trip.coverImage && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 bg-[#0C2B4E]">
                    <MapPin className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-xl text-[#0C2B4E] leading-tight">{trip.name}</h3>
                <div className="flex flex-col gap-1 mt-3">
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <MapPin className="w-3.5 h-3.5 text-[#288C78]" />
                    <span className="uppercase tracking-widest font-semibold text-[10px]">{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Calendar className="w-3.5 h-3.5 text-[#288C78]" />
                    <span className="uppercase tracking-widest font-semibold text-[10px]">{format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d')}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* FAB */}
      {!isViewOnly && (
        <button 
          onClick={() => setShowAddModal(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-[#0C2B4E] text-[#F4F1EE] rounded-full flex items-center justify-center shadow-lg transition-colors z-10 hover:bg-[#1a416e]"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Add Trip Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-[#F4F1EE] w-full rounded-t-3xl p-6 min-h-[60%] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8 border-b border-[#0C2B4E]/5 pb-4">
              <h2 className="text-2xl font-serif italic text-[#0C2B4E]">Plan a new trip</h2>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-black transition-colors p-2">✕</button>
            </div>
            
            <form onSubmit={handleAddTrip} className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <label className="shrink-0 w-20 h-20 bg-white rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden border border-[#0C2B4E]/10 hover:border-[#0C2B4E]/30 transition-colors">
                   {coverImage ? (
                      <img src={coverImage} className="w-full h-full object-cover" />
                   ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-[#0C2B4E]/30 mb-1" />
                        <span className="text-[8px] uppercase tracking-widest font-bold text-[#0C2B4E]/40">Banner</span>
                      </>
                   )}
                   <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const base64 = await fileToBase64(file);
                       setCoverImage(base64);
                     }
                   }} />
                </label>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">Trip Name</label>
                  <input required name="name" type="text" placeholder="e.g. Summer in Bali" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">Destination</label>
                <input required name="destination" type="text" placeholder="e.g. Bali, Indonesia" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">Start Date</label>
                  <input required name="startDate" type="date" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">End Date</label>
                  <input required name="endDate" type="date" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">Currency</label>
                  <select required name="currency" defaultValue="USD" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors">
                    <option value="USD">USD ($)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">Total Budget</label>
                  <input required name="budget" type="number" placeholder="e.g. 5000" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors" />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-[#0C2B4E] text-white text-[11px] uppercase tracking-[0.2em] font-bold py-4 mt-6 hover:bg-[#1a416e] transition-colors rounded-xl flex justify-center items-center gap-2">
                Create Trip
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
