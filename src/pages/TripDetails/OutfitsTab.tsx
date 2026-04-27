import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Camera, Plus, Trash2 } from 'lucide-react';
import { Outfit } from '../../types';
import { getTripOutfits, saveOutfit, fileToBase64, deleteOutfit } from '../../store/db';
import { useAuth } from '../../contexts/AuthContext';

export default function OutfitsTab({ tripId }: { tripId: string }) {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchParams] = useSearchParams();
  const isViewOnly = searchParams.get('viewOnly') === 'true';
  const { user } = useAuth();

  useEffect(() => {
    loadOutfits();
  }, [tripId]);

  const loadOutfits = async () => {
    const data = await getTripOutfits(tripId);
    setOutfits(data);
  };

  const startEdit = (o: Outfit) => {
    if (isViewOnly) return;
    setEditId(o.id);
    setPhotoPreview(o.photoData);
    setDesc(o.description || '');
    setDateStr(o.date || '');
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditId(null);
    setPhotoPreview(null);
    setDesc('');
    setDateStr('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setPhotoPreview(b64);
    } catch (e) {
      console.error(e);
      alert('Failed to load image');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoPreview || (!user && !isViewOnly)) return;

    try {
      const newOutfit: Outfit = {
        id: editId || uuidv4(),
        userId: user?.uid,
        tripId,
        photoData: photoPreview,
        description: desc,
        date: dateStr || undefined
      };
      await saveOutfit(newOutfit);
      cancelEdit();
      loadOutfits();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (editId && confirm('Are you sure you want to delete this outfit?')) {
      await deleteOutfit(tripId, editId);
      cancelEdit();
      loadOutfits();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {outfits.length === 0 && !isAdding ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-white text-[#0C2B4E]/40 flex items-center justify-center rounded-xl mx-auto mb-4 border border-[#0C2B4E]/5">
            <Camera className="w-5 h-5" />
          </div>
          <p className="text-[11px] uppercase tracking-widest font-bold opacity-30 text-[#0C2B4E]">No Outfits</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {outfits.map(o => (
            <div 
              key={o.id} 
              className={`relative group rounded-[24px] overflow-hidden aspect-[3/4] bg-[#F4F1EE] ${isViewOnly ? '' : 'cursor-pointer'}`}
              onClick={() => startEdit(o)}
            >
              <img src={o.photoData} className="w-full h-full object-cover" alt="Outfit" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 group-hover:opacity-80 transition-opacity"></div>
              {(o.description || o.date) && (
                <div className="absolute bottom-4 left-4 right-4">
                  {o.date && <p className="text-[9px] font-bold tracking-widest uppercase text-[#288C78] mb-0.5">{format(new Date(o.date), 'dd MMM')}</p>}
                  {o.description && <p className="text-[10px] text-white uppercase font-bold tracking-widest truncate drop-shadow-md">{o.description}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdding ? (
        <form onSubmit={handleSave} className="bg-white p-5 rounded-xl border border-[#0C2B4E]/10 shadow-sm flex flex-col gap-4 mt-4">
          <h4 className="font-bold text-[#0C2B4E] text-xl font-serif italic mb-1">{editId ? 'Edit OOTD' : 'Add OOTD'}</h4>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`w-full aspect-[4/5] rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative ${photoPreview ? 'border-[#0C2B4E]/20' : 'border-[#0C2B4E]/10 bg-transparent'}`}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-[#0C2B4E]/20 mb-2" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#0C2B4E]/40">Tap to add photo</span>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
          
          <input 
            type="text" 
            placeholder="e.g. Kyoto Walk" 
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none text-[#0C2B4E]"
          />

          <input 
            type="date" 
            value={dateStr}
            onChange={e => setDateStr(e.target.value)}
            className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none font-sans text-[#0C2B4E]"
          />

          <div className="flex gap-2 mt-4">
            {editId && (
              <button type="button" onClick={handleDelete} className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-red-500 hover:text-white hover:bg-red-500 transition-colors bg-red-50 border border-red-500/20 rounded-xl">Delete</button>
            )}
            <button type="button" onClick={cancelEdit} className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-[#0C2B4E]/50 hover:text-[#0C2B4E] border border-transparent rounded-xl">Cancel</button>
            <button type="submit" disabled={!photoPreview} className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-white bg-[#0C2B4E] hover:bg-[#1a416e] transition-colors rounded-xl disabled:opacity-50">{editId ? 'Update' : 'Save Outfit'}</button>
          </div>
        </form>
      ) : !isViewOnly ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border border-[#0C2B4E]/10 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#0C2B4E] hover:text-white transition-colors mt-4 text-[#0C2B4E] rounded-xl"
        >
          + Add Outfit
        </button>
      ) : null}
    </div>
  );
}
