import BaseComponent from './BaseComponent.js';

export default class DialogComponent extends BaseComponent {

    static get componentObservedAttributes() {
        return [
            'data-width', 'data-min-width', 'data-max-width',
            'data-height', 'data-min-height', 'data-max-height',
            'data-header-status', 'data-footer-status',
            'data-auto-open-status', 'data-auto-close-status'
        ];
    }

    init() {
        this.contentRoot.addEventListener('click', this._handleClick.bind(this));
    }

    render() {
        const width = this.getAttribute('data-width') || 'auto';
        const minWidth = this.getAttribute('data-min-width') || 'auto';
        const maxWidth = this.getAttribute('data-max-width') || 'auto';

        const height = this.getAttribute('data-height') || 'auto';
        const minHeight = this.getAttribute('data-min-height') || 'auto';
        const maxHeight = this.getAttribute('data-max-height') || 'auto';

        const headerStatus = this.getAttribute('data-header-status') || 'active';
        const footerStatus = this.getAttribute('data-footer-status') || 'active';

        const autoOpenStatus = this.getAttribute('data-auto-open-status') || 'inactive';
        const autoCloseStatus = this.getAttribute('data-auto-close-status') || 'active';

        const autoCloseAction = (autoCloseStatus === 'active') ? 'dialog_autoClose' : '';

        return `
            ${this.sharedStyle}

            <style>
            div[data-container] {
                display: flex;
                flex-flow: column nowrap;
                z-index: 1000;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                align-items: center;
                justify-content: center;
            }
            div[data-container][data-status="inactive"] {
                display: none;
            }

            article[data-dialog] {
                display: flex;
                flex-flow: column nowrap;
                width: ${width};
                min-width: ${minWidth};
                max-width: ${maxWidth};
                height: ${height};
                min-height: ${minHeight};
                max-height: ${maxHeight};
                border: 1px solid var(--color-border);
                border-radius: 5px;
                box-shadow: 0 10px 30px var(--color-shadow);
                background-color: var(--color-content);
            }
            header[data-header] {
                display: flex;
                flex-flow: row nowrap;
                flex: 0 0 auto;
                align-items: center;
                padding: 5px 10px;
                border-bottom: 1px solid var(--color-border);
                border-top-left-radius: 5px;
                border-top-right-radius: 5px;
            }
            header[data-header][data-status="inactive"] {
                display: none;
            }
            div[data-header-content] {
                flex: 1 1 auto;
            }
            div[data-header-control] {
                flex: 0 0 auto;
            }
            article[data-content] {
                display: flex;
                flex-flow: column nowrap;
                flex: 1 1 auto;
            }
            footer[data-footer] {
                flex: 0 0 auto;
                padding: 5px 10px;
                border-top: 1px solid var(--color-border);
                border-bottom-left-radius: 5px;
                border-bottom-right-radius: 5px;
            }
            footer[data-footer][data-status="inactive"] {
                display: none;
            }
            </style>

            <div data-container data-status="${autoOpenStatus}" data-action="${autoCloseAction}">

            <article data-dialog class="fade-in">
            <header data-header data-status="${headerStatus}">
            <div data-header-content><slot name="header"></slot></div>
            <div data-header-control><app-iconbutton data-title="Close" data-icon="close" data-action="dialog_close"></app-iconbutton></div>
            </header>
            <article data-content><slot name="content"></slot></article>
            <footer data-footer data-status="${footerStatus}"><slot name="footer"></slot></footer>
            </article>

            </div>
        `;
    }

    open() {
        this.contentRoot.querySelector('div[data-container]')
            .setAttribute('data-status', 'active');
        this.dispatch('dialog_open', {});
    }

    close() {
        this.contentRoot.querySelector('div[data-container]')
            .setAttribute('data-status', 'inactive');
        this.dispatch('dialog_close', {});
    }

    _handleClick(event) {
        if (event.target.getAttribute('data-action') === 'dialog_autoClose'
            || event.target.closest('[data-action="dialog_close"]')
        ) {
            this.close();
        }
    }

}
