import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

type WithId = { id: string };

export function SortableList<T extends WithId>({
  items,
  onReorder,
  renderItem,
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  renderItem: (item: T, dragHandle: ReactNode) => ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onReorder(arrayMove(items, oldIdx, newIdx));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((it) => (
            <Row key={it.id} id={it.id} render={(handle) => renderItem(it, handle)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function Row({ id, render }: { id: string; render: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      className="p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
      {...attributes}
      {...listeners}
      aria-label="Drag handle"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
    >
      {render(handle)}
    </div>
  );
}

export async function persistOrder<T extends WithId>(
  table: string,
  items: T[],
  supabase: { from: (t: string) => { update: (v: { display_order: number }) => { eq: (k: string, v: string) => Promise<unknown> } } },
) {
  await Promise.all(
    items.map((it, idx) =>
      supabase.from(table).update({ display_order: idx + 1 }).eq("id", it.id),
    ),
  );
}
