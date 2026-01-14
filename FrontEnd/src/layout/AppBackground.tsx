import { Box, CssBaseline } from '@mui/material';
import type { ReactNode } from 'react';

interface AppBackgroundProps {
    children: ReactNode;
    centered?: boolean;
}

export const AppBackground = ({ children, centered = false }: AppBackgroundProps) => {
    return (
        <Box component="main" sx={{
            minHeight: '100vh',
            width: '100vw',
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://picsum.photos/1920/1080)',
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) => t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            display: centered ? 'flex' : 'block',
            alignItems: centered ? 'center' : undefined,
            justifyContent: centered ? 'center' : undefined,
        }}>
            <CssBaseline />
            {children}
        </Box>
    );
};
