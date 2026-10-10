import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TaskService } from '../../services/supabaseService';
import {
  X,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Share2,
  Check,
} from 'lucide-react';

export const ContentDetailModal = () => {
  const { modalState, closeModal, openModal, refreshData, addToast } = useApp();
  const { currentUser, allUsers, isOwner, requirePermission } = useAuth();

  const [copiedCaption, setCopiedCaption] = useState(false);
  const [publishedUrlInput, setPublishedUrlInput] = useState('');
  const [showPublishInput, setShowPublishInput] = useState(false);

  const isOpen = modalState.type === 'content_detail';
  const content = modalState.data;

  if (!isOpen || !content) return null;

  const assignee = content?.assignee || null;

  const handleCopyCaption = () => {
    if (content.caption) {
      navigator.clipboard.writeText(content.caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
      addToast('Caption disalin ke clipboard!', 'info');
    }
  };

  const handleStatusChange = async (newProdStatus, newApprovalStatus) => {
    try {
      if (newApprovalStatus === 'Approved' && !isOwner) {
        requirePermission('final_approve', 'marketing_content', content);
        return;
      }

      await TaskService.save(
        {
          ...content,
          productionStatus: newProdStatus,
          approvalStatus: newApprovalStatus || content.approvalStatus,
          status: newProdStatus === 'Published' ? 'Done' : content.status,
        },
        currentUser
      );

      addToast(`Status diperbarui ke ${newProdStatus}`, 'success');
      refreshData();
      closeModal();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSavePublishedUrl = async () => {
    if (!publishedUrlInput.trim()) return;
    try {
      await TaskService.save(
        {
          ...content,
          publishedUrl: publishedUrlInput.trim(),
          productionStatus: 'Published',
          status: 'Done',
        },
        currentUser
      );

      addToast('URL publikasi tersimpan & status menjadi Published!', 'success');
      refreshData();
      closeModal();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Yakin ingin menghapus konten ${content.id}?`)) {
      try {
        await TaskService.delete(content.id, currentUser);
        addToast(`Konten ${content.id} berhasil dihapus.`, 'success');
        refreshData();
        closeModal();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-purple-50/70 border-b border-purple-100 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                {content.id}
              </span>
              <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                {content.platform} • {content.contentType}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  content.approvalStatus === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : content.approvalStatus === 'Pending Approval'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {content.approvalStatus || 'Draft'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{content.title}</h2>
          </div>

          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Metadata banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Pillar</span>
              <span className="font-semibold text-slate-800">{content.contentPillar || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Campaign</span>
              <span className="font-semibold text-slate-800">{content.campaign || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PIC</span>
              <span className="font-semibold text-slate-800">{assignee?.name || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Status Produksi</span>
              <span className="font-semibold text-purple-700">{content.productionStatus || 'Planning'}</span>
            </div>
          </div>

          {/* Brief */}
          {content.brief && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Content Brief & Arahan
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {content.brief}
              </p>
            </div>
          )}

          {/* Caption */}
          {content.caption && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Caption Copywriting
                </h4>
                <button
                  onClick={handleCopyCaption}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Caption</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {content.caption}
              </p>
            </div>
          )}

          {/* Hashtags */}
          {content.hashtags && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Hashtags
              </h4>
              <p className="text-xs font-mono text-purple-700 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
                {content.hashtags}
              </p>
            </div>
          )}

          {/* Dates & Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Deadline Produksi:</span>
                <span className="font-semibold text-slate-800">{content.productionDeadline || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jadwal Publish:</span>
                <span className="font-semibold text-indigo-700">{content.publishDate || '-'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Link Desain:</span>
                {content.designUrl ? (
                  <a
                    href={content.designUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Buka Figma/Canva <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Link Assets:</span>
                {content.assetUrl ? (
                  <a
                    href={content.assetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Buka Storage <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Published URL section */}
          {content.publishedUrl ? (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-emerald-900">Sudah Dipublikasikan:</span>
              </div>
              <a
                href={content.publishedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:underline font-mono truncate max-w-xs flex items-center gap-1 font-bold"
              >
                {content.publishedUrl} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="pt-2">
              {!showPublishInput ? (
                <button
                  onClick={() => setShowPublishInput(true)}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" /> + Masukkan URL Hasil Publikasi
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={publishedUrlInput}
                    onChange={(e) => setPublishedUrlInput(e.target.value)}
                    placeholder="https://instagram.com/p/..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSavePublishedUrl}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                  >
                    Simpan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeModal();
                openModal('content_form', content);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Konten
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus
            </button>
          </div>

          <div className="flex items-center gap-2">
            {content.productionStatus !== 'In Review' &&
              content.approvalStatus !== 'Approved' && (
                <button
                  onClick={() => handleStatusChange('In Review', 'Pending Approval')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Ajukan untuk Approval
                </button>
              )}

            {isOwner && content.approvalStatus === 'Pending Approval' && (
              <>
                <button
                  onClick={() => handleStatusChange('In Progress', 'Rejected')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Minta Revisi
                </button>
                <button
                  onClick={() => handleStatusChange('Approved', 'Approved')}
                  className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve Konten
                </button>
              </>
            )}

            {content.approvalStatus === 'Approved' &&
              content.productionStatus !== 'Published' && (
                <button
                  onClick={() => handleStatusChange('Scheduled', 'Approved')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Jadwalkan Posting
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
