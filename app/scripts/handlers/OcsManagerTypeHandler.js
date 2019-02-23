export default class OcsManagerTypeHandler {

    constructor(stateManager, ocsManagerApi, ipcRenderer) {
        this._stateManager = stateManager;
        this._ocsManagerApi = ocsManagerApi;
        this._ipcRenderer = ipcRenderer;

        this._updateCheckAfter = 86400000; // 1day (ms)
        this._previewpicDirectory = this._ipcRenderer.sendSync('previewpic', 'directory');
        this._installTypes = {};

        this._webviewComponent = null;
        this._collectiondialogComponent = null;

        this._subscribe();
        this._receiveMessage();
    }

    _subscribe() {
        this._stateManager.actionHandler
            .add('webview_activate', (data) => {
                this._webviewComponent = data.component;
                return {};
            })
            .add('ocsManager_activate', (data) => {
                this._collectiondialogComponent = data.component;
                return {isActivated: true};
            })
            .add('ocsManager_activate', async () => {
                if (await this._ocsManagerApi.connect()) {
                    let message = null;

                    message = await this._ocsManagerApi.sendSync('ConfigHandler::getAppConfigInstallTypes', []);
                    this._installTypes = message.data[0];

                    message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigApplication', []);
                    if (!message.data[0].update_checked_at
                        || (message.data[0].update_checked_at + this._updateCheckAfter) < new Date().getTime()
                    ) {
                        this._ocsManagerApi.send('UpdateHandler::checkAll', []);
                    }
                }
                return {};
            })
            .add('ocsManager_externalUrl', (data) => {
                this._ocsManagerApi.send('SystemHandler::openUrl', [data.url]);
                return false;
            })
            .add('ocsManager_ocsUrl', (data) => {
                this._ocsManagerApi.send('ItemHandler::getItemByOcsUrl', [data.url, data.providerKey, data.contentId]);
                return false;
            })
            .add('ocsManager_installedItems', async () => {
                const message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigInstalledItems', []);
                const installedItems = message.data[0];
                return {
                    installedItems: installedItems,
                    installTypes: this._installTypes,
                    previewpicDirectory: this._previewpicDirectory
                };
            })
            .add('ocsManager_installedItemsByType', async (data) => {
                const installType = data.installType;

                let message = null;

                message = await this._ocsManagerApi.sendSync('DesktopThemeHandler::isApplicableType', [installType]);
                const isApplicableType = message.data[0];

                message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigInstalledItems', []);
                const installedItems = message.data[0];

                const installedItemsByType = {};
                for (const [key, value] of Object.entries(installedItems)) {
                    if (value.install_type === installType) {
                        installedItemsByType[key] = value;
                    }
                }

                return {
                    installType: installType,
                    isApplicableType: isApplicableType,
                    installedItemsByType: installedItemsByType,
                    installTypes: this._installTypes,
                    previewpicDirectory: this._previewpicDirectory
                };
            })
            .add('ocsManager_updateAvailableItems', async () => {
                let message = null;

                message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigUpdateAvailableItems', []);
                const updateAvailableItems = message.data[0];

                message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigInstalledItems', []);
                const installedItems = message.data[0];

                return {
                    count: Object.keys(updateAvailableItems).length,
                    updateAvailableItems: updateAvailableItems,
                    installedItems: installedItems,
                    installTypes: this._installTypes,
                    previewpicDirectory: this._previewpicDirectory
                };
            })
            .add('ocsManager_metadataSet', async () => {
                const message = await this._ocsManagerApi.sendSync('ItemHandler::metadataSet', []);
                const metadataSet = message.data[0];
                return {
                    count: Object.keys(metadataSet).length,
                    metadataSet: metadataSet
                };
            })
            .add('ocsManager_installing', (data) => {
                return {
                    status: data.status,
                    message: data.message,
                    metadata: data.metadata
                };
            })
            .add('ocsManager_downloading', (data) => {
                return {
                    url: data.url,
                    received: data.received,
                    total: data.total
                };
            })
            .add('ocsManager_uninstall', (data) => {
                this._ocsManagerApi.send('ItemHandler::uninstall', [data.itemKey]);
                // Remove preview pic
                this._ipcRenderer.sendSync('previewpic', 'remove', data.itemKey);
                return false;
            })
            .add('ocsManager_update', (data) => {
                this._ocsManagerApi.send('UpdateHandler::update', [data.itemKey]);
                return false;
            })
            .add('ocsManager_updating', (data) => {
                return {
                    itemKey: data.itemKey,
                    progress: data.progress
                };
            })
            .add('ocsManager_apply', (data) => {
                this._ocsManagerApi.send('DesktopThemeHandler::applyTheme', [data.path, data.installType]);
                return false;
            })
            .add('ocsManager_navigation', (data) => {
                switch (data.action) {
                    case 'collection':
                        this._collectiondialogComponent.open();
                        break;
                }
                return false;
            });
    }

    _receiveMessage() {
        this._ocsManagerApi.callback
            .set('ItemHandler::metadataSetChanged', () => {
                this._stateManager.dispatch('ocsManager_metadataSet', {});
            })
            .set('ItemHandler::downloadStarted', (message) => {
                if (message.data[0].status !== 'success_downloadstart') {
                    console.error(new Error(message.data[0].message));
                }

                this._stateManager.dispatch('ocsManager_installing', {
                    status: message.data[0].status,
                    message: message.data[0].message,
                    metadata: message.data[0].metadata
                });

                // Download preview pic
                this._webviewComponent.executeJavaScript(
                    `document.querySelector('meta[property="og:image"]').content`,
                    false,
                    (result) => {
                        let previewpicUrl = result || '';
                        // Previewpic API has been deprecated?
                        /*if (!previewpicUrl
                            && message.data[0].metadata.command === 'install'
                            && message.data[0].metadata.provider && message.data[0].metadata.content_id
                        ) {
                            previewpicUrl = `${message.data[0].metadata.provider}content/previewpic/${message.data[0].metadata.content_id}`;
                        }*/
                        if (previewpicUrl) {
                            this._ipcRenderer.sendSync('previewpic', 'download', message.data[0].metadata.url, previewpicUrl);
                        }
                    }
                );
            })
            .set('ItemHandler::downloadFinished', (message) => {
                if (message.data[0].status !== 'success_download') {
                    console.error(new Error(message.data[0].message));
                }

                this._stateManager.dispatch('ocsManager_installing', {
                    status: message.data[0].status,
                    message: message.data[0].message,
                    metadata: message.data[0].metadata
                });
            })
            .set('ItemHandler::downloadProgress', (message) => {
                this._stateManager.dispatch('ocsManager_downloading', {
                    url: message.data[0],
                    received: message.data[1],
                    total: message.data[2]
                });
            })
            .set('ItemHandler::saveStarted', (message) => {
                if (message.data[0].status !== 'success_savestart') {
                    console.error(new Error(message.data[0].message));
                }

                this._stateManager.dispatch('ocsManager_installing', {
                    status: message.data[0].status,
                    message: message.data[0].message,
                    metadata: message.data[0].metadata
                });
            })
            .set('ItemHandler::saveFinished', (message) => {
                if (message.data[0].status !== 'success_save') {
                    console.error(new Error(message.data[0].message));
                }

                this._stateManager.dispatch('ocsManager_installing', {
                    status: message.data[0].status,
                    message: message.data[0].message,
                    metadata: message.data[0].metadata
                });
            })
            .set('ItemHandler::installStarted', (message) => {
                if (message.data[0].status !== 'success_installstart') {
                    console.error(new Error(message.data[0].message));
                }

                this._stateManager.dispatch('ocsManager_installing', {
                    status: message.data[0].status,
                    message: message.data[0].message,
                    metadata: message.data[0].metadata
                });
            })
            .set('ItemHandler::installFinished', (message) => {
                if (message.data[0].status !== 'success_install') {
                    console.error(new Error(message.data[0].message));
                }

                this._stateManager.dispatch('ocsManager_installing', {
                    status: message.data[0].status,
                    message: message.data[0].message,
                    metadata: message.data[0].metadata
                });

                this._stateManager.dispatch('ocsManager_installedItems', {});
            })
            .set('ItemHandler::uninstallStarted', (message) => {
                if (message.data[0].status !== 'success_uninstallstart') {
                    console.error(new Error(message.data[0].message));
                }
            })
            .set('ItemHandler::uninstallFinished', (message) => {
                if (message.data[0].status !== 'success_uninstall') {
                    console.error(new Error(message.data[0].message));
                }
                this._stateManager.dispatch('ocsManager_installedItems', {});
                this._stateManager.dispatch('ocsManager_updateAvailableItems', {});
            })
            .set('UpdateHandler::checkAllStarted', (message) => {
                if (!message.data[0]) {
                    console.error(new Error('Item update check failed'));
                }
            })
            .set('UpdateHandler::checkAllFinished', (message) => {
                if (!message.data[0]) {
                    console.error(new Error('Item update check failed'));
                }
                this._stateManager.dispatch('ocsManager_updateAvailableItems', {});
            })
            .set('UpdateHandler::updateStarted', (message) => {
                if (!message.data[1]) {
                    console.error(new Error('Item update failed'));
                }
            })
            .set('UpdateHandler::updateFinished', (message) => {
                if (!message.data[1]) {
                    console.error(new Error('Item update failed'));
                }
                this._stateManager.dispatch('ocsManager_installedItems', {});
                this._stateManager.dispatch('ocsManager_updateAvailableItems', {});
            })
            .set('UpdateHandler::updateProgress', (message) => {
                this._stateManager.dispatch('ocsManager_updating', {
                    itemKey: message.data[0],
                    progress: message.data[1]
                });
            });
    }

}
