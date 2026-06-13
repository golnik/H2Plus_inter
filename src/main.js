epsilon = 8.8541878e-12;
h_ground_energy = -13.6;
bohr_radius = 5.291772e-11;
electron_charge = 1.60217663e-19;
radius = [];
const radiusTextInput = document.getElementById('radius_text');
const radiusSliderInput = document.getElementById('radius');
bonding_energy_y = [];
antibonding_energy_y = [];
bonding_probability_y = [];
antibonding_probability_y = [];
probability_x = [];

for (let i = 0; i <= 1000; i++) {
    probability_x.push(-5 + i * 0.01);
}

for (let i = 0; i <= 1000; i++) {
    radius.push(0.1 + 0.0059 * i);
    bonding_energy_y.push(bonding_energy((0.1 + 0.0059 * i) * bohr_radius));
    antibonding_energy_y.push(antibonding_energy((0.1 + 0.0059 * i) * bohr_radius));
}

function bonding_energy(radius) {
    return ((electron_charge) / (4 * Math.PI * epsilon * radius)) * ((1 + radius / bohr_radius) * Math.exp(-2 * radius / bohr_radius) + (1 - (2 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius)) / (1 + (1 + (radius / bohr_radius) + (1 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius))
}
function antibonding_energy(radius) {
    return ((electron_charge) / (4 * Math.PI * epsilon * radius)) * ((1 + radius / bohr_radius) * Math.exp(-2 * radius / bohr_radius) - (1 - (2 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius)) / (1 - (1 + (radius / bohr_radius) + (1 / 3) * (radius / bohr_radius) ** 2) * Math.exp(-radius / bohr_radius))
}

function probability_Curve(radius, distance) {
    let p = radius
    const waveFunction1 = 0.5*Math.exp(-2*Math.abs(distance+p/2))*(1+2*Math.abs(distance+p/2));
    const waveFunction2 = 0.5*Math.exp(-2*Math.abs(p/2-distance))*(1+2*Math.abs(p/2-distance));
    const overlapIntegral = Math.exp(-p)*(1+p+(p**2)/3);
    const normalizeBond = 2+2*overlapIntegral;
    const normalizeAnti = 2-2*overlapIntegral;
    let sum = 0
    for(let i=0; i<15; i+=0.05) {
        const A = Math.sqrt(i**2+(Math.abs(distance+p/2))**2);
        const B = Math.sqrt(i**2+(Math.abs(p/2-distance))**2);
        sum += 4*i*Math.exp(-(A+B))*0.05;
    }
    return [(waveFunction1 + waveFunction2 + sum)/normalizeBond, (waveFunction1 + waveFunction2 - sum)/normalizeAnti];
}
// function antibonding_probability(radius, distance) {
//     let p = radius
//     const waveFunction1 = 0.5*Math.exp(-2*Math.abs(distance+p/2))*(1+2*Math.abs(distance+p/2));
//     const waveFunction2 = 0.5*Math.exp(-2*Math.abs(p/2-distance))*(1+2*Math.abs(p/2-distance));
//     const overlapIntegral = Math.exp(-p)*(1+p+(p**2)/3)
//     const normalize = 2-2*overlapIntegral;
//     let sum = 0
//     for(let i=0; i<15; i+=0.05) {
//         const A = Math.sqrt(i**2+(Math.abs(distance+p/2))**2);
//         const B = Math.sqrt(i**2+(Math.abs(p/2-distance))**2);
//         sum += 4*i*Math.exp(-(A+B))*0.05;
//     }
//     return (waveFunction1 + waveFunction2 - sum)/normalize;
// }

function update_radius(newRadius) {
    if (newRadius <= 0) {
        return;
    }
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
    Plotly.relayout('hydrogen-cation-energy-chart', {
        'shapes[0].x0': newRadius,
        'shapes[0].x1': newRadius
    });
    bonding_probability_y = []
    antibonding_probability_y = []
    for(const distance of probability_x) {
        const [bondingProb, antibondingProb] = probability_Curve(newRadius, distance);
        bonding_probability_y.push(bondingProb);
        antibonding_probability_y.push(antibondingProb);
    }
    Plotly.restyle('hydrogen-cation-bond-probability-chart', { y: [bonding_probability_y, [0,0]], x: [probability_x,[-(newRadius/2),newRadius/2]]}, [0, 1]);
    Plotly.restyle('hydrogen-cation-antibond-probability-chart', { y: [antibonding_probability_y, [0,0]], x: [probability_x,[-(newRadius/2),newRadius/2]]}, [0, 1]);
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
    title: { text: 'Hydrogen cation bonding and antibonding energy' },
    xaxis: {
        range: [0, 6],
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
    }]
};

const layout_prob = {
    autosize: true,
    showlegend: false,
    xaxis: {
        range: [-5, 5],
        title: { text: 'R/a<sub>0</sub>' }
    },
    yaxis: {
        title: { text: 'Probability of Electron' }
    },
};

const layout_bond_prob = { ...layout_prob, title: { text: 'Electron Probability Curve for Bonding System' } };
const layout_antibond_prob = { ...layout_prob, title: { text: 'Electron Probability Curve for Antibonding System' } };

const config = {
    responsive: true,
    // displayModeBar: false
};


Plotly.react('hydrogen-cation-energy-chart', [bonding_energy_graph, antibonding_energy_graph], layout_energy, config);
Plotly.react('hydrogen-cation-bond-probability-chart', [{ x: probability_x }, {y: [0,0], mode: 'markers', type: 'scatter', marker: { size: 12 }}], layout_bond_prob, config);
Plotly.react('hydrogen-cation-antibond-probability-chart', [{ x: probability_x }, {y: [0,0], mode: 'markers', type: 'scatter', marker: { size: 12 }}], layout_antibond_prob, config);
energy_minimum = numeric.uncmin(x => bonding_energy(x[0] * bohr_radius), [2.5]);
update_radius(energy_minimum.solution[0]);
