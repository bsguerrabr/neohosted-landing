// DOM Elements
const initialValueInput = document.getElementById('initialValue');
const monthlyValueInput = document.getElementById('monthlyValue');
const interestRateInput = document.getElementById('interestRate');
const rateTypeSelect = document.getElementById('rateType');
const periodInput = document.getElementById('period');
const periodTypeSelect = document.getElementById('periodType');

const totalInvestedEl = document.getElementById('totalInvested');
const totalInterestEl = document.getElementById('totalInterest');
const finalAmountEl = document.getElementById('finalAmount');

// Chart instance
let chart = null;

// Format number as currency (with $ symbol)
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Format number with thousands separator (no $ symbol, for inputs)
function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

// Parse formatted number (remove commas)
function parseFormattedNumber(str) {
    return parseFloat(str.replace(/,/g, '')) || 0;
}

// Format input field value while typing
function formatInputValue(input) {
    const cursorPos = input.selectionStart;
    const oldValue = input.value;

    // Count digits before cursor in old value
    const digitsBeforeCursor = oldValue.slice(0, cursorPos).replace(/,/g, '').length;

    // Remove non-numeric characters except for the value itself
    const numericOnly = oldValue.replace(/[^0-9]/g, '');

    // Parse and format
    const rawValue = parseInt(numericOnly, 10) || 0;
    const newValue = rawValue > 0 ? formatNumber(rawValue) : '';
    input.value = newValue;

    // Find new cursor position: count digits until we reach the same digit count
    let newCursorPos = 0;
    let digitCount = 0;
    for (let i = 0; i < newValue.length && digitCount < digitsBeforeCursor; i++) {
        newCursorPos = i + 1;
        if (newValue[i] !== ',') {
            digitCount++;
        }
    }

    input.setSelectionRange(newCursorPos, newCursorPos);
}

// Calculate compound interest data
function calculateCompoundInterest() {
    const initialValue = parseFormattedNumber(initialValueInput.value);
    const monthlyValue = parseFormattedNumber(monthlyValueInput.value);
    const interestRate = parseFloat(interestRateInput.value) || 0;
    const period = parseInt(periodInput.value) || 0;
    const rateType = rateTypeSelect.value;
    const periodType = periodTypeSelect.value;

    // Convert to monthly rate
    let monthlyRate;
    if (rateType === 'annual') {
        monthlyRate = Math.pow(1 + interestRate / 100, 1 / 12) - 1;
    } else {
        monthlyRate = interestRate / 100;
    }

    // Convert to total months
    const totalMonths = periodType === 'years' ? period * 12 : period;

    // Calculate data points for each month
    const labels = [];
    const accumulatedData = [];
    const investedData = [];
    const interestData = [];

    let accumulated = initialValue;

    for (let month = 0; month <= totalMonths; month++) {
        const invested = initialValue + (monthlyValue * month);

        if (month === 0) {
            accumulated = initialValue;
        } else {
            accumulated = accumulated * (1 + monthlyRate) + monthlyValue;
        }

        const interest = accumulated - invested;

        labels.push(month);
        accumulatedData.push(accumulated);
        investedData.push(invested);
        interestData.push(interest);
    }

    return {
        labels,
        accumulatedData,
        investedData,
        interestData
    };
}

// Initialize or update chart
function updateChart() {
    const data = calculateCompoundInterest();
    const ctx = document.getElementById('chart').getContext('2d');

    // Update results display
    const lastIndex = data.accumulatedData.length - 1;
    totalInvestedEl.textContent = formatCurrency(data.investedData[lastIndex]);
    totalInterestEl.textContent = formatCurrency(data.interestData[lastIndex]);
    finalAmountEl.textContent = formatCurrency(data.accumulatedData[lastIndex]);

    if (chart) {
        // Update existing chart
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.accumulatedData;
        chart.data.datasets[1].data = data.investedData;
        chart.data.datasets[2].data = data.interestData;
        chart.update();
    } else {
        // Create new chart
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Accumulated Total',
                        data: data.accumulatedData,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'Total Invested',
                        data: data.investedData,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'Total Interest',
                        data: data.interestData,
                        borderColor: '#f39c12',
                        backgroundColor: 'rgba(243, 156, 18, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            color: '#e7e9ea',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            title: function(context) {
                                return 'Month ' + context[0].label;
                            },
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Months',
                            color: '#a0a8b0',
                            font: {
                                size: 14,
                                weight: '500'
                            }
                        },
                        ticks: {
                            color: '#8b949e'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Value ($)',
                            color: '#a0a8b0',
                            font: {
                                size: 14,
                                weight: '500'
                            }
                        },
                        ticks: {
                            color: '#8b949e',
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return '$' + (value / 1000000).toFixed(1) + 'M';
                                } else if (value >= 1000) {
                                    return '$' + (value / 1000).toFixed(0) + 'K';
                                }
                                return '$' + value;
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)'
                        }
                    }
                }
            }
        });
    }
}

// Money input fields (need formatting)
const moneyInputs = [initialValueInput, monthlyValueInput];

// Event listeners for money inputs (format while typing)
moneyInputs.forEach(input => {
    input.addEventListener('input', () => {
        formatInputValue(input);
        updateChart();
    });
});

// Event listeners for other inputs
[interestRateInput, periodInput].forEach(input => {
    input.addEventListener('input', updateChart);
});

rateTypeSelect.addEventListener('change', updateChart);
periodTypeSelect.addEventListener('change', updateChart);

// Initial calculation
updateChart();
