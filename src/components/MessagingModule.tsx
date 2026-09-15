import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Circle, Paperclip, FileText, X, Loader2, ArrowLeft, MoreVertical, Trash2, Image as ImageIcon } from 'lucide-react';
import { useMessaging } from '../hooks/useMessaging';
import { Settings, Plus, Check, CheckCheck } from 'lucide-react';
import { Employee } from '../types';
import { supabase } from '../lib/supabase-client';

interface MessagingModuleProps {
 currentUser: Employee;
 employees: Employee[];
}

export function MessagingModule({ currentUser, employees }: MessagingModuleProps) {
 const [selectedUser, setSelectedUser] = useState<Employee | { isGroup: true, id: string, name: string, admin_id?: string } | null>(null);
 const [showGroupSettings, setShowGroupSettings] = useState(false);
 const [newGroupName, setNewGroupName] = useState('');
 const [showNewGroupModal, setShowNewGroupModal] = useState(false);
 const [channelId, setChannelId] = useState<string | null>(null);
 const [inputText, setInputText] = useState('');
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [isUploading, setIsUploading] = useState(false);
 
 // Context menu state for message deletion
 const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number, isMine: boolean } | null>(null);
 
 const fileInputRef = useRef<HTMLInputElement>(null);
 const messagesEndRef = useRef<HTMLDivElement>(null);

 const { messages, sendMessage, deleteMessageForMe, deleteMessageForEveryone, isConnected, participants, messageReads, channelDetails, updateGroupName, addParticipant, removeParticipant } = useMessaging(channelId, currentUser.id);

 // Auto-scroll to bottom
 useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages]);
 
 // Hide context menu on click outside
 useEffect(() => {
  const handleClick = () => setContextMenu(null);
  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
 }, []);

 // Handle selecting a user or group to chat with
 useEffect(() => {
  
  async function setupChannel() {
   if (!selectedUser) return;
   
   if ('isGroup' in selectedUser) {
    if (selectedUser.id === 'group_all') {
     const { data: existingChannels } = await supabase.from('pharma_hrms_chat_channels').select('*').eq('name', 'group_all');
     if (existingChannels && existingChannels.length > 0) {
      setChannelId(existingChannels[0].id);
     } else {
      const { data: newChannel } = await supabase.from('pharma_hrms_chat_channels').insert([{ name: 'group_all', type: 'group' }]).select().single();
      if (newChannel) setChannelId(newChannel.id);
     }
    } else {
      setChannelId(selectedUser.id);
    }
   } else {
    const participantsIds = [currentUser.id, selectedUser.id].sort();
    const channelName = `direct_${participantsIds[0]}_${participantsIds[1]}`;

    const { data: existingChannels } = await supabase.from('pharma_hrms_chat_channels').select('*').eq('name', channelName);

    if (existingChannels && existingChannels.length > 0) {
     setChannelId(existingChannels[0].id);
    } else {
     const { data: newChannel } = await supabase.from('pharma_hrms_chat_channels').insert([{ name: channelName, type: 'direct' }]).select().single();
     if (newChannel) setChannelId(newChannel.id);
    }
   }
  }

  setupChannel();
 }, [selectedUser, currentUser.id]);

 const handleSend = async (e: React.FormEvent | React.KeyboardEvent) => {
  if (e.type === 'submit') {
   e.preventDefault();
  }
  if ((!inputText.trim() && !selectedFile) || isUploading) return;

  let attachmentUrl = undefined;
  let attachmentType = undefined;
  let attachmentName = undefined;

  if (selectedFile) {
   setIsUploading(true);
   try {
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
     .from('chat-attachments')
     .upload(fileName, selectedFile);
     
    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage
     .from('chat-attachments')
     .getPublicUrl(fileName);
     
    attachmentUrl = publicUrlData.publicUrl;
    attachmentType = selectedFile.type.startsWith('image/') ? 'image' : 'document';
    attachmentName = selectedFile.name;
   } catch (err: any) {
    console.error("Error uploading file:", err);
    alert(`Failed to upload attachment: ${err.message}`);
    setIsUploading(false);
    return;
   }
   setIsUploading(false);
  }

  sendMessage(inputText.trim() || null, attachmentUrl, attachmentType, attachmentName);
  setInputText('');
  setSelectedFile(null);
  if (fileInputRef.current) fileInputRef.current.value = '';
 };

 const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
   e.preventDefault();
   handleSend(e);
  }
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
   const file = e.target.files[0];
   if (file.size > 5 * 1024 * 1024) {
    alert('File size exceeds 5MB limit. Please choose a smaller file.');
    if (fileInputRef.current) fileInputRef.current.value = '';
    return;
   }
   setSelectedFile(file);
  }
 };
 
 const handleContextMenu = (e: React.MouseEvent, msgId: string, isMine: boolean) => {
  e.preventDefault();
  setContextMenu({ msgId, x: e.clientX, y: e.clientY, isMine });
 };

 const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
 };

 const contacts = employees.filter(emp => emp.id !== currentUser.id);

 // Calculate visible messages
 const visibleMessages = messages.filter(msg => {
  // Hide if sender deleted for themselves and I am the sender
  if (msg.deleted_for_sender && msg.sender_id === currentUser.id) return false;
  return true;
 });

 return (
  <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6 relative">
   
   {/* Left Sidebar - Contact List */}
   <div className={`border-r border-slate-200 bg-white flex-col ${selectedUser ? 'hidden md:flex md:w-[350px]' : 'flex w-full md:w-[350px]'}`}>
    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
     <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
       {getInitials(currentUser.name)}
      </div>
      <h2 className="text-lg font-bold text-slate-800">Chats</h2>
     </div>
     <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
       <Circle className={`w-2.5 h-2.5 ${isConnected ? 'text-green-500 fill-green-500' : 'text-slate-400 fill-slate-400'}`} />
       <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{isConnected ? 'Online' : 'Offline'}</span>
     </div>
    </div>
    
    <div className="flex-1 overflow-y-auto">
     
     {/* Groups List */}
     <div className="px-4 py-2 flex items-center justify-between">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Groups</span>
     </div>
     <button
      onClick={() => setSelectedUser({ isGroup: true, id: 'group_all', name: 'Company Group' })}
      className={`w-full flex items-center gap-4 p-4 border-b border-slate-100 transition-colors ${
       selectedUser && 'isGroup' in selectedUser && selectedUser.id === 'group_all' ? 'bg-slate-100' : 'hover:bg-slate-50'
      }`}
     >
      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-lg">
       CG
      </div>
      <div className="flex-1 text-left min-w-0">
       <h3 className="text-[15px] font-semibold text-slate-900 truncate">Company Group</h3>
      </div>
     </button>


     {/* Individual Contacts */}
     {contacts.map((contact) => (
      <button
       key={contact.id}
       onClick={() => setSelectedUser(contact)}
       className={`w-full flex items-center gap-4 p-4 border-b border-slate-50 transition-colors ${
        selectedUser?.id === contact.id ? 'bg-slate-100' : 'hover:bg-slate-50'
       }`}
      >
       <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-bold text-base">
        {getInitials(contact.name)}
       </div>
       <div className="flex-1 text-left min-w-0">
        <div className="flex justify-between items-baseline mb-1">
         <h3 className="text-[15px] font-semibold text-slate-900 truncate">{contact.name}</h3>
        </div>
        <p className="text-[13px] text-slate-500 truncate capitalize">{contact.designation}</p>
       </div>
      </button>
     ))}
    </div>
   </div>

   {/* Right Content - Chat Area */}
   <div className={`flex-1 flex-col bg-[#efeae2] ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
    {selectedUser ? (
     <>
      {/* Chat Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-4 z-10 shadow-sm">
       <button 
        onClick={() => setSelectedUser(null)}
        className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-200 rounded-full"
       >
        <ArrowLeft className="w-5 h-5"/>
       </button>
       
       <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
        selectedUser === 'group' ? 'bg-gradient-to-tr from-emerald-400 to-teal-500' : 'bg-slate-300 text-slate-600'
       }`}>
        {selectedUser && 'isGroup' in selectedUser ? getInitials(selectedUser.name) : getInitials(selectedUser.name)}
       </div>
       
       
       <div className="flex-1 min-w-0">
        <h2 className="text-[16px] font-semibold text-slate-900 truncate">
         {selectedUser && 'isGroup' in selectedUser ? channelDetails?.name || selectedUser.name : (selectedUser as Employee).name}
        </h2>
        <p className="text-[13px] text-slate-500 truncate capitalize">
         {selectedUser && 'isGroup' in selectedUser ? `${participants.length} Participants` : (selectedUser as Employee).designation}
        </p>
       </div>
       
       {selectedUser && 'isGroup' in selectedUser && (
        <button onClick={() => setShowGroupSettings(true)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full">
         <Settings className="w-5 h-5"/>
        </button>
       )}

      </div>

      {/* Messages Stream */}
      <div 
       className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-repeat bg-center"
       style={{ backgroundSize: '400px' }}
      >
       {visibleMessages.length === 0 ? (
        <div className="flex mt-10 justify-center">
         <div className="bg-amber-100 text-amber-900 text-xs px-4 py-2 rounded-lg shadow-sm max-w-sm text-center">
          Messages are end-to-end encrypted. No one outside of this chat, not even Orca Labs HRMS, can read them.
         </div>
        </div>
       ) : (
        visibleMessages.map((msg, index) => {
         const isMe = msg.sender_id === currentUser.id;
         const isDeleted = msg.deleted_for_everyone;
         
         return (
          <div 
           key={msg.id || index} 
           className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
          >
           <div 
            onContextMenu={(e) => handleContextMenu(e, msg.id, isMe)}
            className={`relative max-w-[85%] md:max-w-[65%] rounded-xl px-3 py-1.5 shadow-sm ${
             isMe 
              ? 'bg-[#dcf8c6] rounded-tr-none text-slate-900' 
              : 'bg-white rounded-tl-none text-slate-900'
            }`}
           >
            {/* Sender Name for Group */}
            {!isMe && selectedUser && 'isGroup' in selectedUser && !isDeleted && (
             <div className="text-[11px] font-bold text-teal-600 mb-0.5">
              {employees.find(e => e.id === msg.sender_id)?.name || 'Unknown'}
             </div>
            )}
            
            {isDeleted ? (
             <div className="flex items-center gap-1.5 text-slate-500 italic py-1 text-[13px]">
              <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center">
               <span className="text-[10px] leading-none">!</span>
              </div>
              This message was deleted
             </div>
            ) : (
             <>
              {msg.attachment_url && msg.attachment_type === 'image' && (
               <a href={msg.attachment_url} target="_blank"rel="noreferrer"className="block mb-1 mt-1">
                <img src={msg.attachment_url} alt={msg.attachment_name || 'attachment'} className="max-w-full rounded-lg object-cover max-h-64 sm:max-h-80"/>
               </a>
              )}
              {msg.attachment_url && msg.attachment_type === 'document' && (
               <a href={msg.attachment_url} target="_blank"rel="noreferrer"className={`flex items-center gap-3 p-2.5 rounded-lg mb-1 mt-1 transition-colors ${isMe ? 'bg-[#cbe6b6] hover:bg-[#b9d5a4]' : 'bg-slate-100 hover:bg-slate-200'}`}>
                <div className="w-10 h-10 rounded bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                 <FileText className="w-5 h-5"/>
                </div>
                <div className="flex flex-col min-w-0">
                 <span className="text-[13px] truncate font-medium">{msg.attachment_name || 'Document'}</span>
                 <span className="text-[11px] uppercase text-slate-500">Document</span>
                </div>
               </a>
              )}
              
              <div className="flex flex-wrap items-end justify-between gap-2">
               {msg.text && (
                <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words pb-2">
                 {msg.text}
                </p>
               )}
               
               <span className={`text-[10px] ml-auto float-right ${isMe ? 'text-teal-700' : 'text-slate-400'} whitespace-nowrap mt-1`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
              </div>
             </>
            )}
           </div>
          </div>
         );
        })
       )}
       <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f2f5] px-4 py-3 flex flex-col">
       
       {/* Attachment Preview */}
       {selectedFile && (
        <div className="mb-3 p-3 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
         <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
           {selectedFile.type.startsWith('image/') ? (
            <img src={URL.createObjectURL(selectedFile)} alt="preview"className="w-full h-full object-cover rounded"/>
           ) : (
            <FileText className="w-6 h-6 text-slate-500"/>
           )}
          </div>
          <div className="flex flex-col min-w-0">
           <span className="truncate text-sm font-medium text-slate-700">{selectedFile.name}</span>
           <span className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
         </div>
         <button 
          onClick={() => {
           setSelectedFile(null);
           if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
         >
          <X className="w-5 h-5"/>
         </button>
        </div>
       )}

       <div className="flex items-end gap-2">
        <div className="flex-1 bg-white rounded-2xl flex items-end px-2 py-1 shadow-sm">
         <input 
          type="file"
          ref={fileInputRef} 
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
         />
         
         <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all shrink-0 mb-0.5"
          title="Attach file"
         >
          <Paperclip className="w-5 h-5 -rotate-45"/>
         </button>
         
         <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-2 text-[15px] text-slate-800 leading-normal"
          rows={1}
          style={{ height: inputText ? 'auto' : '44px' }}
         />
        </div>
        
        <button
         onClick={handleSend}
         disabled={(!inputText.trim() && !selectedFile) || isUploading}
         className="bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white p-3.5 rounded-full shadow-sm transition-all shrink-0 mb-0.5"
        >
         {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin"/>
         ) : (
          <Send className="w-5 h-5 translate-x-0.5"/>
         )}
        </button>
       </div>
      </div>
     </>
    ) : (
     <div className="flex h-full items-center justify-center flex-col text-slate-400 bg-slate-50">
      <div className="w-72 max-w-full text-center">
       <div className="w-24 h-24 mx-auto bg-slate-200 rounded-full flex items-center justify-center mb-6">
         <ImageIcon className="w-10 h-10 text-slate-400"/>
       </div>
       <h2 className="text-xl font-light text-slate-700 mb-4">Orca Labs Pharma HRMS Web</h2>
       <p className="text-[13px] leading-relaxed">Send and receive messages seamlessly. Select a contact to start chatting.</p>
      </div>
     </div>
    )}
   </div>

   {/* Context Menu for Deletion */}
   {contextMenu && (
    <div 
     className="fixed z-50 bg-white rounded-lg shadow-md border border-slate-100 py-1 min-w-[160px] overflow-hidden animate-scaleUp"
     style={{ 
      top: `${Math.min(contextMenu.y, window.innerHeight - 100)}px`, 
      left: `${Math.min(contextMenu.x, window.innerWidth - 180)}px` 
     }}
     onClick={(e) => e.stopPropagation()}
    >
     <button 
      className="w-full text-left px-4 py-3 text-[14px] text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
      onClick={() => {
       deleteMessageForMe(contextMenu.msgId);
       setContextMenu(null);
      }}
     >
      <Trash2 className="w-4 h-4 text-slate-400"/>
      Delete for me
     </button>
     
     {contextMenu.isMine && (
      <button 
       className="w-full text-left px-4 py-3 text-[14px] text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors border-t border-slate-50"
       onClick={() => {
        deleteMessageForEveryone(contextMenu.msgId);
        setContextMenu(null);
       }}
      >
       <Trash2 className="w-4 h-4 text-rose-500"/>
       Delete for everyone
      </button>
     )}
    </div>
   )}


   {/* Group Settings Modal */}
   {showGroupSettings && selectedUser && 'isGroup' in selectedUser && (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
     <div className="bg-white rounded-2xl shadow-md w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
       <h3 className="font-bold text-slate-800 text-lg">Group Settings</h3>
       <button onClick={() => setShowGroupSettings(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5"/></button>
      </div>
      
      <div className="p-6 overflow-y-auto">
       {channelDetails?.admin_id === currentUser.id || !channelDetails?.admin_id ? (
        <div className="mb-6 space-y-3">
         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Change Group Name</label>
         <div className="flex gap-2">
          <input 
           type="text"
           defaultValue={channelDetails?.name || ''}
           onChange={(e) => setNewGroupName(e.target.value)}
           className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
          />
          <button 
           onClick={async () => { 
            if(newGroupName) {
              await updateGroupName(newGroupName); 
              if (!channelDetails?.admin_id) {
               await supabase.from('pharma_hrms_chat_channels').update({ admin_id: currentUser.id }).eq('id', channelId);
              }
              alert("Saved!");
            }
           }}
           className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
           Save
          </button>
         </div>
        </div>
       ) : (
        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
         <p className="text-sm text-slate-600 text-center">Only the group admin can change the name or add members.</p>
        </div>
       )}

       <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Participants ({participants.length})</label>
        <div className="space-y-2">
         {participants.map(p => {
          const emp = employees.find(e => e.id === p.user_id);
          return (
           <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl group transition-colors">
            <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              {emp ? getInitials(emp.name) : '?'}
             </div>
             <div>
              <p className="text-sm font-medium text-slate-800">{emp ? emp.name : p.user_id}</p>
              {channelDetails?.admin_id === p.user_id && <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">Admin</span>}
             </div>
            </div>
            {(channelDetails?.admin_id === currentUser.id || !channelDetails?.admin_id) && p.user_id !== currentUser.id && (
             <button onClick={() => removeParticipant(p.user_id)} className="text-rose-500 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 rounded transition-all">
              <Trash2 className="w-4 h-4"/>
             </button>
            )}
           </div>
          )
         })}
        </div>
       </div>

       {(channelDetails?.admin_id === currentUser.id || !channelDetails?.admin_id) && (
        <div className="mt-6 border-t border-slate-100 pt-6">
         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Add People</label>
         <div className="space-y-2">
          {employees.filter(e => e.id !== currentUser.id && !participants.some(p => p.user_id === e.id)).map(e => (
            <div key={e.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
             <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
               {getInitials(e.name)}
              </div>
              <span className="text-sm font-medium text-slate-700">{e.name}</span>
             </div>
             <button onClick={() => addParticipant(e.id)} className="bg-white border border-slate-200 hover:border-teal-600 hover:text-teal-600 shadow-sm text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
              Add
             </button>
            </div>
          ))}
          {employees.filter(e => e.id !== currentUser.id && !participants.some(p => p.user_id === e.id)).length === 0 && (
           <p className="text-sm text-slate-400 italic text-center py-4">All employees are in this group.</p>
          )}
         </div>
        </div>
       )}
      </div>
     </div>
    </div>
   )}

  </div>
 );
}
