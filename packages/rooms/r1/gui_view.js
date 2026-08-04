class GUIView {
    #id;
    #widgets = new Map();
    #controller;
    #control;

    constructor(controller, cfg) {
        this.#id = cfg.id;
        this.#controller = controller;
        for (const widgetCfg of cfg.widgets) {
            const widget = new GUIWidget(this, widgetCfg);
            this.#widgets.set(widgetCfg.id, widget);
        }
    }

    bindEntities() {
        for (const widget of this.#widgets.values()) {
            widget.bindEntities();
        }
    }

    link(entityId, updateCallback) {
        const callback = this.#controller.link(entityId, updateCallback);
        return callback;
    }

    assembleDom() {
        this.#control = document.createElement("div");

        this.#control.id = this.#id;
        this.#control.className = "view";

        for (const widget of this.#widgets.values()) {
            this.#control.appendChild(
                widget.assembleDom()
            );
        }

        return this.#control;
    }
}