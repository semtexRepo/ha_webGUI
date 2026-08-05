class HASocket {
    #url;
    #token;
    #socket = null;
    #storeUpdateCallback = null;
    #requestId = 1;
    #pendingRequests = new Map();
    
    constructor(url, token) {
        this.#url = url;
        this.#token = token;
    }
    
    /*
    * Connects to the Home Assistant WebSocket API and authenticates using the provided token.
    * After successful authentication, it subscribes to state_changed events to receive updates for devices.
    * This method returns a promise that resolves when the connection is established and authenticated.
    * If there is an error during the connection or authentication process, the promise is rejected with an error.
    */
    async connect() {
        return new Promise(
            (resolve, reject) => {
            this.#socket = new WebSocket(this.#url);
            this.#socket.onopen = () => {/* Wait for auth challenge */};
            this.#socket.onerror = (error) => {reject(error);};
            this.#socket.onclose = () => {reject(new Error("WebSocket closed"));};

            this.#socket.onmessage = (event) => {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case "auth_required":
                        this.#socket.send(JSON.stringify({
                            type: "auth",
                            access_token: this.#token
                        }));
                        break;

                    case "auth_ok":
                        this.#socket.onerror = null;
                        this.#socket.onmessage = (event) => {
                            const msg = JSON.parse(event.data);
                            this.#handleMessage(msg);
                        };

                        resolve();
                        break;
                        
                    case "auth_invalid":
                        reject(new Error("Authentication failed"));
                        break;
                }
            };
        });
    }

    /*
    * Handles incoming messages from the Home Assistant WebSocket.
    * Used in the connect method to handle messages after authentication is successful.
    */
    #handleMessage(msg) {
        if (msg.type === "event") {
            if (msg.event.event_type !== "state_changed") {return;}
            const entity = msg.event.data.new_state;
            if (!entity) {return;}
            this.#storeUpdateCallback?.(entity);
            return;
        }

        if (!Object.hasOwn(msg, "id")) {return;}
        const request = this.#pendingRequests.get(msg.id);
        if (!request) {return;}
        this.#pendingRequests.delete(msg.id);
        if (msg.success) {request.resolve(msg.result);}
        else {request.reject(msg.error);}
    }

    /*
    * Handles state_changed events received from the Home Assistant WebSocket.
    * This method is called when a state_changed event is received, and it updates the internal state of the socket.
    * It checks if the event is of type "state_changed" and if the new state is valid.
    * If valid, it calls the state update callback with the updated entity information.
    */
    #handleEvent(msg) {
        if (
            msg.event.event_type !== "state_changed"
        ) {
            return;
        }

        const state =
            msg.event.data.new_state;

        if (!state) {
            return;
        }

        const update = {
            entityId: state.entity_id,
            state: state.state
        };

        this.#storeUpdateCallback?.(update);
    }

    /*
    * Builds the service call object based on the entity domain and value.
    * It is called by the callService method to determine the appropriate service to call for the given entity.
    * This method determines the appropriate service to call based on the entity's domain (e.g., input_number, input_text, input_select, input_boolean).
    * It constructs the service call object with the necessary parameters for the service call.
    * If the entity domain is unsupported, it throws an error.
    */
    #buildServiceCall(entityId, value) {
        const domain = entityId.split(".")[0];
        switch (domain) {
            case "input_number":
                return {
                    domain: domain,
                    service: "set_value",
                    target: {
                        entity_id: entityId
                    },
                    service_data: {
                        value: value
                    }
                };

            case "input_text":
                return {
                    domain: domain,
                    service: "set_value",
                    target: {
                        entity_id: entityId
                    },
                    service_data: {
                        value: value
                    }
                };

            case "input_select":
                return {
                    domain: domain,
                    service: "select_option",
                    target: {
                        entity_id: entityId
                    },
                    service_data: {
                        option: value
                    }
                };

            case "input_boolean":
                const serviceCall = {
                    domain: domain,
                    service: value === "on" ? "turn_on" : "turn_off",
                    target: {
                        entity_id: entityId
                    },
                    service_data: {}
                };
                return serviceCall;

            default:
                throw new Error(
                    `Unsupported entity domain: ${domain}`
                );
        }
    }  

    /*
    * Sends a request to the Home Assistant WebSocket and returns a promise that resolves or rejects based on the response.
    * It is called by any method that needs to send a request to the Home Assistant WebSocket (e.g., callService).
    * It generates a unique request ID for each request and stores the resolve and reject functions in a map.
    * When a response is received, it checks if the request ID matches and resolves or rejects the promise accordingly.
    * If the request is successful, it resolves the promise with the result; otherwise, it rejects with the error.
    */
    #sendRequest(request) {
        return new Promise((resolve, reject) => {

            const requestId =
                this.#requestId++;

            this.#pendingRequests.set(
                requestId,
                {
                    resolve,
                    reject
                }
            );
            
            this.#socket.send(
                JSON.stringify({
                    id: requestId,
                    ...request
                })
            );
        });
    }

/***************************************************************************************************************************
 * API Methods
 */
    /*
    * Starts a subscription to state_changed events from the Home Assistant WebSocket.
    * Called by the HADeviceStore to initiate the subscription to receive updates for devices, only once.
    */
    startSubscription(storeUpdateCallback) {
        this.#storeUpdateCallback = storeUpdateCallback;
        return this.#sendRequest({
            type: "subscribe_events",
            event_type: "state_changed"
        });
    }

    /*
    * API method to call a service in Home Assistant.
    * It sends a request to the Home Assistant WebSocket to call the appropriate service for the entity.
    * The method returns a promise that resolves when the service call is successful, or rejects if there is an error.
    */
    async callService(command) {

        const serviceCall =
            this.#buildServiceCall(
                command.entityId,
                command.value
            );

        const response = this.#sendRequest({
            type: "call_service",
            domain: serviceCall.domain,
            service: serviceCall.service,
            target: serviceCall.target,
            service_data: serviceCall.service_data
        });

        return response;
    }

    /*
    * API method to get the current state of an entity in Home Assistant.
    * It sends a request to the Home Assistant WebSocket to retrieve all the entities.
    */
    async getEntities() {
        return this.#sendRequest({
            type: "get_states"
        });
    }

}