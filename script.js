class RitalinSimulator {
    constructor() {
        this.doses = [];
        this.initializeEventListeners();
        this.updateChart();
    }

    initializeEventListeners() {
        const form = document.getElementById('dose-form');
        const clearAllBtn = document.getElementById('clear-all');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addDose();
        });

        clearAllBtn.addEventListener('click', () => {
            this.clearAllDoses();
        });
    }

    addDose() {
        const timeInput = document.getElementById('time-input');
        const doseInput = document.getElementById('dose-input');
        const typeInput = document.getElementById('type-input');

        const dose = {
            id: Date.now(),
            time: timeInput.value,
            dosage: parseInt(doseInput.value),
            type: typeInput.value
        };

        this.doses.push(dose);
        this.doses.sort((a, b) => a.time.localeCompare(b.time));
        
        this.updateDosesList();
        this.updateChart();
        this.updateSummary();
        
        // Reset form
        doseInput.value = 20;
    }

    removeDose(id) {
        this.doses = this.doses.filter(dose => dose.id !== id);
        this.updateDosesList();
        this.updateChart();
        this.updateSummary();
    }

    clearAllDoses() {
        this.doses = [];
        this.updateDosesList();
        this.updateChart();
        this.updateSummary();
    }

    updateDosesList() {
        const dosesList = document.getElementById('doses-list');
        const clearAllBtn = document.getElementById('clear-all');

        if (this.doses.length === 0) {
            dosesList.innerHTML = '<p class="empty-state">No doses added yet</p>';
            clearAllBtn.style.display = 'none';
            return;
        }

        clearAllBtn.style.display = 'block';
        
        dosesList.innerHTML = this.doses.map(dose => `
            <div class="dose-item">
                <div class="dose-info">
                    <div class="dose-time">${dose.time}</div>
                    <div class="dose-details">
                        ${dose.dosage}mg 
                        <span class="dose-type ${dose.type.toLowerCase()}">${dose.type}</span>
                    </div>
                </div>
                <button class="btn-remove" onclick="simulator.removeDose(${dose.id})">
                    Remove
                </button>
            </div>
        `).join('');
    }

    timeToDecimal(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours + minutes / 60;
    }

    simulateIR(dose, t0, hours) {
        return hours.map(h => {
            const t = h - t0;
            if (t < 0) return 0;
            // IR: peaks around 1h, exponential decay
            return dose * (t / 0.5) * Math.exp(-t / 1.2);
        });
    }

    simulateER(dose, t0, hours) {
        return hours.map(h => {
            const t = h - t0;
            if (t < 0) return 0;
            // ER: 50% immediate, 50% extended over 8 hours
            const immediate = (dose * 0.5) * (t / 0.5) * Math.exp(-t / 1.2);
            const extended = (dose * 0.5) * Math.pow(t / 3, 2) * Math.exp(-t / 3.5);
            return immediate + extended;
        });
    }

    calculateConcentrations() {
        // Generate time points from 6:00 to 22:00 in 15-minute intervals
        const hours = [];
        for (let h = 6; h <= 22; h += 0.25) {
            hours.push(h);
        }

        let totalConcentration = new Array(hours.length).fill(0);

        this.doses.forEach(dose => {
            const t0 = this.timeToDecimal(dose.time);
            let concentration;
            
            if (dose.type === 'IR') {
                concentration = this.simulateIR(dose.dosage, t0, hours);
            } else {
                concentration = this.simulateER(dose.dosage, t0, hours);
            }

            totalConcentration = totalConcentration.map((total, i) => total + concentration[i]);
        });

        return { hours, concentration: totalConcentration };
    }

    updateChart() {
        const { hours, concentration } = this.calculateConcentrations();

        // Convert decimal hours to time labels
        const timeLabels = hours.map(h => {
            const hour = Math.floor(h);
            const minute = Math.round((h - hour) * 60);
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        });

        const trace = {
            x: timeLabels,
            y: concentration,
            type: 'scatter',
            mode: 'lines',
            name: 'Concentration',
            line: {
                color: '#667eea',
                width: 3,
                shape: 'spline'
            },
            fill: 'tonexty',
            fillcolor: 'rgba(102, 126, 234, 0.1)'
        };

        const layout = {
            title: {
                text: 'Ritalin Concentration Over Time',
                font: { size: 16, color: '#2d3748' }
            },
            xaxis: {
                title: 'Time of Day',
                tickangle: -45,
                dtick: 4, // Show every hour
                gridcolor: '#e2e8f0'
            },
            yaxis: {
                title: 'Concentration (mg)',
                gridcolor: '#e2e8f0'
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'inherit', color: '#4a5568' },
            margin: { t: 50, r: 30, b: 80, l: 60 },
            hovermode: 'x unified'
        };

        const config = {
            responsive: true,
            displayModeBar: false
        };

        Plotly.newPlot('concentration-chart', [trace], layout, config);
    }

    updateSummary() {
        if (this.doses.length === 0) {
            document.getElementById('peak-concentration').textContent = '--';
            document.getElementById('peak-time').textContent = '--';
            document.getElementById('evening-concentration').textContent = '--';
            return;
        }

        const { hours, concentration } = this.calculateConcentrations();
        
        // Find peak
        const maxConcentration = Math.max(...concentration);
        const maxIndex = concentration.indexOf(maxConcentration);
        const peakHour = hours[maxIndex];
        
        // Convert peak time to readable format
        const peakHourInt = Math.floor(peakHour);
        const peakMinute = Math.round((peakHour - peakHourInt) * 60);
        const peakTimeStr = `${peakHourInt.toString().padStart(2, '0')}:${peakMinute.toString().padStart(2, '0')}`;
        
        // Find concentration at 20:00
        const eveningIndex = hours.findIndex(h => Math.abs(h - 20) < 0.01);
        const eveningConcentration = eveningIndex >= 0 ? concentration[eveningIndex] : 0;

        document.getElementById('peak-concentration').textContent = `${maxConcentration.toFixed(1)} mg`;
        document.getElementById('peak-time').textContent = peakTimeStr;
        document.getElementById('evening-concentration').textContent = `${eveningConcentration.toFixed(1)} mg`;
    }
}

// Initialize the simulator when the page loads
const simulator = new RitalinSimulator();