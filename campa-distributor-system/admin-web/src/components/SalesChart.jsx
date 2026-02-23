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
    return label; // Return as is for W or Y
};

export const SalesLineChart = ({ data, title = 'Sales Trend' }) => {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { font: { weight: 'bold' } }
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(241, 245, 249, 1)' },
                ticks: {
                    callback: (value) => `₹${value.toLocaleString()}`
                }
            },
            x: {
                grid: { display: false }
            }
        }
    };

    const chartData = {
        labels: data.map(item => formatLabel(item.date)),
        datasets: [
            {
                label: 'Total Sales',
                data: data.map(item => item.totalSales),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    return <Line options={options} data={chartData} />;
};

export const CollectionLineChart = ({ data }) => {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { font: { weight: 'bold' } }
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(241, 245, 249, 1)' },
                ticks: {
                    callback: (value) => `₹${value.toLocaleString()}`
                }
            },
            x: {
                grid: { display: false }
            }
        }
    };

    const chartData = {
        labels: data.map(item => formatLabel(item.date)),
        datasets: [
            {
                label: 'Total Collections',
                data: data.map(item => item.totalCollection),
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#059669',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    return <Line options={options} data={chartData} />;
};

export const ProductBarChart = ({ data }) => {
    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { color: 'rgba(241, 245, 249, 1)' }
            },
            y: {
                grid: { display: false },
                ticks: {
                    callback: function (value) {
                        const label = this.getLabelForValue(value);
                        if (typeof label === 'string' && label.length > 15) {
                            return label.substr(0, 15) + '...';
                        }
                        return label;
                    }
                }
            }
        }
    };

    const chartData = {
        labels: data.map(item => item.Product?.name || 'Unknown'),
        datasets: [
            {
                label: 'Quantity Sold',
                data: data.map(item => item.totalQuantity),
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderRadius: 8,
                barThickness: 20
            },
        ],
    };

    return <Bar options={options} data={chartData} />;
};
