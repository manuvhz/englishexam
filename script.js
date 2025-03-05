const API_KEY = "AIzaSyC70pXH6sFPKdE3g1EI_avTO7vvTOX2GcY";
const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent";

let preguntas = [];

async function generarExamen() {
    document.getElementById("exam-container").innerHTML = `
        <div class="question-card loading">⌛ Procesando... Por favor, espera.</div>`;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Genera 10 preguntas de inglés de selección múltiple para niños de 8 a 12 años.
                               Cada pregunta debe tener 4 opciones (a, b, c, d) y solo una respuesta correcta.
                               Formato exacto:
                               Pregunta 1. [Pregunta]?
                               a) [Opción 1]
                               b) [Opción 2]
                               c) [Opción 3]
                               d) [Opción 4]
                               Respuesta correcta: [Letra]`
                    }]
                }]
            })
        });

        if (response.status === 429) throw new Error("Demasiadas solicitudes, por favor intenta más tarde.");
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const data = await response.json();
        const texto = data.candidates[0]?.content?.parts[0]?.text || "";
        console.log("Respuesta de la API:", texto); // Depuración

        preguntas = parsearPreguntas(texto);

        if (preguntas.length === 0) throw new Error("No se generaron preguntas. Intenta nuevamente.");

        mostrarExamen(preguntas);

    } catch (error) {
        document.getElementById("exam-container").innerHTML = `
            <div class="question-card error">
                ❌ Lo sentimos, ha ocurrido un problema.<br>
                ${error.message}
            </div>`;
    }
}

function parsearPreguntas(texto) {
    return texto.split('\n\n').filter(p => p.trim()).map(bloque => {
        const lineas = bloque.split('\n').filter(l => l.trim());

        if (lineas.length < 6) {
            console.error("Formato de pregunta incorrecto:", bloque);
            return null;
        }

        const pregunta = lineas[0].replace(/Pregunta \d+\.\s*/, '');
        const opciones = {};

        lineas.slice(1, 5).forEach(linea => {
            const match = linea.match(/([a-d])\)\s*(.+)/);
            if (match) opciones[match[1]] = match[2];
        });

        const respuestaCorrecta = lineas[5]?.match(/Respuesta correcta:\s*([a-d])/i)?.[1];
        if (!respuestaCorrecta) {
            console.error("Respuesta correcta no encontrada:", bloque);
            return null;
        }

        return { pregunta, opciones, correcta: respuestaCorrecta };
    }).filter(p => p !== null);
}

// (Mantén las funciones mostrarExamen, calificarExamen y mostrarResultados iguales)
