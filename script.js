const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7NFQ3I5p7rZXslX3KedEAd8H_htsT9eP9wTLIO0sNkZg50z2dVI4DZcn4ZqcK_gv0/exec';

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
        
        // Protezione extra: avvisa se il file è troppo grande (> 35MB per sicurezza)
        if (file.size > 35 * 1024 * 1024) {
            statusMessage.textContent = `Il file ${file.name} è troppo grande (Max 35MB).`;
            statusMessage.className = "status-message error";
            resetUI();
            return;
        }

        try {
            const base64Data = await getBase64(file);
            
            const payload = {
                filename: file.name,
                mimeType: file.type,
                base64: base64Data,
                customName: customName
            };

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", GOOGLE_SCRIPT_URL, true);
                xhr.setRequestHeader("Content-Type", "text/plain;charset=utf-8");

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        let filePercent = event.loaded / event.total;
                        let totalPercent = Math.round(((i + filePercent) / files.length) * 100);
                        
                        progressBar.style.width = totalPercent + "%";
                        progressText.textContent = totalPercent + "%";
                        
                        if (totalPercent === 100) {
                            progressText.textContent = "Salvataggio nel Drive... attendi un istante!";
                        }
                    }
                };

                xhr.onload = () => {
                    // Google Apps Script restituisce 200 dopo il redirect
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(`Errore HTTP: ${xhr.status}`);
                    }
                };
                
                xhr.onerror = () => reject("Bloccato (Testi in locale? Permessi Script su 'Chiunque'?)");
                xhr.send(JSON.stringify(payload));
            });

        } catch (error) {
            console.error("Dettaglio Errore:", error);
            statusMessage.textContent = `Errore: ${error}`;
            statusMessage.className = "status-message error";
            resetUI();
            return; 
        }
    }

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
    progressContainer.style.display = "none";
    progressText.style.display = "none";
    progressBar.style.width = "0%";
}
