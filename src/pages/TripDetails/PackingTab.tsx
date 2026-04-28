import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Check, Trash2 } from 'lucide-react';
import { PackingItem } from '../../types';
import { getTripPackingList, savePackingItem, deletePackingItem } from '../../store/db';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['Clothing', 'Toiletries', 'Electronics', 'Documents', 'Miscellaneous'];

export default function PackingTab({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[0]);

  const [searchParams] = useSearchParams();
  const isViewOnly = searchParams.get('viewOnly') === 'true';
  const { user } = useAuth();

  useEffect(() => {
    loadItems();
  }, [tripId]);

  const loadItems = async () => {
    const data = await getTripPackingList(tripId);
    setItems(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle || (!user && !isViewOnly)) return;

    const newItem: PackingItem = {
      id: uuidv4(),
      tripId,
      title: newItemTitle,
      isPacked: false,
      category: newItemCategory,
    };
    if (user?.uid) newItem.userId = user.uid;

    await savePackingItem(newItem);
    setNewItemTitle('');
    setIsAdding(false);
    loadItems();
  };

  const handleTogglePacked = async (item: PackingItem) => {
    if (isViewOnly) return;
    const updated = { ...item, isPacked: !item.isPacked };
    await savePackingItem(updated);
    loadItems();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isViewOnly) return;
    if (confirm('Are you sure you want to delete this item?')) {
      await deletePackingItem(tripId, id);
      loadItems();
    }
  };

  const itemsByCategory = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, PackingItem[]>);

  const totalItems = items.length;
  const packedItems = items.filter(i => i.isPacked).length;
  const progress = totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#0C2B4E]/5 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#0C2B4E]/50">Packing Progress</span>
          <span className="text-sm font-mono font-bold text-[#0C2B4E]">{progress}%</span>
        </div>
        <div className="w-full bg-[#E8E4E1] h-2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0C2B4E] to-[#288C78] transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="mt-3 text-[10px] text-right font-bold uppercase tracking-widest text-[#0C2B4E]/40">
          {packedItems} of {totalItems} packed
        </div>
      </div>

      {Object.entries(itemsByCategory).map(([category, catItems]) => (
        <div key={category} className="mt-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#0C2B4E]/40 mb-3 ml-2">{category}</h3>
          <div className="bg-white rounded-2xl overflow-hidden border border-[#0C2B4E]/5 shadow-sm">
            {catItems.map((item, idx) => (
              <div 
                key={item.id} 
                className={`flex items-center gap-3 p-4 ${idx !== catItems.length - 1 ? 'border-b border-[#0C2B4E]/5' : ''} ${isViewOnly ? '' : 'cursor-pointer hover:bg-neutral-50'} transition-colors`}
                onClick={() => handleTogglePacked(item)}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${item.isPacked ? 'bg-[#288C78] border-[#288C78] text-white' : 'border-[#0C2B4E]/20 text-transparent'}`}>
                  <Check className="w-3 h-3" />
                </div>
                <span className={`flex-1 text-sm font-medium ${item.isPacked ? 'text-[#0C2B4E]/40 line-through' : 'text-[#0C2B4E]'}`}>
                  {item.title}
                </span>
                {!isViewOnly && (
                  <button onClick={(e) => handleDelete(item.id, e)} className="p-2 text-[#0C2B4E]/20 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {isAdding && !isViewOnly && (
        <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl border border-[#0C2B4E]/5 shadow-sm flex flex-col gap-4 animate-in slide-in-from-bottom-2 mt-4">
          <h4 className="font-bold text-[#0C2B4E] text-lg font-serif italic mb-1">Add Packing Item</h4>
          
          <input 
            type="text" 
            placeholder="Item name (e.g., Passport)" 
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none text-[#0C2B4E]"
            required
            autoFocus
          />

          <div>
            <label className="block text-[9px] font-bold text-[#0C2B4E]/50 uppercase tracking-widest mb-1">Category</label>
            <select 
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm text-[#0C2B4E] focus:border-[#288C78] outline-none"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-[#0C2B4E]/50 hover:text-[#0C2B4E] border border-transparent rounded-xl">Cancel</button>
            <button type="submit" className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-white bg-[#0C2B4E] hover:bg-[#1a416e] transition-colors rounded-xl">Add</button>
          </div>
        </form>
      )}

      {!isAdding && !isViewOnly && (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border border-[#0C2B4E]/10 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#0C2B4E] hover:text-white transition-colors mt-4 rounded-xl text-[#0C2B4E]"
        >
          + Add Item
        </button>
      )}
    </div>
  );
}
