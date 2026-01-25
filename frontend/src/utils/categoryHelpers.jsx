import React from 'react';
import {
    Smartphone, Shirt, BookOpen, Home, Sparkles, Dumbbell,
    Watch, Headphones, Monitor, Grid, Gift, Camera, Briefcase,
    Coffee, Music, PenTool, Layout, Box
} from 'lucide-react';

export const getCategoryIcon = (name) => {
    if (!name) return <Grid size={24} />;
    const n = name.toLowerCase();

    // Tech & Electronics
    if (n.includes('phone') || n.includes('mobile')) return <Smartphone size={24} />;
    if (n.includes('computer') || n.includes('laptop') || n.includes('electron')) return <Monitor size={24} />;
    if (n.includes('watch')) return <Watch size={24} />;
    if (n.includes('audio') || n.includes('headphone') || n.includes('speaker')) return <Headphones size={24} />;
    if (n.includes('camera') || n.includes('photo')) return <Camera size={24} />;

    // Fashion & Lifestyle
    if (n.includes('fashion') || n.includes('cloth') || n.includes('shirt') || n.includes('wear')) return <Shirt size={24} />;
    if (n.includes('beauty') || n.includes('makeup') || n.includes('skin')) return <Sparkles size={24} />;
    if (n.includes('bag') || n.includes('luggage')) return <Briefcase size={24} />;

    // Home & Living
    if (n.includes('home') || n.includes('living') || n.includes('furnitu')) return <Home size={24} />;
    if (n.includes('kitchen') || n.includes('cook')) return <Coffee size={24} />;

    // Hobbies & Others
    if (n.includes('book')) return <BookOpen size={24} />;
    if (n.includes('sport') || n.includes('fit') || n.includes('gym')) return <Dumbbell size={24} />;
    if (n.includes('music') || n.includes('instrument')) return <Music size={24} />;
    if (n.includes('art') || n.includes('craft')) return <PenTool size={24} />;
    if (n.includes('gift')) return <Gift size={24} />;
    if (n.includes('toy') || n.includes('game')) return <Layout size={24} />;

    // Default
    return <Box size={24} />;
};
