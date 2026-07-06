function extraerCampo(texto, campo) {

    const regex = new RegExp(
        campo + "\\s*:\\s*([\\s\\S]*?)(?=\\n[A-Za-zÁÉÍÓÚáéíóú ]+\\s*:|$)",
        "i"
    );

    const resultado = texto.match(regex);

    return resultado ? resultado[1].trim() : "";

}

function interpretarPedido(texto){

    return {

        cliente:
            extraerCampo(texto,"Cliente") ||
            extraerCampo(texto,"Nombre"),

        telefono:
            extraerCampo(texto,"Celular") ||
            extraerCampo(texto,"Telefono") ||
            extraerCampo(texto,"Teléfono"),

        direccion:
            extraerCampo(texto,"Dirección") ||
            extraerCampo(texto,"Direccion"),

        pedido:
            extraerCampo(texto,"Pedido"),

        pago:
            extraerCampo(texto,"Pago"),

        cambio:
            extraerCampo(texto,"Cambio"),

        observaciones:
            extraerCampo(texto,"Observaciones")

    };

}