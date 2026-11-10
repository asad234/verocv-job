import styles from './menu.module.scss';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import gsap from 'gsap';
import Link from 'next/link';

interface LinkProps {
    data: {
        label: string;
        url: string;
    };
    index: number;
    closeMenu: () => void; // Pass closeMenu function as a prop
}

const LinkComponent = ({ data: { label, url }, index, closeMenu }: LinkProps) => {
    const outer = useRef<HTMLDivElement>(null);
    const inner = useRef<HTMLDivElement>(null);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!outer.current || !inner.current) return;

        const bounds = e.currentTarget.getBoundingClientRect();
        const isTopHalf = e.clientY < bounds.top + bounds.height / 2;

        gsap.set(outer.current, { top: isTopHalf ? "-100%" : "100%" });
        gsap.set(inner.current, { top: isTopHalf ? "100%" : "-100%" });

        gsap.to([outer.current, inner.current], { top: "0%", duration: 0.3 });
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!outer.current || !inner.current) return;

        const bounds = e.currentTarget.getBoundingClientRect();
        const isTopHalf = e.clientY < bounds.top + bounds.height / 2;

        gsap.to(outer.current, { top: isTopHalf ? "-100%" : "100%", duration: 0.3 });
        gsap.to(inner.current, { top: isTopHalf ? "100%" : "-100%", duration: 0.3 });
    };

    const handleClick = () => {
        closeMenu(); // Close the menu when the link is clicked
    };

    return (
        <motion.div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={styles.el}
            whileHover={{ scale: 1.05 }} // Framer Motion hover effect
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Link href={url} passHref>
                    <a onClick={handleClick}>{label}</a> {/* Trigger closeMenu on click */}
                </Link>
            </motion.div>
        </motion.div>
    );
};

export default LinkComponent;
