import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TaskService } from '../../services/supabaseService';
import { X, Check, Megaphone, AlertCircle } from 'lucide-react';

export const ContentFormModal = () => {
  const { modalState, closeModal, refreshData, addToast } = useApp();
  const { currentUser, allUsers, isOwner, requirePermission } = useAuth();

  const isOpen = modalState.type === 'content_form';

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    division: 'marketing',
    taskType: 'Content',
    platform: 'Instagram',
    contentType: 'Carousel',
    campaign: '',
    contentPillar: 'Edukasi & Mindset',
    brief: '',
    caption: '',
    hashtags: '',
    designUrl: '',
    assetUrl: '',
    publishedUrl: '',
    assigneeId: '',
    priority: 'Medium',
    status: 'To Do',
    productionStatus: 'Planning',
    approvalStatus: 'Draft',
    productionDeadline: '',
    publishDate: '',
    dueDate: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const data = modalState.data || {};
      setFormData({
        id: data.id || '',
        title: data.title || '',
        description: data.description || '',
        division: 'marketing',
        taskType: 'Content',
        platform: data.platform || 'Instagram',
        contentType: data.contentType || 'Carousel',
        campaign: data.campaign || '',
        contentPillar: data.contentPillar || 'Edukasi & Mindset',
        brief: data.brief || '',
        caption: data.caption || '',
        hashtags: data.hashtags || '',
        designUrl: data.designUrl || '',
        assetUrl: data.assetUrl || '',
        publishedUrl: data.publishedUrl || '',
        assigneeId: data.assigneeId || currentUser.id,
        priority: data.priority || 'Medium',
        status: data.status || 'To Do',
        productionStatus: data.productionStatus || 'Planning',
        approvalStatus: data.approvalStatus || 'Draft',
        productionDeadline: data.productionDeadline || '',
        publishDate: data.publishDate || '',
        dueDate: data.productionDeadline || data.dueDate || '',
      });
      setError('');
    }
  }, [isOpen, modalState.data, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Nama konten / Judul wajib diisi.');
      return;
    }

    if (!requirePermission(formData.id ? 'edit' : 'create', 'marketing_tasks', formData)) {
      return;
    }

    try {
      await TaskService.save(
        {
          ...formData,
          division: 'marketing',
          taskType: 'Content',
          dueDate: formData.productionDeadline || formData.dueDate,
        },
        currentUser
      );

      addToast(
        formData.id ? 'Konten berhasil diperbarui!' : 'Konten baru berhasil dijadwalkan!',
        'success'
      );
      refreshData();
      closeModal();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan konten.');
    }
  };

  const mktUsers = allUsers.filter((u) => u.role === 'owner' || u.division === 'marketing');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 bg-purple-50/60 border-b border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-600 text-white rounded-xl">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {formData.id ? `Edit Content (${formData.id})` : 'Buat Content Task Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Alur produksi konten BookQu: Brief, visual design, caption, hingga approval.
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Konten (Title) *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Carousel 5 Rekomendasi Buku Self-Improvement..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Platform *</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube Shorts / Video</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter/X">Twitter / X</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Content Type *</label>
              <select
                value={formData.contentType}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Carousel">Carousel Post</option>
                <option value="Reel">Reels / Short Video</option>
                <option value="Story">Story</option>
                <option value="Static Post">Static Post</option>
                <option value="Long Form">Long Form Video / Article</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Content Pillar *</label>
              <select
                value={formData.contentPillar}
                onChange={(e) => setFormData({ ...formData, contentPillar: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Edukasi & Mindset">Edukasi & Mindset</option>
                <option value="Promosi & Diskon">Promosi & Diskon</option>
                <option value="Brand Awareness">Brand Awareness</option>
                <option value="Behind the Scenes">Behind The Scenes</option>
                <option value="Komunitas & Testimoni">Komunitas & Testimoni</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campaign</label>
              <input
                type="text"
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                placeholder="Contoh: BookQu October Healing..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PIC Assignee *</label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {mktUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Content Brief & Instruksi</label>
            <textarea
              rows={3}
              value={formData.brief}
              onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
              placeholder="Instruksi pembuatan konten, alur slide / script video..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Caption Final</label>
            <textarea
              rows={3}
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="Tuliskan copywriting caption di sini..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hashtags</label>
            <input
              type="text"
              value={formData.hashtags}
              onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
              placeholder="#BookQu #BacaBuku #SelfImprovement..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link Desain (Figma / Canva)</label>
              <input
                type="url"
                value={formData.designUrl}
                onChange={(e) => setFormData({ ...formData, designUrl: e.target.value })}
                placeholder="https://figma.com/..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link Asset (Google Drive / Cloud)</label>
              <input
                type="url"
                value={formData.assetUrl}
                onChange={(e) => setFormData({ ...formData, assetUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deadline Produksi</label>
              <input
                type="date"
                value={formData.productionDeadline}
                onChange={(e) => setFormData({ ...formData, productionDeadline: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jadwal Publikasi (Publish Date/Time)</label>
              <input
                type="datetime-local"
                value={formData.publishDate}
                onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Produksi</label>
              <select
                value={formData.productionStatus}
                onChange={(e) => setFormData({ ...formData, productionStatus: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Planning">Planning</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Approved">Approved</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Approval Status</label>
              <select
                value={formData.approvalStatus}
                onChange={(e) => setFormData({ ...formData, approvalStatus: e.target.value })}
                disabled={!isOwner}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70"
              >
                <option value="Draft">Draft</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved (Owner Only)</option>
                <option value="Rejected">Rejected / Revise</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              {formData.id ? 'Simpan Perubahan' : 'Buat Konten'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
