# Simulador EDO: Centro Barrial de Acopio de Envases Retornables y Vidrio

Proyecto interactivo para la materia de Metodos Numericos. Modela el comportamiento del stock de material reciclable en una bodega comunitaria mediante una ecuacion diferencial ordinaria de primer orden, comparando la solucion exacta frente a los metodos numericos de Heun y Runge-Kutta 4.

---

## 1. Descripcion del Modelo y Que Resuelve el Proyecto

El centro de acopio barrial recolecta botellas retornables y vidrio junto a tiendas locales y familias recicladoras. Cada semana entra material y la recicladora retira un porcentaje de lo acumulado.

El objetivo del proyecto es calcular si la bodega colapsara por exceso de material y determinar en que semana ocurrira, ayudando a la asociacion vecinal a tomar decisiones operativas a tiempo.

### Ecuacion y Variables
El balance se rige por la relacion: Cambio de inventario = Ingreso semanal - Retiro semanal.

En terminos matematicos:
dy/dt = I - k * y

Donde:
- t: Tiempo transcurrido en semanas.
- y: Masa acumulada en bodega en kilogramos.
- y0: Stock inicial con el que arranca la simulacion (500 kg en el caso base).
- I: Flujo constante de recoleccion (600 kg por semana).
- k: Fraccion proporcional retirada por la recicladora (0.20 por semana, equivalente al 20 por ciento).
- Capacidad maxima: Limite fisico seguro del galpon (2500 kg).

Nota: Los parametros utilizados son hipoteticos y representan un escenario barrial verosimil.

### Solucion Exacta del Modelo
Resolviendo la ecuacion por factor integrante se obtiene la formula analitica:
y(t) = 3000 - 2500 * exp(-0.20 * t)

A largo plazo el stock tiende a estabilizarse en 3000 kg. Debido a que 3000 kg supera el limite fisico de 2500 kg, el inventario sobrepasa la capacidad en la semana 8.05. Para evitar el colapso, la recicladora deberia retirar al menos un 24 por ciento semanal.

---

## 2. Como Funciona el Codigo

El desarrollo se realizo con HTML5, Tailwind CSS y JavaScript puro sin dependencias complejas. El archivo principal de logica es app.js y esta organizado en los siguientes bloques:

### Modelado y Ecuacion
- Funcion f(t, y, I, k): Retorna el valor de la derivada I - k * y para cualquier instante.
- Funcion exactSolution(t, y0, I, k): Evalua la formula exacta analitica en cada tiempo t.

### Metodos Numericos
- Funcion runNumericalSimulation(y0, I, k, h, tMax):
  - Metodo de Heun (RK2): Calcula la pendiente inicial k1, predice el valor auxiliar y_pred con Euler y corrige promediando con la pendiente final k2.
  - Metodo Runge-Kutta 4 (RK4): Calcula cuatro pendientes intermedias (k1, k2, k3, k4), las promedia con pesos 1, 2, 2, 1 sobre 6, y avanza en el tiempo con orden 4.
  - Errores: En cada iteracion calcula el error absoluto y el error relativo porcentual comparando contra exactSolution.

### Interfaz y Visualizacion
- Chart.js: Genera tanto la grafica de evolucion del stock frente al limite de 2500 kg como la grafica comparativa de error relativo porcentual.
- Exportacion CSV: Permite descargar la tabla completa de datos simulados directamente a una hoja de calculo.
- Doble Vista: Pestaña 1 con el simulador interactivo y Pestaña 2 con la explicacion detallada del modelo paso a paso.

---

## 3. Como Usar la Aplicacion Web

No se requiere instalar Node.js ni ningun servidor especial. La aplicacion corre directamente en cualquier navegador moderno.

### Opcion Directa (Online)
Accede a la aplicacion publicada mediante GitHub Pages:
https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/

### Opcion Local
1. Descarga o clona este repositorio.
2. Abre la carpeta del proyecto.
3. Haz doble clic en el archivo index.html para abrirlo en Chrome, Edge o Firefox.

---

## 4. Estructura de Archivos

- index.html: Maquetacion de las dos pantallas, formularios y tablas.
- app.js: Algoritmos de simulacion, calculo de errores y control de graficos.
- styles.css: Ajustes visuales complementarios a Tailwind CSS.
- README.md: Documentacion del proyecto y explicacion tecnica.

---

## 5. Datos Academicos

- Estudiante / Autor: Juan Vidal Mamani Riveros
- Materia: Metodos Numericos
- Actividad: Desafio individual - EDO de primer orden con condicion inicial
- Metodos: Analitico, Heun y Runge-Kutta 4
- Gestion: 2026
