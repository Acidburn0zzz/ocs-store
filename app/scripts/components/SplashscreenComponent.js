import BaseComponent from './common/BaseComponent.js';

export default class SplashscreenComponent extends BaseComponent {

    init() {
        this._viewHandler_webview_loading = this._viewHandler_webview_loading.bind(this);
    }

    componentConnectedCallback() {
        this.getStateManager().viewHandler
            .add('webview_loading', this._viewHandler_webview_loading);
    }

    componentDisconnectedCallback() {
        this.getStateManager().viewHandler
            .remove('webview_loading', this._viewHandler_webview_loading);
    }

    render() {
        return `
            <style>${this.sharedStyle}</style>

            <style>
            @import url(images/icon.css);

            div[slot="content"] {
                display: flex;
                flex-flow: column nowrap;
                flex: 1 1 auto;
                align-items: center;
                justify-content: center;
            }
            div[slot="content"] figure.icon-ocs-store {
                display: inline-block;
                width: 128px;
                height: 128px;
                background-position: center center;
                background-repeat: no-repeat;
                background-size: 128px 128px;
            }
            div[slot="content"] h3 {
                margin: 1em;
            }
            </style>

            <app-dialog
                data-width="400px" data-height="300px"
                data-status="active"
                data-header-status="inactive" data-footer-status="inactive"
                data-auto-close-status="inactive">
            <div slot="content">
            <figure class="icon-ocs-store"></figure>
            <h3>Welcome to ${document.title}</h3>
            <p>Loading...</p>
            </div>
            </app-dialog>
        `;
    }

    _viewHandler_webview_loading(state) {
        if (!state.isLoading) {
            this.contentRoot.querySelector('app-dialog').close();
            this.remove();
        }
    }

}
