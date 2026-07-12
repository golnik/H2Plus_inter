// =============================================================================
// Physical constants
// =============================================================================

const epsilon = 8.8541878e-12;
const h_ground_energy = -13.6057;
const bohr_radius = 5.291772e-11;
const electron_charge = 1.60217663e-19;
const hbar_eVfs = 0.6582119569;

// =============================================================================
// Plot configuration
// =============================================================================

const PLOT_FONT_SIZE = 14;

// =============================================================================
// Colors
// =============================================================================

const probColor_nonSpecific = 'black';
const bondingColor = '#1f77b4';
const antibondingColor = '#ff7f0e';
const multiUseColor = 'green';
const protonStandardColor = 'red';
const h2Color = '#9467bd';
const arrowDelta = -0.3;

// =============================================================================
// UI configuration
// =============================================================================

const choices = ['info', 'static', 'e_dynamic', 'n_dynamic', 'en_dynamic'];

const infoBoxes = [
    'energy-info', 'bondProb-info', 'antiBondProb-info', 'eDynamic-info',
    'nDynamicsMain-info', 'nDynamicsPos-info', 'nDynamicsMom-info',
    'fullDynamics-info', 'overlap-info', 'transition-info', 'static-summary',
    'eDynamics-summary', 'nDynamics-summary', 'fullDynamics-summary',
    'radiusSlider-info', 'expansionCoeff-info', 'timeSlider-info',
];

const graphs = [
    'hydrogen-cation-energy-chart', 'hydrogen-cation-bond-probability-chart',
    'hydrogen-cation-antibond-probability-chart', 'hydrogen-cation-electron-dynamics-chart',
    'hydrogen-cation-energy-chart-nuclear', 'hydrogen-cation-nuclear-position-chart',
    'hydrogen-cation-nuclear-momentum-chart', 'fullDynamics-probability-chart',
    'nuclear-overlap-chart', 'transition-probability-chart', 'time-electron-density-chart',
];

// =============================================================================
// DOM references
// =============================================================================

const radiusTextInput = document.getElementById('radius_text');
const radiusSliderInput = document.getElementById('radius');

// =============================================================================
// Application state
// =============================================================================

let screen = 'info';
let iterate_time;
let energy_minimum;

const radius = [];
const bonding_energy_y = [];
const antibonding_energy_y = [];
const h2_energy_y = [];
let bonding_probability_y = [];
let antibonding_probability_y = [];
const probability_x = [];
let fullDynamics_probability_y = [];
const time_axis =[];

let nDynamics_bonding_data;
let nDynamics_antibonding_data;
let nOverlap_Data;
let fullDynamics_data;

// =============================================================================
// Physics
// =============================================================================

function bonding_energy(radius) {
    const R = radius / bohr_radius;
    const exp_R = Math.exp(-R);
    const R_sq_term = (1 / 3) * (R ** 2);
    return ((electron_charge) / (4 * Math.PI * epsilon * radius)) * ((1 + R) * exp_R**2 + (1 - 2 * R_sq_term) * exp_R) / (1 + (1 + R + R_sq_term) * exp_R);
}

function antibonding_energy(radius) {
    const R = radius / bohr_radius;
    const exp_R = Math.exp(-R);
    const R_sq_term = (1 / 3) * (R ** 2);
    return ((electron_charge) / (4 * Math.PI * epsilon * radius)) * ((1 + R) * exp_R**2 - (1 - 2 * R_sq_term) * exp_R) / (1 - (1 + R + R_sq_term) * exp_R);
}

function probability_Curve(radius, distance) {
    const p = radius;
    const waveFunction1 = 0.5 * Math.exp(-2 * Math.abs(distance + p / 2)) * (1 + 2 * Math.abs(distance + p / 2));
    const waveFunction2 = 0.5 * Math.exp(-2 * Math.abs(p / 2 - distance)) * (1 + 2 * Math.abs(p / 2 - distance));
    const overlapIntegral = Math.exp(-p) * (1 + p + (p ** 2) / 3);
    const normalizeBond = 2 + 2 * overlapIntegral;
    const normalizeAnti = 2 - 2 * overlapIntegral;

    let sum = 0;
    for (let i = 0; i < 15; i += 0.05) {
        const A = Math.sqrt(i ** 2 + (Math.abs(distance + p / 2)) ** 2);
        const B = Math.sqrt(i ** 2 + (Math.abs(p / 2 - distance)) ** 2);
        sum += i * Math.exp(-(A + B)) * 0.2;
    }

    return [
        (waveFunction1 + waveFunction2 + sum) / normalizeBond,
        (waveFunction1 + waveFunction2 - sum) / normalizeAnti,
        waveFunction1**2-waveFunction2**2
    ];
}

function eDynamics_probability_Curve(radius, distance, time = 0, c = [Math.sqrt(0.5), Math.sqrt(0.5)]) {
    const R = radius * bohr_radius;
    const E1 = bonding_energy(R);
    const E2 = antibonding_energy(R);
    const distPlus = Math.abs(distance + radius / 2);
    const distMinus = Math.abs(radius / 2 - distance);
    const distPlusSq = distPlus * distPlus;
    const distMinusSq = distMinus * distMinus;

    const waveFunction1 = 0.5 * Math.exp(-2 * distPlus) * (1 + 2 * distPlus);
    const waveFunction2 = 0.5 * Math.exp(-2 * distMinus) * (1 + 2 * distMinus);
    const overlapIntegral = Math.exp(-radius) * (1 + radius + (radius * radius) / 3);
    const normalizeBond = 2 + 2 * overlapIntegral;
    const normalizeAnti = 2 - 2 * overlapIntegral;

    let sum = 0;
    for (let i = 0; i < 15; i += 0.05) {
        const iSq = i * i;
        const A = Math.sqrt(iSq + distPlusSq);
        const B = Math.sqrt(iSq + distMinusSq);
        sum += 4 * i * Math.exp(-(A + B)) * 0.05;
    }

    const c0_sq = c[0] * c[0];
    const c1_sq = c[1] * c[1];
    const pBond = c0_sq * (waveFunction1 + waveFunction2 + sum) / normalizeBond;
    const pAnti = c1_sq * (waveFunction1 + waveFunction2 - sum) / normalizeAnti;
    const pCross = 2 * c[0] * c[1] * (waveFunction1 - waveFunction2) / (normalizeAnti * normalizeBond) * Math.cos((time * (E1 - E2)) / hbar_eVfs);

    return pBond + pAnti + pCross;
}

// =============================================================================
// Precomputed data
// =============================================================================

for (let i = 0; i <= 300; i++) {
    probability_x.push(parseFloat(((-7.5 + i * 0.05).toFixed(2))));
}

for (let i = 0; i <= 2667; i++) {
    const rad = parseFloat((1 + 0.009 * i).toFixed(3));
    radius.push(rad);
    bonding_energy_y.push(bonding_energy(rad * bohr_radius));
    antibonding_energy_y.push(antibonding_energy(rad * bohr_radius));
    h2_energy_y.push(4.7475*(1-Math.exp(-1.0298*(rad-1.4011)))**2+h_ground_energy-4.7475);
}

for (let i = 0; i <= 1000; i++) {time_axis.push((i * 0.01).toFixed(2));}

const h2_ymin = Math.min(...h2_energy_y);
const h2_xmin = radius[h2_energy_y.indexOf(h2_ymin)]+0.03;
const h2toBond_y = bonding_energy(h2_xmin * bohr_radius)+0.1;
const h2toAnti_y = antibonding_energy(h2_xmin * bohr_radius)+0.4;


// =============================================================================
// Chart traces & layouts
// =============================================================================

const bonding_energy_graph = {
    x: radius,
    y: bonding_energy_y,
    name: 'Bonding State',
    line: {color: bondingColor},
};

const antibonding_energy_graph = {
    x: radius,
    y: antibonding_energy_y,
    name: 'Antibonding State',
    line: {color: antibondingColor},
};

const bonding_point_graph = {
    type: 'scatter',
    mode: 'markers',
    marker: { size: 10, color: bondingColor },
};

const antibonding_point_graph = {
    type: 'scatter',
    mode: 'markers',
    marker: { size: 10, color: antibondingColor },
};

const delta_point_graph = {
    type: 'scatter',
    mode: 'markers',
    marker: { size: 10, color: multiUseColor },
};

const layout_energy = {
    autosize: true,
    font: { size: PLOT_FONT_SIZE },
    showlegend: true,
    legend: {
        x: 1,
        y: 1,
        yanchor: 'top',
        xanchor: 'right',
        bgcolor: 'rgba(255,255,255,0.5)',
    },
    xaxis: {
        range: [0.9, 6],
        title: { text: 'R [Bohr]' },
    },
    yaxis: {
        range: [-3, 20],
        title: { text: 'Energy [eV]' },
    },
    shapes: [{
        type: 'line',
        line: { color: 'black', dash: 'dash' },
        x0: radiusSliderInput.value, y0: -4, x1: radiusSliderInput.value, y1: 300,
    }],
    margin: { l: 55, r: 15, b: 55, t: 10, pad: 10 },
};

const layout_nPosition = {
    autosize: true,
    font: { size: PLOT_FONT_SIZE },
    legend: {
        x: 0.01,
        y: 1,
        yanchor: 'top',
        xanchor: 'left',
        bgcolor: 'rgba(255,255,255,0.5)',
    },
    xaxis: {
        range: [0, 7],
        title: { text: 'Time [fs]' },
    },
    yaxis: {
        title: { text: 'Distance [Bohr]' },
        range: [0, 12],
    },
    shapes: [{
        type: 'line',
        line: { color: 'black', dash: 'dash' },
        x0: 0, y0: -1, x1: 0, y1: 18,
    }],
    margin: { l: 55, r: 15, b: 55, t: 10, pad: 10 },
};

const layout_nMomentum = {
    autosize: true,
    font: { size: PLOT_FONT_SIZE },
    legend: {
        xanchor: 'right',
        x: 1,
        yanchor: 'middle',
        y: 0.6,
        bgcolor: 'rgba(255,255,255,0.5)',
    },
    xaxis: {
        range: [0, 7],
        title: { text: 'Time [fs]' },
    },
    yaxis: {
        title: { text: 'Momentum [Bohr<sup>-1</sup>]' },
        range: [0, 35],
    },
    shapes: [{
        type: 'line',
        line: { color: 'black', dash: 'dash' },
        x0: 0, y0: -1, x1: 0, y1: 35,
    }],
    margin: { l: 55, r: 15, b: 55, t: 10, pad: 10 },
};

const layout_prob = {
    autosize: true,
    font: { size: PLOT_FONT_SIZE },
    showlegend: false,
    xaxis: {
        title: { text: 'r [Bohr]' },
    },
    yaxis: {
        range: [-0.1, 0.4],
        title: { text: 'Probability' },
    },
    margin: { l: 55, r: 15, b: 55, t: 10, pad: 10 },
};

const layout_edynamics_prob = {
    ...layout_prob,
    yaxis: { ...layout_prob.yaxis, range: [-0.015, 0.7] },
    annotations: [{
        xref: 'paper', yref: 'paper',
        x: 0.98, y: 1.0,
        xanchor: 'right', yanchor: 'top',
        align: 'left',
        showarrow: false,
        font: { size: PLOT_FONT_SIZE },
        text: '',
    }],
};

const time_electron_density_layout = {
    autosize: true,
    showlegend: false,
    font: { size: PLOT_FONT_SIZE },
    xaxis: {
        range: [0.0, 7],
        title: { text: 'Time [fs]' },
    },
    yaxis: {
        title: { text: 'r [Bohr]' },
        range: [-6,6],
        automargin: false
    },
    shapes: [{
        type: 'line', line: { color: 'white', dash: 'dash', width:3 },
        x0: 0, y0: -10, x1: 0, y1: 10,
    }],
    margin: { l: 55, r: 15, b: 55, t: 10, pad: 0 },
}

const config = {
    responsive: true,
    useResizeHandler: true,
};

// =============================================================================
// UI helpers
// =============================================================================

function toggle_about() {
    const overlay = document.getElementById('about-modal-overlay');
    overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
}

function info_toggle(info, close = 0) {
    if (close == 1) return info.forEach(id => document.getElementById(id).style.display = 'none');
    const element = document.getElementById(info);
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
}

function default_values() {
    stopTime();
    document.getElementById('time_text').value = (0).toFixed(2);
    document.getElementById('time_slider').value = 0.00;
    document.getElementById('c1').value = 0.5;
    document.getElementById('c2').value = 0.5;
    update_graphs(energy_minimum.solution[0]);
    for (const id of graphs) { document.getElementById(id).querySelector('[data-title="Reset axes"]').click(); }
}

let animationFrameId = null;
let lastTimestamp = null;
let animationSpeed = 0.5;  //Femtosecond(s) per second

function startTime() {
    if (iterate_time) return; 
    iterate_time = true;
    document.getElementById('playPauseButton').textContent = 'Pause';
    lastTimestamp = performance.now();
    function step(timestamp) {
        const timeInput = document.getElementById('time_text');
        if (!iterate_time) return;
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        const currentTime = parseFloat(timeInput.value) || 0;
        const maxTime = parseFloat(document.getElementById('time_slider').max);
        let newTime = currentTime + (deltaTime / 1000) * animationSpeed;

        if (screen === 'e_dynamic' && newTime > maxTime) {
            newTime = 0.00;
        } else if (screen !== 'e_dynamic' && newTime >= maxTime) {
            newTime = maxTime;
            stopTime();
        }
        timeInput.value = newTime.toFixed(2);
        throttledUpdate();
        if (iterate_time) animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
}

function stopTime() {
    iterate_time = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    document.getElementById('playPauseButton').textContent = 'Play';
}

function togglePlayPause() {
    if (iterate_time) {
        stopTime();
    } else {
        startTime();
    }
}

// =============================================================================
// Graph updates
// =============================================================================

function update_graphs(newRadius = parseFloat(radiusTextInput.value)) {
    if (newRadius <= 0 || isNaN(newRadius)) {
        return;
    }

    if (screen == 'static') {
        if (parseFloat(radiusTextInput.value) !== newRadius) {
            radiusTextInput.value = newRadius.toFixed(2);
        }
        if (radiusSliderInput.value !== newRadius) {
            radiusSliderInput.value = newRadius;
        }

        const bondingEnergy = bonding_energy(newRadius * bohr_radius);
        const antibondingEnergy = antibonding_energy(newRadius * bohr_radius);

        Plotly.relayout('hydrogen-cation-energy-chart', {
            'shapes[0].x0': newRadius, 'shapes[0].x1': newRadius,
            'shapes[0].y0': bondingEnergy, 'shapes[0].y1': antibondingEnergy,
        });
        Plotly.restyle('hydrogen-cation-energy-chart', {
            x: [[newRadius], [newRadius], [newRadius]],
            y: [
                [bondingEnergy], [antibondingEnergy], [(bondingEnergy + antibondingEnergy) / 2],
            ],
            name: [
                `E<sub>B</sub>(R): ${bondingEnergy.toFixed(3)} eV`,
                `E<sub>A</sub>(R): ${antibondingEnergy.toFixed(3)} eV`,
                `ΔE: ${ (antibondingEnergy - bondingEnergy).toFixed(3) } eV`,
            ],
        }, [2, 3, 4]);

        let bonding_probability_y = [];
        let antibonding_probability_y = [];
        let transistion_y=[];
        for (const distance of probability_x) {
            const [bondingProb, antibondingProb, transistionProb] = probability_Curve(newRadius, distance);
            bonding_probability_y.push(bondingProb);
            antibonding_probability_y.push(antibondingProb);
            transistion_y.push(transistionProb);
        }

        Plotly.restyle('hydrogen-cation-bond-probability-chart', {
            y: [bonding_probability_y, [0, 0]],
            x: [probability_x, [-(newRadius / 2), newRadius / 2]],
        }, [0, 1]);
        Plotly.restyle('hydrogen-cation-antibond-probability-chart', {
            y: [antibonding_probability_y, [0, 0]],
            x: [probability_x, [-(newRadius / 2), newRadius / 2]],
        }, [0, 1]);
        Plotly.restyle('transition-probability-chart', {
            y: [transistion_y, [0, 0]],
            x: [probability_x, [-(newRadius / 2), newRadius / 2]],
        }, [0,1]);
    }

    else if (screen == 'e_dynamic') {
        if (parseFloat(radiusTextInput.value) !== newRadius) {
            radiusTextInput.value = newRadius.toFixed(2);
        }
        if (radiusSliderInput.value !== newRadius) {
            radiusSliderInput.value = newRadius;
        }

        const bondingEnergy = bonding_energy(newRadius * bohr_radius);
        const antibondingEnergy = antibonding_energy(newRadius * bohr_radius);
        const oscillationPeriod = (2 * Math.PI * hbar_eVfs) / Math.abs(antibondingEnergy - bondingEnergy);
        const time = parseFloat(document.getElementById('time_text').value);

        document.getElementById('time_slider').max = oscillationPeriod.toFixed(3);
        document.getElementById('time_slider').value = time;
        document.getElementById('c1Text').value = parseFloat(document.getElementById('c1').value).toFixed(2);
        document.getElementById('c2Text').value = parseFloat(document.getElementById('c2').value).toFixed(2);

        const c1 = Math.sqrt(document.getElementById('c1').value);
        const c2 = Math.sqrt(document.getElementById('c2').value);

        const dE = antibondingEnergy - bondingEnergy;

        const electron_dynamics_y = [];
        for (const distance of probability_x) {
            electron_dynamics_y.push(eDynamics_probability_Curve(newRadius, distance, time, [c1, c2]));
        }

        Plotly.relayout('hydrogen-cation-energy-chart', {
            'shapes[0].x0': newRadius, 'shapes[0].x1': newRadius,
            'shapes[0].y0': bondingEnergy, 'shapes[0].y1': antibondingEnergy,
        });
        Plotly.restyle('hydrogen-cation-energy-chart', {
            x: [[newRadius], [newRadius], [newRadius]],
            y: [
                [bondingEnergy], [antibondingEnergy], [(bondingEnergy + antibondingEnergy) / 2],
            ],
            name: [
                `E<sub>B</sub>(R): ${bondingEnergy.toFixed(3)} eV`,
                `E<sub>A</sub>(R): ${antibondingEnergy.toFixed(3)} eV`,
                `ΔE: ${ (antibondingEnergy - bondingEnergy).toFixed(3) } eV`,
            ],
        }, [2, 3, 4]);
        Plotly.restyle('hydrogen-cation-electron-dynamics-chart', {
            y: [electron_dynamics_y, [0, 0]],
            x: [probability_x, [-(newRadius / 2), newRadius / 2]],
        }, [0, 1]);
        Plotly.relayout('hydrogen-cation-electron-dynamics-chart', {
            'annotations[0].text':
                `ΔE = ${Math.abs(dE).toFixed(3)} eV<br>T = ${oscillationPeriod.toFixed(3)} fs<br>t = ${time.toFixed(3)}fs`,
        });
    }

    else if (screen == 'n_dynamic') {
        const time = parseFloat(document.getElementById('time_text').value).toFixed(2);
        if (time > 10 || time < 0 || isNaN(time)) return;

        const y_data_bond = nDynamics_bonding_data.wave_data.y[time];
        const y_data_anti = nDynamics_antibonding_data.wave_data.y[time];
        const c1 = document.getElementById('c1').value;
        const c2 = document.getElementById('c2').value;

        document.getElementById('time_slider').value = document.getElementById('time_text').value;
        document.getElementById('c1Text').value = parseFloat(c1).toFixed(2);
        document.getElementById('c2Text').value = parseFloat(c2).toFixed(2);

        const shiftBond = bonding_energy(nDynamics_bonding_data.wave_data.x[y_data_bond.indexOf(Math.max(...y_data_bond))] * bohr_radius);
        const shiftAnti = antibonding_energy(nDynamics_antibonding_data.wave_data.x[y_data_anti.indexOf(Math.max(...y_data_anti))] * bohr_radius);

        const NUC_SCALE = 1;

        Plotly.restyle('hydrogen-cation-energy-chart-nuclear', {
            y: [
                y_data_bond.map(num => num * c1 > 0.0005 ? NUC_SCALE * num * c1 + shiftBond : null),
                y_data_anti.map(num => num * c2 > 0.0005 ? NUC_SCALE * num * c2 + shiftAnti : null),
                y_data_bond.map(num => num > 0.0005 && time == 0 ? NUC_SCALE * num + h2_ymin : null),
            ],
        }, [3, 4, 5]);
        
        if (time == 0){
            Plotly.relayout('hydrogen-cation-energy-chart-nuclear', {
                'annotations[1].showarrow': true, 'annotations[0].showarrow': true, 'annotations[2].opacity': 1,
            });
        } else {
            Plotly.relayout('hydrogen-cation-energy-chart-nuclear', {
                'annotations[1].showarrow': false, 'annotations[0].showarrow': false, 'annotations[2].opacity': 0,
            });
        }

        Plotly.relayout('hydrogen-cation-nuclear-position-chart', { 'shapes[0].x0': time, 'shapes[0].x1': time });
        Plotly.relayout('hydrogen-cation-nuclear-momentum-chart', { 'shapes[0].x0': time, 'shapes[0].x1': time });
        Plotly.restyle('hydrogen-cation-nuclear-position-chart', {
            y: [nDynamics_bonding_data.position_data.y.map((num, i) => num * c1 + c2 * nDynamics_antibonding_data.position_data.y[i])],
        }, [2]);
        Plotly.restyle('hydrogen-cation-nuclear-momentum-chart', {
            y: [nDynamics_bonding_data.momentum_data.y.map((num, i) => num * c1 + c2 * nDynamics_antibonding_data.momentum_data.y[i])],
        }, [2]);
    }

    else if (screen == 'en_dynamic') {
        const timeStr = parseFloat(document.getElementById('time_text').value).toFixed(2);
        if (timeStr > 10 || timeStr < 0 || isNaN(timeStr)) return;

        const c1Val = parseFloat(document.getElementById('c1').value);
        const c2Val = parseFloat(document.getElementById('c2').value);

        document.getElementById('time_slider').value = timeStr;
        document.getElementById('c1Text').value = c1Val;
        document.getElementById('c2Text').value = c2Val;

        const c12 = Math.sqrt(c1Val) * Math.sqrt(c2Val);
        
        const timeData = fullDynamics_data[timeStr];
        const len = timeData.P1.length;

        const P1_y = new Float32Array(len);
        const P2_y = new Float32Array(len);
        const P3_y = new Float32Array(len);
        const total_y = new Float32Array(len);

        for (let i = 0; i < len; i++) {
            P1_y[i] = timeData.P1[i] * c1Val;
            P2_y[i] = timeData.P2[i] * c2Val;
            P3_y[i] = timeData.P3[i] * c12;
            total_y[i] = P1_y[i] + P2_y[i] + P3_y[i];
        }

        const bondY = nDynamics_bonding_data.wave_data.y[timeStr];
        const antiY = nDynamics_antibonding_data.wave_data.y[timeStr];
        let maxBondIdx = 0, maxAntiIdx = 0;
        
        for (let i = 1; i < bondY.length; i++) {
            if (bondY[i] > bondY[maxBondIdx]) maxBondIdx = i;
            if (antiY[i] > antiY[maxAntiIdx]) maxAntiIdx = i;
        }
        
        const bondRadius = nDynamics_bonding_data.wave_data.x[maxBondIdx];
        const antiRadius = nDynamics_antibonding_data.wave_data.x[maxAntiIdx];



        // const bondRadius = nDynamics_bonding_data.wave_data.x[bondY.indexOf(Math.max(...bondY))];
        // const antiRadius = nDynamics_antibonding_data.wave_data.x[antiY.indexOf(Math.max(...antiY))];

        Plotly.restyle('fullDynamics-probability-chart', {
            y: [total_y, P1_y, P2_y, P3_y, [0, 0], [0, 0]],
            x: [fullDynamics_data.x, fullDynamics_data.x, fullDynamics_data.x, fullDynamics_data.x, [-bondRadius / 2, bondRadius / 2], [-antiRadius / 2, antiRadius / 2]],
        }, [0, 1, 2, 3, 4, 5]);
        
        Plotly.relayout('nuclear-overlap-chart', { 'shapes[0].x0': timeStr, 'shapes[0].x1': timeStr });
        
        // Alex, we need to find a better solution for this
        // I returned this line back because it looks better when the time line adjust synchroniously with the time slider
        // if it influences the performance on tablet/mobile, we need to add it as a special case
        Plotly.relayout('time-electron-density-chart', { 'shapes[0].x0': timeStr, 'shapes[0].x1': timeStr });
    }
}

function update_heatmap() {
    const c1 = parseFloat(document.getElementById('c1').value);
    const c2 = parseFloat(document.getElementById('c2').value);
    const c1_c2 = Math.sqrt(c1 * c2);

    const t_len = time_axis.length;
    const x_len = fullDynamics_data.x.length;
    let z_data = new Array(x_len);
    for (let i = 0; i < x_len; i++) {
        z_data[i] = new Float32Array(t_len); 
    }
    for (let t = 0; t < t_len; t++) {
        const ttime = time_axis[t];
        const data_t = fullDynamics_data[ttime];
        const P1 = data_t.P1;
        const P2 = data_t.P2;
        const P3 = data_t.P3;
        for (let i = 0; i < x_len; i++) {
            z_data[i][t] = (P1[i] * c1) + (P2[i] * c2) + (P3[i] * c1_c2);
        }
    }
    Plotly.restyle('time-electron-density-chart', {z: [z_data]}, [0]);
}

// =============================================================================
// Initial chart setup
// =============================================================================

Plotly.react('hydrogen-cation-energy-chart', [bonding_energy_graph, antibonding_energy_graph, bonding_point_graph, antibonding_point_graph, delta_point_graph], layout_energy, config);
Plotly.react('hydrogen-cation-bond-probability-chart', [
    { x: probability_x, line: { color: bondingColor }, name: '|<i>ψ</i><sub>B</sub>(R)|<sup>2</sup>' },
    { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: protonStandardColor }, name: 'proton' },
], layout_prob, config);
Plotly.react('hydrogen-cation-antibond-probability-chart', [
    { x: probability_x, line: { color: antibondingColor }, name: '|<i>ψ</i><sub>A</sub>(R)|<sup>2</sup>' },
    { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: protonStandardColor }, name: 'proton' },
], layout_prob, config);
Plotly.react('transition-probability-chart', [{x: probability_x, line: {color:multiUseColor}, name:'ψ</i><sub>A</sub>(R)ψ</i><sub>B</sub>(R)'},{ y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: 'red' }, name: 'proton' }], {...layout_prob, yaxis:{...layout_prob.yaxis, range:[-0.3, 0.3]}}, config);
Plotly.react('hydrogen-cation-electron-dynamics-chart', [
    { x: probability_x, name: '|<i>ψ</i>(R,t)|<sup>2</sup>', line:{color: probColor_nonSpecific} },
    { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: protonStandardColor }, name: 'proton' },
], layout_edynamics_prob, config);

energy_minimum = numeric.uncmin(x => bonding_energy(x[0] * bohr_radius), [2.5]);
radiusTextInput.value = energy_minimum.solution[0].toFixed(2);

// =============================================================================
// Initial visibility
// =============================================================================

for (const i of choices) { document.querySelectorAll('.' + i).forEach(element => { element.style.display = 'none'; }); }
document.querySelectorAll('.info').forEach(element => { element.style.display = ''; });

// =============================================================================
// Event listeners
// =============================================================================

document.querySelectorAll('input[name="selection"]').forEach((radio) => {
    radio.addEventListener('change', function () {
        screen = this.value;
        for (const i of choices) { document.querySelectorAll('.' + i).forEach(element => { element.style.display = 'none'; }); }
        document.querySelectorAll('.' + screen).forEach(element => { element.style.display = ''; });
        stopTime();
        document.getElementById('time_slider').max = (screen == 'e_dynamic') ? 1.1 : 7;
        for (const id of graphs) { Plotly.Plots.resize(document.getElementById(id)); }
        info_toggle(infoBoxes, 1);
        screen == 'en_dynamic' ? update_heatmap() : null;
        const visibleGraphs = Array.from(document.querySelectorAll('.' + screen + ' .js-plotly-plot'));
        visibleGraphs.forEach(graph => {
            Plotly.Plots.resize(graph);
            const resetBtn = graph.querySelector('[data-title="Reset axes"]');
            if (resetBtn) resetBtn.click();
        });
        update_graphs();
    });
});

// =============================================================================
// Nuclear dynamics data (loaded asynchronously)
// =============================================================================

let isDrawing = false;
let drawingHeat = false;

function throttledUpdate() {
    if (!isDrawing) {
        isDrawing = true;
        requestAnimationFrame(() => {
            update_graphs();
            isDrawing = false;
        });
    }
}

function throttledHeatmap() {
    if (!drawingHeat) {
        drawingHeat = true;
        requestAnimationFrame(() => {
            update_heatmap();
            drawingHeat = false;
        });
    }
}

fetch('qdata.json').then(response => response.json()).then(data => {
    nDynamics_bonding_data = data.nDynamics_bonding;
    nDynamics_antibonding_data = data.nDynamics_antibonding;
    nOverlap_Data = data.overlap_data;
    fullDynamics_data = data.fullDynamics;
    exprB = nDynamics_bonding_data.position_data.y.map(num => num/2);
    exprA = nDynamics_antibonding_data.position_data.y.map(num => num/2);
    exprx = nDynamics_bonding_data.position_data.x;
    nexprB = exprB.map(num => -num);
    nexprA = exprA.map(num => -num);

    const overlap_magnitude = [];
    for (const i in nOverlap_Data.time) {
        overlap_magnitude.push(Math.sqrt(nOverlap_Data.real[i] ** 2 + nOverlap_Data.imag[i] ** 2)/3);
    }

    Plotly.react('hydrogen-cation-energy-chart-nuclear', [
        bonding_energy_graph, antibonding_energy_graph,
        { x: radius, y: h2_energy_y, name: 'Ground Neutral State'},
        { x: nDynamics_bonding_data.wave_data.x, name: 'Nuclear Density on Bonding State', fill: 'toself', fillcolor: `${bondingColor}4D` },
        { x: nDynamics_bonding_data.wave_data.x, name: 'Nuclear Density on Antibonding State', fill: 'toself', fillcolor: `${antibondingColor}4D` },
        { x: nDynamics_bonding_data.wave_data.x, name: 'Initial Nuclear Density', fill: 'toself', fillcolor: `${h2Color}4D` },
    ], {
        ...layout_energy,
        xaxis: { ...layout_energy.xaxis, range: [0.5, 15] },
        yaxis: { ...layout_energy.yaxis, range: [-20, 20] },
        shapes: [],
        annotations: [
            {x: h2_xmin+arrowDelta/2, y: h2toAnti_y, xref:'x', yref:'y', ax: h2_xmin+arrowDelta/2, ay: h2_ymin, axref:'x', ayref:'y', layer: 'below', showarrow:true,text:'', arrowhead:2, arrowsize:1, arrowwidth:2, arrowcolor:'black'},
            {x: h2_xmin-arrowDelta/2, y: h2toBond_y, xref:'x', yref:'y', ax: h2_xmin-arrowDelta/2, ay: h2_ymin, axref:'x', ayref:'y', layer: 'below', showarrow:true,text:'', arrowhead:2, arrowsize:1, arrowwidth:2, arrowcolor:'black'},
            {x: 2, y: -8.0, xref:'x', yref:'y', showarrow:false, text:'Ionization', font:{size:PLOT_FONT_SIZE+2}, xanchor:'left'},
        ],
    }, config);

    Plotly.react('hydrogen-cation-nuclear-position-chart', [
        { x: exprx, y: nDynamics_bonding_data.position_data.y, name: 'Bonding State', line: {color: bondingColor}},
        { x: nDynamics_antibonding_data.position_data.x, y: nDynamics_antibonding_data.position_data.y, name: 'Antionding State', line: {color: antibondingColor} },
        { x: exprx, name: 'Average', visible: 'legendonly', line: {color: multiUseColor} },
    ], layout_nPosition, config);

    Plotly.react('hydrogen-cation-nuclear-momentum-chart', [
        { x: nDynamics_bonding_data.momentum_data.x, y: nDynamics_bonding_data.momentum_data.y, name: 'Bonding State', line: {color: bondingColor} },
        { x: nDynamics_antibonding_data.momentum_data.x, y: nDynamics_antibonding_data.momentum_data.y, name: 'Antibonding State', line: {color: antibondingColor} },
        { x: nDynamics_bonding_data.momentum_data.x, name: 'Average', visible: 'legendonly', line: {color: multiUseColor} },
    ], layout_nMomentum, config);

    Plotly.react('fullDynamics-probability-chart', [
        { x: fullDynamics_data.x, name: 'Total Probability', line:{color:probColor_nonSpecific} },
        { x: fullDynamics_data.x, name: '$|c_{\\text{B}}|^2 \\int \\rho_{\\text{B}} |\\chi_{\\text{B}}|^2 dR$', visible: 'legendonly' , line:{color:bondingColor}},
        { x: fullDynamics_data.x, name: '$|c_{\\text{A}}|^2 \\int \\rho_{\\text{A}} |\\chi_{\\text{A}}|^2 dR$', visible: 'legendonly', line:{color:antibondingColor} },
        { x: fullDynamics_data.x, name: '$c_{\\text{B}}^{*} c_{\\text{A}} \\int \\rho_{\\text{BA}} \\chi^{*}_{\\text{B}} \\chi_{\\text{A}} dR$', visible: 'legendonly', line:{color:'#d62728'} },
        { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: bondingColor }, name: 'Protons on Bonding State' },
        { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: antibondingColor }, name: 'Protons on Antibonding State' },
    ], {
        ...layout_prob,
        hovermode: false,
        showlegend: true,
        legend: { x: 1, y: 1, xanchor: 'right', yanchor: 'top', bgcolor: 'rgba(255,255,255,0.5)' },
        xaxis: {title: { text: 'r [Bohr]' }, range: [-10, 10] },
        yaxis: { title: { text: 'Probability' }, range: [-0.3, 0.6] },
    }, config);

    Plotly.react('nuclear-overlap-chart', [
        { x: nOverlap_Data.time, y: nOverlap_Data.real.map(num => num/3), name: 'Real Part' },
        { x: nOverlap_Data.time, y: nOverlap_Data.imag.map(num => num/3), name: 'Imaginary Part' },
        { x: nOverlap_Data.time, y: overlap_magnitude, name: 'Magnitude' },
    ], {
        font: { size: PLOT_FONT_SIZE },
        xaxis: { range: [0, 7], title: { text: 'Time [fs]' } },
        yaxis: { title: { text: 'Coherence' }, range: [-1.05, 1.05] },
        legend: { x: 1, y: 1, xanchor: 'right', yanchor: 'top', bgcolor: 'rgb(255,255,255,0.5)' },
        shapes: [{
            type: 'line', line: { color: 'black', dash: 'dash' },
            x0: radiusSliderInput.value, y0: -1.1, x1: radiusSliderInput.value, y1: 1.1,
        }],
        margin: { l: 55, r: 15, b: 55, t: 10, pad: 10 },
    }, config);
    Plotly.react('time-electron-density-chart', [{
        x:time_axis,
        y:fullDynamics_data.x,
        type:'heatmap',
        colorscale: 'Jet',
        showscale: false,},
        {x:exprx, y:exprB, name:'Bonding Proton', line:{color:'yellow', dash:'dash'}}, 
        {x:exprx, y:exprA, name:'AntibondProton', line:{color:'yellow', dash:'dash'}}, 
        {x:exprx, y:nexprB, name:'Bonding Proton', line:{color:'yellow', dash:'dash'}}, 
        {x:exprx, y:nexprA, name:'AntibondProton', line:{color:'yellow', dash:'dash'}}], 
        time_electron_density_layout, {...config, displayModeBar:false});
});
