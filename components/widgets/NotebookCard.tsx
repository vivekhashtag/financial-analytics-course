import { assetHref, colabHref, findNotebook, getDataset, publicFileExists } from '@/lib/content';
import type { ModuleNotebook } from '@/lib/types';
import { NotebookCardView, type NotebookCardData } from './NotebookCardView';
import { MissingWidget } from './MissingWidget';

interface NotebookCardProps {
  /** notebook id from module.json — MDX references notebooks by id alone */
  id?: string;
  moduleId?: string;
  notebook?: ModuleNotebook;
}

/**
 * Resolves a notebook from the content package and hands the rendering to a
 * client view that owns the download / attempt state.
 */
export function NotebookCard({ id, moduleId, notebook }: NotebookCardProps) {
  let resolved = notebook ? { moduleId: moduleId ?? '', notebook } : null;
  if (!resolved && id) resolved = findNotebook(id);

  if (!resolved) {
    return (
      <MissingWidget
        name="NotebookCard"
        detail={`No notebook with id "${id ?? '(none given)'}" in any module.json`}
      />
    );
  }

  const nb = resolved.notebook;

  const data: NotebookCardData = {
    id: nb.id,
    moduleId: resolved.moduleId,
    title: nb.title,
    downloadHref: assetHref(nb.file),
    downloadAvailable: publicFileExists(assetHref(nb.file)),
    colabHref: nb.colabEnabled === false ? null : colabHref(nb.file),
    packages: nb.packages ?? [],
    datasets: (nb.datasets ?? []).map((dsId) => {
      const ds = getDataset(dsId);
      return { id: dsId, title: ds?.title ?? dsId, exists: !!ds };
    }),
    solution: nb.solutionFile
      ? {
          href: assetHref(nb.solutionFile),
          colabHref: colabHref(nb.solutionFile),
          available: publicFileExists(assetHref(nb.solutionFile)),
        }
      : null,
  };

  return <NotebookCardView data={data} />;
}
