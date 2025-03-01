const API_KEY = "AIzaSyDhYQY3B9JuuSKzT2YXZ3uotmie3y3ms6M";
const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent";

let preguntas = []; // Almacena las preguntas con respuestas correctas

async function generarExamen() {
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
                               Respuesta correcta: [Letra]
                                
                               Ejemplo:
                               Pregunta 1. What color is the sky?
                               a) Red
                               b) Blue
                               c) Green
                               d) Yellow
                               Respuesta correcta: b`
                    }]
                }]
            })
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        const data = await response.json();
        const texto = data.candidates[0].content.parts[0].text;
        preguntas = parsearPreguntas(texto);
        mostrarExamen(preguntas);

    } catch (error) {
        document.getElementById("exam-container").innerHTML = `
            <div class="question-card error">
                Error: ${error.message}
            </div>`;
    }
}

function parsearPreguntas(texto) {
    return texto.split('\n\n').filter(p => p.trim()).map(bloque => {
        const lineas = bloque.split('\n').filter(l => l.trim());
        const pregunta = lineas[0].replace(/Pregunta \d+\.\s*/, '');
        const opciones = {};
        
        lineas.slice(1, 5).forEach(linea => {
            const match = linea.match(/([a-d])\)\s*(.+)/);
            if (match) opciones[match[1]] = match[2];
        });

        const correcta = lineas[5].match(/Respuesta correcta:\s*([a-d])/i)[1];
        
        return { pregunta, opciones, correcta };
    });
}

function mostrarExamen(preguntas) {
    const examHTML = preguntas.map((p, index) => `
        <div class="question-card">
            <h3>Pregunta ${index + 1}: ${p.pregunta}</h3>
            <div class="options-container">
                ${Object.entries(p.opciones).map(([letra, texto]) => `
                    <label class="option-label">
                        <input type="radio" name="pregunta-${index}" value="${letra}" required>
                        <span>${letra}) ${texto}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');

    document.getElementById("exam-container").innerHTML = `
        <form id="exam-form">${examHTML}</form>
        <button onclick="calificarExamen()" style="margin-top:20px">📝 Calificar Examen</button>`;
}

function calificarExamen() {
    const form = document.getElementById("exam-form");
    const respuestas = new FormData(form);
    let correctas = 0;

    const resultados = preguntas.map((p, index) => {
        const respuestaUsuario = respuestas.get(`pregunta-${index}`)?.toLowerCase();
        const esCorrecta = respuestaUsuario === p.correcta;
        if (esCorrecta) correctas++;
        
        return {
            pregunta: p.pregunta,
            usuario: respuestaUsuario || 'Sin responder',
            correcta: p.correcta,
            esCorrecta
        };
    });

    const puntaje = ((correctas / preguntas.length) * 4 + 1).toFixed(2); // Escala 1.0-5.0
    
    mostrarResultados(resultados, puntaje);
}

function mostrarResultados(resultados, puntaje) {
    const resultadosHTML = resultados.map((r, index) => `
        <div class="question-card ${r.esCorrecta ? 'correct' : 'incorrect'}">
            <h3>Pregunta ${index + 1}: ${r.pregunta}</h3>
            <p>Tu respuesta: ${r.usuario.toUpperCase()} 
            (${r.esCorrecta ? '✅ Correcta' : '❌ Correcta: ' + r.correcta.toUpperCase()})</p>
        </div>
    `).join('');

    document.getElementById("results-container").innerHTML = `
        <div class="results">
            <div class="score">Tu calificación: ${puntaje}/5.0</div>
            ${resultadosHTML}
        </div>`;
    
    window.scrollTo(0, document.body.scrollHeight);
}
