function normalizarTexto(valor) {

    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

}

function extraerCampo(texto, campos) {

    const nombres = Array.isArray(campos) ? campos : [campos];
    const lineas = String(texto || "").split(/\r?\n/);
    const etiquetasBuscadas = nombres.map(normalizarTexto);
    const etiquetasConocidas = [
        "cliente",
        "nombre",
        "name",
        "celular",
        "telefono",
        "phone",
        "direccion",
        "address",
        "referencia",
        "reference",
        "pedido",
        "productos",
        "order",
        "pago",
        "payment",
        "cambio",
        "observaciones",
        "notas",
        "notes",
        "mesa",
        "table"
    ];

    let capturando = false;
    const resultado = [];

    for (const linea of lineas) {

        const separador = linea.indexOf(":");

        if (separador > -1) {

            const etiqueta = normalizarTexto(linea.slice(0, separador).trim());
            const valor = linea.slice(separador + 1).trim();

            if (etiquetasBuscadas.includes(etiqueta)) {
                capturando = true;
                resultado.push(valor);
                continue;
            }

            if (capturando && etiquetasConocidas.includes(etiqueta)) {
                break;
            }

        }

        if (capturando) {
            resultado.push(linea.trim());
        }

    }

    return resultado.join("\n").trim();

}

function interpretarPedido(texto) {

    return {

        cliente:
            extraerCampo(texto, ["Cliente", "Nombre", "Name"]),

        telefono:
            extraerCampo(texto, ["Celular", "Telefono", "Teléfono", "Phone"]),

        direccion:
            extraerCampo(texto, ["Dirección", "Direccion", "Address"]),

        referencia:
            extraerCampo(texto, ["Referencia", "Reference"]),

        mesa:
            extraerCampo(texto, ["Mesa", "Table"]),

        pedido:
            extraerCampo(texto, ["Pedido", "Productos", "Order"]),

        pago:
            extraerCampo(texto, ["Pago", "Payment"]),

        cambio:
            extraerCampo(texto, ["Cambio"]),

        observaciones:
            extraerCampo(texto, ["Observaciones", "Notas", "Notes"])

    };

}
