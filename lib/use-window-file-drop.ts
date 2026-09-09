import { useEffect, useRef, useState } from 'react';

function isFileDrag(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

/** True while a file is being dragged over the window. Prevents the browser from opening the file. */
export function useWindowFileDrop(
  enabled: boolean,
  onFile: (file: File) => void,
) {
  const [dragging, setDragging] = useState(false);
  const countRef = useRef(0);
  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;

  useEffect(() => {
    if (!enabled) {
      countRef.current = 0;
      setDragging(false);
      return;
    }

    function onEnter(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      countRef.current += 1;
      setDragging(true);
    }

    function onOver(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }

    function onLeave(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      countRef.current -= 1;
      if (countRef.current <= 0) {
        countRef.current = 0;
        setDragging(false);
      }
    }

    function onDrop(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      countRef.current = 0;
      setDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) onFileRef.current(file);
    }

    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [enabled]);

  return dragging;
}
