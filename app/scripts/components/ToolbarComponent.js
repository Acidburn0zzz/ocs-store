import BaseComponent from './BaseComponent.js';

export default class ToolbarComponent extends BaseComponent {

    render() {
        return `
            ${this.sharedStyle}

            <style>
            :host {
                height: 40px;
            }

            nav[data-toolbar] {
                height: inherit;
                border-bottom: 1px solid rgba(0,0,0,0.1);
                background-color: #f5f5f5;
            }
            nav[data-toolbar] ul {
                list-style: none;
                height: inherit;
                margin: 0 4px;
                align-items: center;
            }
            nav[data-toolbar] ul li {
                margin: 0 2px;
            }
            nav[data-toolbar] ul li.flex {
                justify-content: center;
            }

            @media (min-width: 900px) {
                nav[data-toolbar] ul li.flex {
                    margin-right: calc(32px * 4);
                }
            }

            div[data-indicator] {
                z-index: 1;
                position: relative;
                top: -2px;
                left: 0;
                height: 2px;
                background-color: #68a4d9;
            }
            div[data-indicator="inactive"] {
                display: none;
            }
            div[data-indicator="active"] {
                animation-name: loading;
                animation-duration: 2s;
                animation-iteration-count: infinite;
                animation-direction: alternate;
            }
            @keyframes loading {
                0% {
                    opacity: 0.3;
                }
                100% {
                    opacity: 1.0;
                }
            }
            </style>

            <nav data-toolbar>
            <ul class="flex">
            <li><menubutton-component data-ref="back"></menubutton-component></li>
            <li><menubutton-component data-ref="forward"></menubutton-component></li>
            <li><menubutton-component data-ref="reload"></menubutton-component></li>
            <li><menubutton-component data-ref="home"></menubutton-component></li>
            <li><menubutton-component data-ref="collection"></menubutton-component></li>
            <li class="flex-auto flex"><omnibox-component></omnibox-component></li>
            <li><menubutton-component data-ref="menu"></menubutton-component></li>
            </ul>
            </nav>

            <div data-indicator="inactive"></div>
        `;
    }

    checkLoadingStatus() {
        if (this.rootState.get('webview-loading').isLoading) {
            const reloadButton = this.contentRoot.querySelector('menubutton-component[data-ref="reload"]');
            if (reloadButton) {
                reloadButton.setAttribute('data-ref', 'stop');
            }

            this.contentRoot.querySelector('div[data-indicator]')
                .setAttribute('data-indicator', 'active');
        }
        else {
            const stopButton = this.contentRoot.querySelector('menubutton-component[data-ref="stop"]');
            if (stopButton) {
                stopButton.setAttribute('data-ref', 'reload');
            }

            this.contentRoot.querySelector('div[data-indicator]')
                .setAttribute('data-indicator', 'inactive');
        }
    }

}
