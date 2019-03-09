import BaseComponent from './BaseComponent.js';

export default class IndicatorComponent extends BaseComponent {

    static get componentObservedAttributes() {
        return ['data-state'];
    }

    render() {
        const state = this.getAttribute('data-state') || 'inactive';

        return this.html`
            <style>
            ${this.sharedStyle}
            </style>

            <style>
            :host {
                width: 100%;
                height: 2px;
            }

            div[data-container] {
                width: inherit;
                height: inherit;
                overflow: hidden;
            }
            div[data-container][data-state="inactive"] {
                display: none;
            }

            div[data-indicator][data-state="active"] {
                position: relative;
                top: 0;
                left: 0;
                width: 50%;
                height: inherit;
                background-color: var(--color-information);
                animation-name: slide;
                animation-duration: 1s;
                animation-iteration-count: infinite;
                animation-direction: alternate;
            }
            div[data-indicator][data-state="inactive"] {
                display: none;
            }

            @keyframes slide {
                0% {
                    left: -40%;
                }
                100% {
                    left: 90%;
                }
            }
            </style>

            <div data-container data-state="${state}">
            <div data-indicator data-state="${state}"></div>
            </div>
        `;
    }

}
