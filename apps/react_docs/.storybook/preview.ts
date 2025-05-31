import type { Preview } from '@storybook/react';
export const tags = ['autodocs'];
import './tailwind.css';

const preview: Preview = {
    parameters: {
        // automatically create action args for all props that start with "on"
        actions: { argTypesRegex: '^on.*' },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        docs: {
            codePanel: true,
        },
    },
};

export default preview;
