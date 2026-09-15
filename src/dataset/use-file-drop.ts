import { useCallback, useRef, useState, type DragEvent } from 'react'

/**
 * Drag-and-drop mechanics, kept apart from what they look like.
 *
 * The whole working area is the drop target, not just the panel in the middle
 * of it, so this is bound once near the root and the surfaces underneath render
 * the state it reports.
 */
export type FileDrop = {
  isDraggingOver: boolean
  dropHandlers: {
    onDragEnter: (event: DragEvent) => void
    onDragOver: (event: DragEvent) => void
    onDragLeave: (event: DragEvent) => void
    onDrop: (event: DragEvent) => void
  }
}

/** A drag of selected text or a link is not an offer of a file. */
function carriesFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
}

export function useFileDrop(onFiles: (files: readonly File[]) => void): FileDrop {
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  /**
   * `dragenter` and `dragleave` fire again for every child element the pointer
   * crosses, so a boolean flickers off as soon as the drag moves over the text
   * inside the surface. Counting entries against leaves is what makes the
   * highlight hold steady.
   */
  const depth = useRef(0)

  const onDragEnter = useCallback((event: DragEvent): void => {
    if (!carriesFiles(event)) {
      return
    }

    event.preventDefault()
    depth.current += 1
    setIsDraggingOver(true)
  }, [])

  const onDragOver = useCallback((event: DragEvent): void => {
    if (!carriesFiles(event)) {
      return
    }

    // Without this the browser handles the drop itself, which means navigating
    // away from Puddle to display the file.
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDragLeave = useCallback((event: DragEvent): void => {
    if (!carriesFiles(event)) {
      return
    }

    event.preventDefault()
    depth.current = Math.max(0, depth.current - 1)

    if (depth.current === 0) {
      setIsDraggingOver(false)
    }
  }, [])

  const onDrop = useCallback(
    (event: DragEvent): void => {
      if (!carriesFiles(event)) {
        return
      }

      event.preventDefault()
      depth.current = 0
      setIsDraggingOver(false)
      onFiles(Array.from(event.dataTransfer.files))
    },
    [onFiles],
  )

  return { isDraggingOver, dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop } }
}
