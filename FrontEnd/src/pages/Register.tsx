import { useState } from 'react';
import { useNotify, useRedirect } from 'react-admin';
import { Button, Card, CardActions, CircularProgress, TextField } from '@mui/material';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { AppBackground } from '../layout/AppBackground';
import { getErrorMessage } from '../utils/errorHandler';

const apiUrl = import.meta.env.VITE_REACT_ADMIN_PROVIDER_API;

export const Register = () => {
    const [loading, setLoading] = useState(false);
    const notify = useNotify();
    const redirect = useRedirect();

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        password: '',
        phoneNumber: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${apiUrl}/authentication/register`, {
                ...formData,
                // roles: ["User"]
            });
            notify('Registration successful! Please login.');
            redirect('/login');
        } catch (error: unknown) {
            console.error(error);
            const message = getErrorMessage(error);
            notify(message, { type: 'error', multiLine: true }); // multiLine allows newlines
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppBackground centered>
            <Card sx={{ minWidth: 350, maxWidth: 400, padding: 2 }}>
                <Box sx={{ margin: '1em', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="h5">Sign Up</Typography>
                </Box>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ padding: '0 1em 1em 1em' }}>
                        <TextField
                            name="firstName"
                            label="First Name"
                            value={formData.firstName}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                        />
                        <TextField
                            name="lastName"
                            label="Last Name"
                            value={formData.lastName}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                        />
                        <TextField
                            name="userName"
                            label="Username"
                            value={formData.userName}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                        />
                        <TextField
                            name="email"
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                        />
                        <TextField
                            name="password"
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                        />
                        <TextField
                            name="phoneNumber"
                            label="Phone Number"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />
                    </Box>
                    <CardActions sx={{ padding: '0 1em 1em 1em', flexDirection: 'column', gap: 1 }}>
                        <Button
                            variant="contained"
                            type="submit"
                            color="primary"
                            disabled={loading}
                            fullWidth
                        >
                            {loading && <CircularProgress size={25} thickness={2} />}
                            {loading ? ' Registering...' : 'Sign Up'}
                        </Button>
                        <Button
                            component={Link}
                            to="/login"
                            color="inherit"
                            fullWidth
                        >
                            Already have an account? Login
                        </Button>
                    </CardActions>
                </form>
            </Card>
        </AppBackground>
    );
};
