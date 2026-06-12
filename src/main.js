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

function bonding_probability(radius, distance) {
    let p = radius
    const waveFunction1 = Math.exp(-Math.abs(distance + p / 2)) / Math.sqrt(Math.PI);
    const waveFunction2 = Math.exp(-Math.abs(p / 2 - distance)) / Math.sqrt(Math.PI);
    const orbitalOverlap = Math.exp(-p) * (1 + p + (p ** 2) / 3);
    const normalize = 1 / Math.sqrt(2 * (1 + orbitalOverlap));
    return (normalize * (waveFunction1 + waveFunction2)) ** 2
}
function antibonding_probability(radius, distance) {
    let p = radius
    const waveFunction1 = Math.exp(-Math.abs((distance + p / 2))) / Math.sqrt(Math.PI);
    const waveFunction2 = Math.exp(-Math.abs((p / 2 - distance))) / Math.sqrt(Math.PI);
    const orbitalOverlap = Math.exp(-p) * (1 + p + (p ** 2) / 3);
    const normalize = 1 / Math.sqrt(2 * (1 - orbitalOverlap));
    return (normalize * (waveFunction1 - waveFunction2)) ** 2;
}

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
    const bonding_probability_y = probability_x.map(distance => bonding_probability(newRadius, distance));
    const antibonding_probability_y = probability_x.map(distance => antibonding_probability(newRadius, distance));
    let integral = 0
    for (let i = 0; i < probability_x.length; i++) {
        integral += 0.01 * bonding_probability(newRadius, probability_x[i]);
    }
    console.log(integral)
    Plotly.restyle('hydrogen-cation-probability-chart', { y: [bonding_probability_y, antibonding_probability_y] }, [0, 1]);
}


bonding_energy_graph = {
    x: radius,
    y: bonding_energy_y,
    name: 'E<sup>g</sup> - E<sub>1s</sub>',
};

antibonding_energy_graph = {
    x: radius,
    y: antibonding_energy_y,
    name: 'E<sup>u</sup> - E<sub>1s</sub>',
};

layout = {
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

config = {
    responsive: true,
    // displayModeBar: false
};

Plotly.react('hydrogen-cation-energy-chart', [bonding_energy_graph, antibonding_energy_graph], layout, config);
Plotly.react('hydrogen-cation-probability-chart', [{ x: probability_x }, { x: probability_x }], {}, config);
energy_minimum = numeric.uncmin(x => bonding_energy(x[0] * bohr_radius), [2.5]);
update_radius(energy_minimum.solution[0]);
