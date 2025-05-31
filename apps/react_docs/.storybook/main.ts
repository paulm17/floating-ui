import { mergeConfig } from 'vite';

import type { StorybookConfig } from '@storybook/react-vite';

export default <StorybookConfig>{
    framework: '@storybook/react-vite',
    addons: [
        '@storybook/addon-onboarding',
        '@storybook/addon-docs',
        '@storybook/addon-a11y',
        '@storybook/addon-links',
        {
            name: '@storybook/addon-vitest',
            options: {
                cli: false,
            },
        },
    ],
    stories: [
        // '../stories/**/*.mdx',
        '../../../packages/react/src/stories/*.stories.@(js|jsx|mjs|ts|tsx)',
    ],
    async viteFinal(config) {
        return mergeConfig(config, {
            define: {
                'process.env': {},
                __DEV__: true,
            },
            plugins: [(await import('@tailwindcss/vite')).default()],
        });
    },
};
