// DS 單元測試設定：與 mendesky-web（dashboard-app）的 karma 設定對齊，
// 讓 src/**/*.spec.ts 在本 repo 的 CI 跑。與 mendesky-web 之間的 spec 同步方式見 README「Spec 政策」。
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {},
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
    },
    // Chrome 第一次啟動偶爾超過預設的 60 秒（實測 3 次有 1 次），放寬並允許重連
    captureTimeout: 120000,
    browserDisconnectTolerance: 2,
    browserNoActivityTimeout: 120000,
    restartOnFileChange: true,
  });
};
