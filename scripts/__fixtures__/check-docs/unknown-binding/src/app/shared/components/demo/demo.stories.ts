export const Default = {
  render: () => ({
    template: `
      <app-demo
        [text]="title"
        [bogus]="true"
        (clicked)="onClick()"
        [class.wide]="wide"
        [ngClass]="cls"
        [appDemoTip]="tip">
      </app-demo>`,
  }),
};
