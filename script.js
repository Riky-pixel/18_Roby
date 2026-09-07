// === INCOLLA QUI L'URL DELLA TUA APP SCRIPT ===
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbykbLzzFiLznYL-PXhNyRZ2jkMz0_20bApYquODxvD3CNGrO9gz8jxlGlSWN_jKtZy-/exec';
const fileInput = document.getElementById('fileInput');
const fileCount = document.getElementById('fileCount');
const submitBtn = document.getElementById('submitBtn');
const uploadForm = document.getElementById('uploadForm');
const customNameInput = document.getElementById('customName');
const statusMessage = document.getElementById('statusMessage');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    if (files.length === 0) {
        fileCount.textContent = "Seleziona Foto / Video";
        submitBtn.disabled = true;
    } else if (files.length === 1) {
        fileCount.textContent = "1 file selezionato";
        submitBtn.disabled = false;
    } else {
        fileCount.textContent = `${files.length} file selezionati`;
        submitBtn.disabled = false;
    }
});

const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
            if ((encoded.length % 4) > 0) {
                encoded += '='.repeat(4 - (encoded.length % 4));
            }
            resolve(encoded);
        };
        reader.onerror = error => reject(error);
    });
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const files = fileInput.files;
    const customName = customNameInput.value.trim();
    if (files.length === 0) return;

    submitBtn.disabled = true;
    customNameInput.disabled = true;
    progressContainer.style.display = "block";
    progressText.style.display = "block";
    statusMessage.textContent = "";

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Inizializza la barra per il file corrente
        progressBar.style.width = "0%";
        progressText.textContent = `Caricamento file ${i + 1} di ${files.length}...`;

        // Simulazione avanzamento visivo per bypassare il blocco di Google
        let progress = 0;
        const fakeProgress = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 10;
                if (progress > 90) progress = 90;
                progressBar.style.width = progress + "%";
            }
        }, 400);

        try {
            const base64Data = await getBase64(file);
            
            const payload = {
                filename: file.name,
                mimeType: file.type,
                base64: base64Data,
                customName: customName
            };

            // Utilizziamo fetch, che è compatibile con i server di Google
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
            });

            clearInterval(fakeProgress);

            if (!response.ok) throw new Error("Errore di rete");

            // Porta la barra al 100% per questo file
            progressBar.style.width = "100%";
            progressText.textContent = "Salvato!";
            
            await new Promise(r => setTimeout(r, 600));

        } catch (error) {
            clearInterval(fakeProgress);
            console.error("Errore:", error);
            statusMessage.textContent = `Errore di connessione. Riprova.`;
            statusMessage.className = "status-message error";
            resetUI();
            return; 
        }
    }

    // Successo
    statusMessage.textContent = "Caricamento completato con successo! Grazie!";
    statusMessage.className = "status-message success";
    uploadForm.reset();
    fileCount.textContent = "Seleziona Foto / Video";
    resetUI();
    
    setTimeout(() => {
        statusMessage.textContent = "";
        statusMessage.className = "status-message";
    }, 5000);
});

function resetUI() {
    submitBtn.disabled = false;
    customNameInput.disabled = false;
    setTimeout(() => {
        progressContainer.style.display = "none";
        progressText.style.display = "none";
        progressBar.style.width = "0%";
    }, 2000);
}
