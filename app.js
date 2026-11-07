// Simulador EDO - Centro Barrial de Acopio de Envases Retornables y Vidrio
let mainChart = null;
let errChart = null;
let lastSimDataH1 = [];

// Función derivada de la EDO: dy/dt = I - k * y
function f(t, y, I, k) {
  return I - k * y;
}

// Solución Analítica Exacta: y(t) = (I/k) + (y0 - I/k) * e^(-k*t)
function exactSolution(t, y0, I, k) {
  const eq = I / k;
  return eq + (y0 - eq) * Math.exp(-k * t);
}

// Implementación numérica de Heun (RK2) y Runge-Kutta 4 (RK4)
function runNumericalSimulation(y0, I, k, h, tMax) {
  const rows = [];
  let yHeun = y0;
  let yRK4 = y0;
  const totalSteps = Math.round(tMax / h);

  for (let n = 0; n <= totalSteps; n++) {
    const t = Number((n * h).toFixed(6));
    const yExact = exactSolution(t, y0, I, k);

    const absErrHeun = Math.abs(yExact - yHeun);
    const relErrHeun = yExact !== 0 ? (absErrHeun / Math.abs(yExact)) * 100 : 0;

    const absErrRK4 = Math.abs(yExact - yRK4);
    const relErrRK4 = yExact !== 0 ? (absErrRK4 / Math.abs(yExact)) * 100 : 0;

    rows.push({
      step: n,
      t,
      yExact,
      yHeun,
      absErrHeun,
      relErrHeun,
      yRK4,
      absErrRK4,
      relErrRK4
    });

    if (n < totalSteps) {
      // Método de Heun (RK2)
      const k1_h = f(t, yHeun, I, k);
      const yPred = yHeun + h * k1_h;
      const k2_h = f(t + h, yPred, I, k);
      yHeun = yHeun + (h / 2) * (k1_h + k2_h);

      // Método Clásico Runge-Kutta de 4.º Orden (RK4)
      const k1_r = f(t, yRK4, I, k);
      const k2_r = f(t + h / 2, yRK4 + (h / 2) * k1_r, I, k);
      const k3_r = f(t + h / 2, yRK4 + (h / 2) * k2_r, I, k);
      const k4_r = f(t + h, yRK4 + h * k3_r, I, k);
      yRK4 = yRK4 + (h / 6) * (k1_r + 2 * k2_r + 2 * k3_r + k4_r);
    }
  }
  return rows;
}

function simulate() {
  const alertBox = document.getElementById('errorAlert');
  alertBox.classList.add('hidden');

  const y0 = parseFloat(document.getElementById('y0').value);
  const I = parseFloat(document.getElementById('rateI').value);
  const k = parseFloat(document.getElementById('rateK').value);
  const h1 = parseFloat(document.getElementById('stepH1').value);
  const h2 = parseFloat(document.getElementById('stepH2').value);
  const tMax = parseFloat(document.getElementById('tMax').value);
  const capMax = parseFloat(document.getElementById('capMax').value);

  if ([y0, I, k, h1, h2, tMax, capMax].some(isNaN)) {
    alertBox.textContent = 'Error: Todos los campos deben contener valores numéricos válidos.';
    alertBox.classList.remove('hidden');
    return;
  }
  if (y0 < 0 || I <= 0 || k <= 0 || h1 <= 0 || h2 <= 0 || tMax <= 0 || capMax <= 0) {
    alertBox.textContent = 'Error: Los parámetros I, k, pasos h₁/h₂, tiempo y capacidad deben ser mayores que cero (y₀ ≥ 0).';
    alertBox.classList.remove('hidden');
    return;
  }
  if (h1 > tMax || h2 > tMax) {
    alertBox.textContent = 'Error: Los tamaños de paso h₁ y h₂ no pueden superar el tiempo máximo de simulación.';
    alertBox.classList.remove('hidden');
    return;
  }
  if (k * h1 >= 2 || k * h2 >= 2) {
    alertBox.textContent = 'Advertencia de estabilidad: El producto k·h es muy alto. Usa un tamaño de paso menor para asegurar estabilidad.';
    alertBox.classList.remove('hidden');
  }

  const dataH1 = runNumericalSimulation(y0, I, k, h1, tMax);
  const dataH2 = runNumericalSimulation(y0, I, k, h2, tMax);
  lastSimDataH1 = dataH1;

  renderTable(dataH1);
  renderCharts(dataH1, capMax);
  renderComparisonAndInterpretation(y0, I, k, h1, h2, tMax, capMax, dataH1, dataH2);
  renderTheoryDocument(y0, I, k, h1, h2, tMax, capMax, dataH1, dataH2);
}

function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = data.map(r => `
    <tr class="hover:bg-slate-50">
      <td class="p-2.5 font-bold text-slate-600">${r.step}</td>
      <td class="p-2.5">${r.t.toFixed(2)}</td>
      <td class="p-2.5 font-semibold text-emerald-800">${r.yExact.toFixed(4)}</td>
      <td class="p-2.5 text-amber-700">${r.yHeun.toFixed(4)}</td>
      <td class="p-2.5 text-amber-700">${r.absErrHeun.toFixed(4)}</td>
      <td class="p-2.5 text-amber-700">${r.relErrHeun.toFixed(4)}%</td>
      <td class="p-2.5 text-blue-700">${r.yRK4.toFixed(4)}</td>
      <td class="p-2.5 text-blue-700">${r.absErrRK4.toFixed(6)}</td>
      <td class="p-2.5 text-blue-700">${r.relErrRK4.toFixed(6)}%</td>
    </tr>
  `).join('');
}

function renderCharts(data, capMax) {
  const ctxMain = document.getElementById('edoChart').getContext('2d');
  const ctxErr = document.getElementById('errorChart').getContext('2d');

  if (mainChart) mainChart.destroy();
  if (errChart) errChart.destroy();

  const labels = data.map(d => d.t.toFixed(2));

  mainChart = new Chart(ctxMain, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Solución Analítica (Exacta)',
          data: data.map(d => d.yExact),
          borderColor: '#1E5631',
          backgroundColor: 'rgba(30, 86, 49, 0.08)',
          borderWidth: 3,
          tension: 0.25,
          pointRadius: 3
        },
        {
          label: 'Método de Heun (RK2)',
          data: data.map(d => d.yHeun),
          borderColor: '#D97706',
          borderDash: [6, 4],
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 4,
          pointStyle: 'triangle'
        },
        {
          label: 'Runge-Kutta 4 (RK4)',
          data: data.map(d => d.yRK4),
          borderColor: '#2563EB',
          borderDash: [2, 2],
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 4,
          pointStyle: 'rectRot'
        },
        {
          label: `Capacidad Límite Bodega (${capMax} kg)`,
          data: data.map(() => capMax),
          borderColor: '#DC2626',
          borderDash: [4, 4],
          borderWidth: 1.8,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { title: { display: true, text: 'Tiempo t (semanas)' } },
        y: { title: { display: true, text: 'Stock de envases y(t) (kg)' }, beginAtZero: true }
      }
    }
  });

  errChart = new Chart(ctxErr, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Error Relativo Heun (%)',
          data: data.map(d => d.relErrHeun),
          borderColor: '#D97706',
          backgroundColor: 'rgba(217, 119, 6, 0.1)',
          borderWidth: 2,
          tension: 0.2
        },
        {
          label: 'Error Relativo RK4 (%)',
          data: data.map(d => d.relErrRK4),
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          borderWidth: 2,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { title: { display: true, text: 'Tiempo t (semanas)' } },
        y: { title: { display: true, text: 'Error Relativo (%)' }, beginAtZero: true }
      }
    }
  });
}

function renderComparisonAndInterpretation(y0, I, k, h1, h2, tMax, capMax, dataH1, dataH2) {
  const last1 = dataH1[dataH1.length - 1];
  const last2 = dataH2[dataH2.length - 1];
  const yEq = I / k;

  document.getElementById('stepComparisonBox').innerHTML = `
    <table class="w-full text-left border-collapse text-xs font-mono">
      <thead>
        <tr class="bg-slate-100 border-b border-slate-300 text-slate-700">
          <th class="p-2">Tamaño de Paso</th>
          <th class="p-2 text-amber-700">Error Abs. Heun</th>
          <th class="p-2 text-amber-700">Error Rel. Heun</th>
          <th class="p-2 text-blue-700">Error Abs. RK4</th>
          <th class="p-2 text-blue-700">Error Rel. RK4</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200">
        <tr>
          <td class="p-2 font-bold">h₁ = ${h1} sem (${dataH1.length - 1} pasos)</td>
          <td class="p-2 text-amber-700">${last1.absErrHeun.toFixed(4)} kg</td>
          <td class="p-2 text-amber-700">${last1.relErrHeun.toFixed(4)}%</td>
          <td class="p-2 text-blue-700">${last1.absErrRK4.toFixed(6)} kg</td>
          <td class="p-2 text-blue-700">${last1.relErrRK4.toFixed(6)}%</td>
        </tr>
        <tr>
          <td class="p-2 font-bold">h₂ = ${h2} sem (${dataH2.length - 1} pasos)</td>
          <td class="p-2 text-amber-700">${last2.absErrHeun.toFixed(4)} kg</td>
          <td class="p-2 text-amber-700">${last2.relErrHeun.toFixed(4)}%</td>
          <td class="p-2 text-blue-700">${last2.absErrRK4.toFixed(6)} kg</td>
          <td class="p-2 text-blue-700">${last2.relErrRK4.toFixed(6)}%</td>
        </tr>
      </tbody>
    </table>
  `;

  let alertHtml = '';
  if (y0 < capMax && yEq > capMax) {
    const tCrit = -(1 / k) * Math.log((yEq - capMax) / (yEq - y0));
    const reqK = I / capMax;
    alertHtml = `
      <div class="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-950">
        <strong>Alerta de Saturación de Bodega:</strong> El stock alcanzará el límite máximo de <strong>${capMax} kg</strong> en la <strong>semana ${tCrit.toFixed(2)}</strong>. A largo plazo tiende a <strong>${yEq.toFixed(0)} kg</strong>. Para evitar que la bodega colapse, la recicladora debe retirar al menos el <strong>${(reqK * 100).toFixed(1)}% semanal</strong> (k ≥ ${reqK.toFixed(3)} sem⁻¹).
      </div>
    `;
  } else if (y0 >= capMax) {
    alertHtml = `
      <div class="p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-950">
        <strong>Bodega Saturada Inicialmente:</strong> El stock inicial (${y0} kg) ya iguala o supera la capacidad máxima (${capMax} kg).
      </div>
    `;
  } else {
    alertHtml = `
      <div class="p-3 bg-emerald-50 border-l-4 border-[#1E5631] rounded text-emerald-950">
        <strong>Operación Sostenible:</strong> El inventario se estabilizará en <strong>${yEq.toFixed(1)} kg</strong>, manteniéndose siempre por debajo de la capacidad máxima de la bodega (${capMax} kg).
      </div>
    `;
  }

  document.getElementById('interpretationBox').innerHTML = `
    ${alertHtml}
    <p class="text-xs text-slate-600 mt-1">
      <strong>Precisión de los Métodos:</strong> En t = ${tMax} semanas, <strong>RK4</strong> logra un error relativo de apenas <strong>${last1.relErrRK4.toFixed(6)}%</strong> (con h₁=${h1}) y <strong>${last2.relErrRK4.toFixed(6)}%</strong> (con h₂=${h2}), siendo cientos de veces más preciso que Heun.
    </p>
  `;
}

function renderTheoryDocument(y0, I, k, h1, h2, tMax, capMax, dataH1, dataH2) {
  const yEq = I / k;
  const cVal = y0 - yEq;
  const step1 = dataH1[1] || dataH1[0];
  const last1 = dataH1[dataH1.length - 1];
  const last2 = dataH2[dataH2.length - 1];

  let tCritText = 'No se supera la capacidad con los parámetros actuales';
  if (y0 < capMax && yEq > capMax) {
    const tCrit = -(1 / k) * Math.log((yEq - capMax) / (yEq - y0));
    tCritText = `${tCrit.toFixed(2)} semanas`;
  }

  document.getElementById('theoryDynamicContent').innerHTML = `

    <!-- a) Problema y contexto -->
    <div class="space-y-3">
      <h3 class="text-lg font-bold text-[#1E5631] border-b border-emerald-100 pb-1">a) El problema que queremos resolver</h3>
      <p class="text-slate-700">
        En muchos barrios existen pequeños centros comunitarios que recolectan botellas, envases y vidrio
        para luego entregarlos a una planta recicladora. El desafío de este proyecto se llama
        <strong>"Gestión de Inventario en el Centro Barrial de Acopio de Envases Retornables y Vidrio"</strong>
        y busca ayudar a las asociaciones de tiendas de barrio, recicladores de base y familias vecinas
        que participan en estos programas de retorno.
      </p>
      <p class="text-slate-700">
        El problema concreto es el siguiente: cada semana llegan al galpón comunitario
        <strong>${I} kg de envases y vidrio</strong> provenientes de comercios y hogares del sector.
        Al mismo tiempo, el camión de la planta recicladora pasa a retirar el
        <strong>${(k * 100).toFixed(1)}% de lo que hay acumulado</strong> en ese momento.
        Si el stock supera los <strong>${capMax} kg</strong>, el espacio físico de la bodega colapsa
        y ya no es posible seguir recibiendo material, perjudicando a toda la cadena comunitaria.
      </p>
      <p class="text-slate-700">
        Esto tiene impacto directo en la comunidad: si la bodega se satura, los vecinos dejan de poder
        reciclar, se acumula basura en las calles y los recicladores de base pierden su fuente de
        ingresos. Modelar matemáticamente esta situación permite anticipar cuándo ocurrirá el colapso
        y qué ajustes hay que hacer antes de que sea tarde.
      </p>
      <div class="bg-emerald-50 border-l-4 border-[#1E5631] rounded p-3 text-slate-700 text-sm">
        <strong>Pregunta del desafío:</strong> Si la bodega parte con <strong>${y0} kg</strong>,
        recibe <strong>${I} kg por semana</strong> y la recicladora retira el
        <strong>${(k * 100).toFixed(1)}% del stock cada semana</strong>, ¿en qué semana se
        llegará al límite de <strong>${capMax} kg</strong> y cuánto material habrá acumulado
        a largo plazo si no se cambia nada?
      </div>
    </div>

    <!-- b) Modelo matemático -->
    <div class="space-y-3">
      <h3 class="text-lg font-bold text-[#1E5631] border-b border-emerald-100 pb-1">b) Cómo se traduce el problema a matemáticas</h3>
      <p class="text-slate-700">
        Para modelar esta situación usamos una <strong>ecuación diferencial ordinaria (EDO) de primer orden</strong>.
        La idea es simple: el stock de la bodega cambia cada semana porque entra material y sale material.
        Si llamamos <strong>y(t)</strong> a la cantidad de envases acumulados (en kg) en la semana t, entonces:
      </p>
      <div class="formula-box">
        Variación del stock = Entrada − Salida<br/>
        dy/dt = I − k·y   ⟹   dy/dt = ${I} − ${k}·y
      </div>
      <p class="text-slate-700">
        Aquí <strong>I = ${I} kg/semana</strong> es el flujo de ingreso constante (lo que llega cada semana),
        y <strong>k = ${k} semana⁻¹</strong> es la proporción del stock que retira la recicladora
        (un ${(k * 100).toFixed(1)}% de lo que hay).
        La condición inicial es <strong>y(0) = ${y0} kg</strong>, que es cuánto había en la bodega al comenzar.
      </p>
      <p class="text-slate-700">
        Los parámetros son <em>hipotéticos y declarados como tales</em>: fueron elegidos para representar
        una situación verosímil de un pequeño centro barrial. La simulación corre entre
        <strong>t = 0 y t = ${tMax} semanas</strong>, suponiendo que el flujo de ingreso es constante
        semana a semana y que la recicladora retira siempre la misma proporción sin fallas logísticas.
      </p>
    </div>

    <!-- c) Solución analítica -->
    <div class="space-y-3">
      <h3 class="text-lg font-bold text-[#1E5631] border-b border-emerald-100 pb-1">c) La solución exacta y cómo verificarla</h3>
      <p class="text-slate-700">
        Esta EDO tiene solución matemática exacta, lo que significa que podemos calcular el stock en
        cualquier semana con una sola fórmula, sin necesidad de ir paso a paso. Se resuelve usando
        el método del <strong>factor integrante</strong> (multiplicar ambos lados de la ecuación por
        e<sup>k·t</sup> para poder integrar directamente):
      </p>
      <div class="formula-box space-y-1.5">
        <div><span class="text-slate-500">Paso 1 — Forma estándar:</span>  dy/dt + ${k}·y = ${I}</div>
        <div><span class="text-slate-500">Paso 2 — Factor integrante μ(t) = e<sup>${k}t</sup>:</span>  d/dt [ y · e<sup>${k}t</sup> ] = ${I} · e<sup>${k}t</sup></div>
        <div><span class="text-slate-500">Paso 3 — Integrando:</span>  y(t) = ${yEq.toFixed(2)} + C · e<sup>−${k}t</sup></div>
        <div><span class="text-slate-500">Paso 4 — Condición inicial y(0) = ${y0}:</span>  C = ${y0} − ${yEq.toFixed(2)} = ${cVal.toFixed(2)}</div>
        <div class="pt-1 font-bold text-[#113829]">
          Solución exacta:  y(t) = ${yEq.toFixed(2)} ${cVal >= 0 ? '+ ' + cVal.toFixed(2) : '− ' + Math.abs(cVal).toFixed(2)} · e<sup>−${k}t</sup>  [kg]
        </div>
      </div>
      <p class="text-slate-700">
        Para comprobar que la fórmula es correcta, se hacen dos verificaciones rápidas:
        primero se reemplaza t = 0 y se confirma que da exactamente ${y0} kg (la condición inicial).
        Luego se deriva la fórmula y se comprueba que coincide con el lado derecho de la EDO
        (${I} − ${k}·y). En ambos casos la igualdad se cumple perfectamente, lo que confirma
        que la solución es válida.
      </p>
    </div>

    <!-- d) Soluciones numéricas -->
    <div class="space-y-3">
      <h3 class="text-lg font-bold text-[#1E5631] border-b border-emerald-100 pb-1">d) Aproximaciones numéricas: Heun y Runge-Kutta 4</h3>
      <p class="text-slate-700">
        Los métodos numéricos sirven cuando no existe (o no se puede encontrar fácilmente) una solución
        exacta. En este caso sí la tenemos, así que los usamos para <strong>comparar qué tan precisa es
        cada aproximación</strong> frente a la fórmula exacta. Ambos métodos avanzan semana a semana
        usando solo la derivada <em>f(t, y) = ${I} − ${k}·y</em>.
      </p>
      <p class="text-slate-700">
        A continuación se muestra el cálculo detallado del <strong>primer paso</strong>
        (desde t₀ = 0 hasta t₁ = ${h1} semanas) para cada método:
      </p>

      <p class="text-slate-700 font-semibold">① Método de Heun — predice y luego corrige</p>
      <p class="text-slate-700 text-sm mb-1">
        Heun funciona en dos tiempos: primero estima el valor siguiente con la pendiente actual
        (igual que Euler), y luego corrige ese estimado promediando con la pendiente que
        habría al final del paso. Es como tomar una ruta, ver adónde llegarías, y recalcular
        por dónde ir para llegar mejor.
      </p>
      <div class="formula-box space-y-1 mb-3">
        <div>Pendiente al inicio:   k₁ = f(0, ${y0}) = ${I} − ${k}·${y0} = <strong>${(I - k * y0).toFixed(6)}</strong></div>
        <div>Estimación inicial:    y* = ${y0} + ${h1}·${(I - k * y0).toFixed(6)} = <strong>${(y0 + h1 * (I - k * y0)).toFixed(6)}</strong></div>
        <div>Pendiente al final:    k₂ = f(${h1}, y*) = ${I} − ${k}·${(y0 + h1 * (I - k * y0)).toFixed(6)} = <strong>${(I - k * (y0 + h1 * (I - k * y0))).toFixed(6)}</strong></div>
        <div>Resultado corregido:   y₁ = ${y0} + (${h1}/2)·(${(I - k * y0).toFixed(6)} + ${(I - k * (y0 + h1 * (I - k * y0))).toFixed(6)}) = <strong class="text-amber-700">y₁(Heun) = ${step1.yHeun.toFixed(6)} kg</strong></div>
      </div>

      <p class="text-slate-700 font-semibold">② Runge-Kutta de 4.º orden (RK4) — cuatro pendientes, mayor precisión</p>
      <p class="text-slate-700 text-sm mb-1">
        RK4 hace algo similar pero calcula <strong>cuatro pendientes</strong> en distintos puntos
        dentro del mismo paso y las combina con un promedio ponderado (las del medio valen el doble).
        Esto le da mucha más información sobre cómo evoluciona la función, y por eso su error es
        muchísimo menor que el de Heun.
      </p>
      <div class="formula-box space-y-1 mb-3">
        ${(() => {
          const k1r = I - k * y0;
          const k2r = I - k * (y0 + (h1 / 2) * k1r);
          const k3r = I - k * (y0 + (h1 / 2) * k2r);
          const k4r = I - k * (y0 + h1 * k3r);
          const phi = (k1r + 2 * k2r + 2 * k3r + k4r) / 6;
          return `
            <div>k₁ = f(0, ${y0}) = ${I} − ${k}·${y0} = <strong>${k1r.toFixed(6)}</strong>  <span class="text-slate-400 text-xs">(pendiente al inicio del paso)</span></div>
            <div>k₂ = f(${(h1/2).toFixed(4)}, ${(y0 + (h1/2)*k1r).toFixed(6)}) = ${I} − ${k}·${(y0 + (h1/2)*k1r).toFixed(6)} = <strong>${k2r.toFixed(6)}</strong>  <span class="text-slate-400 text-xs">(pendiente a mitad, usando k₁)</span></div>
            <div>k₃ = f(${(h1/2).toFixed(4)}, ${(y0 + (h1/2)*k2r).toFixed(6)}) = ${I} − ${k}·${(y0 + (h1/2)*k2r).toFixed(6)} = <strong>${k3r.toFixed(6)}</strong>  <span class="text-slate-400 text-xs">(pendiente a mitad, usando k₂)</span></div>
            <div>k₄ = f(${h1}, ${(y0 + h1*k3r).toFixed(6)}) = ${I} − ${k}·${(y0 + h1*k3r).toFixed(6)} = <strong>${k4r.toFixed(6)}</strong>  <span class="text-slate-400 text-xs">(pendiente al final del paso)</span></div>
            <div class="border-t border-slate-300 pt-1 mt-1">Promedio ponderado: φ = (k₁ + 2·k₂ + 2·k₃ + k₄) / 6 = <strong>${phi.toFixed(6)}</strong></div>
            <div>Resultado: y₁ = ${y0} + ${h1}·${phi.toFixed(6)} = <strong class="text-blue-700">y₁(RK4) = ${step1.yRK4.toFixed(6)} kg</strong></div>
          `;
        })()}
      </div>

      <div class="bg-slate-50 border border-slate-200 rounded p-3 text-sm text-slate-700">
        <strong>Comparación en t₁ = ${h1} semanas:</strong>
        &nbsp; Valor exacto = <strong class="text-[#113829]">${step1.yExact.toFixed(6)} kg</strong>
        &nbsp;·&nbsp; Error de Heun = ${step1.absErrHeun.toFixed(6)} kg (${step1.relErrHeun.toFixed(6)}%)
        &nbsp;·&nbsp; Error de RK4 = ${step1.absErrRK4.toFixed(8)} kg (${step1.relErrRK4.toFixed(8)}%)
      </div>
    </div>

    <!-- e) Análisis comparativo -->
    <div class="space-y-3">
      <h3 class="text-lg font-bold text-[#1E5631] border-b border-emerald-100 pb-1">e) ¿Qué tan precisos son los métodos y qué pasa si usamos pasos más pequeños?</h3>
      <p class="text-slate-700">
        Al llegar a la semana ${tMax} con un paso de <strong>h₁ = ${h1}</strong>, el método de Heun
        acumuló un error de <strong>${last1.absErrHeun.toFixed(4)} kg</strong> respecto a la solución
        exacta, lo que representa un <strong>${last1.relErrHeun.toFixed(4)}%</strong> de diferencia.
        RK4, en cambio, apenas se equivocó en <strong>${last1.absErrRK4.toFixed(6)} kg</strong>
        (un <strong>${last1.relErrRK4.toFixed(6)}%</strong>), prácticamente coincidiendo con el
        valor exacto.
      </p>
      <p class="text-slate-700">
        Cuando se reduce el tamaño de paso a <strong>h₂ = ${h2}</strong> (la mitad), algo interesante
        ocurre: el error de Heun cae aproximadamente <strong>4 veces</strong>, porque es un método de
        segundo orden — su error se comporta como h². El error de RK4 cae aproximadamente
        <strong>16 veces</strong>, porque es de cuarto orden — su error se comporta como h⁴.
        Esto significa que con un paso dos veces más pequeño, RK4 mejora su precisión 16 veces,
        mientras que Heun solo la mejora 4 veces.
      </p>
      <p class="text-slate-700">
        La tabla y los gráficos del simulador muestran esta evolución del error en cada semana para
        ambos métodos y ambos tamaños de paso, permitiendo ver visualmente cómo convergen hacia
        la solución exacta.
      </p>
    </div>

    <!-- f) Interpretación y conclusiones -->
    <div class="space-y-3">
      <h3 class="text-lg font-bold text-[#1E5631] border-b border-emerald-100 pb-1">f) ¿Qué nos dicen los resultados y qué puede hacer la comunidad?</h3>
      <p class="text-slate-700">
        La pregunta de partida era saber cuándo la bodega llegaría a su límite y qué pasaría a largo
        plazo. La respuesta matemática es clara: despejando t en la ecuación y(t) = ${capMax} se obtiene
        que la bodega alcanza su capacidad en <strong>${tCritText}</strong>. Con los parámetros del
        caso base (I = 600, k = 0.20, y₀ = 500), eso ocurre exactamente alrededor de la
        <strong>semana 8</strong>. Si no se toma ninguna acción, el inventario de largo plazo tendería
        a estabilizarse en <strong>${yEq.toFixed(0)} kg</strong> — es decir, ${yEq > capMax ? `${(yEq - capMax).toFixed(0)} kg por encima de la capacidad máxima, lo cual haría inviable la operación.` : `dentro de la capacidad máxima, lo que indica que la operación es sostenible con estos parámetros.`}
      </p>
      <p class="text-slate-700">
        Para evitar el colapso, la asociación barrial debería negociar con la planta recicladora
        que el retiro semanal sea de al menos el <strong>${((I / capMax) * 100).toFixed(1)}%
        del stock acumulado</strong> (k ≥ ${(I / capMax).toFixed(3)} sem⁻¹). Con ese ajuste,
        el inventario de equilibrio bajaría justo a ${capMax} kg y la bodega nunca se saturaría.
      </p>
      <p class="text-slate-700">
        En cuanto a los métodos numéricos, <strong>RK4 fue claramente el más preciso</strong> en
        todos los ensayos realizados, con errores tan pequeños que en la práctica son despreciables.
        Heun también es una buena aproximación, pero con pasos grandes su error es notablemente mayor.
        Para un centro de acopio real, donde los datos de entrada ya tienen incertidumbre (días de
        lluvia, feriados, fluctuaciones del mercado), RK4 ofrece la garantía de que el error del
        método en sí no va a ser el problema.
      </p>
      <p class="text-slate-700">
        Una <strong>limitación importante del modelo</strong> es que asume un flujo de ingreso
        completamente constante semana a semana, lo cual no siempre es real. En época de fiestas
        o campañas de reciclaje, pueden llegar el doble de envases. Además, el modelo no considera
        que la recicladora pueda fallar en sus retiros o llegar con retraso. Incluir esas variaciones
        requeriría modelos más complejos, posiblemente con ecuaciones no lineales o estocásticas.
      </p>
    </div>
  `;
}

// Exportar tabla a CSV
document.getElementById('exportCsvBtn').addEventListener('click', () => {
  if (!lastSimDataH1.length) return;
  const headers = ['Paso_n', 'Tiempo_t_semanas', 'y_Analitica_kg', 'y_Heun_kg', 'Error_Abs_Heun_kg', 'Error_Rel_Heun_%', 'y_RK4_kg', 'Error_Abs_RK4_kg', 'Error_Rel_RK4_%'];
  const csvRows = [headers.join(',')];

  lastSimDataH1.forEach(r => {
    csvRows.push([
      r.step,
      r.t.toFixed(4),
      r.yExact.toFixed(6),
      r.yHeun.toFixed(6),
      r.absErrHeun.toFixed(6),
      r.relErrHeun.toFixed(6),
      r.yRK4.toFixed(6),
      r.absErrRK4.toFixed(6),
      r.relErrRK4.toFixed(6)
    ].join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'simulacion_acopio_envases_edo.csv';
  a.click();
});

// Eventos de navegación de pestañas
const tabSimBtn = document.getElementById('tabSimBtn');
const tabTheoryBtn = document.getElementById('tabTheoryBtn');
const viewSimulator = document.getElementById('viewSimulator');
const viewTheory = document.getElementById('viewTheory');

tabSimBtn.addEventListener('click', () => {
  tabSimBtn.classList.add('active-tab');
  tabTheoryBtn.classList.remove('active-tab');
  viewSimulator.classList.remove('hidden');
  viewTheory.classList.add('hidden');
});

tabTheoryBtn.addEventListener('click', () => {
  tabTheoryBtn.classList.add('active-tab');
  tabSimBtn.classList.remove('active-tab');
  viewTheory.classList.remove('hidden');
  viewSimulator.classList.add('hidden');
});

document.getElementById('simForm').addEventListener('submit', (e) => {
  e.preventDefault();
  simulate();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('y0').value = 500;
  document.getElementById('rateI').value = 600;
  document.getElementById('rateK').value = 0.20;
  document.getElementById('stepH1').value = 1;
  document.getElementById('stepH2').value = 0.5;
  document.getElementById('tMax').value = 16;
  document.getElementById('capMax').value = 2500;
  simulate();
});

window.addEventListener('DOMContentLoaded', simulate);
