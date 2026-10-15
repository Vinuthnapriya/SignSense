import React, { useState, useMemo } from 'react';
import { X, CheckCircle, Hand, Search, Tag } from 'lucide-react';
import { SUPPORTED_SIGNS, SignDefinition } from '../types/gestures';

interface SignDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDemoSign: (signName: string) => void;
}

const CATEGORIES = [
  'All',
  'Greeting & Social',
  'Responses',
  'Expressions',
  'Numbers & Hands',
] as const;

export const SignDictionaryModal: React.FC<SignDictionaryModalProps> = ({
  isOpen,
  onClose,
  onSelectDemoSign,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredSigns = useMemo(() => {
    return SUPPORTED_SIGNS.filter((sign) => {
      const matchesCategory =
        selectedCategory === 'All' || sign.group === selectedCategory;
      const matchesSearch =
        sign.name.toLowerCase().includes(search.toLowerCase()) ||
        sign.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Hand className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 id="modal-title" className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                Supported Signs Library
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {SUPPORTED_SIGNS.length} Signs
                </span>
              </h3>
              <p className="text-xs text-neutral-500">
                MediaPipe Vision &amp; 3D geometric landmark recognition
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="pt-4 pb-2 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search signs by name or gesture..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const count =
                cat === 'All'
                  ? SUPPORTED_SIGNS.length
                  : SUPPORTED_SIGNS.filter((s) => s.group === cat).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-neutral-700 text-neutral-200' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* List of signs */}
        <div className="py-2 space-y-2.5 overflow-y-auto flex-1 pr-1">
          {filteredSigns.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              No signs matched your search criteria.
            </div>
          ) : (
            filteredSigns.map((sign) => (
              <div
                key={sign.id}
                className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl select-none w-10 text-center" aria-hidden="true">
                    {sign.emoji}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900 group-hover:text-emerald-950">
                        {sign.name}
                      </h4>
                      <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                        {sign.group}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {sign.description}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDemoSign(sign.name);
                    onClose();
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-emerald-600 hover:text-white text-neutral-700 transition-colors shrink-0 ml-2"
                >
                  Try Sign
                </button>
              </div>
            ))
          )}
        </div>

        {/* Tips Footer */}
        <div className="pt-3.5 border-t border-gray-100 text-xs text-neutral-500 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Position your hand facing the camera in good lighting. Deep learning landmarks track finger joints at 30+ FPS.
          </span>
        </div>
      </div>
    </div>
  );
};
