import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { FileText, Plus, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Attachment } from '../../types';
import { getTripAttachments, saveAttachment, fileToBase64, deleteAttachment } from '../../store/db';
import { useAuth } from '../../contexts/AuthContext';

export default function DocsTab({ tripId }: { tripId: string }) {
  const [docs, setDocs] = useState<Attachment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  const [searchParams] = useSearchParams();
  const isViewOnly = searchParams.get('viewOnly') === 'true';
  const { user } = useAuth();

  useEffect(() => {
    loadDocs();
  }, [tripId]);

  const loadDocs = async () => {
    const data = await getTripAttachments(tripId);
    setDocs(data);
  };

  const startEdit = (doc: Attachment) => {
    if (isViewOnly) return;
    setEditId(doc.id);
    setTitle(doc.title);
    setSelectedFile(null);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditId(null);
    setTitle('');
    setSelectedFile(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!selectedFile && !editId) || (!user && !isViewOnly)) return;

    try {
      let base64 = '';
      let fileType = '';
      
      if (selectedFile) {
        base64 = await fileToBase64(selectedFile);
        fileType = selectedFile.type;
      } else if (editId) {
        const existingDoc = docs.find(d => d.id === editId);
        if (existingDoc) {
          base64 = existingDoc.fileData;
          fileType = existingDoc.fileType;
        }
      }

      const newDoc: Attachment = {
        id: editId || uuidv4(),
        userId: user?.uid,
        tripId,
        title,
        fileData: base64,
        fileType: fileType,
        dateAdded: new Date().toISOString()
      };
      await saveAttachment(newDoc);
      cancelEdit();
      loadDocs();
    } catch (e) {
      console.error(e);
      alert('File too large or could not be read');
    }
  };

  const handleDelete = async () => {
    if (editId && confirm('Are you sure you want to delete this document?')) {
      await deleteAttachment(tripId, editId);
      cancelEdit();
      loadDocs();
    }
  };

  const openDoc = (doc: Attachment) => {
    // If it's an image or PDF, we can open in a new tab
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<iframe src="${doc.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden; z-index:999999;"></iframe>`
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {docs.length === 0 && !isAdding ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-white text-[#0C2B4E]/40 flex items-center justify-center rounded-xl mx-auto mb-4 border border-[#0C2B4E]/5">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-[11px] uppercase tracking-widest font-bold opacity-30 text-[#0C2B4E]">No Documents</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {docs.map(doc => (
            <div 
              key={doc.id} 
              className="bg-white p-4 rounded-xl border border-[#0C2B4E]/5 flex items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 bg-[#F4F1EE] flex shrink-0 items-center justify-center rounded text-lg border border-[#0C2B4E]/5">
                <FileText className="w-5 h-5 text-[#288C78]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#0C2B4E] truncate">{doc.title}</div>
                <div className="text-[10px] opacity-50 uppercase tracking-widest mt-0.5 text-[#0C2B4E]">{format(new Date(doc.dateAdded), 'dd MMM yy')}</div>
              </div>
              <div className="flex gap-2 items-center">
                {!isViewOnly && (
                  <button onClick={() => startEdit(doc)} className="text-[#0C2B4E]/40 hover:text-[#0C2B4E] p-1 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => openDoc(doc)} className="text-[10px] uppercase font-bold text-white bg-[#0C2B4E] hover:bg-[#1a416e] transition-colors tracking-widest px-3 py-1.5 rounded-lg">View</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdding ? (
        <form onSubmit={handleSave} className="bg-white p-5 rounded-xl border border-[#0C2B4E]/10 shadow-sm flex flex-col gap-4 mt-2">
          <h4 className="font-bold text-[#0C2B4E] text-xl font-serif italic mb-1">{editId ? 'Edit Document' : 'Add Document'}</h4>
          
          <input 
            type="text" 
            placeholder="e.g. Boarding Pass" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent border-b border-[#0C2B4E]/20 py-2 text-sm focus:border-[#288C78] outline-none transition-colors text-[#0C2B4E]"
            required
          />
          
          <input 
            type="file" 
            accept="image/*,application/pdf"
            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
            className="text-sm mt-3 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-[#0C2B4E] file:text-white hover:file:bg-[#1a416e] file:transition-colors file:cursor-pointer"
            required={!editId}
          />
          {editId && <p className="text-[9px] text-[#0C2B4E]/40 italic">Leave file empty to keep existing document.</p>}

          <div className="flex gap-2 mt-4">
            {editId && (
              <button type="button" onClick={handleDelete} className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-red-500 hover:text-white hover:bg-red-500 transition-colors bg-red-50 border border-red-500/20 rounded-xl">Delete</button>
            )}
            <button type="button" onClick={cancelEdit} className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-[#0C2B4E]/50 hover:text-[#0C2B4E] rounded-xl border border-transparent">Cancel</button>
            <button type="submit" className="flex-1 py-3 text-[11px] uppercase tracking-widest font-bold text-white bg-[#0C2B4E] hover:bg-[#1a416e] transition-colors rounded-xl">{editId ? 'Update' : 'Save'}</button>
          </div>
        </form>
      ) : !isViewOnly ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border border-[#0C2B4E]/10 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#0C2B4E] hover:text-white transition-colors mt-4 text-[#0C2B4E] rounded-xl"
        >
          + Add Document
        </button>
      ) : null}
    </div>
  );
}
