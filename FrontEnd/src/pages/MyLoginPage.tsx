import { useState } from 'react';
import { useLogin, useNotify, Button } from 'react-admin';
import { useForm, Controller } from 'react-hook-form';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Link } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { AppBackground } from '../layout/AppBackground';

export const MyLoginPage = () => {
    const login = useLogin();
    const notify = useNotify();
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            username: '',
            password: '',
        }
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            await login(data);
        } catch (error) {
            notify('Invalid username or password', { type: 'error' });
            setLoading(false);
        }
    };

    return (
        <AppBackground centered>
            <Paper elevation={6} sx={{
                width: '100%',
                maxWidth: 450,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 4,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
            }}>
                <Stack direction="column" alignItems="center" justifyContent="center" width="100%">
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
                        <LockOutlinedIcon fontSize="large" />
                    </Avatar>
                    <Typography component="h1" variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                        Welcome Back
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Sign in to manage your expenses
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1, width: '100%' }}>
                        <Controller
                            name="username"
                            control={control}
                            rules={{ required: "Username is required" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="username"
                                    label="Username"
                                    autoComplete="username"
                                    autoFocus
                                    error={!!errors.username}
                                    helperText={errors.username?.message}
                                    sx={{ mb: 2 }}
                                />
                            )}
                        />
                        <Controller
                            name="password"
                            control={control}
                            rules={{ required: "Password is required" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="password"
                                    autoComplete="current-password"
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                    sx={{ mb: 3 }}
                                />
                            )}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                mt: 1,
                                mb: 2,
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                borderRadius: 2
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button>

                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                                    Don't have an account? Sign Up
                                </Typography>
                            </Link>
                        </Box>
                    </Box>
                </Stack>
            </Paper>
        </AppBackground>
    );
};
