const Storage = {

    estados: [
        "Nuevo",
        "Preparando",
        "Listo",
        "Entregado"
    ],

    coleccion: null,

    iniciar() {

        if (typeof db !== "undefined") {
            this.coleccion = db.collection("pedidos");
        }

    },

    obtener() {

        return JSON.parse(
            localStorage.getItem("gabriel_pedidos")
        ) || [];

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

        if (this.coleccion) {

            this.coleccion
                .doc(String(pedido.id))
                .set(pedido)
                .catch(console.error);

        }

    },

    actualizar(pedidoActualizado) {

        const pedidos = this.obtener();

        const indice = pedidos.findIndex(
            p => p.id === pedidoActualizado.id
        );

        if (indice === -1) return;

        pedidos[indice] = pedidoActualizado;

        localStorage.setItem(
            "gabriel_pedidos",
            JSON.stringify(pedidos)
        );

        if (this.coleccion) {

            this.coleccion
                .doc(String(pedidoActualizado.id))
                .set(pedidoActualizado)
                .catch(console.error);

        }

    },

    cambiarEstado(id) {

        const pedidos = this.obtener();

        const pedido = pedidos.find(
            p => p.id === id
        );

        if (!pedido) return null;

        let indice = this.estados.indexOf(
            pedido.estado
        );

        indice++;

        if (indice >= this.estados.length)
            indice = 0;

        pedido.estado = this.estados[indice];

        localStorage.setItem(
            "gabriel_pedidos",
            JSON.stringify(pedidos)
        );

        if (this.coleccion) {

            this.coleccion
                .doc(String(pedido.id))
                .set(pedido)
                .catch(console.error);

        }

        return pedido;

    },

    borrar() {

        localStorage.removeItem(
            "gabriel_pedidos"
        );

    }

};

Storage.iniciar();