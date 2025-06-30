class App {
    private static _instance: App;


    private constructor() {
        console.log("App instance created");
    }

    public static get instance(): App {
        if (!App._instance) {
            App._instance = new App();
        }
        return App._instance;
    }
}

// ---------------------------------------------------------------------
// Export the singleton instance
export default App.instance