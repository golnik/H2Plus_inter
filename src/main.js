let nDynamics_bonding_data;
let nDynamics_antibonding_data;

fetch('nDynamics_bonding.json').then(response => response.json()).then(data => {
    nDynamics_bonding_data = data;
    Plotly.react('hydrogen-cation-energy-chart-nuclear', [bonding_energy_graph, antibonding_energy_graph, {x: nDynamics_bonding_data.wave_data.x, fill: 'tozeroy', fillcolor: 'rgba(31, 119, 180, 0.3)'}, {x: nDynamics_bonding_data.wave_data.x, fill: 'tozeroy', fillcolor: 'rgba(255, 127, 14, 0.3)'}], {...layout_energy, xaxis:{...layout_energy.xaxis, range:[0.5,25]}, yaxis: {...layout_energy.yaxis, range:[-2,4]}, shapes:{}}, config);

});
fetch('nDynamics_antibonding.json').then(response => response.json()).then(data => {
    nDynamics_antibonding_data = data;
    Plotly.react('hydrogen-cation-nuclear-position-chart', [{x: nDynamics_bonding_data.position_data.x, y: nDynamics_bonding_data.position_data.y}, {x: nDynamics_antibonding_data.position_data.x, y: nDynamics_antibonding_data.position_data.y}], layout_nPosition, config);
    Plotly.react('hydrogen-cation-nuclear-momentum-chart', [{x: nDynamics_bonding_data.momentum_data.x, y: nDynamics_bonding_data.momentum_data.y}, {x: nDynamics_antibonding_data.momentum_data.x, y: nDynamics_antibonding_data.momentum_data.y}], layout_nMomentum, config);
    });

const epsilon = 8.8541878e-12;
const h_ground_energy = -13.6;
const bohr_radius = 5.291772e-11;
const electron_charge = 1.60217663e-19;
const choices = ['static', 'e_dynamic', 'n_dynamic', 'en_dynamic'];
let screen = 'static';
let radius = [];
let iterate_time;
const radiusTextInput = document.getElementById('radius_text');
const radiusSliderInput = document.getElementById('radius');
let bonding_energy_y = [];
let antibonding_energy_y = [];
let bonding_probability_y = [];
let antibonding_probability_y = [];
let probability_x = [];

for (let i of choices) { document.querySelectorAll('.' + i).forEach(element => { element.style.display = 'none'; }); }
document.querySelectorAll('.static').forEach(element => { element.style.display = 'flex'; });

document.querySelectorAll('input[name="selection"]').forEach((radio) => {
    radio.addEventListener('change', function () {
        for (let i of choices) { document.querySelectorAll('.' + i).forEach(element => { element.style.display = 'none'; }); }
        document.querySelectorAll('.' + this.value).forEach(element => { element.style.display = 'flex'; });
        screen = this.value;
        stopTime();
        update_graphs();
    });
});


for (let i = 0; i <= 300; i++) {
    probability_x.push(-7.5 + i * 0.05);
}

for (let i = 0; i <= 2667; i++) {
    const rad = 1 + 0.009 * i
    radius.push(rad);
    bonding_energy_y.push(bonding_energy((rad) * bohr_radius));
    antibonding_energy_y.push(antibonding_energy((rad) * bohr_radius));
}

function info_toggle(info, close = 0) {
    if (close == 1) return info.forEach(id => document.getElementById(id).style.display = 'none');
    const element = document.getElementById(info);
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
}

function bonding_energy(radius) {
    return ((electron_charge) / (4 * Math.PI * epsilon * radius)) * ((1 + radius / bohr_radius) * Math.exp(-2 * radius / bohr_radius) + (1 - (2 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius)) / (1 + (1 + (radius / bohr_radius) + (1 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius))
}
function antibonding_energy(radius) {
    return ((electron_charge) / (4 * Math.PI * epsilon * radius)) * ((1 + radius / bohr_radius) * Math.exp(-2 * radius / bohr_radius) - (1 - (2 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius)) / (1 - (1 + (radius / bohr_radius) + (1 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius))
}

function startTime() {
    if (iterate_time) return;
    iterate_time = setInterval(() => {
        const time = parseFloat(document.getElementById('time_text').value);
        document.getElementById('time_text').value = (time + 0.01).toFixed(2);
        update_graphs();
    }, 50);
}

function stopTime() {
    if (iterate_time) {
        clearInterval(iterate_time);
        iterate_time = undefined;
    } else {
        document.getElementById('time_text').value = 0;
        document.getElementById('time_slider').value = 0;
        update_graphs();
    }
    return;
}

function probability_Curve(radius, distance) {
    const p = radius
    const waveFunction1 = 0.5 * Math.exp(-2 * Math.abs(distance + p / 2)) * (1 + 2 * Math.abs(distance + p / 2));
    const waveFunction2 = 0.5 * Math.exp(-2 * Math.abs(p / 2 - distance)) * (1 + 2 * Math.abs(p / 2 - distance));
    const overlapIntegral = Math.exp(-p) * (1 + p + (p ** 2) / 3);
    const normalizeBond = 2 + 2 * overlapIntegral;
    const normalizeAnti = 2 - 2 * overlapIntegral;
    let sum = 0
    for (let i = 0; i < 15; i += 0.05) {
        const A = Math.sqrt(i ** 2 + (Math.abs(distance + p / 2)) ** 2);
        const B = Math.sqrt(i ** 2 + (Math.abs(p / 2 - distance)) ** 2);
        sum += 4 * i * Math.exp(-(A + B)) * 0.05;
    }
    return [(waveFunction1 + waveFunction2 + sum) / normalizeBond, (waveFunction1 + waveFunction2 - sum) / normalizeAnti];
}

function eDynamics_probability_Curve(radius, distance, time = 0, c = [Math.sqrt(0.5), Math.sqrt(0.5)]) {
    const E1 = bonding_energy(radius * bohr_radius);
    const E2 = antibonding_energy(radius * bohr_radius);
    const waveFunction1 = 0.5 * Math.exp(-2 * Math.abs(distance + radius / 2)) * (1 + 2 * Math.abs(distance + radius / 2));
    const waveFunction2 = 0.5 * Math.exp(-2 * Math.abs(radius / 2 - distance)) * (1 + 2 * Math.abs(radius / 2 - distance));
    const overlapIntegral = Math.exp(-radius) * (1 + radius + (radius ** 2) / 3);
    const normalizeBond = 2 + 2 * overlapIntegral;
    const normalizeAnti = 2 - 2 * overlapIntegral;
    let sum = 0
    for (let i = 0; i < 15; i += 0.05) {
        const A = Math.sqrt(i ** 2 + (Math.abs(distance + radius / 2)) ** 2);
        const B = Math.sqrt(i ** 2 + (Math.abs(radius / 2 - distance)) ** 2);
        sum += 4 * i * Math.exp(-(A + B)) * 0.05;
    }
    const pBond = c[0] ** 2 * (waveFunction1 + waveFunction2 + sum) / normalizeBond;
    const pAnti = c[1] ** 2 * (waveFunction1 + waveFunction2 - sum) / normalizeAnti;
    const pCross = 2 * c[0] * c[1] * (waveFunction1 - waveFunction2) / (normalizeAnti * normalizeBond) * Math.cos((time * (E1 - E2)) / 0.6582119569);
    return pBond + pAnti + pCross;
}

function update_graphs(newRadius = parseFloat(radiusTextInput.value)) {
    if (newRadius <= 0 || isNaN(newRadius)) {
        return;
    }
    if (screen == 'static') {
        if (radiusTextInput.value !== newRadius) {
            radiusTextInput.value = newRadius;
        }
        if (radiusSliderInput.value !== newRadius) {
            radiusSliderInput.value = newRadius;
        }
        let bondingEnergy = bonding_energy(newRadius * bohr_radius);
        let antibondingEnergy = antibonding_energy(newRadius * bohr_radius);
        document.getElementById('bonding_text').value = bondingEnergy.toFixed(3);
        document.getElementById('antibonding_text').value = antibondingEnergy.toFixed(3);
        document.getElementById('energy_diff').value = (antibondingEnergy - bondingEnergy).toFixed(3);
        Plotly.relayout('hydrogen-cation-energy-chart', { 'shapes[0].x0': newRadius, 'shapes[0].x1': newRadius });
        bonding_probability_y = []
        antibonding_probability_y = []
        for (const distance of probability_x) {
            const [bondingProb, antibondingProb] = probability_Curve(newRadius, distance);
            bonding_probability_y.push(bondingProb);
            antibonding_probability_y.push(antibondingProb);
        }
        Plotly.restyle('hydrogen-cation-bond-probability-chart', { y: [bonding_probability_y, [0, 0]], x: [probability_x, [-(newRadius / 2), newRadius / 2]] }, [0, 1]);
        Plotly.restyle('hydrogen-cation-antibond-probability-chart', { y: [antibonding_probability_y, [0, 0]], x: [probability_x, [-(newRadius / 2), newRadius / 2]] }, [0, 1]);
    }
    else if (screen == 'e_dynamic') {
        if (radiusTextInput.value !== newRadius) {
            radiusTextInput.value = newRadius;
        }
        if (radiusSliderInput.value !== newRadius) {
            radiusSliderInput.value = newRadius;
        }
        const bondingEnergy = bonding_energy(newRadius * bohr_radius);
        const antibondingEnergy = antibonding_energy(newRadius * bohr_radius);
        document.getElementById('bonding_text').value = bondingEnergy.toFixed(3);
        document.getElementById('antibonding_text').value = antibondingEnergy.toFixed(3);
        document.getElementById('energy_diff').value = (antibondingEnergy - bondingEnergy).toFixed(3);
        document.getElementById('c1Text').value = document.getElementById('c1').value
        document.getElementById('c2Text').value = document.getElementById('c2').value
        const c1 = Math.sqrt(document.getElementById('c1').value);
        const c2 = Math.sqrt(document.getElementById('c2').value);
        electron_dynamics_y = []
        for (const distance of probability_x) {
            electron_dynamics_y.push(eDynamics_probability_Curve(newRadius, distance, document.getElementById('time_text').value, [c1, c2]))
        }
        Plotly.relayout('hydrogen-cation-energy-chart', { 'shapes[0].x0': newRadius, 'shapes[0].x1': newRadius });
        Plotly.restyle('hydrogen-cation-electron-dynamics-chart', { y: [electron_dynamics_y, [0, 0]], x: [probability_x, [-(newRadius / 2), newRadius / 2]] }, [0, 1]);
    }
    else if (screen == 'n_dynamic') {
        const time = parseFloat(document.getElementById('time_text').value).toFixed(2)
        const y_data_bond = nDynamics_bonding_data.wave_data.y[time];
        const y_data_anti = nDynamics_antibonding_data.wave_data.y[time];
        Plotly.restyle('hydrogen-cation-energy-chart-nuclear', {y: [bonding_energy_y, antibonding_energy_y, y_data_bond, y_data_anti]}, [0,1,2,3]);
        Plotly.relayout('hydrogen-cation-nuclear-position-chart', { 'shapes[0].x0': time, 'shapes[0].x1': time});
        Plotly.relayout('hydrogen-cation-nuclear-momentum-chart', { 'shapes[0].x0': time, 'shapes[0].x1': time});
    }
}


const bonding_energy_graph = {
    x: radius,
    y: bonding_energy_y,
    name: 'E<sup>g</sup> - E<sub>1s</sub>',
};

const antibonding_energy_graph = {
    x: radius,
    y: antibonding_energy_y,
    name: 'E<sup>u</sup> - E<sub>1s</sub>',
};

const layout_energy = {
    autosize: true,
    showlegend: false,
    xaxis: {
        range: [0.5, 6],
        title: { text: 'R/a<sub>0</sub>' }
    },
    yaxis: {
        range: [-3, 4],
        title: { text: 'E<sup>g,u</sup> - E<sub>1s</sub> (eV)' }
    },
    annotations: [
        {
            x: 1.65,
            y: bonding_energy(1.3 * bohr_radius),
            text: 'E<sup>g</sup> - E<sub>1s</sub>',
            showarrow: false
        },
        {
            x: 3.75,
            y: antibonding_energy(3.4 * bohr_radius),
            text: 'E<sup>u</sup> - E<sub>1s</sub>',
            showarrow: false
        }
    ],
    shapes: [{
        type: 'line',
        line: { color: 'black', dash: 'dash' },
        x0: radiusSliderInput.value, y0: -4, x1: radiusSliderInput.value, y1: 300
    }],
    margin: { l: 55, r: 15, b: 55, t: 25, pad: 10 }
};

const layout_nPosition = {
    autosize: true,
    showlegend: false,
    xaxis: {
        range: [0, 10],
        title: { text: 'Time (fs)' }
    },
    yaxis: {
        title: { text: '<R/a<sub>0</sub>> (borh)' }
    },
    shapes: [{
        type: 'line',
        line: { color: 'black', dash: 'dash' },
        x0: 0, y0: 0, x1: 0, y1: 15.5
    }],
    margin: { l: 55, r: 15, b: 55, t: 25, pad: 10 }
};

const layout_nMomentum = {
    autosize: true,
    showlegend: false,
    xaxis: {
        range: [0, 10],
        title: { text: 'Time (fs)' }
    },
    yaxis: {
        title: { text: '<p> (bohr<sup>-1</sup>)' }
    },
    shapes: [{
        type: 'line',
        line: { color: 'black', dash: 'dash' },
        x0: 0, y0: 0, x1: 0, y1: 34
    }],
    margin: { l: 55, r: 15, b: 55, t: 25, pad: 10 }
};

const layout_prob = {
    autosize: true,
    showlegend: false,
    xaxis: {
        title: { text: 'R/a<sub>0</sub>' }
    },
    yaxis: {
        range: [-0.015, 0.4],
        title: { text: 'Probability of Electron' }
    },
    margin: { l: 55, r: 15, b: 55, t: 25, pad: 10 }
};

layout_edynamics_prob = { ...layout_prob, yaxis: { ...layout_prob.yaxis, range: [-0.015, 0.75] } }

const config = {
    responsive: true,
    displayModeBar: false
};


Plotly.react('hydrogen-cation-energy-chart', [bonding_energy_graph, antibonding_energy_graph], layout_energy, config);
Plotly.react('hydrogen-cation-bond-probability-chart', [{ x: probability_x, line: { color: 1 }, name: '|<i>\u03C8</i><sub>B</sub>(R)|<sup>2</sup>' }, { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: 'red' }, name: 'proton' }], layout_prob, config);
Plotly.react('hydrogen-cation-antibond-probability-chart', [{ x: probability_x, line: { color: '#ff7f0e' }, name: '|<i>\u03C8</i><sub>A</sub>(R)|<sup>2</sup>' }, { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: 'red' }, name: 'proton' }], layout_prob, config);
Plotly.react('hydrogen-cation-electron-dynamics-chart', [{ x: probability_x, name: '|<i>\u03C8</i>(R,t)|<sup>2</sup>' }, { y: [0, 0], mode: 'markers', type: 'scatter', marker: { size: 12, color: 'red' }, name: 'proton' }], layout_edynamics_prob, config)
energy_minimum = numeric.uncmin(x => bonding_energy(x[0] * bohr_radius), [2.5]);
update_graphs(energy_minimum.solution[0]);