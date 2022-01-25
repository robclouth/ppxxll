import { IconButton, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";

type Props = {
  options: string[];
  onSelect: (index: number) => void;
  sx?: any;
};

export default function ItemMenu({ options, onSelect, sx }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        sx={sx}
        aria-label="more"
        id="long-button"
        aria-controls={open ? "long-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        MenuListProps={{
          "aria-labelledby": "long-button",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        container={document.getElementById("cameraView")}
      >
        {options.map((option, i) => (
          <MenuItem
            key={option}
            onClick={() => {
              onSelect(i);
              handleClose();
            }}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
