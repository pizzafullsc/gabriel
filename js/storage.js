const Storage = {

    obtener() {
        return JSON.parse(localStorage.getItem("gabriel_pedidos")) || [];
    },

    guardar(pedido) {

        const pedidos = this.obtener();

        pedido.id = Date.now();
        pedido.fecha = new Date().toLocaleString("es-UY");
        pedido.estado = "Nuevo";

        pedidos.unshift(pedido);

        localStorage.setItem(
            "gabriel_pedidos",
            JSON.stringify(pedidos)
        );

    },

    actualizarEstado(id) {

        const pedidos = this.obtener();

        const estados = [
            "Nuevo",
            "Preparando",
            "Listo",
            "Entregado"
        ];

        const pedido = pedidos.find(p => p.id === id);

        if (!pedido) return;

        let indice = estados.indexOf(pedido.estado);

        indice++;

        if (indice >= estados.length)
            indice = 0;

        pedido.estado = estados[indice];

        localStorage.setItem(
            "gabriel_pedidos",
            JSON.stringify(pedidos)
        );

    },

    borrar() {

        localStorage.removeItem("gabriel_pedidos");

    }

};