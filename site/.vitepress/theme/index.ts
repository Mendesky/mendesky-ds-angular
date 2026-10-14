import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import type { Theme } from 'vitepress';
import VersionSwitcher from './components/VersionSwitcher.vue';
import PatternBlock from './components/PatternBlock.vue';
import TokenTable from './components/TokenTable.vue';
import TypographyTable from './components/TypographyTable.vue';
import MotionTable from './components/MotionTable.vue';
import ComponentTable from './components/ComponentTable.vue';
import ComponentLink from './components/ComponentLink.vue';
import StoryEmbed from './components/StoryEmbed.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'nav-bar-content-after': () => h(VersionSwitcher) }),
  enhanceApp({ app }) {
    app.component('PatternBlock', PatternBlock);
    app.component('TokenTable', TokenTable);
    app.component('TypographyTable', TypographyTable);
    app.component('MotionTable', MotionTable);
    app.component('ComponentTable', ComponentTable);
    app.component('ComponentLink', ComponentLink);
    app.component('StoryEmbed', StoryEmbed);
  },
} satisfies Theme;
