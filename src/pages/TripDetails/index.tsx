import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, MapPin, Calendar, Settings, Image as ImageIcon, Share, Trash2, LogIn } from 'lucide-react';
import { Trip } from '../../types';
import { getTrip, saveTrip, fileToBase64, deleteTrip } from '../../store/db';
import { useAuth } from '../../contexts/AuthContext';

import ItineraryTab from './ItineraryTab';
import DocsTab from './DocsTab';
import OutfitsTab from './OutfitsTab';
import BudgetTab from './BudgetTab';
import PackingTab from './PackingTab';

type TabId = 'itinerary' | 'docs' | 'outfits' | 'budget' | 'packing';

export default function TripDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isGuest, logout } = useAuth();
  const isViewOnly = searchParams.get('viewOnly') === 'true' || (isGuest && !user);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('itinerary');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCoverImage, setEditCoverImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (id) {
      loadTrip(id);
    }
  }, [id]);

  const loadTrip = async (tripId: string) => {
    const data = await getTrip(tripId);
    if (data) {
      setTrip(data);
    } else {
      navigate('/');
    }
  };

  const handleEditTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!trip || !user) return;
    const formData = new FormData(e.currentTarget);
    const updatedTrip: Trip = {
      ...trip,
      name: formData.get('name') as string,
      destination: formData.get('destination') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      budget: Number(formData.get('budget')) || 0,
      currency: formData.get('currency') as string || 'USD',
      coverImage: editCoverImage !== undefined ? editCoverImage : trip.coverImage,
      isPublic: formData.get('isPublic') === 'on',
    };
    await saveTrip(updatedTrip);
    setTrip(updatedTrip);
    setShowEditModal(false);
  };

  const openEditModal = () => {
    setEditCoverImage(trip?.coverImage);
    setShowEditModal(true);
  };

  const handleDeleteTrip = async () => {
    if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      await deleteTrip(trip!.id);
      navigate('/');
    }
  };

  if (!trip) return null;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'docs', label: 'Docs' },
    { id: 'outfits', label: 'OOTD' },
    { id: 'budget', label: 'Budget' },
    { id: 'packing', label: 'Packing' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#F4F1EE] pb-20 relative">
      {/* Banner */}
      <div className="relative h-64 bg-neutral-200 shrink-0 overflow-hidden">
        {trip.coverImage ? (
          <img src={trip.coverImage} className="w-full h-full object-cover opacity-80" alt={trip.name} />
        ) : (
          <div className="absolute inset-0 bg-[#0C2B4E] flex items-center justify-center">
             <span className="text-4xl text-white font-serif italic tracking-tighter opacity-10">{trip.name}</span>
          </div>
        )}
        
        <div className="absolute inset-x-0 top-0 p-4 flex justify-between items-center z-10">
          <button onClick={() => navigate(isViewOnly && (!isGuest || user) ? '/?viewOnly=true' : '/')} className="w-10 h-10 rounded-full bg-white border border-[#0C2B4E]/10 text-[#0C2B4E] flex items-center justify-center hover:bg-neutral-100 transition shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {isGuest && !user && (
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-[#0C2B4E] hover:bg-neutral-100 transition-colors font-bold text-xs uppercase tracking-widest shadow-sm" title="Sign In">
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
            {!isViewOnly && (
              <button onClick={openEditModal} className="w-10 h-10 rounded-full bg-white border border-[#0C2B4E]/10 text-[#0C2B4E] flex items-center justify-center hover:bg-neutral-100 transition shadow-sm">
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6 z-10 bg-gradient-to-t from-black/60 to-transparent">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/70 mb-1 block">Current Trip</span>
          <h1 className="text-4xl font-serif italic text-white mb-3 leading-tight">{trip.name}</h1>
          <div className="flex items-center gap-4 text-xs font-semibold text-white/90">
            <div className="flex items-center gap-1.5 uppercase tracking-widest">
              <MapPin className="w-3.5 h-3.5 opacity-60 text-[#288C78]" />
              <span>{trip.destination}</span>
            </div>
            <div className="flex items-center gap-1.5 uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5 opacity-60 text-[#288C78]" />
              <span>{format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-[#F4F1EE] px-4 pt-4 pb-0 border-b border-[#0C2B4E]/5 sticky top-0 z-40">
        <div className="flex overflow-x-auto no-scrollbar gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-[11px] uppercase tracking-widest font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'border-b-2 border-[#288C78] text-[#0C2B4E]' 
                  : 'border-b-2 border-transparent text-[#0C2B4E]/40 hover:text-[#0C2B4E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        {activeTab === 'itinerary' && <ItineraryTab tripId={trip.id} />}
        {activeTab === 'docs' && <DocsTab tripId={trip.id} />}
        {activeTab === 'outfits' && <OutfitsTab tripId={trip.id} />}
        {activeTab === 'budget' && <BudgetTab tripId={trip.id} trip={trip} />}
        {activeTab === 'packing' && <PackingTab tripId={trip.id} />}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-[#F4F1EE] w-full max-w-md mx-auto rounded-t-3xl p-6 min-h-[60%] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8 border-b border-[#0C2B4E]/5 pb-4">
              <h2 className="text-2xl font-serif italic text-[#0C2B4E]">Edit Trip</h2>
              <button onClick={() => setShowEditModal(false)} className="text-[#0C2B4E]/40 hover:text-[#0C2B4E] transition-colors p-2">✕</button>
            </div>
            
            <form onSubmit={handleEditTrip} className="flex flex-col gap-6 pb-6">
              <div className="flex items-center gap-4">
                <label className="shrink-0 w-20 h-20 bg-white rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden border border-[#0C2B4E]/10 hover:border-[#0C2B4E]/30 transition-colors">
                   {editCoverImage ? (
                      <img src={editCoverImage} className="w-full h-full object-cover" />
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
                       setEditCoverImage(base64);
                     }
                   }} />
                </label>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">Trip Name</label>
                  <input required name="name" type="text" defaultValue={trip.name} placeholder="e.g. Summer in Bali" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">Destination</label>
                <input required name="destination" type="text" defaultValue={trip.destination} placeholder="e.g. Bali, Indonesia" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">Start Date</label>
                  <input required name="startDate" type="date" defaultValue={trip.startDate} className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">End Date</label>
                  <input required name="endDate" type="date" defaultValue={trip.endDate} className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">Currency</label>
                  <select required name="currency" defaultValue={trip.currency || 'USD'} className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors">
                    <option value="USD">USD ($)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#288C78] uppercase tracking-widest mb-1">Total Budget</label>
                  <input required name="budget" type="number" defaultValue={trip.budget || 0} placeholder="e.g. 5000" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 focus:border-[#288C78] outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer w-fit mt-2">
                  <div className="relative flex items-center justify-center">
                    <input name="isPublic" type="checkbox" defaultChecked={trip.isPublic} className="peer appearance-none w-5 h-5 border-2 border-[#0C2B4E]/20 rounded-md checked:bg-[#288C78] checked:border-[#288C78] transition-colors cursor-pointer" />
                    <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#0C2B4E] block">Public Trip</span>
                    <span className="text-[10px] text-[#0C2B4E]/50 block">Allow guests to view this trip</span>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 mt-6">
                 <button type="button" onClick={handleDeleteTrip} className="flex-1 bg-red-100 text-red-600 text-[11px] uppercase tracking-[0.2em] font-bold py-4 hover:bg-red-200 transition-colors rounded-xl">
                   Delete
                 </button>
                 <button type="submit" className="flex-1 bg-[#0C2B4E] text-white text-[11px] uppercase tracking-[0.2em] font-bold py-4 hover:bg-[#1a416e] transition-colors rounded-xl">
                   Save
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
