class HADeviceStore {
    #socket;
    #devices = new Map();
    #subscriptions = new Map();
    #filterRules = {
        domain: [
            "input_boolean",
            "input_number",
            "input_select",
            "input_text",
            "timer"
        ],

        tokens: {
            0: [
                "r1"
            ],

            1: [
                "device",
                "settings"
            ]
        }
    };

// startup order: HAWebSocket -> HADeviceStore
// startup sequence: HADeviceStore(socket) -> loadDevices() -> start()

    constructor(socket) {
        this.#socket = socket;
    }

    async loadDevices() {
        const entities =
            await this.#socket.getEntities();

        const filtered =
            this.#filterEntities(entities);

        for (const entity of filtered) {
            this.#createDevice(entity);
        }
    }

    #createDevice(entity) {
        const converter = this.#chooseConverter(entity.entity_id);

        const device =
            new HADevice(
                this,
                entity,
                converter
            );

        this.#devices.set(
            entity.entity_id,
            device
        );
    }

    /*
    * Starts live synchronization with Home Assistant.
    * Registers the callback for state updates and subscribes
    * to state_changed events.
    * Called after loadDevices() has created all devices.
    */
    async start() {
        const callback = this.updateCallback.bind(this);
        await this.#socket.startSubscription(callback);
    }

    #filterEntities(entities) {
        const result = [];

        for (const entity of entities) {
            const parsed =
                this.#parseEntityId(
                    entity.entity_id
                );

            if (!parsed) {
                continue;
            }

            if (
                !this.#matchesRules(parsed)
            ) {
                continue;
            }
            result.push(entity);
        }

        return result;
    }

    #matchesRules(parsed) {
        if (
            this.#filterRules.domain.length > 0 &&
            !this.#filterRules.domain.includes(parsed.domain)
        ) {
            return false;
        }

        for (const index in this.#filterRules.tokens) {
            const allowed =
                this.#filterRules.tokens[index];

            const value =
                parsed.tokens[index];

            if (
                !allowed.includes(value)
            ) {
                return false;
            }
        }

        return true;
    }

    #parseEntityId(entityId) {
        const parts =
            entityId.split(".");

        if (parts.length !== 2) {
            return null;
        }

        const domain =
            parts[0];

        const tokens =
            parts[1]
                .split("_");

        return {
            domain,
            tokens
        };
    }

// create update method to pass as callback to HAWebSocket, which will be called when a state update is received from Home Assistant

    link(entityId, entityCallback) {

        const device =
            this.#devices.get(entityId);
        if (!device) {
            throw new Error(
                `Device not found: ${entityId}`
            );
        }

        entityCallback(device.state);

        device.addListener(entityCallback);
        return device.updateCallback.bind(device);
    }

    /*
    * Callback for Home Assistant state_changed events.
    * Finds the corresponding device and updates its state.
    * Called by HASocket when a subscribed entity changes.
    */
    updateCallback(entity) {
        const device =
            this.#devices.get(
                entity.entity_id
            );

        if (!device) {
            return;
        }

        device.setEntity(entity);
    }

    #chooseConverter(id) {
        const domain =
            id.split(".")[0];

        switch(domain) {

            case "input_boolean":
                return {
                    toGUI: value => value === "on",
                    toHA: value => value ? "on" : "off"
                };


            case "input_number":
                return {
                    toGUI: value => Number(value),
                    toHA: value => String(value)
                };


            case "input_select":
            case "input_text":
                return {
                    toGUI: value => value,
                    toHA: value => value
                };


            default:
                console.warn(
                    `No converter for domain: ${domain}`
                );

                return {
                    toGUI: value => value,
                    toHA: value => value
                };
        }
    }

    /*
    * Requests a state change for the given entity.
    * Returns the updated entity from Home Assistant, or null if the request failed.
    * Called by HADevice.updateCallback() when a widget requests a state change.
    */
async setState(entity) {
    try {
        await this.#socket.callService({
            entityId: entity.entity_id,
            value: entity.state
        });

        const entities =
            await this.#socket.getEntities();

        const updatedEntity =
            entities.find(
                item =>
                    item.entity_id === entity.entity_id
            );

        return updatedEntity ?? null;

    } catch (error) {
        console.error(
            "Failed to set entity state:",
            error
        );

        return null;
    }
}
}





