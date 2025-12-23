'use client';

import { useState } from 'react';
import { X, Users, Briefcase, Heart, Clock, Globe, Tag, MapPin, Building2 } from 'lucide-react';

interface GameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: GameConfig) => void;
  gameTitle: string;
}

export interface GameConfig {
  filterType: 'all' | 'group' | 'tag' | 'location' | 'company' | 'recent';
  filterValue?: string;
}

export function GameSetupModal({ isOpen, onClose, onStart, gameTitle }: GameSetupModalProps) {
  const [filterType, setFilterType] = useState<GameConfig['filterType']>('all');
  const [selectedValue, setSelectedValue] = useState<string>('work');

  // Mock groups
  const groups = [
    { id: 'work', name: 'Work', icon: Briefcase, count: 12 },
    { id: 'family', name: 'Family', icon: Heart, count: 8 },
    { id: 'tech-conf', name: 'Tech Conf', icon: Globe, count: 24 },
  ];

  // Mock tags (matching filter options from home page)
  const tags = [
    { id: 'investor', name: 'Investor', count: 6 },
    { id: 'startup', name: 'Startup', count: 14 },
    { id: 'friend', name: 'Friend', count: 10 },
    { id: 'mentor', name: 'Mentor', count: 3 },
  ];

  // Mock locations
  const locations = [
    { id: 'austin', name: 'Austin', count: 8 },
    { id: 'san-francisco', name: 'San Francisco', count: 15 },
    { id: 'new-york', name: 'New York', count: 12 },
    { id: 'seattle', name: 'Seattle', count: 5 },
  ];

  // Mock companies/organizations
  const companies = [
    { id: 'google', name: 'Google', count: 5 },
    { id: 'apple', name: 'Apple', count: 3 },
    { id: 'microsoft', name: 'Microsoft', count: 4 },
    { id: 'meta', name: 'Meta', count: 2 },
    { id: 'amazon', name: 'Amazon', count: 6 },
    { id: 'startup-xyz', name: 'Startup XYZ', count: 8 },
  ];

  if (!isOpen) return null;

  const handleStart = () => {
    onStart({
      filterType,
      filterValue: filterType !== 'all' && filterType !== 'recent' ? selectedValue : undefined,
    });
  };

  // Reset selection when filter type changes
  const handleFilterTypeChange = (type: GameConfig['filterType']) => {
    setFilterType(type);
    // Set default value for each type
    if (type === 'group') setSelectedValue('work');
    else if (type === 'tag') setSelectedValue('investor');
    else if (type === 'location') setSelectedValue('austin');
    else if (type === 'company') setSelectedValue('google');
  };

  const getInfoMessage = () => {
    switch (filterType) {
      case 'all':
        return "Practicing with all available contacts.";
      case 'group':
        return `Practicing with contacts from the "${groups.find(g => g.id === selectedValue)?.name}" group.`;
      case 'tag':
        return `Practicing with contacts tagged as "${tags.find(t => t.id === selectedValue)?.name}".`;
      case 'location':
        return `Practicing with contacts in ${locations.find(l => l.id === selectedValue)?.name}.`;
      case 'company':
        return `Practicing with contacts from ${companies.find(c => c.id === selectedValue)?.name}.`;
      case 'recent':
        return "Practicing with contacts added or interacted with in the last 30 days.";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Setup {gameTitle}</h3>
            <p className="text-sm text-slate-500">Choose who to practice with</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Main Filter Type - 6 options in a compact grid */}
          <div className="grid grid-cols-6 gap-2">
            <button
              onClick={() => handleFilterTypeChange('all')}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                filterType === 'all'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Users className="w-5 h-5 mx-auto mb-1" />
              <div className="font-semibold text-xs">All</div>
            </button>
            <button
              onClick={() => handleFilterTypeChange('group')}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                filterType === 'group'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Briefcase className="w-5 h-5 mx-auto mb-1" />
              <div className="font-semibold text-xs">Group</div>
            </button>
            <button
              onClick={() => handleFilterTypeChange('tag')}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                filterType === 'tag'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Tag className="w-5 h-5 mx-auto mb-1" />
              <div className="font-semibold text-xs">Tag</div>
            </button>
            <button
              onClick={() => handleFilterTypeChange('location')}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                filterType === 'location'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <MapPin className="w-5 h-5 mx-auto mb-1" />
              <div className="font-semibold text-xs">City</div>
            </button>
            <button
              onClick={() => handleFilterTypeChange('company')}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                filterType === 'company'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Building2 className="w-5 h-5 mx-auto mb-1" />
              <div className="font-semibold text-xs">Org</div>
            </button>
            <button
              onClick={() => handleFilterTypeChange('recent')}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                filterType === 'recent'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Clock className="w-5 h-5 mx-auto mb-1" />
              <div className="font-semibold text-xs">Recent</div>
            </button>
          </div>

          {/* Sub-options for Group */}
          {filterType === 'group' && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              <label className="text-sm font-medium text-slate-700">Select Group</label>
              <div className="grid grid-cols-1 gap-2">
                {groups.map((group) => {
                  const Icon = group.icon;
                  const isSelected = selectedValue === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedValue(group.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">{group.name}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${isSelected ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                        {group.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-options for Tag */}
          {filterType === 'tag' && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              <label className="text-sm font-medium text-slate-700">Select Tag</label>
              <div className="grid grid-cols-2 gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedValue === tag.id;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedValue(tag.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="font-semibold text-sm">{tag.name}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${isSelected ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                        {tag.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-options for Location */}
          {filterType === 'location' && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              <label className="text-sm font-medium text-slate-700">Select Location</label>
              <div className="grid grid-cols-2 gap-2">
                {locations.map((location) => {
                  const isSelected = selectedValue === location.id;
                  return (
                    <button
                      key={location.id}
                      onClick={() => setSelectedValue(location.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-semibold text-sm">{location.name}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${isSelected ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                        {location.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-options for Company */}
          {filterType === 'company' && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              <label className="text-sm font-medium text-slate-700">Select Company/Organization</label>
              <div className="grid grid-cols-2 gap-2">
                {companies.map((company) => {
                  const isSelected = selectedValue === company.id;
                  return (
                    <button
                      key={company.id}
                      onClick={() => setSelectedValue(company.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span className="font-semibold text-sm">{company.name}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${isSelected ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                        {company.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info Message */}
          <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
            {getInfoMessage()}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={handleStart}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
          >
            Start Game
          </button>
        </div>

      </div>
    </div>
  );
}
