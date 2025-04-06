import type React from "react"
import { useDrag } from "react-dnd"
import { Button } from "@/components/ui/button"
import { Type, AlignLeft, Hash, Mail, List, CheckSquare, Circle } from "lucide-react"

const elementTypes = [
  { type: "text", icon: Type, label: "Text" },
  { type: "textarea", icon: AlignLeft, label: "Paragraph" },
  { type: "number", icon: Hash, label: "Number" },
  { type: "email", icon: Mail, label: "Email" },
  { type: "select", icon: List, label: "Dropdown" },
  { type: "checkbox", icon: CheckSquare, label: "Checkbox" },
  { type: "radio", icon: Circle, label: "Radio" },
]

export default function AvailableElements() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {elementTypes.map((element) => (
        <DraggableElement key={element.type} {...element} />
      ))}
    </div>
  )
}

function DraggableElement({ type, icon: Icon, label }: { type: string; icon: React.ElementType; label: string }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "formElement",
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <Button
      ref={drag}
      className={`w-full flex items-center justify-start space-x-2 ${isDragging ? "opacity-50" : ""}`}
      variant="outline"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Button>
  )
}

