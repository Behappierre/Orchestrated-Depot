// App Controller
class App {
    constructor() {
        this.store = new Store(MOCK_DATA);
        this.view = new View(this.store);
        this.view.app = this; // Link back

        this.setupNavigation();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-links li');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewName = link.dataset.view;
                if (viewName) {
                    this.view.switchView(viewName);
                }
            });
        });
    }

    handleClick(action, id) {
        console.log("Action Triggered:", action, id);
        if (action === 'RESOLVE') {
            this.view.showResolutionModal(id);
        } else if (action === 'ACKNOWLEDGE') {
            // Just remove alert
            this.store.alerts = this.store.alerts.filter(a => a.id !== id);
            this.view.renderAll();
        }
    }

    executeResolution(alertId, optionIndex) {
        const success = this.store.resolveAlert(alertId, optionIndex);
        if (success) {
            this.view.renderAll();
            // show toast?
        }
    }
}

// Init
const app = new App();
// Expose for onclick handlers in HTML strings
window.app = app;
