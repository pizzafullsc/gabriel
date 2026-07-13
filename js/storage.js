const Storage = {

    coleccion: null,

    iniciar() {

        if (typeof db !== "undefined") {
            this.coleccion = db.collection("pedidos");
        }

    },

    estaListo() {

        return Boolean(this.coleccion);

    },

    timestampServidor() {

        if (
            typeof firebase !== "undefined" &&
            firebase.firestore &&
            firebase.firestore.FieldValue
        ) {
            return firebase.firestore.FieldValue.serverTimestamp();
        }

        return new Date().toISOString();

    },

    normalizar(doc) {

        return {
            firestoreId: doc.id,
            ...doc.data()
        };

    },

    ordenar(pedidos, direccion = "desc") {

        return pedidos.sort((a, b) => {

            const idA = Number(a.id || a.firestoreId || 0);
            const idB = Number(b.id || b.firestoreId || 0);

            return direccion === "asc"
                ? idA - idB
                : idB - idA;

        });

    },

    obtener(opciones = {}) {

        const incluirEntregados = opciones.incluirEntregados !== false;
        const direccion = opciones.direccion || "desc";

        return new Promise((resolve) => {

            if (!this.coleccion) {
                resolve([]);
                return;
            }

            this.coleccion
                .get()
                .then(snapshot => {

                    let pedidos = snapshot.docs.map(doc => this.normalizar(doc));

                    if (!incluirEntregados) {
                        pedidos = pedidos.filter(p =>
                            p.estado !== "Entregado" &&
                            p.estado !== "Cancelado"
                        );
                    }

                    resolve(this.ordenar(pedidos, direccion));

                })
                .catch(err => {

                    console.error(err);
                    resolve([]);

                });

        });

    },

    suscribir(callback, opciones = {}) {

        const incluirEntregados = opciones.incluirEntregados !== false;
        const direccion = opciones.direccion || "desc";

        if (!this.coleccion) {
            callback([]);
            return () => {};
        }

        return this.coleccion.onSnapshot(snapshot => {

            let pedidos = snapshot.docs.map(doc => this.normalizar(doc));

            if (!incluirEntregados) {
                pedidos = pedidos.filter(p =>
                    p.estado !== "Entregado" &&
                    p.estado !== "Cancelado"
                );
            }

            callback(this.ordenar(pedidos, direccion));

        }, error => {

            console.error("Error escuchando pedidos:", error);
            callback([]);

        });

    },

    guardar(pedido) {

        if (!this.coleccion) {
            return Promise.reject(new Error("Firestore no esta inicializado."));
        }

        const { firestoreId, ...datosPedido } = pedido;
        const idExistente = firestoreId || datosPedido.id;
        const esActualizacion = Boolean(idExistente);
        const idDocumento = esActualizacion ? idExistente : Date.now();
        const id = esActualizacion ? (datosPedido.id || idDocumento) : idDocumento;
        const fecha = esActualizacion && datosPedido.fecha
            ? datosPedido.fecha
            : new Date().toLocaleString("es-UY");

        const nuevoPedido = {
            ...datosPedido,
            id,
            numero: datosPedido.numero || id,
            fecha,
            estado: datosPedido.estado || "Nuevo",
            creadoEn: datosPedido.creadoEn || this.timestampServidor(),
            actualizadoEn: this.timestampServidor()
        };

        return this.coleccion
            .doc(String(idDocumento))
            .set(nuevoPedido);

    },

    cambiarEstado(id, siguienteEstado, estadosPermitidos) {

        if (!this.coleccion) {
            return Promise.reject(new Error("Firestore no esta inicializado."));
        }

        const ref = this.coleccion.doc(String(id));

        return db.runTransaction(async transaction => {

            const doc = await transaction.get(ref);

            if (!doc.exists) {
                throw new Error("El pedido ya no existe.");
            }

            const pedido = doc.data();
            const estadoActual = pedido.estado || "Nuevo";

            if (!estadosPermitidos.includes(estadoActual)) {
                throw new Error(
                    "Transicion invalida: " +
                    estadoActual +
                    " -> " +
                    siguienteEstado
                );
            }

            transaction.update(ref, {
                estado: siguienteEstado,
                actualizadoEn: this.timestampServidor()
            });

        });

    },

    marcarPreparando(id) {

        return this.cambiarEstado(id, "Preparando", ["Nuevo"]);

    },

    marcarListo(id) {

        return this.cambiarEstado(id, "Listo", ["Preparando"]);

    },

    marcarEntregado(id) {

        return this.cambiarEstado(id, "Entregado", ["Listo"]);

    },

    marcarCancelado(id) {

        return this.cambiarEstado(id, "Cancelado", ["Nuevo", "Preparando", "Listo"]);

    }

};

Storage.iniciar();
