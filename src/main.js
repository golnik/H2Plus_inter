// =============================================================================
// Physical constants
// =============================================================================

const epsilon = 8.8541878e-12;
const h_ground_energy = -13.6;
const bohr_radius = 5.291772e-11;
const electron_charge = 1.60217663e-19;
const hbar_eVfs = 0.6582119569;

// =============================================================================
// Plot configuration
// =============================================================================

const PLOT_FONT_SIZE = 14;

// =============================================================================
// UI configuration
// =============================================================================

const choices = ['info', 'static', 'e_dynamic', 'n_dynamic', 'en_dynamic'];

const infoBoxes = [
    'energy-info', 'bondProb-info', 'antiBondProb-info', 'eDynamic-info',
    'nDynamicsMain-info', 'nDynamicsPos-info', 'nDynamicsMom-info',
    'fullDynamics-info', 'overlap-info', 'transition-info', 'static-summary',
    'eDynamics-summary', 'nDynamics-summary', 'fullDynamics-summary',
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
let bonding_probability_y = [];
let antibonding_probability_y = [];
const probability_x = [];
let fullDynamics_probability_y = [];
const time_axis =[];
for (let i = 0; i <= 1000; i++) {time_axis.push((i * 0.01).toFixed(2));}

let nDynamics_bonding_data;
let nDynamics_antibonding_data;
let nOverlap_Data;
let fullDynamics_data;

// =============================================================================
// Physics
// =============================================================================

function bonding_energy(radius) {
    return ((electron_charge) / (4 * Math.PI * epsilon * radius))
        * ((1 + radius / bohr_radius) * Math.exp(-2 * radius / bohr_radius)
            + (1 - (2 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius))
        / (1 + (1 + (radius / bohr_radius) + (1 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius))+h_ground_energy;
}

function antibonding_energy(radius) {
    return ((electron_charge) / (4 * Math.PI * epsilon * radius))
        * ((1 + radius / bohr_radius) * Math.exp(-2 * radius / bohr_radius)
            - (1 - (2 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius))
        / (1 - (1 + (radius / bohr_radius) + (1 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius))+h_ground_energy;
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
        sum += 4 * i * Math.exp(-(A + B)) * 0.05;
    }

    return [
        (waveFunction1 + waveFunction2 + sum) / normalizeBond,
        (waveFunction1 + waveFunction2 - sum) / normalizeAnti,
    ];
}

function eDynamics_probability_Curve(radius, distance, time = 0, c = [Math.sqrt(0.5), Math.sqrt(0.5)]) {
    const E1 = bonding_energy(radius * bohr_radius);
    const E2 = antibonding_energy(radius * bohr_radius);
    const waveFunction1 = 0.5 * Math.exp(-2 * Math.abs(distance + radius / 2)) * (1 + 2 * Math.abs(distance + radius / 2));
    const waveFunction2 = 0.5 * Math.exp(-2 * Math.abs(radius / 2 - distance)) * (1 + 2 * Math.abs(radius / 2 - distance));
    const overlapIntegral = Math.exp(-radius) * (1 + radius + (radius ** 2) / 3);
    const normalizeBond = 2 + 2 * overlapIntegral;
    const normalizeAnti = 2 - 2 * overlapIntegral;

    let sum = 0;
    for (let i = 0; i < 15; i += 0.05) {
        const A = Math.sqrt(i ** 2 + (Math.abs(distance + radius / 2)) ** 2);
        const B = Math.sqrt(i ** 2 + (Math.abs(radius / 2 - distance)) ** 2);
        sum += 4 * i * Math.exp(-(A + B)) * 0.05;
    }

    const pBond = c[0] ** 2 * (waveFunction1 + waveFunction2 + sum) / normalizeBond;
    const pAnti = c[1] ** 2 * (waveFunction1 + waveFunction2 - sum) / normalizeAnti;
    const pCross = 2 * c[0] * c[1] * (waveFunction1 - waveFunction2) / (normalizeAnti * normalizeBond)
        * Math.cos((time * (E1 - E2)) / hbar_eVfs);

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
}

// =============================================================================
// Chart traces & layouts
// =============================================================================

const bonding_energy_graph = {
    x: radius,
    y: bonding_energy_y,
    name: 'Bonding State',
};

const antibonding_energy_graph = {
    x: radius,
    y: antibonding_energy_y,
    name: 'Antibonding State',
};

const bonding_point_graph = {
    type: 'scatter',
    mode: 'markers',
    marker: { size: 10, color: '#1f77b4' },
};

const antibonding_point_graph = {
    type: 'scatter',
    mode: 'markers',
    marker: { size: 10, color: '#ff7f0e' },
};

const delta_point_graph = {
    type: 'scatter',
    mode: 'markers',
    marker: { size: 10, color: 'green' },
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
        range: [0.5, 6],
        title: { text: 'R [Bohr]' },
    },
    yaxis: {
        range: [-2, 20],
        title: { text: 'Energy [eV]' },
    },
    shapes: [{
        type: 'line',
        line: { color: 'black', dash: 'dash' },
        x0: radiusSliderInput.value, y0: -4, x1: radiusSliderInput.value, y1: 300,
    }],
    margin: { l: 55, r: 15, b: 55, t: 25, pad: 10 },
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
        range: [0, 10],
        title: { text: 'Time [fs]' },
    },
    yaxis: {
        title: { text: 'Distance [Bohr]' },
    },
    shapes: [{
        type: 'line',
        line: { color: 'black', dash: 'dash' },
        x0: 0, y0: 0, x1: 0, y1: 15.5,
    }],
    margin: { l: 55, r: 15, b: 55, t: 25, pad: 10 },
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
        range: [0, 10],
        title: { text: 'Time [fs]' },
    },
    yaxis: {
        title: { text: 'Momentum [Bohr<sup>-1</sup>]' },
    },
    shapes: [{
        type: 'line',
        line: { color: 'black', dash: 'dash' },
        x0: 0, y0: 0, x1: 0, y1: 34,
    }],
    margin: { l: 55, r: 15, b: 55, t: 25, pad: 10 },
};

const layout_prob = {
    autosize: true,
    font: { size: PLOT_FONT_SIZE },
    showlegend: false,
    xaxis: {
        title: { text: 'r [Bohr]' },
    },
    yaxis: {
        range: [-0.015, 0.4],
        title: { text: 'Probability' },
    },
    margin: { l: 55, r: 15, b: 55, t: 25, pad: 10 },
};

const layout_edynamics_prob = {
    ...layout_prob,
    yaxis: { ...layout_prob.yaxis, range: [-0.015, 0.75] },
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
    font: { size: PLOT_FONT_SIZE },
    xaxis: {
        title: { text: 'Time [fs]' },
    },
    yaxis: {
        title: { text: 'Distance [Bohr]' },
    },
    margin: { l: 55, r: 15, b: 55, t: 25, pad: 10 },
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

function startTime() {
    if (iterate_time) return;
    iterate_time = setInterval(() => {
        const time = parseFloat(document.getElementById('time_text').value);
        let newTime = time + 0.01;
        if (screen === 'e_dynamic' && newTime > parseFloat(document.getElementById('time_slider').max)) {
            newTime = 0.00;
        }
        document.getElementById('time_text').value = newTime.toFixed(2);
        update_graphs();
    }, 10);
    document.getElementById('playPauseButton').textContent = 'Pause';
}

function stopTime() {
    if (iterate_time) {
        clearInterval(iterate_time);
        iterate_time = undefined;
    } else {
        document.getElementById('time_text').value = (0.00).toFixed(2);
        document.getElementById('time_slider').value = 0.00;
        update_graphs();
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
            x: [radius, radius, [newRadius], [newRadius], [newRadius]],
            y: [
                bonding_energy_y, antibonding_energy_y,
                [bondingEnergy], [antibondingEnergy], [(bondingEnergy + antibondingEnergy) / 2],
            ],
            name: [
                'Bonding State', 'Antibonding State',
                `$E_{\\text{B}}(R): ${bondingEnergy.toFixed(3)} \\text{ eV}$`,
                `$E_{\\text{A}}(R): ${antibondingEnergy.toFixed(3)} \\text{ eV}$`,
                `$\\Delta E: ${(antibondingEnergy - bondingEnergy).toFixed(3)} \\text{ eV}$`,
            ],
        }, [0, 1, 2, 3, 4]);

        let bonding_probability_y = [];
        let antibonding_probability_y = [];
        let transistion_y=[];
        for (const distance of probability_x) {
            const [bondingProb, antibondingProb] = probability_Curve(newRadius, distance);
            bonding_probability_y.push(bondingProb);
            antibonding_probability_y.push(antibondingProb);
            transistion_y.push(bondingProb-antibondingProb);
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

        document.getElementById('time_slider').max = oscillationPeriod.toFixed(3);
        document.getElementById('time_slider').value = document.getElementById('time_text').value;
        document.getElementById('c1Text').value = parseFloat(document.getElementById('c1').value).toFixed(2);
        document.getElementById('c2Text').value = parseFloat(document.getElementById('c2').value).toFixed(2);

        const c1 = Math.sqrt(document.getElementById('c1').value);
        const c2 = Math.sqrt(document.getElementById('c2').value);

        const dE = antibondingEnergy - bondingEnergy;
        const time = parseFloat(document.getElementById('time_text').value);

        const electron_dynamics_y = [];
        for (const distance of probability_x) {
            electron_dynamics_y.push(eDynamics_probability_Curve(newRadius, distance, document.getElementById('time_text').value, [c1, c2]));
        }

        Plotly.relayout('hydrogen-cation-energy-chart', {
            'shapes[0].x0': newRadius, 'shapes[0].x1': newRadius,
            'shapes[0].y0': bondingEnergy, 'shapes[0].y1': antibondingEnergy,
        });
        Plotly.restyle('hydrogen-cation-energy-chart', {
            x: [radius, radius, [newRadius], [newRadius], [newRadius]],
            y: [
                bonding_energy_y, antibonding_energy_y,
                [bondingEnergy], [antibondingEnergy], [(bondingEnergy + antibondingEnergy) / 2],
            ],
            name: [
                'Bonding State', 'Antibonding State',
                `$E_{\\text{B}}(R): ${bondingEnergy.toFixed(3)} \\text{ eV}$`,
                `$E_{\\text{A}}(R): ${antibondingEnergy.toFixed(3)} \\text{ eV}$`,
                `$\\Delta E: ${dE.toFixed(3)} \\text{ eV}$`,
            ],
        }, [0, 1, 2, 3, 4]);
        Plotly.restyle('hydrogen-cation-electron-dynamics-chart', {
            y: [electron_dynamics_y, [0, 0]],
            x: [probability_x, [-(newRadius / 2), newRadius / 2]],
        }, [0, 1]);
        Plotly.relayout('hydrogen-cation-electron-dynamics-chart', {
            'annotations[0].text':
                `$\\begin{array}{c}
                    \\Delta E &=& ${Math.abs(dE).toFixed(3)} \\text{ eV} \\\\ 
                    T &=& ${oscillationPeriod.toFixed(3)} \\text{ fs} \\\\
                    t &=& ${time.toFixed(3)} \\text{ fs}
                \\end{array}$`,
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

        const NUC_SCALE = 2;

        Plotly.restyle('hydrogen-cation-energy-chart-nuclear', {
            y: [
                bonding_energy_y, antibonding_energy_y,
                y_data_bond.map(num => num * c1 > 0.0005 ? NUC_SCALE * num * c1 + shiftBond : null),
                y_data_anti.map(num => num * c2 > 0.0005 ? NUC_SCALE * num * c2 + shiftAnti : null),
            ],
        }, [0, 1, 2, 3]);

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
        const time = parseFloat(document.getElementById('time_text').value).toFixed(2);
        if (time > 10 || time < 0 || isNaN(time)) return;

        document.getElementById('time_slider').value = document.getElementById('time_text').value;
        document.getElementById('c1Text').value = parseFloat(document.getElementById('c1').value).toFixed(2);
        document.getElementById('c2Text').value = parseFloat(document.getElementById('c2').value).toFixed(2);

        const c1 = Math.sqrt(document.getElementById('c1').value);
        const c2 = Math.sqrt(document.getElementById('c2').value);

        const fullDynamicsP1_prob_y = fullDynamics_data[time].P1.map(num => num * c1 ** 2);
        const fullDynamicsP2_prob_y = fullDynamics_data[time].P2.map(num => num * c2 ** 2);
        const fullDynamicsP3_prob_y = fullDynamics_data[time].P3.map(num => num * c1 * c2);

        fullDynamics_probability_y = [];
        for (const i in fullDynamics_data.x) {
            fullDynamics_probability_y[i] = fullDynamicsP1_prob_y[i] + fullDynamicsP2_prob_y[i] + fullDynamicsP3_prob_y[i];
        }

        const bondRadius = nDynamics_bonding_data.wave_data.x[nDynamics_bonding_data.wave_data.y[time].indexOf(Math.max(...nDynamics_bonding_data.wave_data.y[time]))];
        const antiRadius = nDynamics_antibonding_data.wave_data.x[nDynamics_antibonding_data.wave_data.y[time].indexOf(Math.max(...nDynamics_antibonding_data.wave_data.y[time]))];

        Plotly.restyle('fullDynamics-probability-chart', {
            y: [fullDynamics_probability_y, fullDynamicsP1_prob_y, fullDynamicsP2_prob_y, fullDynamicsP3_prob_y, [0, 0], [0, 0]],
            x: [
                fullDynamics_data.x, fullDynamics_data.x, fullDynamics_data.x, fullDynamics_data.x,
                [-bondRadius / 2, bondRadius / 2], [-antiRadius / 2, antiRadius / 2],
            ],
        }, [0, 1, 2, 3, 4, 5]);
        Plotly.relayout('nuclear-overlap-chart', { 'shapes[0].x0': time, 'shapes[0].x1': time });
    }
}

function update_heatmap() {
    if (screen == 'en_dynamic') {
        let z_data = [];
        const c1 = Math.sqrt(document.getElementById('c1').value);
        const c2 = Math.sqrt(document.getElementById('c2').value);
        for (const t in time_axis) {
            z_data[t] = [];
            const ttime = time_axis[t];
            const P1 = fullDynamics_data[ttime].P1.map(num => num * c1 ** 2);
            const P2 = fullDynamics_data[ttime].P2.map(num => num * c2 ** 2);
            const P3 = fullDynamics_data[ttime].P3.map(num => num * c1 * c2);
            for (const i in fullDynamics_data.x) {
                z_data[t][i] = P1[i] + P2[i] + P3[i];
            }
        }
        z_data = z_data[0].map((_, colIndex) => z_data.map(row => row[colIndex]));
        Plotly.restyle('time-electron-density-chart', {z:[z_data]}, [0]);
    }
}
// =============================================================================
// Initial chart setup
// =============================================================================

Plotly.react('hydrogen-cation-energy-chart', [bonding_energy_graph, antibonding_energy_graph, bonding_point_graph, antibonding_point_graph, delta_point_graph], layout_energy, config);
Plotly.react('hydrogen-cation-bond-probability-chart', [
    { x: probability_x, line: { color: 1 }, name: '|<i>ψ</i><sub>B</sub>(R)|<sup>2</sup>' },
    { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: 'red' }, name: 'proton' },
], layout_prob, config);
Plotly.react('hydrogen-cation-antibond-probability-chart', [
    { x: probability_x, line: { color: '#ff7f0e' }, name: '|<i>ψ</i><sub>A</sub>(R)|<sup>2</sup>' },
    { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: 'red' }, name: 'proton' },
], layout_prob, config);
Plotly.react('transition-probability-chart', [{x: probability_x, line: {color:'green'}, name:'ψ</i><sub>A</sub>(R)ψ</i><sub>B</sub>(R)'},{ y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: 'red' }, name: 'proton' }], {...layout_prob, yaxis:{...layout_prob.yaxis, range:[-0.2, 0.4]}}, config);
Plotly.react('hydrogen-cation-electron-dynamics-chart', [
    { x: probability_x, name: '|<i>ψ</i>(R,t)|<sup>2</sup>' },
    { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: 'red' }, name: 'proton' },
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
        document.getElementById('time_slider').max = (screen == 'n_dynamic' || screen == 'en_dynamic') ? 10 : 1.1;
        for (const id of graphs) { Plotly.Plots.resize(document.getElementById(id)); }
        info_toggle(infoBoxes, 1);
        screen == 'en_dynamic' ? update_heatmap() : null;
        for (const id of graphs) { document.getElementById(id).querySelector('[data-title="Reset axes"]').click(); }
        update_graphs();
    });
});

// =============================================================================
// Nuclear dynamics data (loaded asynchronously)
// =============================================================================

fetch('qdata.json').then(response => response.json()).then(data => {
    nDynamics_bonding_data = data.nDynamics_bonding;
    nDynamics_antibonding_data = data.nDynamics_antibonding;
    nOverlap_Data = data.overlap_data;
    fullDynamics_data = data.fullDynamics;

    const overlap_magnitude = [];
    for (const i in nOverlap_Data.time) {
        overlap_magnitude.push(Math.sqrt(nOverlap_Data.real[i] ** 2 + nOverlap_Data.imag[i] ** 2));
    }

    Plotly.react('hydrogen-cation-energy-chart-nuclear', [
        bonding_energy_graph, antibonding_energy_graph,
        { x: nDynamics_bonding_data.wave_data.x, name: 'Nuclear Density on Bonding State', fill: 'toself', fillcolor: 'rgba(31, 119, 180, 0.3)' },
        { x: nDynamics_bonding_data.wave_data.x, name: 'Nuclear Density on Antibonding State', fill: 'toself', fillcolor: 'rgba(255, 127, 14, 0.3)' },
    ], {
        ...layout_energy,
        xaxis: { ...layout_energy.xaxis, range: [0.5, 20] },
        //yaxis: { ...layout_energy.yaxis, range: [-2, 20] },
        shapes: {},
    }, config);

    Plotly.react('hydrogen-cation-nuclear-position-chart', [
        { x: nDynamics_bonding_data.position_data.x, y: nDynamics_bonding_data.position_data.y, name: 'Bonding State' },
        { x: nDynamics_antibonding_data.position_data.x, y: nDynamics_antibonding_data.position_data.y, name: 'Antionding State' },
        { x: nDynamics_bonding_data.position_data.x, name: 'Average', visible: 'legendonly' },
    ], layout_nPosition, config);

    Plotly.react('hydrogen-cation-nuclear-momentum-chart', [
        { x: nDynamics_bonding_data.momentum_data.x, y: nDynamics_bonding_data.momentum_data.y, name: 'Bonding State' },
        { x: nDynamics_antibonding_data.momentum_data.x, y: nDynamics_antibonding_data.momentum_data.y, name: 'Antibonding State' },
        { x: nDynamics_bonding_data.momentum_data.x, name: 'Average', visible: 'legendonly' },
    ], layout_nMomentum, config);

    Plotly.react('fullDynamics-probability-chart', [
        { x: fullDynamics_data.x, name: 'Total Probability' },
        { x: fullDynamics_data.x, name: '$|c_{\\text{B}}|^2 \\int \\rho_{\\text{B}} |\\chi_{\\text{B}}|^2 dR$', visible: 'legendonly' },
        { x: fullDynamics_data.x, name: '$|c_{\\text{A}}|^2 \\int \\rho_{\\text{A}} |\\chi_{\\text{A}}|^2 dR$', visible: 'legendonly' },
        { x: fullDynamics_data.x, name: '$|c_{\\text{B}}| |c_{\\text{A}}| \\int \\rho_{\\text{BA}} \\chi^{*}_{\\text{B}} \\chi_{\\text{A}} dR$', visible: 'legendonly' },
        { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: 'purple' }, name: 'Protons on Bonding State' },
        { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: 'yellow' }, name: 'Protons on Antibonding State' },
    ], {
        ...layout_prob,
        showlegend: true,
        legend: { x: 1, y: 1, xanchor: 'right', yanchor: 'top', bgcolor: 'rgba(255,255,255,0.5)' },
        yaxis: { title: { text: 'Probability' }, range: [-0.225, 0.55] },
    }, config);

    Plotly.react('nuclear-overlap-chart', [
        { x: nOverlap_Data.time, y: nOverlap_Data.real, name: 'Real Part' },
        { x: nOverlap_Data.time, y: nOverlap_Data.imag, name: 'Imaginary Part' },
        { x: nOverlap_Data.time, y: overlap_magnitude, name: 'Magnitude' },
    ], {
        font: { size: PLOT_FONT_SIZE },
        xaxis: { range: [0, 10], title: { text: 'Time [fs]' } },
        yaxis: { title: { text: '$\\langle \\chi_{\\text{B}} \\vert \\chi_{\\text{A}} \\rangle$' } },
        legend: { x: 1, y: 1, xanchor: 'right', yanchor: 'top', bgcolor: 'rgb(255,255,255,0.5)' },
        shapes: [{
            type: 'line', line: { color: 'black', dash: 'dash' },
            x0: radiusSliderInput.value, y0: -3, x1: radiusSliderInput.value, y1: 3,
        }],
        margin: { l: 55, r: 15, b: 55, t: 25, pad: 10 },
    }, config);
    Plotly.react('time-electron-density-chart', [{x:time_axis, y:fullDynamics_data.x, type:'heatmap'}], time_electron_density_layout, config);
});
