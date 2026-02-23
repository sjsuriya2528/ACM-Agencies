import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const formatLabel = (label) => {
    // If it's a date like 2023-10-27
    if (label.includes('-') && !label.includes('W')) {
        const parts = label.split('-');
        if (parts.length === 3) { // YYYY-MM-DD
            return new Date(label).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        }
        if (parts.length === 2) { // YYYY-MM
            return new Date(label + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        }
    }
    return label;
};

const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 20,
                font: { size: 10, weight: 'bold', family: "'Outfit', sans-serif" },
                color: '#64748b'
            }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold', family: "'Outfit', sans-serif" },
            bodyFont: { size: 13, family: "'Outfit', sans-serif" },
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            displayColors: false,
            cornerRadius: 12,
            callbacks: {
                label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0
                        }).format(context.parsed.y);
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: 'rgba(241, 245, 249, 0.5)', drawBorder: false },
            ticks: {
                font: { size: 10, weight: '500' },
                color: '#94a3b8',
                callback: (value) => value >= 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`
            }
        },
        x: {
            grid: { display: false },
            ticks: {
                font: { size: 10, weight: '500' },
                color: '#94a3b8'
            }
        }
    }
};

export const SalesLineChart = ({ data }) => {
    const chartData = {
        labels: data.map(item => formatLabel(item.date)),
        datasets: [
            {
                label: 'Total Sales',
                data: data.map(item => item.totalSales),
                borderColor: '#2563eb',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
                    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
                    return gradient;
                },
                fill: true,
                tension: 0.45,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#fff',
                pointBorderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderWidth: 3,
            },
        ],
    };

    return <Line options={commonOptions} data={chartData} />;
};

export const CollectionLineChart = ({ data }) => {
    const chartData = {
        labels: data.map(item => formatLabel(item.date)),
        datasets: [
            {
                label: 'Total Collection',
                data: data.map(item => item.totalCollection),
                borderColor: '#059669',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(5, 150, 105, 0.2)');
                    gradient.addColorStop(1, 'rgba(5, 150, 105, 0)');
                    return gradient;
                },
                fill: true,
                tension: 0.45,
                pointBackgroundColor: '#059669',
                pointBorderColor: '#fff',
                pointBorderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderWidth: 3,
            },
        ],
    };

    return <Line options={commonOptions} data={chartData} />;
};

export const ProductBarChart = ({ data }) => {
    const options = {
        ...commonOptions,
        indexAxis: 'y',
        plugins: {
            ...commonOptions.plugins,
            legend: { display: false },
            tooltip: {
                ...commonOptions.plugins.tooltip,
                callbacks: {
                    label: function (context) {
                        return `Total Quantity: ${context.parsed.x}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(241, 245, 249, 0.5)' },
                ticks: { font: { size: 10 }, color: '#94a3b8' }
            },
            y: {
                grid: { display: false },
                ticks: {
                    font: { size: 10, weight: 'bold' },
                    color: '#475569',
                    callback: function (value) {
                        const label = this.getLabelForValue(value);
                        return label.length > 12 ? label.substr(0, 12) + '...' : label;
                    }
                }
            }
        }
    };

    const chartData = {
        labels: data.map(item => item.Product?.name || 'Unknown'),
        datasets: [
            {
                label: 'Total Quantity',
                data: data.map(item => item.totalQuantity),
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                hoverBackgroundColor: '#6366f1',
                borderRadius: 10,
                barThickness: 15
            },
        ],
    };

    return <Bar options={options} data={chartData} />;
};
