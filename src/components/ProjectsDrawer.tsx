import React from 'react';
import { SavedProject, LocationPoint } from '../types/route';
import { BANGLADESH_LOCATIONS } from '../data/bangladeshLocations';
import { X, Play, Download, Trash2, Calendar, Navigation, Clock } from 'lucide-react';

interface ProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProject[];
  onLoadProject: (proj: SavedProject) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectsDrawer: React.FC<ProjectsDrawerProps> = ({
  isOpen,
  onClose,
  projects,
  onLoadProject,
  onDeleteProject
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              My Saved Journeys
            </h3>
            <p className="text-xs text-slate-500">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} saved on device
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {projects.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Navigation className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-700">No journeys saved yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Generate an animated video to automatically save it here.
              </p>
            </div>
          ) : (
            projects.map(proj => (
              <div
                key={proj.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {proj.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">
                        {proj.startName}
                      </span>
                      <span>➔</span>
                      <span className="font-medium text-slate-700">
                        {proj.destName}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteProject(proj.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="font-mono">{proj.distanceKm} km</span>
                  <span>·</span>
                  <span>{proj.duration}s Reel</span>
                  <span>·</span>
                  <span className="capitalize">{proj.vehicle}</span>
                  <span>·</span>
                  <span>{proj.date}</span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <button
                    onClick={() => {
                      onLoadProject(proj);
                      onClose();
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Open in Map</span>
                  </button>

                  {proj.videoUrl && (
                    <a
                      href={proj.videoUrl}
                      download={`RouteReel_${proj.startName}_to_${proj.destName}.webm`}
                      className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-white text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
