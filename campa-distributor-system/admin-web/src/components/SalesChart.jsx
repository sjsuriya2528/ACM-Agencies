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

export const SalesLineChart = ({ data }) => {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Sales Trend (Last 7 Days)',
            },
        },
    };

    const chartData = {
        labels: data.map(item => item.date),
        datasets: [
            {
                label: 'Total Sales (₹)',
                data: data.map(item => item.totalSales),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    };

    return <Line options={options} data={chartData} />;
};

export const ProductBarChart = ({ data }) => {
    const options = {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Top 5 Products by Sales',
            },
        },
        scales: {
            x: {
                beginAtZero: true,
            },
            y: {
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
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    return <Bar options={options} data={chartData} />;
};
