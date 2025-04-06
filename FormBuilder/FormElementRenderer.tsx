"use client"

import type React from "react"
import { useRef } from "react"
import { useDrag, useDrop } from "react-dnd"
import type { FormElement } from "@/types/formBuilder"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2, Type, AlignLeft, Hash, Mail, List, CheckSquare, Circle } from "lucide-react"

interface FormElementRendererProps {
  element: FormElement
  index: number
  onSelect: () => void
  onMove: (dragIndex: number, hoverIndex: number) => void
  onRemove: () => void
}

const iconMap: { [key: string]: React.ElementType } = {
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  email: Mail,
  select: List,
  checkbox: CheckSquare,
  radio: Circle,
}

export default function FormElementRenderer({ element, index, onSelect, onMove, onRemove }: FormElementRendererProps) {
  const ref = useRef<HTMLDivElement>(null)

  const [{ handlerId }, drop] = useDrop({
    accept: "formElement",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index
      if (dragIndex === hoverIndex) {
        return
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }
      onMove(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: "formElement",
    item: () => {
      return { id: element.id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(drop(ref))

  const opacity = isDragging ? 0 : 1

  const renderElement = () => {
    switch (element.type) {
      case "text":
      case "email":
      case "number":
        return <Input type={element.type} placeholder={`Enter ${element.label}`} />
      case "textarea":
        return <Textarea placeholder={`Enter ${element.label}`} />
      case "select":
        return (
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {element.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "checkbox":
        return <Checkbox />
      case "radio":
        return (
          <RadioGroup>
            {element.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${element.id}-${index}`} />
                <Label htmlFor={`${element.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )
      default:
        return null
    }
  }

  const Icon = iconMap[element.type]

  return (
    <div
      ref={ref}
      style={{ opacity }}
      className="mb-4 p-4 border rounded cursor-move"
      onClick={onSelect}
      data-handler-id={handlerId}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4" />
          <Label>{element.label}</Label>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {renderElement()}
    </div>
  )
}

