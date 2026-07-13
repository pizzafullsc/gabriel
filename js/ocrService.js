const OcrService = {

    async reconocerImagen(archivo, onProgreso) {

        if (!archivo) {
            return "";
        }

        if (typeof Tesseract === "undefined") {
            throw new Error("OCR no disponible. No se pudo cargar Tesseract.js.");
        }

        this.notificar(onProgreso, "Leyendo imagen...");

        const resultado = await Tesseract.recognize(
            archivo,
            "spa",
            {
                logger: estado => {
                    if (!estado || typeof onProgreso !== "function") {
                        return;
                    }

                    if (estado.status === "recognizing text") {
                        const porcentaje = Math.round(Number(estado.progress || 0) * 100);
                        this.notificar(onProgreso, `Reconociendo texto... ${porcentaje}%`);
                        return;
                    }

                    this.notificar(onProgreso, "Procesando imagen...");
                }
            }
        );

        return resultado && resultado.data && resultado.data.text
            ? resultado.data.text.trim()
            : "";

    },

    notificar(callback, mensaje) {

        if (typeof callback === "function") {
            callback(mensaje);
        }

    }

};
