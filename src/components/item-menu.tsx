import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type Props = {
  options: string[];
  onSelect: (index: number) => void;
  className?: string;
};

export default function ItemMenu({ options, onSelect, className }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", className)}
          aria-label="more"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((option, i) => (
          <DropdownMenuItem key={option} onClick={() => onSelect(i)}>
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
