import React, { useState } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

const NewInvestigationModal = ({ isOpen, onClose, onCaseCreated }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Investigation Title is required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/cases', {
        title: title.trim(),
        description: description.trim() || 'New investigative operation initiated.',
        priority: priority.toUpperCase(),
      });

      setTitle('');
      setDescription('');
      setPriority('HIGH');
      onClose();
      
      if (onCaseCreated) {
        onCaseCreated(response);
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create new investigation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container border border-outline-variant w-full max-w-lg rounded-xl shadow-[0_0_40px_rgba(0,229,255,0.15)] overflow-hidden">
        
        {/* Header */}
        <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-primary-container/20 border border-primary text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add_box</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Initiate Investigation</h3>
              <p className="text-[11px] font-data-code text-on-surface-variant">VEILLE Intelligence Docket 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-status-critical/10 border border-status-critical/30 rounded flex items-center gap-2 text-status-critical text-xs font-body-md">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface-variant flex items-center gap-1.5" htmlFor="case-title">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              Operation / Case Title <span className="text-primary">*</span>
            </label>
            <input
              id="case-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Operation Redline 2026"
              className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2.5 text-sm font-body-md text-on-surface focus:outline-none focus:border-primary focus:shadow-[0_0_8px_rgba(0,229,255,0.2)] transition-all placeholder:text-on-surface-variant/40"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface-variant flex items-center gap-1.5" htmlFor="case-priority">
              <span className="material-symbols-outlined text-[14px]">flag</span>
              Priority Classification
            </label>
            <select
              id="case-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2.5 text-sm font-data-code text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
              disabled={isLoading}
            >
              <option value="CRITICAL">CRITICAL (Top Threat Level)</option>
              <option value="HIGH">HIGH (Active Syndicate)</option>
              <option value="MEDIUM">MEDIUM (Standard Monitoring)</option>
              <option value="LOW">LOW (Preliminary Intelligence)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface-variant flex items-center gap-1.5" htmlFor="case-desc">
              <span className="material-symbols-outlined text-[14px]">description</span>
              Case Brief / Objectives
            </label>
            <textarea
              id="case-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of intel leads, target persons, financial nodes, and operational scope..."
              rows={3}
              className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm font-body-md text-on-surface focus:outline-none focus:border-primary transition-all resize-none placeholder:text-on-surface-variant/40"
              disabled={isLoading}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-label-caps text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded transition-colors cursor-pointer"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-primary text-on-primary font-label-caps text-xs font-bold rounded flex items-center gap-2 hover:bg-primary-fixed transition-all cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.3)] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  CREATING...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  CREATE INVESTIGATION
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewInvestigationModal;
