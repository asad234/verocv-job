"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../Menu/menu.module.scss";
import Link from "../Menu/link";
import { ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

// Type definitions
interface ResolvedSubItem {
    label: string;
    url: string;
}

interface RawSubItem {
    relationTo: string;
    value: number;
}

interface MenuItem {
    id: number;
    label: string;
    url: string;
    subItems: (RawSubItem | ResolvedSubItem)[];
}

interface MenuProps {
    menuSlug: string;
    isOpen: boolean;
    closeMenu: () => void;
}

const SubMenu = memo(({ subItems, isOpen, closeMenu }: {
    subItems: ResolvedSubItem[];
    isOpen: boolean;
    closeMenu: () => void;
}) => {
    if (!isOpen) return null;
    return (
        <motion.div
            className={styles.subMenu}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            {subItems.map((subItem, subIndex) => (
                <div key={subIndex} className={styles.subMenuItem}>
                    <Link data={subItem} index={subIndex} closeMenu={closeMenu} />
                </div>
            ))}
        </motion.div>
    );
});

SubMenu.displayName = 'SubMenu';

const MenuItemComponent = memo(({
    menuItem,
    index,
    isSubmenuOpen,
    toggleSubmenu,
    closeMenu
}: {
    menuItem: MenuItem & { subItems: ResolvedSubItem[] };
    index: number;
    isSubmenuOpen: boolean;
    toggleSubmenu: (index: number) => void;
    closeMenu: () => void;
}) => {
    const hasSubItems = menuItem.subItems && menuItem.subItems.length > 0;

    return (
        <div className={styles.menuItem}>
            <div
                className={styles.menuItemHeader}
                onClick={() => hasSubItems && toggleSubmenu(index)}
            >
                <Link
                    data={menuItem}
                    index={index}
                    closeMenu={hasSubItems ? () => { } : closeMenu}
                />
                {hasSubItems && (
                    <ChevronDown
                        className={`${styles.arrow} ${isSubmenuOpen ? styles.open : ""}`}
                    />
                )}
            </div>
            {hasSubItems && (
                <AnimatePresence>
                    <SubMenu
                        subItems={menuItem.subItems}
                        isOpen={isSubmenuOpen}
                        closeMenu={closeMenu}
                    />
                </AnimatePresence>
            )}
        </div>
    );
});

MenuItemComponent.displayName = 'MenuItemComponent';

function Menu({ menuSlug, isOpen, closeMenu }: MenuProps) {
    const [openSubmenus, setOpenSubmenus] = useState<{ [key: number]: boolean }>({});
    const { data: session } = useSession();

    const fetchMenuData = useCallback(async () => {
        const res = await fetch(`/api/menus?slug=${menuSlug}`);
        const data = await res.json();

        const menu = data.docs?.[0]; // Get the first doc safely

        if (!menu || !Array.isArray(menu.items)) {
            throw new Error("Invalid menu structure: items missing or not an array");
        }

        const resolvedItems = menu.items.map((item: MenuItem) => {
            const resolvedSubItems = item.subItems.map((sub: any) => {
                if (sub?.value?.label && sub?.value?.url) {
                    return {
                        label: sub.value.label,
                        url: sub.value.url,
                    };
                }
                return null;
            }).filter(Boolean) as ResolvedSubItem[];

            return {
                ...item,
                subItems: resolvedSubItems,
            };
        });

        return resolvedItems;
    }, [menuSlug]);


    const { data: menu, isLoading, isError, error } = useQuery<MenuItem[], Error>({
        queryKey: ['menu', menuSlug],
        queryFn: fetchMenuData,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        enabled: isOpen,
    });

    const toggleSubmenu = useCallback((index: number) => {
        setOpenSubmenus((prev) => ({ ...prev, [index]: !prev[index] }));
    }, []);

    useEffect(() => {
        setOpenSubmenus({});
    }, [menuSlug]);

    const renderMenuContent = () => {
        if (isLoading) return <p>Loading menu...</p>;
        if (isError) return <p>Error loading menu: {error?.message}</p>;

        return (
            <>
                <div className={styles.menuItem}>
                    {session ? (
                        <Link data={{ label: "Dashboard", url: "/dashboard" }} index={0} closeMenu={closeMenu} />
                    ) : (
                        <Link data={{ label: "Login", url: "/login" }} index={0} closeMenu={closeMenu} />
                    )}
                </div>

                {menu && menu.length > 0 ? (
                    menu.map((menuItem, index) => (
                        <MenuItemComponent
                            key={`${menuItem.label}-${index}`}
                            menuItem={menuItem as MenuItem & { subItems: ResolvedSubItem[] }}
                            index={index}
                            isSubmenuOpen={!!openSubmenus[index]}
                            toggleSubmenu={toggleSubmenu}
                            closeMenu={closeMenu}
                        />
                    ))
                ) : (
                    <p>No menu found</p>
                )}
            </>
        );
    };

    return (
        <>
            <motion.div
                className={styles.menu}
                initial={{ x: "100%" }}
                animate={{ x: isOpen ? "0%" : "100%" }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <button className={styles.closeButton} onClick={closeMenu} aria-label="Close menu">
                    &times;
                </button>
                <div className={styles.body}>{renderMenuContent()}</div>
            </motion.div>

            {isOpen && <div className={styles.overlay} onClick={closeMenu} />}
        </>
    );
}

export default memo(Menu);
