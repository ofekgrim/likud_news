import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:mocktail/mocktail.dart';

import 'package:metzudat_halikud/core/services/tts_service.dart';

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------

class MockFlutterTts extends Mock implements FlutterTts {}

void main() {
  late MockFlutterTts mockTts;
  late TtsService service;

  /// Captures the completionHandler registered via setCompletionHandler.
  VoidCallback? capturedCompletion;

  setUp(() {
    mockTts = MockFlutterTts();
    capturedCompletion = null;

    // Stub all engine setup calls.
    when(() => mockTts.setLanguage(any())).thenAnswer((_) async => 1);
    when(() => mockTts.setSpeechRate(any())).thenAnswer((_) async => 1);
    when(() => mockTts.setPitch(any())).thenAnswer((_) async => 1);
    when(() => mockTts.setVolume(any())).thenAnswer((_) async => 1);
    when(() => mockTts.stop()).thenAnswer((_) async => 1);
    when(() => mockTts.speak(any())).thenAnswer((_) async => 1);
    when(() => mockTts.pause()).thenAnswer((_) async => 1);

    // Capture the completion handler so tests can invoke it.
    when(() => mockTts.setCompletionHandler(any())).thenAnswer((inv) {
      capturedCompletion =
          inv.positionalArguments[0] as VoidCallback;
    });
    when(() => mockTts.setErrorHandler(any())).thenReturn(null);
    when(() => mockTts.setCancelHandler(any())).thenReturn(null);

    service = TtsService.withTts(mockTts);
  });

  // -------------------------------------------------------------------------
  // Helper: wait for _init() to complete (async constructor body).
  // -------------------------------------------------------------------------
  Future<void> pumpInit() => Future<void>.delayed(Duration.zero);

  group('TtsService', () {
    // -----------------------------------------------------------------------
    // Initialization
    // -----------------------------------------------------------------------
    test('initialises TTS engine with Hebrew', () async {
      await pumpInit();
      verify(() => mockTts.setLanguage('he-IL')).called(1);
      verify(() => mockTts.setPitch(1.0)).called(1);
      verify(() => mockTts.setVolume(1.0)).called(1);
    });

    // -----------------------------------------------------------------------
    // speak()
    // -----------------------------------------------------------------------
    test('speak() sets state to playing and calls engine', () async {
      await pumpInit();

      final states = <TtsPlaybackState>[];
      service.stateStream.listen(states.add);

      await service.speak('Hello world. Goodbye.');
      // After speak resolves, state should be playing.
      expect(service.state, TtsPlaybackState.playing);
      expect(states, contains(TtsPlaybackState.playing));
      verify(() => mockTts.speak(any())).called(greaterThanOrEqualTo(1));
    });

    test('speak() with empty text stays idle', () async {
      await pumpInit();
      await service.speak('');
      expect(service.state, TtsPlaybackState.idle);
    });

    test('speak() strips HTML before splitting', () async {
      await pumpInit();
      await service.speak('<p>First sentence.</p> <b>Second sentence.</b>');
      expect(service.totalSentences, 2);
    });

    // -----------------------------------------------------------------------
    // pause() / resume()
    // -----------------------------------------------------------------------
    test('pause() changes state from playing to paused', () async {
      await pumpInit();
      await service.speak('Test sentence one. Test sentence two.');
      await service.pause();
      expect(service.state, TtsPlaybackState.paused);
      verify(() => mockTts.pause()).called(1);
    });

    test('resume() changes state from paused to playing', () async {
      await pumpInit();
      await service.speak('One. Two.');
      await service.pause();
      await service.resume();
      expect(service.state, TtsPlaybackState.playing);
    });

    test('pause() does nothing when idle', () async {
      await pumpInit();
      await service.pause();
      expect(service.state, TtsPlaybackState.idle);
      verifyNever(() => mockTts.pause());
    });

    // -----------------------------------------------------------------------
    // stop()
    // -----------------------------------------------------------------------
    test('stop() resets state to idle and clears sentences', () async {
      await pumpInit();
      await service.speak('One. Two. Three.');
      await service.stop();
      expect(service.state, TtsPlaybackState.idle);
      expect(service.totalSentences, 0);
      expect(service.currentSentenceIndex, 0);
    });

    // -----------------------------------------------------------------------
    // togglePlayPause()
    // -----------------------------------------------------------------------
    test('togglePlayPause() pauses when playing', () async {
      await pumpInit();
      await service.speak('Hello. World.');
      await service.togglePlayPause();
      expect(service.state, TtsPlaybackState.paused);
    });

    test('togglePlayPause() resumes when paused', () async {
      await pumpInit();
      await service.speak('Hello. World.');
      await service.togglePlayPause(); // pause
      await service.togglePlayPause(); // resume
      expect(service.state, TtsPlaybackState.playing);
    });

    // -----------------------------------------------------------------------
    // cycleSpeed()
    // -----------------------------------------------------------------------
    test('cycleSpeed() cycles through all presets', () async {
      await pumpInit();
      expect(service.speed, TtsSpeed.normal);
      await service.cycleSpeed();
      expect(service.speed, TtsSpeed.fast);
      await service.cycleSpeed();
      expect(service.speed, TtsSpeed.veryFast);
      await service.cycleSpeed();
      expect(service.speed, TtsSpeed.slow);
      await service.cycleSpeed();
      expect(service.speed, TtsSpeed.normal);
    });

    // -----------------------------------------------------------------------
    // skipForward()
    // -----------------------------------------------------------------------
    test('skipForward() advances sentence index', () async {
      await pumpInit();
      await service.speak('One. Two. Three.');
      expect(service.currentSentenceIndex, 0);
      await service.skipForward();
      expect(service.currentSentenceIndex, 1);
      expect(service.state, TtsPlaybackState.playing);
    });

    test('skipForward() does nothing at last sentence', () async {
      await pumpInit();
      await service.speak('Only one.');
      await service.skipForward();
      expect(service.currentSentenceIndex, 0);
    });

    test('skipForward() does nothing when idle', () async {
      await pumpInit();
      await service.skipForward();
      expect(service.currentSentenceIndex, 0);
    });

    // -----------------------------------------------------------------------
    // skipBackward()
    // -----------------------------------------------------------------------
    test('skipBackward() decrements sentence index', () async {
      await pumpInit();
      await service.speak('One. Two. Three.');
      await service.skipForward(); // index = 1
      await service.skipBackward(); // index = 0
      expect(service.currentSentenceIndex, 0);
      expect(service.state, TtsPlaybackState.playing);
    });

    test('skipBackward() does nothing at first sentence', () async {
      await pumpInit();
      await service.speak('One. Two.');
      await service.skipBackward();
      expect(service.currentSentenceIndex, 0);
    });

    // -----------------------------------------------------------------------
    // Completion handler — natural sentence advance
    // -----------------------------------------------------------------------
    test('completionHandler advances to next sentence', () async {
      await pumpInit();
      await service.speak('One. Two. Three.');
      expect(service.currentSentenceIndex, 0);

      // Simulate the engine finishing the first sentence.
      capturedCompletion?.call();
      // Allow microtask to settle.
      await Future<void>.delayed(Duration.zero);

      expect(service.currentSentenceIndex, 1);
    });

    test('completionHandler goes idle after last sentence', () async {
      await pumpInit();
      await service.speak('Only one.');
      expect(service.currentSentenceIndex, 0);

      capturedCompletion?.call();
      await Future<void>.delayed(Duration.zero);

      expect(service.state, TtsPlaybackState.idle);
    });

    // -----------------------------------------------------------------------
    // _suppressCompletion — the race condition fix
    // -----------------------------------------------------------------------
    test('stale completionHandler is suppressed during skipForward', () async {
      await pumpInit();
      await service.speak('One. Two. Three.');

      // Simulate: skipForward calls stop(), stale completion fires
      // BEFORE _speakCurrentSentence resolves.
      // We mock speak() to fire the stale completion mid-flight.
      var speakCallCount = 0;
      when(() => mockTts.speak(any())).thenAnswer((_) async {
        speakCallCount++;
        if (speakCallCount == 2) {
          // This is the speak() from skipForward's _speakCurrentSentence.
          // Simulate a stale completion callback arriving mid-await.
          capturedCompletion?.call();
        }
        return 1;
      });

      await service.skipForward(); // index should go 0→1
      // The stale completion MUST be suppressed — index should stay at 1,
      // not advance to 2.
      expect(service.currentSentenceIndex, 1);
    });

    test('stale completionHandler is suppressed during skipBackward', () async {
      await pumpInit();
      await service.speak('One. Two. Three.');
      await service.skipForward(); // index = 1

      var speakCallCount = 0;
      when(() => mockTts.speak(any())).thenAnswer((_) async {
        speakCallCount++;
        if (speakCallCount == 1) {
          // Stale completion from the stopped utterance.
          capturedCompletion?.call();
        }
        return 1;
      });

      await service.skipBackward(); // index should go 1→0
      expect(service.currentSentenceIndex, 0);
    });

    test('stale completionHandler is suppressed during stop()', () async {
      await pumpInit();
      await service.speak('One. Two. Three.');

      // Fire stale completion after stop.
      await service.stop();
      capturedCompletion?.call();
      await Future<void>.delayed(Duration.zero);

      // Should remain idle, index 0.
      expect(service.state, TtsPlaybackState.idle);
      expect(service.currentSentenceIndex, 0);
    });

    // -----------------------------------------------------------------------
    // Progress stream
    // -----------------------------------------------------------------------
    test('progress stream emits values between 0 and 1', () async {
      await pumpInit();

      final progressValues = <double>[];
      service.progressStream.listen(progressValues.add);

      await service.speak('One. Two. Three.');
      // Initial progress should be 0/3.
      expect(progressValues.last, closeTo(0.0, 0.01));

      await service.skipForward();
      // Progress should be 1/3.
      expect(progressValues.last, closeTo(0.333, 0.01));
    });

    // -----------------------------------------------------------------------
    // estimateReadingTime (static)
    // -----------------------------------------------------------------------
    test('estimateReadingTime returns reasonable duration', () {
      // 150 words at normal speed → 1 minute.
      final words = List.generate(150, (i) => 'word$i').join(' ');
      final duration = TtsService.estimateReadingTime(words);
      expect(duration.inSeconds, closeTo(60, 5));
    });

    test('estimateReadingTime strips HTML', () {
      const html = '<p>Hello</p> <b>world</b>';
      final duration = TtsService.estimateReadingTime(html);
      expect(duration.inSeconds, greaterThan(0));
    });

    test('estimateReadingTime scales with speed', () {
      final text = List.generate(150, (i) => 'word$i').join(' ');
      final normal = TtsService.estimateReadingTime(text);
      final fast =
          TtsService.estimateReadingTime(text, speed: TtsSpeed.fast);
      expect(fast.inSeconds, lessThan(normal.inSeconds));
    });

    // -----------------------------------------------------------------------
    // Sentence splitting
    // -----------------------------------------------------------------------
    test('speak() splits sentences on punctuation', () async {
      await pumpInit();
      await service.speak('First. Second! Third?');
      expect(service.totalSentences, 3);
    });

    test('speak() chunks long text without punctuation', () async {
      await pumpInit();
      final longText = List.generate(100, (i) => 'word$i').join(' ');
      await service.speak(longText);
      expect(service.totalSentences, greaterThan(1));
    });

    // -----------------------------------------------------------------------
    // dispose()
    // -----------------------------------------------------------------------
    test('dispose() stops engine and closes streams', () async {
      await pumpInit();
      await service.dispose();
      verify(() => mockTts.stop()).called(greaterThanOrEqualTo(1));
    });
  });
}
