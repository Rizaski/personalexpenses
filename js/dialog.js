// Custom Dialog Module - Replaces alert, confirm, and prompt
const dialog = {
    // Escape HTML to prevent XSS
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Show alert dialog
    async alert(message, options = {}) {
        const title = options.title || 'Alert';
        const type = options.type || 'info'; // info, success, warning, error
        const icon = options.icon !== false;

        // Convert newlines to <br> and escape HTML
        const safeMessage = dialog.escapeHTML(message).replace(/\n/g, '<br>');
        const safeTitle = dialog.escapeHTML(title);

        return new Promise((resolve) => {
            const dialogHTML = `
                <div id="custom-dialog" class="custom-dialog-overlay">
                    <div class="custom-dialog">
                        <div class="custom-dialog-header ${type}">
                            ${icon ? dialog.getIcon(type) : ''}
                            <h3 class="custom-dialog-title">${safeTitle}</h3>
                        </div>
                        <div class="custom-dialog-body">
                            <p>${safeMessage}</p>
                        </div>
                        <div class="custom-dialog-footer">
                            <button class="btn btn-primary custom-dialog-btn" onclick="dialog.closeDialog()">OK</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', dialogHTML);
            document.getElementById('custom-dialog').classList.add('active');

            // Store resolve function
            dialog.resolveAlert = resolve;
        });
    },

    // Show confirm dialog
    async confirm(message, options = {}) {
        const title = options.title || 'Confirm';
        const type = options.type || 'warning';
        const confirmText = options.confirmText || 'Confirm';
        const cancelText = options.cancelText || 'Cancel';

        // Escape HTML
        const safeMessage = dialog.escapeHTML(message).replace(/\n/g, '<br>');
        const safeTitle = dialog.escapeHTML(title);
        const safeConfirmText = dialog.escapeHTML(confirmText);
        const safeCancelText = dialog.escapeHTML(cancelText);

        return new Promise((resolve) => {
            const dialogHTML = `
                <div id="custom-dialog" class="custom-dialog-overlay">
                    <div class="custom-dialog">
                        <div class="custom-dialog-header ${type}">
                            ${dialog.getIcon(type)}
                            <h3 class="custom-dialog-title">${safeTitle}</h3>
                        </div>
                        <div class="custom-dialog-body">
                            <p>${safeMessage}</p>
                        </div>
                        <div class="custom-dialog-footer">
                            <button class="btn btn-secondary custom-dialog-btn" onclick="dialog.closeDialog(false)">${safeCancelText}</button>
                            <button class="btn btn-primary custom-dialog-btn" onclick="dialog.closeDialog(true)">${safeConfirmText}</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', dialogHTML);
            document.getElementById('custom-dialog').classList.add('active');

            // Store resolve function
            dialog.resolveConfirm = resolve;
        });
    },

    // Show prompt dialog
    async prompt(message, options = {}) {
        const title = options.title || 'Input';
        const defaultValue = options.defaultValue || '';
        const placeholder = options.placeholder || '';
        const confirmText = options.confirmText || 'OK';
        const cancelText = options.cancelText || 'Cancel';

        // Escape HTML
        const safeMessage = dialog.escapeHTML(message).replace(/\n/g, '<br>');
        const safeTitle = dialog.escapeHTML(title);
        const safePlaceholder = dialog.escapeHTML(placeholder);
        const safeConfirmText = dialog.escapeHTML(confirmText);
        const safeCancelText = dialog.escapeHTML(cancelText);
        const safeDefaultValue = dialog.escapeHTML(defaultValue);

        return new Promise((resolve) => {
            const dialogHTML = `
                <div id="custom-dialog" class="custom-dialog-overlay">
                    <div class="custom-dialog custom-dialog-prompt">
                        <div class="custom-dialog-header">
                            <h3 class="custom-dialog-title">${safeTitle}</h3>
                        </div>
                        <div class="custom-dialog-body">
                            <p style="margin-bottom: 1rem;">${safeMessage}</p>
                            <input type="text" id="dialog-prompt-input" class="custom-dialog-input" value="${safeDefaultValue}" placeholder="${safePlaceholder}" autofocus>
                        </div>
                        <div class="custom-dialog-footer">
                            <button class="btn btn-secondary custom-dialog-btn" onclick="dialog.closeDialog(null)">${safeCancelText}</button>
                            <button class="btn btn-primary custom-dialog-btn" onclick="dialog.closePromptDialog()">${safeConfirmText}</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', dialogHTML);
            document.getElementById('custom-dialog').classList.add('active');

            // Focus input
            setTimeout(() => {
                const input = document.getElementById('dialog-prompt-input');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 100);

            // Handle Enter key
            const input = document.getElementById('dialog-prompt-input');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        dialog.closePromptDialog();
                    }
                });
            }

            // Store resolve function
            dialog.resolvePrompt = resolve;
        });
    },

    closeDialog(result = true) {
        const dialogEl = document.getElementById('custom-dialog');
        if (dialogEl) {
            dialogEl.classList.remove('active');
            setTimeout(() => {
                dialogEl.remove();
            }, 300);
        }

        if (dialog.resolveAlert !== undefined) {
            dialog.resolveAlert();
            dialog.resolveAlert = undefined;
        }

        if (dialog.resolveConfirm !== undefined) {
            dialog.resolveConfirm(result);
            dialog.resolveConfirm = undefined;
        }
    },

    closePromptDialog() {
        const input = document.getElementById('dialog-prompt-input');
        const value = input ? input.value : null;
        dialog.closeDialog(value);

        if (dialog.resolvePrompt !== undefined) {
            dialog.resolvePrompt(value);
            dialog.resolvePrompt = undefined;
        }
    },

    getIcon(type) {
        const icons = {
            info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`,
            success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`
        };
        return icons[type] || icons.info;
    }
};