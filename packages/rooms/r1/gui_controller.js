class GUIController {
    #id;
    #views = new Map();
    #store;
    #control;

    constructor(store, cfg) {
        this.#id = cfg.id;
        this.#store = store;
        for (const viewCfg of cfg.views) {
            const view = new GUIView(this, viewCfg);
            this.#views.set(viewCfg.id, view);
        }
    }

    connectHaService() {
        for (const view of this.#views.values()) {
            view.bindEntities();
        }
    }

    link(entityId, updateCallback) {
        const callback = this.#store.link(entityId, updateCallback);
        return callback;
    }


    buildDom() {
        this.#control = document.createElement("div");

        this.#control.id = this.#id;
        this.#control.className = "controller";

        for (const view of this.#views.values()) {
            this.#control.appendChild(
                view.assembleDom()
            );
        }

        return this.#control;
    }

}