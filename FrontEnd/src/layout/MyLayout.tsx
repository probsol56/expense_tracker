import { AppBar, Layout } from 'react-admin';
import type { LayoutProps } from 'react-admin';
import Box from '@mui/material/Box';
import { AppBackground } from './AppBackground';

const MyAppBar = (props: any) => (
    <AppBar
        {...props}
        sx={{
            backgroundColor: 'rgba(25, 118, 210, 0.7)', // Semi-transparent blue
            backdropFilter: 'blur(8px)',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
    />
);

export const MyLayout = (props: LayoutProps) => (
    <AppBackground>
        <Box sx={{
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)',
            minHeight: '100vh',
        }}>
            <Layout
                {...props}
                appBar={MyAppBar}
                sx={{
                    '& .RaLayout-content': {
                        backgroundColor: 'transparent',
                    }
                }}
            />
        </Box>
    </AppBackground>
);
