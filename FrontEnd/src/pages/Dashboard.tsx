
import { useEffect, useState } from 'react';
import { Title } from 'react-admin';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { axiosInstance } from '../dataProvider';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid2 from '@mui/material/Grid'

interface DashboardStats {
    totalBudget: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyBalance: number;
}

const COLORS = ['#00C49F', '#FF8042']; // Green for Income, Orange for Expense

const KPICard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => (
    <Card sx={{ height: '100%', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: 4, boxShadow: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="h4" component="div" fontWeight="bold">
                    ${value.toLocaleString()}
                </Typography>
            </Box>
            <Box sx={{ backgroundColor: `${color}20`, borderRadius: '50%', p: 1.5, display: 'flex' }}>
                {icon}
            </Box>
        </CardContent>
    </Card>
);

export const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axiosInstance.get('/dashboard/stats');
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        fetchStats();
    }, []);

    if (!stats) return null;

    const chartData = [
        { name: 'Income', value: stats.monthlyIncome },
        { name: 'Expense', value: stats.monthlyExpense },
    ];

    return (
        <Box mt={2}>
            <Title title="Financial Overview" />

            <Grid2 container spacing={3} mb={4}>
                <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                    <KPICard
                        title="Monthly Income"
                        value={stats.monthlyIncome}
                        icon={<TrendingUpIcon sx={{ color: '#00C49F', fontSize: 40 }} />}
                        color="#00C49F"
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                    <KPICard
                        title="Monthly Expense"
                        value={stats.monthlyExpense}
                        icon={<TrendingDownIcon sx={{ color: '#FF8042', fontSize: 40 }} />}
                        color="#FF8042"
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                    <KPICard
                        title="Monthly Balance"
                        value={stats.monthlyBalance}
                        icon={<AccountBalanceWalletIcon sx={{ color: '#0088FE', fontSize: 40 }} />}
                        color="#0088FE"
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                    <KPICard
                        title="Annual Budget"
                        value={stats.totalBudget}
                        icon={<AttachMoneyIcon sx={{ color: '#FFBB28', fontSize: 40 }} />}
                        color="#FFBB28"
                    />
                </Grid2>
            </Grid2>

            {/* Charts Section */}
            <Grid2 container spacing={3}>
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: 400, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: 4, boxShadow: 3 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Income vs Expense (This Month)</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid2>

                {/* Placeholder for future Budget vs Actual chart */}
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: 400, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: 4, boxShadow: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CardContent>
                            <Typography variant="h6" color="textSecondary">
                                Budget vs Actual Chart (Coming Soon)
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid2>
            </Grid2>
        </Box>
    );
};
