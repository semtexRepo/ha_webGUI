class GUIWidget {
    #id;
    #entities = new Map();
    #view;
    #control;

    constructor(view, cfg) {
        this.#id = cfg.id;
        this.#view = view;
        for (const entityCfg of cfg.entities) {
            const entity = new GUIEntity(this, entityCfg);
            this.#entities.set(entityCfg.id, entity);
        }
    }

    /*
    * Loads the entities for the widget based on the provided configuration.
    */
    bindEntities() {
        for (const entity of this.#entities.values()) {
            const deviceCallback = this.#view.link(entity.entityId, entity.updateCallback.bind(entity));
            entity.setStateCallback(deviceCallback);
        }
    }

    assembleDom() {
        this.#control = document.createElement("div");

        this.#control.id = this.#id;
        this.#control.className = "widget";

        for (const entity of this.#entities.values()) {
            this.#control.appendChild(
                entity.assembleDom()
            );
        }

        return this.#control;
    }

}