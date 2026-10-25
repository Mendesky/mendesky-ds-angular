export default {
  title: 'Demo',
  argTypes: {
    size: { control: 'select', table: { defaultValue: { summary: 'L' } } },
    on: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    label: { control: 'text', table: { defaultValue: { summary: "''" } } },
    count: { control: 'number', table: { defaultValue: { summary: '3' } } },
  },
};
