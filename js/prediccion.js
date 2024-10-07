document.addEventListener('DOMContentLoaded', function () {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const results = document.getElementById('results');
    const recommendation = document.getElementById('recommendation');
    const details = document.getElementById('details');
    const analysisBelowBarChart = document.getElementById('analysisBarChart');
    const analysisBelowHeatmap = document.getElementById('analysisHeatmap');
    let latitude, longitude;

    // Inicializar el mapa de Leaflet con la capa de ESRI World Street Map
    const map = L.map('map').setView([0, 0], 2); // Centro en [0, 0] con zoom 2

    // Añadir la capa ESRI World Street Map con etiquetas de países y ciudades
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/en-us/home">ESRI</a> contributors',
        maxZoom: 18
    }).addTo(map);

    // Evento para obtener latitud y longitud al hacer clic en el mapa
    map.on('click', function (e) {
        latitude = e.latlng.lat;
        longitude = e.latlng.lng;
        console.log(`Ubicación seleccionada: Lat ${latitude}, Lon ${longitude}`);
    });

    analyzeBtn.addEventListener('click', async function () {
        if (!latitude || !longitude) {
            alert("Por favor, seleccione una ubicación en el mapa primero.");
            return;
        }

        analyzeBtn.textContent = 'Analizando...';
        analyzeBtn.disabled = true;  // Desactivar el botón mientras se procesa

        try {
            // Simular datos de precipitación y NDVI basados en la ubicación seleccionada
            const imerg_precip = (Math.random() * 50) + 50;  // Precipitación simulada entre 50 y 100 mm
            const modis_ndvi = Math.random();  // NDVI entre 0 y 1

            // Generar el análisis detallado usando GPT-4
            const ai_analysis = await generate_ai_analysis(imerg_precip, modis_ndvi, latitude, longitude);

            // Actualizar los resultados con la recomendación y el análisis de GPT-4
            let recommendationText = `<strong>${ai_analysis.recommendation}</strong>`;
            let detailsText = ai_analysis.details.replace(/\n/g, "<br>");

            recommendation.innerHTML = recommendationText;
            details.innerHTML = detailsText;
            results.classList.remove('hidden');

            // Generar análisis debajo de cada gráfica
            const barChartAnalysis = await generate_extra_analysis(imerg_precip, modis_ndvi, 'barras');
            analysisBelowBarChart.innerHTML = `<strong>Análisis de la gráfica de barras:</strong><br>${barChartAnalysis}`;

            const heatmapAnalysis = await generate_extra_analysis(imerg_precip, modis_ndvi, 'mapa de calor');
            analysisBelowHeatmap.innerHTML = `<strong>Análisis del mapa de calor:</strong><br>${heatmapAnalysis}`;

            // Generar gráficas: barra y mapa de calor
            generate_plots(imerg_precip, modis_ndvi);

        } catch (error) {
            console.error("Error durante el análisis: ", error);
            recommendation.innerHTML = "<strong>Error en el análisis</strong>";
            details.innerHTML = "No se pudo generar el análisis. Intente nuevamente.";
        } finally {
            analyzeBtn.textContent = 'Analizar el Área';
            analyzeBtn.disabled = false;  // Reactivar el botón
        }
    });
});

// Función para generar gráficas usando Chart.js
function generate_plots(imerg_precip, modis_ndvi) {
    // Gráfica de barras para precipitación y NDVI
    const ctx1 = document.getElementById('graph1').getContext('2d');
    const barChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Precipitación (mm)', 'NDVI'],
            datasets: [{
                label: 'Condiciones Climáticas',
                data: [imerg_precip, modis_ndvi],
                backgroundColor: ['blue', 'green']
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Gráfica de calor mejorada para NDVI usando un gradiente de colores
    const heatmap_data = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => Math.random()));
    const ctx2 = document.getElementById('graph2').getContext('2d');

    const heatmap = new Chart(ctx2, {
        type: 'matrix',
        data: {
            datasets: [{
                label: 'Mapa de calor de NDVI',
                data: heatmap_data.flat().map((value, index) => {
                    return { x: index % 10, y: Math.floor(index / 10), v: value };
                }),
                width: () => 40,
                height: () => 40,
                backgroundColor: function (context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    const alpha = value; // Ajustar el color según el valor de NDVI
                    const r = Math.floor(255 * value);  // Rojo más intenso cuanto mayor es el valor
                    const g = Math.floor(255 * (1 - value));  // Verde más intenso cuanto menor es el valor
                    return `rgba(${r}, ${g}, 0, 0.7)`;  // Gradiente de rojo a verde
                },
                borderColor: 'black',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
                    type: 'linear',
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.dataset.data[context.dataIndex].v.toFixed(2);
                            return `NDVI: ${value}`;
                        }
                    }
                }
            }
        }
    });
}

// Función para generar análisis extra debajo de cada gráfica usando GPT-4
async function generate_extra_analysis(imerg_precip, modis_ndvi, tipoGrafico) {
    const apiKey = "sk-proj-VsmIR18FQj0DawfdPfYjT3BlbkFJAg71VCHw1NIv8AHiQgdK"; // Cambia esto con tu API Key de OpenAI
    const context = `
        He generado una gráfica de tipo ${tipoGrafico}. Aquí están los datos usados:
        - Precipitación: ${imerg_precip.toFixed(2)} mm
        - NDVI: ${modis_ndvi.toFixed(2)}
        
        Proporciona un análisis breve de lo que muestra esta gráfica.
    `;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    { role: "system", content: "Eres un asistente experto en interpretación de gráficos y datos agrícolas." },
                    { role: "user", content: context }
                ],
                max_tokens: 500,
                temperature: 0.7,
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error("Error al generar el análisis extra con GPT-4:", error);
        return "Hubo un error al generar el análisis extra. Por favor, inténtelo nuevamente.";
    }
}

// Función para generar el análisis detallado usando GPT-4
async function generate_ai_analysis(imerg_precip, modis_ndvi, lat, lon) {
    const apiKey = "sk-proj-VsmIR18FQj0DawfdPfYjT3BlbkFJAg71VCHw1NIv8AHiQgdK"; // Cambia esto con tu API Key de OpenAI
    const context = `
        Estoy analizando datos satelitales para una zona agrícola específica. Aquí tienes los datos recolectados:
        - Latitud: ${lat}
        - Longitud: ${lon}
        - Precipitación (IMERG): ${imerg_precip.toFixed(2)} mm (milímetros)
        - Índice de Vegetación de Diferencia Normalizada (NDVI) de MODIS: ${modis_ndvi.toFixed(2)}
        -Factibilidad de cultivo
        -Humedad
        -Temperatura
        -Posición solar
        
        A partir de estos datos, proporciona un análisis detallado sobre las condiciones climáticas y de vegetación en esta área y de forma puntual decir SI O NO si el agricultor puede cultivar allí y dependiendo los analisis que realices dilo. A toda costa, y mayormente, dependiendo del NDVI dime SI O NO, no acepto respuestas INDEFINIDAS.
    `;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    { role: "system", content: "Eres un asistente experto y profesional en análisis de datos geoespaciales y agrícolas." },
                    { role: "user", content: context }
                ],
                max_tokens: 3000,
                temperature: 0.7,
            })
        });

        const data = await response.json();
        const ai_content = data.choices[0].message.content;

        return {
            recommendation: "Análisis detallado:",
            details: ai_content
        };

    } catch (error) {
        console.error("Error al generar el análisis con GPT-4:", error);
        return {
            recommendation: "Error en el análisis",
            details: "Hubo un error al generar el análisis. Por favor, inténtelo nuevamente."
        };
    }
}
