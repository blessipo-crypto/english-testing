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
        <div className="px-2.5 py-1 text-xs font-bold tracking-wide rounded-xl sb-seg-active-danger border whitespace-nowrap shrink-0">
          Mode Élève
        </div>
      ) : (
        <div className="flex items-center gap-1 p-0.5 sb-seg-track border rounded-xl">
          <button
            type="button"
            onClick={() => onSwitchRole('tutor')}
            className={`px-2.5 py-1 text-xs font-bold tracking-wide rounded-lg transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
              role === 'tutor' ? 'sb-seg-active' : 'sb-seg-idle'
            }`}
          >
            Mode Prof
          </button>

          <button
            type="button"
            onClick={() => onSwitchRole('student')}
            className={`px-2.5 py-1 text-xs font-bold tracking-wide rounded-lg transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
              role === 'student' ? 'sb-seg-active-danger' : 'sb-seg-idle'
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
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold tracking-wide transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
            isOpen ? 'sb-chip-active' : 'sb-chip-idle'
          }`}
        >
          <Users className="w-3.5 h-3.5 sb-text-accent shrink-0" aria-hidden="true" />
          <span className="max-w-[110px] truncate">{activeStudent.name}</span>
          {studentProfiles.length > 1 && (
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold tabular-nums border ${
                isOpen ? 'sb-seg-active' : 'sb-reward-pill'
              }`}
            >
              {studentProfiles.length}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 sb-text-muted transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border sb-surface-soft text-xs font-bold tracking-wide sb-text-primary whitespace-nowrap shrink-0">
          <Users className="w-3.5 h-3.5 sb-text-accent shrink-0" aria-hidden="true" />
          <span className="max-w-[110px] truncate">{activeStudent.name}</span>
        </div>
      )}

      {role === 'tutor' && isOpen && (
        <div
          role="dialog"
          aria-label="Gestion des profils élèves"
          className="absolute left-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] manga-panel p-4 space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2 border-b sb-divider pb-2.5">
            <div>
              <h3 className="text-xs font-bold sb-text-primary uppercase tracking-wide">
                Élèves ({studentProfiles.length})
              </h3>
              <p className="text-[11px] sb-text-muted mt-0.5">
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
                  className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-colors duration-300 ${
                    isSelected ? 'sb-chip-active' : 'sb-surface-soft'
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
                        className="flex-1 min-w-0 rounded-lg border sb-input px-2 py-1 text-xs font-medium"
                      />
                      <button
                        type="submit"
                        aria-label="Valider le prénom"
                        className="p-1 rounded-lg sb-seg-active cursor-pointer shrink-0"
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
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[11px] font-bold shrink-0 ${
                            isSelected ? 'sb-seg-active-danger' : 'sb-chip-idle sb-text-accent'
                          }`}
                        >
                          {profile.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold sb-text-primary truncate">
                              {profile.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded border sb-reward-pill text-[10px] font-bold shrink-0">
                              {profile.level}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-bold sb-text-accent block">
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
                          className="p-1 rounded-lg sb-text-muted hover:sb-text-primary cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {studentProfiles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveStudent(profile.id)}
                            aria-label={`Supprimer ${profile.name}`}
                            title="Supprimer ce profil"
                            className="p-1 rounded-lg sb-text-muted hover:text-red-500 cursor-pointer"
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
            className="pt-3 border-t sb-divider space-y-2"
          >
            <label
              htmlFor="new-student-name"
              className="text-[11px] font-bold tracking-wide sb-text-secondary block"
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
                className="flex-1 min-w-0 rounded-xl border sb-input px-2.5 py-1.5 text-xs"
              />
              <div className="flex items-center rounded-xl border sb-seg-track p-0.5 shrink-0">
                {(['A1', 'A2'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setNewLevel(lvl)}
                    className={`px-1.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                      newLevel === lvl ? 'sb-seg-active-reward' : 'sb-seg-idle'
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
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl manga-btn-primary text-xs font-bold whitespace-nowrap cursor-pointer"
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border sb-status-success text-xs font-bold hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                Binôme visio
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
