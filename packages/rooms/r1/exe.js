async function init() {
    const HA_URL = null;
    const HA_TOKEN = null;
    const guiCfg = {id: "controller",views: [{id: "view1",widgets: [{id: "widget1",entities: [{ id: "entity1",initialState: "off" },{ id: "entity2",initialState: "on" }]},{id: "widget2",entities: [{ id: "input_number.r1_device_lamp_brightness_1",initialState: "23" }]}]}]};

    socket = new HAWebSocket(HA_URL, HA_TOKEN);
    await socket.connect();
    store = new HADeviceStore(socket);
    await store.loadDevices();
    await store.start();

    guiController = new GUIController(store, guiCfg);
    await guiController.connectHaService();


}
