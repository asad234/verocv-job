"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MenuButton from "./Burger";
import Menu from "./Menu";

export default function Header() {
    const [menuIsOpen, setMenuIsOpen] = useState(false);

    return (
        <div>
            <AnimatePresence mode="wait">
                {!menuIsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <MenuButton openMenu={() => setMenuIsOpen(true)} />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {menuIsOpen && (
                    <Menu
                        menuSlug="main-menu"
                        isOpen={menuIsOpen}
                        closeMenu={() => setMenuIsOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}