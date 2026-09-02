import type { BandWorkspace } from "@shared/bandWorkspace";

interface BandWorkspaceSwitcherProps {
  workspaces: BandWorkspace[];
  activeBandId: number;
  onChange: (bandId: number) => void;
  disabled?: boolean;
}

export function BandWorkspaceSwitcher({
  workspaces,
  activeBandId,
  onChange,
  disabled = false,
}: BandWorkspaceSwitcherProps) {
  if (workspaces.length <= 1) return null;

  return (
    <label className="flex min-w-0 items-center gap-2 rounded-xl border border-amber-200 bg-white/80 px-3 py-2 text-sm text-gray-700 shadow-sm">
      <span className="shrink-0 font-medium">目前樂隊</span>
      <select
        aria-label="切換樂隊工作區"
        className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
        value={activeBandId}
        disabled={disabled}
        onChange={event => onChange(Number(event.target.value))}
      >
        {workspaces.map(workspace => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
    </label>
  );
}
