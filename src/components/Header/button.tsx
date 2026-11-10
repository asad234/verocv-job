import React from "react";

interface MenuButtonProps {
    openMenu: () => void; // Prop to open the menu
}

const MenuButton: React.FC<MenuButtonProps> = ({ openMenu }) => {
    return (
        <button onClick={openMenu}>
            {/* Add your button icon or text here */}
            <span>Toggle Menu</span>
        </button>
    );
};

export default MenuButton;