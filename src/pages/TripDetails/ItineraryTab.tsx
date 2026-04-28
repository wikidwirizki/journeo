import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { Plane, Home, Navigation, Coffee, Bus, Plus, Clock } from 'lucide-react';
import { ItineraryItem, ActivityType } from '../../types';
import { getTripItinerary, saveItineraryItem, deleteItineraryItem } from '../../store/db';
import { useAuth } from '../../contexts/AuthContext';

const TypeIcon = ({ type }: { type: ActivityType }) => {
  switch (type) {
    case 'flight': return <Plane className="w-4 h-4 text-blue-500" />;
    case 'hotel': return <Home className="w-4 h-4 text-emerald-500" />;
    case 'activity': return <Navigation className="w-4 h-4 text-purple-500" />;
    case 'food': return <Coffee className="w-4 h-4 text-orange-500" />;
    case 'transport': return <Bus className="w-4 h-4 text-teal-500" />;
    default: return <Navigation className="w-4 h-4 text-gray-500" />;
  }
};

const TypeBg = ({ type }: { type: ActivityType }) => {
  switch (type) {
    case 'flight': return 'bg-blue-50';
    case 'hotel': return 'bg-emerald-50';
    case 'activity': return 'bg-purple-50';
    case 'food': return 'bg-orange-50';
    case 'transport': return 'bg-teal-50';
    default: return 'bg-gray-50';
  }
};

// Extract coordinates from Google Maps URL
const extractCoordinates = (url: string): { lat: number; lng: number } | null => {
  if (!url) return null;
  // Try to match @lat,lng
  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  // Try to match /place/lat,lng
  const placeMatch = url.match(/\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (placeMatch) {
    return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
  }
  // Try to match destination=lat,lng
  const destMatch = url.match(/destination=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if(destMatch) {
     return { lat: parseFloat(destMatch[1]), lng: parseFloat(destMatch[2]) };
  }
  return null;
};

// Calculate distance using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; // Distance in km
  return d;
};

export default function ItineraryTab({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [searchParams] = useSearchParams();
  const isViewOnly = searchParams.get('viewOnly') === 'true';
  const { user } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<ActivityType>('activity');
  const [location, setLocation] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [notes, setNotes] = useState('');
  
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadItinerary();
  }, [tripId]);

  const loadItinerary = async () => {
    const data = await getTripItinerary(tripId);
    setItems(data);
  };

  const startEdit = (item: ItineraryItem) => {
    if (isViewOnly) return;
    setEditId(item.id);
    setTitle(item.title);
    setDate(item.date);
    setTime(item.time || '');
    setType(item.type);
    setLocation(item.location || '');
    setGoogleMapsUrl(item.googleMapsUrl || '');
    setNotes(item.notes || '');
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditId(null);
    setTitle('');
    setDate('');
    setTime('');
    setType('activity');
    setLocation('');
    setGoogleMapsUrl('');
    setNotes('');
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !date || (!user && !isViewOnly)) return;
    
    const newItem: ItineraryItem = {
      id: editId || uuidv4(),
      tripId,
      date,
      title,
      type,
    };
    if (user?.uid) newItem.userId = user.uid;
    if (time) newItem.time = time;
    if (location) newItem.location = location;
    if (googleMapsUrl) newItem.googleMapsUrl = googleMapsUrl;
    if (notes) newItem.notes = notes;

    await saveItineraryItem(newItem);
    cancelEdit();
    loadItinerary();
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (editId && confirm('Are you sure you want to delete this event?')) {
      await deleteItineraryItem(tripId, editId);
      cancelEdit();
      loadItinerary();
    }
  };

  // Group by date
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, ItineraryItem[]>);

  const sortedDates = Object.keys(grouped).sort();

  const toggleCollapse = (dateStr: string) => {
    setCollapsedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  const renderForm = (isEditingForm: boolean) => (
    <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl border border-[#0C2B4E]/10 shadow-sm flex flex-col gap-4 animate-in slide-in-from-bottom-2 my-2" onClick={e => e.stopPropagation()}>
      <h4 className="font-bold text-[#0C2B4E] text-xl font-serif italic mb-1">{isEditingForm ? 'Edit Event' : 'Add Event'}</h4>
      
      <input required name="title" value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="e.g. Flight to DPS" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none text-[#0C2B4E]" />
      
      <div className="grid grid-cols-2 gap-4">
        <input required name="date" value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none font-sans text-[#0C2B4E]" />
        <input name="time" value={time} onChange={e => setTime(e.target.value)} type="time" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none font-sans text-[#0C2B4E]" />
      </div>

      <select required name="type" value={type} onChange={e => setType(e.target.value as ActivityType)} className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm text-[#0C2B4E] focus:border-[#288C78] outline-none">
        <option value="flight">Flight / Train</option>
        <option value="hotel">Hotel / Accommodation</option>
        <option value="activity">Activity / Sightseeing</option>
        <option value="food">Food & Dining</option>
        <option value="transport">Local Transport</option>
      </select>

      <div className="relative">
        <input name="location" value={location} onChange={e => setLocation(e.target.value)} type="text" placeholder="Location e.g. Terminal 3" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none pr-8 text-[#0C2B4E]" />
        {location && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#288C78] hover:text-[#0C2B4E] transition-colors"
            title="Search on Google Maps"
          >
            <Navigation className="w-4 h-4" />
          </a>
        )}
      </div>
      
      <input name="googleMapsUrl" value={googleMapsUrl} onChange={e => setGoogleMapsUrl(e.target.value)} type="url" placeholder="Google Maps URL (optional)" className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none text-[#0C2B4E]" />
      
      <textarea name="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none resize-none text-[#0C2B4E]" rows={2}></textarea>

      <div className="flex gap-2 mt-2">
        {isEditingForm && (
          <button type="button" onClick={handleDelete} className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-red-500 hover:text-white hover:bg-red-500 transition-colors bg-red-50 border border-red-500/20 rounded-xl">Delete</button>
        )}
        <button type="button" onClick={cancelEdit} className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-[#0C2B4E]/50 hover:text-[#0C2B4E] rounded-xl border border-transparent">Cancel</button>
        <button type="submit" className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-white bg-[#0C2B4E] hover:bg-[#1a416e] transition-colors rounded-xl">{isEditingForm ? 'Update' : 'Save'}</button>
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-6">
      
      {sortedDates.map((dateStr) => {
        const dayItems = grouped[dateStr];
        const isCollapsed = collapsedDates[dateStr];
        return (
          <div key={dateStr} className="flex flex-col gap-6 mb-8">
            <div 
              className="flex justify-between items-end cursor-pointer group"
              onClick={() => toggleCollapse(dateStr)}
            >
              <h2 className="text-3xl font-serif italic text-[#0C2B4E] group-hover:text-[#288C78] transition-colors">{format(parseISO(dateStr), 'MMM dd')}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest bg-[#0C2B4E] text-white px-3 py-1 rounded-full">Day</span>
                <span className="text-xs text-[#0C2B4E]/40">{isCollapsed ? '+' : '-'}</span>
              </div>
            </div>

            {!isCollapsed && (
              <div className="space-y-6">
                {dayItems.map((item, idx) => {
                  let distanceInfo = null;
                  if (idx > 0 && item.googleMapsUrl && dayItems[idx - 1].googleMapsUrl) {
                    const coords1 = extractCoordinates(dayItems[idx - 1].googleMapsUrl!);
                    const coords2 = extractCoordinates(item.googleMapsUrl);
                    if (coords1 && coords2) {
                      const dist = calculateDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng);
                      if (dist > 0.1) {
                         distanceInfo = `${dist.toFixed(1)} km from previous`;
                      }
                    }
                  }

                  return editId === item.id ? (
                    <div key={item.id} className="pl-4 border-l-2 border-[#288C78]">
                      {renderForm(true)}
                    </div>
                  ) : (
                  <div 
                    key={item.id} 
                    className={`relative pl-8 border-l border-[#0C2B4E]/10 ${isViewOnly ? '' : 'cursor-pointer hover:bg-[#0C2B4E]/5'} transition-colors py-1`}
                    onClick={() => startEdit(item)}
                  >
                    <div className={`absolute -left-[5px] top-2 w-[9px] h-[9px] rounded-full ${idx === 0 ? 'bg-[#0C2B4E]' : 'border border-[#0C2B4E] bg-[#F4F1EE]'}`}></div>
                    <div className="flex items-center gap-2 mb-1">
                      {item.time && <span className="text-[10px] font-mono opacity-50 uppercase text-[#0C2B4E]">{item.time}</span>}
                      <span className="text-[9px] uppercase tracking-widest opacity-40 text-[#0C2B4E]">{item.type}</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight text-[#0C2B4E]">{item.title}</h3>
                    {item.location && (
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-[11px] opacity-70 uppercase tracking-wider text-[#0C2B4E]">
                          {item.googleMapsUrl ? (
                            <a 
                              href={item.googleMapsUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[#288C78] hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Navigation className="w-3 h-3 inline" /> {item.location}
                            </a>
                          ) : item.location}
                        </p>
                        {distanceInfo && (
                           <span className="text-[9px] text-[#288C78] italic font-medium uppercase tracking-widest bg-[#288C78]/10 w-fit px-2 py-0.5 rounded-sm">
                             {distanceInfo}
                           </span>
                        )}
                      </div>
                    )}
                    {item.notes && <p className="text-sm opacity-60 mt-1 leading-relaxed italic text-[#0C2B4E]">{item.notes}</p>}
                  </div>
                )})}
              </div>
            )}
          </div>
        );
      })}

      {items.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Navigation className="w-8 h-8" />
          </div>
          <p className="text-gray-500 font-medium text-sm">Your itinerary is empty.</p>
        </div>
      )}

      {isAdding && !editId ? (
        renderForm(false)
      ) : !isViewOnly && !editId ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border border-[#0C2B4E]/10 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#0C2B4E] hover:text-white transition-colors text-[#0C2B4E] rounded-xl"
        >
          + Add Event
        </button>
      ) : null}

    </div>
  );
}
