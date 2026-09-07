// === INCOLLA QUI L'URL DELLA TUA APP SCRIPT (Google) ===
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJDF_2P5erSd0bB2rUETQXMquxzSDd4vKBBT_iVdDrTSvDVjF9KUPZkDMZteXALs4s/exec';

const fileInput = document.getElementById('fileInput');
const fileCount = document.getElementById('fileCount');
const submitBtn = document.getElementById('submitBtn');
const uploadForm = document.getElementById('uploadForm');
const statusMessage = document.getElementById('statusMessage');
const loader = document.getElementById('loader');

// Aggiorna il testo quando l'utente seleziona i file
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

// Funzione per convertire il file in Base64
const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Rimuove il prefisso "data:image/jpeg;base64," per mandarlo pulito ad Apps Script
            let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
            if ((encoded.length % 4) > 0) {
                encoded += '='.repeat(4 - (encoded.length % 4));
            }
            resolve(encoded);
        };
        reader.onerror = error => reject(error);
    });
}

// Gestione dell'invio del Form
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const files = fileInput.files;
    if (files.length === 0) return;

    submitBtn.disabled = true;
    loader.style.display = "block";
    statusMessage.textContent = `Caricamento in corso di 0 su ${files.length} file... Non chiudere la pagina.`;
    statusMessage.className = "status-message";

    let successCount = 0;

    // Carica un file alla volta per non sovraccaricare Google Apps Script
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const base64Data = await getBase64(file);
            
            const payload = {
                filename: file.name,
                mimeType: file.type,
                base64: base64Data
            };

            // Invia al Google Script
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
            });

            successCount++;
            statusMessage.textContent = `Caricato ${successCount} su ${files.length} file...`;

        } catch (error) {
            console.error("Errore nel caricamento del file:", file.name, error);
            statusMessage.textContent = `Errore nel caricamento. Riprova.`;
            statusMessage.className = "status-message error";
            loader.style.display = "none";
            submitBtn.disabled = false;
            return; // Interrompe il ciclo se c'è un errore
        }
    }

    // Se tutto va a buon fine
    loader.style.display = "none";
    statusMessage.textContent = "Caricamento completato con successo! Grazie!";
    statusMessage.className = "status-message success";
    uploadForm.reset();
    fileCount.textContent = "Seleziona altre Foto / Video";
    
    // Ripristina il pulsante dopo 3 secondi
    setTimeout(() => {
        statusMessage.textContent = "";
    }, 5000);
});
