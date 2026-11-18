import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import type { StudentProfile, UserRole } from '../types/lesson';

interface StudentSelectorProps {
  role: UserRole;
  isInvitedStudent?: boolean;
  studentProfiles: StudentProfile[];
  activeStudent: StudentProfile;
  onSwitchRole: (role: UserRole) => void;
  onSelectStudent: (id: string, alsoSwitchToStudentRole?: boolean) => void;
  onAddStudent: (
    name: string,
    level?: 'A1' | 'A2',
    alsoSwitchToStudentRole?: boolean
  ) => StudentProfile;
  onRenameStudent: (id: string, name: string, level?: 'A1' | 'A2') => void;
  onRemoveStudent: (id: string) => void;
  onOpenInviteModal: () => void;
}

export function StudentSelector({
  role,
  isInvitedStudent = false,
  studentProfiles,
  activeStudent,
  onSwitchRole,
  onSelectStudent,
  onAddStudent,
  onRenameStudent,
  onRemoveStudent,
  onOpenInviteModal,
}: StudentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState<'A1' | 'A2'>('A1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (role !== 'tutor') {
      setIsOpen(false);
      setEditingId(null);
    }
  }, [role]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackName = `Élève ${studentProfiles.length + 1}`;
    onAddStudent(newName.trim() || fallbackName, newLevel, role === 'student');
    setNewName('');
    setNewLevel('A1');
  };

  const handleStartEdit = (profile: StudentProfile) => {
    setEditingId(profile.id);
    setEditingName(profile.name);
  };

  const handleSaveEdit = (profile: StudentProfile) => {
    if (editingName.trim()) {
      onRenameStudent(profile.id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5">
      {/* Tutor / Student Segmented Control (hidden Mode Prof for invited remote students) */}
      {isInvitedStudent ? (
        <div className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white border border-slate-900 whitespace-nowrap shrink-0">
          Mode Élève
        </div>
      ) : (
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 border border-slate-300 rounded-lg">
          <button
            type="button"
            onClick={() => onSwitchRole('tutor')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              role === 'tutor'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mode Prof
          </button>

          <button
            type="button"
            onClick={() => onSwitchRole('student')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              role === 'student'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mode Élève
          </button>
        </div>
      )}

      {/* Profile Management Dropdown is strictly Tutor-only */}
      {role === 'tutor' ? (
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          title="Changer d'élève ou ajouter un autre élève"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            isOpen
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
          <span className="max-w-[110px] truncate">{activeStudent.name}</span>
          {studentProfiles.length > 1 && (
            <span
              className={`px-1 py-0.2 rounded text-[10px] font-bold tabular-nums ${
                isOpen
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              {studentProfiles.length}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 whitespace-nowrap shrink-0">
          <Users className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
          <span className="max-w-[110px] truncate">{activeStudent.name}</span>
        </div>
      )}

      {role === 'tutor' && isOpen && (
        <div
          role="dialog"
          aria-label="Gestion des profils élèves"
          className="absolute left-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] manga-panel p-4 space-y-3.5 bg-white"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Élèves ({studentProfiles.length})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chaque élève garde son carnet, ses étoiles et sa progression.
              </p>
            </div>
          </div>

          {/* Saved Students List */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
            {studentProfiles.map((profile) => {
              const isSelected = profile.id === activeStudent.id;
              const isEditing = editingId === profile.id;

              return (
                <div
                  key={profile.id}
                  className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-rose-50/80 border-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveEdit(profile);
                      }}
                      className="flex items-center gap-1.5 flex-1 min-w-0"
                    >
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        maxLength={32}
                        autoFocus
                        className="flex-1 min-w-0 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        type="submit"
                        aria-label="Valider le prénom"
                        className="p-1 rounded bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectStudent(profile.id);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                      >
                        <span
                          className={`w-6 h-6 rounded-md border border-slate-900 flex items-center justify-center text-[11px] font-bold shrink-0 ${
                            isSelected
                              ? 'bg-rose-600 text-white'
                              : 'bg-white text-slate-800'
                          }`}
                        >
                          {profile.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {profile.name}
                            </span>
                            <span className="px-1 py-0.2 rounded border border-slate-300 bg-white text-[10px] font-bold text-slate-700 shrink-0">
                              {profile.level}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-semibold text-rose-700 block">
                              Élève actif
                            </span>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(profile)}
                          aria-label={`Renommer ${profile.name}`}
                          title="Renommer"
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {studentProfiles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveStudent(profile.id)}
                            aria-label={`Supprimer ${profile.name}`}
                            title="Supprimer ce profil"
                            className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-white cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Another Student Form */}
          <form
            onSubmit={handleAddSubmit}
            className="pt-3 border-t border-slate-200 space-y-2"
          >
            <label
              htmlFor="new-student-name"
              className="text-[11px] font-bold text-slate-700 block"
            >
              Ajouter un autre élève
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="new-student-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={32}
                placeholder={`Prénom (ex : Élève ${studentProfiles.length + 1})`}
                className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 shrink-0">
                {(['A1', 'A2'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setNewLevel(lvl)}
                    className={`px-1.5 py-1 text-[10px] font-bold rounded cursor-pointer ${
                      newLevel === lvl
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Créer & activer
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenInviteModal();
                }}
                title="Inviter un 2e élève dans la salle visio"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-semibold hover:bg-emerald-100 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                Binôme visio
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
