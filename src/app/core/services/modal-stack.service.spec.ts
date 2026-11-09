import { effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalStackService } from './modal-stack.service';
import { ModalOpenNotifier } from './modal-open-notifier.service';

// 「有視窗打開時通知我」：登記當下同步通知，不等 effect。
// 浮層服務靠它在對話框記下「關掉後焦點還給誰」之前，先把該關的浮層關好（2026-11-09）。
// 通知放在 DS 內部的 ModalOpenNotifier：使用端測試常用假物件代替 ModalStackService，不能要求它多一個方法。
describe('ModalStackService — 登記時通知 ModalOpenNotifier', () => {
  let stack: ModalStackService;
  let notifier: ModalOpenNotifier;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    stack = TestBed.inject(ModalStackService);
    notifier = TestBed.inject(ModalOpenNotifier);
  });

  it('登記一個新視窗 → register 回傳前就收到通知，帶著登記後的層數', () => {
    const sizes: number[] = [];
    notifier.listen((size) => sizes.push(size));

    stack.register('a');
    expect(sizes).withContext('register 一回傳就已通知').toEqual([1]);

    stack.register('b');
    expect(sizes).toEqual([1, 2]);
  });

  it('同一個視窗重複登記、或關閉視窗 → 不通知', () => {
    const sizes: number[] = [];
    notifier.listen((size) => sizes.push(size));

    stack.register('a');
    stack.register('a');
    stack.unregister('a');

    expect(sizes).toEqual([1]);
  });

  it('呼叫取消函式之後 → 不再收到通知', () => {
    const sizes: number[] = [];
    const stop = notifier.listen((size) => sizes.push(size));

    stack.register('a');
    stop();
    stack.register('b');

    expect(sizes).toEqual([1]);
  });

  it('在 effect 裡登記視窗 → 通知裡讀到的 signal 不會變成那個 effect 的依賴', () => {
    const watched = signal(0);
    notifier.listen(() => watched());

    const openRequest = signal(0);
    let runs = 0;
    TestBed.runInInjectionContext(() =>
      effect(() => {
        runs++;
        if (openRequest() > 0) stack.register(`modal-${openRequest()}`);
      }, { allowSignalWrites: true })
    );
    TestBed.flushEffects();
    openRequest.set(1);
    TestBed.flushEffects();
    const runsAfterOpen = runs;

    watched.set(1);
    TestBed.flushEffects();

    expect(runs).withContext('通知裡讀的 signal 變了，登記視窗的 effect 不該重跑').toBe(runsAfterOpen);
  });
});
