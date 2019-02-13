export default class OcsManagerTypeHandler {

    constructor(stateManager, ocsManagerApi, ipcRenderer) {
        this._stateManager = stateManager;
        this._ocsManagerApi = ocsManagerApi;
        this._ipcRenderer = ipcRenderer;

        this._installType = '';
        this._installTypes = {};
        this._installedItems = {};
        this._updateAvailableItems = {};

        this._updateCheckAfter = 86400000; // 1day (ms)

        this._collectiondialogComponent = null;

        this._subscribe();
        this._receiveMessage();
    }

    _subscribe() {
        this._stateManager.actionHandler
            .add('ocsManager_activate', (data) => {
                this._collectiondialogComponent = data.component;
                return {isActivated: true};
            })
            .add('ocsManager_activate', async () => {
                if (await this._ocsManagerApi.connect()) {
                    let message = null;

                    message = await this._ocsManagerApi.sendSync('ConfigHandler::getAppConfigInstallTypes', []);
                    this._installTypes = message.data[0];

                    message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigInstalledItems', []);
                    this._installedItems = message.data[0];

                    message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigUpdateAvailableItems', []);
                    this._updateAvailableItems = message.data[0];

                    message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigApplication', []);
                    if (!message.data[0].update_checked_at
                        || (message.data[0].update_checked_at + this._updateCheckAfter) < new Date().getTime()
                    ) {
                        this._ocsManagerApi.send('UpdateHandler::checkAll', []);
                    }
                }
                return {};
            })
            .add('ocsManager_items', async (data) => {
                this._installType = data.installType || '';
                let isApplicableType = false;

                if (this._installType) {
                    const message = await this._ocsManagerApi.sendSync('DesktopThemeHandler::isApplicableType', [this._installType]);
                    isApplicableType = message.data[0];
                }

                // {installType: {id: installedItem}}
                const categorizedInstalledItems = {};
                for (const [key, value] of Object.entries(this._installedItems)) {
                    if (!categorizedInstalledItems[value.install_type]) {
                        categorizedInstalledItems[value.install_type] = {};
                    }
                    categorizedInstalledItems[value.install_type][key] = value;
                }

                return {
                    installType: this._installType,
                    isApplicableType: isApplicableType,
                    categorizedInstalledItems: categorizedInstalledItems,
                    installTypes: this._installTypes,
                    installedItems: this._installedItems,
                    updateAvailableItems: this._updateAvailableItems
                };
            })
            .add('ocsManager_ocsUrl', (data) => {
                this._ocsManagerApi.send('ItemHandler::getItemByOcsUrl', [data.url, data.providerKey, data.contentId]);
                return false;
            })
            .add('ocsManager_externalUrl', (data) => {
                this._ocsManagerApi.send('SystemHandler::openUrl', [data.url]);
                return false;
            })
            .add('ocsManager_downloading', async () => {
                const message = await this._ocsManagerApi.sendSync('ItemHandler::metadataSet', []);
                const metadataSet = message.data[0];
                return {
                    downloading: Object.keys(metadataSet).length,
                    metadataSet: metadataSet
                };
            })
            .add('ocsManager_apply', (data) => {
                this._ocsManagerApi.send('DesktopThemeHandler::applyTheme', [data.path, data.installType]);
                return false;
            })
            .add('ocsManager_uninstall', (data) => {
                this._ocsManagerApi.send('ItemHandler::uninstall', [data.itemKey]);
                // Remove preview pic
                this._ipcRenderer.sendSync('previewPic', 'remove', data.itemKey);
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
                this._stateManager.dispatch('ocsManager_downloading', {});
            })
            .set('ItemHandler::downloadStarted', (message) => {
                console.log(message);
                if (message.data[0].status !== 'success_downloadstart') {
                    console.error(new Error(message.data[0].message));
                }
                else if (message.data[0].metadata.command === 'install') {
                    // Download preview pic
                    if (message.data[0].metadata.provider && message.data[0].metadata.content_id) {
                        const previewPicUrl = `${message.data[0].metadata.provider}content/previewpic/${message.data[0].metadata.content_id}`;
                        this._ipcRenderer.sendSync('previewPic', 'download', message.data[0].metadata.url, previewPicUrl);
                    }
                }
                // update component
            })
            .set('ItemHandler::downloadFinished', (message) => {
                console.log(message);
                if (message.data[0].status !== 'success_download') {
                    console.error(new Error(message.data[0].message));
                }
                // update component
            })
            .set('ItemHandler::downloadProgress', (message) => {
                console.log(message);
                // update component
            })
            .set('ItemHandler::saveStarted', (message) => {
                console.log(message);
                if (message.data[0].status !== 'success_savestart') {
                    console.error(new Error(message.data[0].message));
                }
                // update component
            })
            .set('ItemHandler::saveFinished', (message) => {
                console.log(message);
                if (message.data[0].status !== 'success_save') {
                    console.error(new Error(message.data[0].message));
                }
                // update component
            })
            .set('ItemHandler::installStarted', (message) => {
                console.log(message);
                if (message.data[0].status !== 'success_installstart') {
                    console.error(new Error(message.data[0].message));
                }
                // update component
            })
            .set('ItemHandler::installFinished', async (message) => {
                console.log(message);
                if (message.data[0].status !== 'success_install') {
                    console.error(new Error(message.data[0].message));
                }

                // update component

                message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigInstalledItems', []);
                this._installedItems = message.data[0];
            })
            .set('ItemHandler::uninstallStarted', (message) => {
                console.log(message);
                if (message.data[0].status !== 'success_uninstallstart') {
                    console.error(new Error(message.data[0].message));
                }
            })
            .set('ItemHandler::uninstallFinished', async (message) => {
                console.log(message);
                if (message.data[0].status !== 'success_uninstall') {
                    console.error(new Error(message.data[0].message));
                }
                message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigInstalledItems', []);
                this._installedItems = message.data[0];
                message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigUpdateAvailableItems', []);
                this._updateAvailableItems = message.data[0];

                this._stateManager.dispatch('ocsManager_items', {installType: this._installType});
            })
            .set('UpdateHandler::checkAllStarted', (message) => {
                console.log(message);
                if (!message.data[0]) {
                    console.error(new Error('Item update check failed'));
                }
            })
            .set('UpdateHandler::checkAllFinished', async (message) => {
                console.log(message);
                if (!message.data[0]) {
                    console.error(new Error('Item update check failed'));
                }
                message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigUpdateAvailableItems', []);
                this._updateAvailableItems = message.data[0];
                // update component
            })
            .set('UpdateHandler::updateStarted', (message) => {
                console.log(message);
                if (!message.data[1]) {
                    console.error(new Error('Item update failed'));
                }
            })
            .set('UpdateHandler::updateFinished', async (message) => {
                console.log(message);
                if (!message.data[1]) {
                    console.error(new Error('Item update failed'));
                }
                message = await this._ocsManagerApi.sendSync('ConfigHandler::getUsrConfigUpdateAvailableItems', []);
                this._updateAvailableItems = message.data[0];
            })
            .set('UpdateHandler::updateProgress', (message) => {
                console.log(message);
                // update component
            });
    }

}
