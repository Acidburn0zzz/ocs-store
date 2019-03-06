import BaseComponent from './common/BaseComponent.js';

export default class ToolbarComponent extends BaseComponent {

    init() {
        this.contentRoot.addEventListener('click', this._handleClick.bind(this));

        this._viewHandler_webview_loading = this._viewHandler_webview_loading.bind(this);
        this._viewHandler_webview_page = this._viewHandler_webview_page.bind(this);
        this._viewHandler_ocsManager_updateAvailableItems = this._viewHandler_ocsManager_updateAvailableItems.bind(this);
        this._viewHandler_ocsManager_metadataSet = this._viewHandler_ocsManager_metadataSet.bind(this);
    }

    componentConnectedCallback() {
        this.getStateManager().viewHandler
            .add('webview_loading', this._viewHandler_webview_loading)
            .add('webview_page', this._viewHandler_webview_page)
            .add('ocsManager_updateAvailableItems', this._viewHandler_ocsManager_updateAvailableItems)
            .add('ocsManager_metadataSet', this._viewHandler_ocsManager_metadataSet);
    }

    componentDisconnectedCallback() {
        this.getStateManager().viewHandler
            .remove('webview_loading', this._viewHandler_webview_loading)
            .remove('webview_page', this._viewHandler_webview_page)
            .remove('ocsManager_updateAvailableItems', this._viewHandler_ocsManager_updateAvailableItems)
            .remove('ocsManager_metadataSet', this._viewHandler_ocsManager_metadataSet);
    }

    render() {
        return `
            <style>${this.sharedStyle}</style>

            <style>
            :host {
                height: 40px;
            }

            nav[data-toolbar] {
                height: inherit;
                border-bottom: 1px solid var(--color-border);
                background-color: var(--color-widget);
            }
            nav[data-toolbar] ul {
                display: flex;
                flex-flow: row nowrap;
                align-items: center;
                height: inherit;
                margin: 0 4px;
            }
            nav[data-toolbar] ul li {
                flex: 0 0 auto;
                height: 30px;
                margin: 0 2px;
            }
            nav[data-toolbar] ul li[data-omnibox] {
                display: flex;
                flex-flow: row nowrap;
                flex: 1 1 auto;
                justify-content: center;
            }
            @media (min-width: 900px) {
                nav[data-toolbar] ul li[data-omnibox] {
                    margin-right: calc(32px * 4);
                }
            }

            app-iconbutton[data-action="webview_reload"][data-status="inactive"] {
                display: none;
            }
            app-iconbutton[data-action="webview_stop"][data-status="inactive"] {
                display: none;
            }

            app-menu a[slot="menuitem"],
            app-menu a[slot="menuitem"]:hover {
                color: var(--color-text);
            }

            nav[data-toolbar] ul li span[data-badge] {
                z-index: 1;
                position: relative;
                top: -36px;
                left: 22px;
                display: inline-block;
                padding: 4px 6px;
                border-radius: 10px;
                background-color: var(--color-active-secondary);
                font-size: 10px;
                line-height: 1;
            }
            nav[data-toolbar] ul li span[data-badge="update"] {
                z-index: 2;
                background-color: var(--color-important);
                color: var(--color-content);
            }
            nav[data-toolbar] ul li span[data-badge="download"] {
                z-index: 3;
                background-color: var(--color-information);
                color: var(--color-content);
            }
            nav[data-toolbar] ul li span[data-badge][data-count="0"] {
                display: none;
            }
            </style>

            <nav data-toolbar>
            <ul>
            <li>
            <app-iconbutton data-action="webview_goBack"
                data-title="Back" data-icon="arrow_back" data-status="inactive"></app-iconbutton>
            </li>
            <li>
            <app-iconbutton data-action="webview_goForward"
                data-title="Forward" data-icon="arrow_forward" data-status="inactive"></app-iconbutton>
            </li>
            <li>
            <app-iconbutton data-action="webview_reload"
                data-title="Reload" data-icon="refresh" data-status="active"></app-iconbutton>
            <app-iconbutton data-action="webview_stop"
                data-title="Stop" data-icon="close" data-status="inactive"></app-iconbutton>
            </li>
            <li>
            <app-iconbutton data-action="webview_startPage"
                data-title="Startpage" data-icon="home"></app-iconbutton>
            </li>
            <li>
            <app-iconbutton data-action="ocsManager_collection"
                data-title="My Collection" data-icon="folder"></app-iconbutton><br>
            <span data-badge="update" data-count="0">0</span>
            <span data-badge="download" data-count="0">0</span>
            </li>
            <li data-omnibox><app-omnibox></app-omnibox></li>
            <li>
            <app-iconbutton data-action="menu_open"
                data-title="Other Operations..." data-icon="more_vert"></app-iconbutton><br>
            <app-menu data-width="250px" data-offset-x="-220px">
            <a slot="menuitem" href="#" data-action="general_about">About This App</a>
            </app-menu>
            </li>
            </ul>
            </nav>
        `;
    }

    _handleClick(event) {
        let targetElement = null;
        if (event.target.closest('app-iconbutton[data-action]')) {
            targetElement = event.target.closest('app-iconbutton[data-action]');
        }
        else if (event.target.closest('a[slot="menuitem"][data-action]')) {
            event.preventDefault();
            targetElement = event.target.closest('a[slot="menuitem"][data-action]');
        }
        else {
            return;
        }

        switch (targetElement.getAttribute('data-action')) {
            case 'webview_goBack':
                this.dispatch('webview_goBack', {});
                break;
            case 'webview_goForward':
                this.dispatch('webview_goForward', {});
                break;
            case 'webview_reload':
                this.dispatch('webview_reload', {});
                break;
            case 'webview_stop':
                this.dispatch('webview_stop', {});
                break;
            case 'webview_startPage':
                this.dispatch('webview_startPage', {});
                break;
            case 'ocsManager_collection':
                this.dispatch('ocsManager_collection', {});
                break;
            case 'menu_open':
                this.contentRoot.querySelector('app-menu').open();
                break;
            case 'general_about':
                this.dispatch('general_about', {});
                this.contentRoot.querySelector('app-menu').close();
                break;
        }
    }

    _viewHandler_webview_loading(state) {
        this.contentRoot.querySelector('app-iconbutton[data-action="webview_reload"]')
            .setAttribute('data-status', state.isLoading ? 'inactive' : 'active');
        this.contentRoot.querySelector('app-iconbutton[data-action="webview_stop"]')
            .setAttribute('data-status', state.isLoading ? 'active' : 'inactive');
    }

    _viewHandler_webview_page(state) {
        this.contentRoot.querySelector('app-iconbutton[data-action="webview_goBack"]')
            .setAttribute('data-status', state.canGoBack ? 'active' : 'inactive');
        this.contentRoot.querySelector('app-iconbutton[data-action="webview_goForward"]')
            .setAttribute('data-status', state.canGoForward ? 'active' : 'inactive');
    }

    _viewHandler_ocsManager_updateAvailableItems(state) {
        const badge = this.contentRoot.querySelector('span[data-badge="update"]');
        badge.setAttribute('data-count', '' + state.count);
        badge.textContent = state.count;
    }

    _viewHandler_ocsManager_metadataSet(state) {
        const badge = this.contentRoot.querySelector('span[data-badge="download"]');
        badge.setAttribute('data-count', '' + state.count);
        badge.textContent = state.count;
    }

}
