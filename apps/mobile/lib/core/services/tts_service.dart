import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:injectable/injectable.dart';

/// Text-to-speech playback state.
enum TtsPlaybackState { idle, playing, paused }

/// Available speech speed presets.
enum TtsSpeed {
  slow(0.35, '0.5x'),
  normal(0.45, '1x'),
  fast(0.55, '1.5x'),
  veryFast(0.65, '2x');

  final double rate;
  final String label;
  const TtsSpeed(this.rate, this.label);
}

/// Service wrapping [FlutterTts] for article reading.
///
/// Provides play/pause/stop controls, speed selection, and progress tracking.
/// Defaults to Hebrew (he-IL). Gracefully degrades on unsupported platforms.
@lazySingleton
class TtsService {
  final FlutterTts _tts;

  static const String _speedKey = 'tts_speed_index';

  bool _isAvailable = true;
  bool get isAvailable => _isAvailable;

  TtsPlaybackState _state = TtsPlaybackState.idle;
  TtsPlaybackState get state => _state;

  TtsSpeed _speed = TtsSpeed.normal;
  TtsSpeed get speed => _speed;

  final _stateController = StreamController<TtsPlaybackState>.broadcast();
  Stream<TtsPlaybackState> get stateStream => _stateController.stream;

  final _progressController = StreamController<double>.broadcast();
  Stream<double> get progressStream => _progressController.stream;

  final _speedController = StreamController<TtsSpeed>.broadcast();
  Stream<TtsSpeed> get speedStream => _speedController.stream;

  List<String> _sentences = [];
  int _currentSentenceIndex = 0;
  int get currentSentenceIndex => _currentSentenceIndex;
  int get totalSentences => _sentences.length;

  /// Suppresses the completionHandler during explicit skip/stop operations.
  bool _suppressCompletion = false;

  TtsService() : _tts = FlutterTts() {
    _loadSpeed();
    _init();
  }

  /// Test-only constructor that accepts a mock [FlutterTts].
  @visibleForTesting
  TtsService.withTts(FlutterTts tts) : _tts = tts {
    _loadSpeed();
    _init();
  }

  Future<void> _init() async {
    try {
      await _tts.setLanguage('he-IL');
      await _tts.setSpeechRate(_speed.rate);
      await _tts.setPitch(1.0);
      await _tts.setVolume(1.0);

      _tts.setCompletionHandler(() {
        debugPrint('TTS completionHandler — suppress=$_suppressCompletion, index=$_currentSentenceIndex/${_sentences.length}');
        if (_suppressCompletion) {
          debugPrint('TTS completionHandler SUPPRESSED');
          return;
        }
        _currentSentenceIndex++;
        debugPrint('TTS completionHandler advanced to index=$_currentSentenceIndex');
        if (_currentSentenceIndex < _sentences.length) {
          _emitProgress();
          _stateController.add(_state);
          _speakCurrentSentence();
        } else {
          debugPrint('TTS completionHandler — reached end, going idle');
          _state = TtsPlaybackState.idle;
          _stateController.add(_state);
          _progressController.add(1.0);
        }
      });

      _tts.setErrorHandler((msg) {
        debugPrint('TTS error: $msg');
        _state = TtsPlaybackState.idle;
        _stateController.add(_state);
      });

      _tts.setCancelHandler(() {
        // No-op — stop() manages state directly. The native cancel fires
        // asynchronously and would cause race conditions if it touched state.
      });

      _isAvailable = true;
    } catch (e) {
      debugPrint('TTS not available on this platform: $e');
      _isAvailable = false;
    }
  }

  /// Starts reading the given [text] aloud.
  Future<void> speak(String text) async {
    if (!_isAvailable) return;

    _suppressCompletion = true;
    try {
      await _tts.stop();
    } catch (_) {}

    final stripped = _stripHtml(text);
    _sentences = _splitSentences(stripped);
    _currentSentenceIndex = 0;

    if (_sentences.isEmpty) return;

    _state = TtsPlaybackState.playing;
    _stateController.add(_state);
    _emitProgress();
    await _speakCurrentSentence();
  }

  /// Pauses the current reading.
  Future<void> pause() async {
    if (!_isAvailable || _state != TtsPlaybackState.playing) return;
    try {
      await _tts.pause();
      _state = TtsPlaybackState.paused;
      _stateController.add(_state);
    } catch (e) {
      debugPrint('TTS pause failed: $e');
    }
  }

  /// Resumes reading from where it was paused.
  Future<void> resume() async {
    if (!_isAvailable || _state != TtsPlaybackState.paused) return;
    _state = TtsPlaybackState.playing;
    _stateController.add(_state);
    await _speakCurrentSentence();
  }

  /// Stops reading and resets progress.
  Future<void> stop() async {
    _suppressCompletion = true;
    try {
      await _tts.stop();
    } catch (e) {
      debugPrint('TTS stop failed: $e');
    }
    _state = TtsPlaybackState.idle;
    _stateController.add(_state);
    _currentSentenceIndex = 0;
    _sentences = [];
    _progressController.add(0.0);
  }

  /// Toggle between play and pause.
  Future<void> togglePlayPause() async {
    if (!_isAvailable) return;
    switch (_state) {
      case TtsPlaybackState.playing:
        await pause();
      case TtsPlaybackState.paused:
        await resume();
      case TtsPlaybackState.idle:
        break;
    }
  }

  /// Estimated reading duration based on current speed and sentence count.
  Duration? get estimatedDuration {
    if (_sentences.isEmpty) return null;
    // Average Hebrew speech: ~150 words/min at normal speed.
    // Scale by speed ratio relative to normal.
    const wordsPerMinAtNormal = 150.0;
    final speedFactor = _speed.rate / TtsSpeed.normal.rate;
    final totalWords = _sentences.join(' ').split(RegExp(r'\s+')).length;
    final minutes = totalWords / (wordsPerMinAtNormal * speedFactor);
    return Duration(seconds: (minutes * 60).ceil());
  }

  /// Estimates reading duration for raw text without starting playback.
  static Duration estimateReadingTime(String text, {TtsSpeed speed = TtsSpeed.normal}) {
    final stripped = text
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll(RegExp(r'&\w+;'), ' ')
        .trim();
    const wordsPerMinAtNormal = 150.0;
    final speedFactor = speed.rate / TtsSpeed.normal.rate;
    final totalWords = stripped.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).length;
    final minutes = totalWords / (wordsPerMinAtNormal * speedFactor);
    return Duration(seconds: (minutes * 60).ceil());
  }

  /// Cycles to the next speed preset.
  Future<void> cycleSpeed() async {
    final values = TtsSpeed.values;
    final nextIndex = (values.indexOf(_speed) + 1) % values.length;
    _speed = values[nextIndex];
    _speedController.add(_speed);
    _saveSpeed();
    try {
      await _tts.setSpeechRate(_speed.rate);
    } catch (_) {}
  }

  /// Skip forward by one sentence.
  Future<void> skipForward() async {
    debugPrint('TTS skipForward() — index=$_currentSentenceIndex/${_sentences.length}, state=$_state, suppress=$_suppressCompletion');
    if (!_isAvailable || _state == TtsPlaybackState.idle) return;
    if (_currentSentenceIndex + 1 >= _sentences.length) return;
    _suppressCompletion = true;
    debugPrint('TTS skipForward: stopping engine...');
    try {
      await _tts.stop();
    } catch (_) {}
    _currentSentenceIndex++;
    debugPrint('TTS skipForward: index now=$_currentSentenceIndex, speaking sentence: "${_sentences[_currentSentenceIndex].substring(0, _sentences[_currentSentenceIndex].length.clamp(0, 40))}"');
    _emitProgress();
    _state = TtsPlaybackState.playing;
    _stateController.add(_state);
    await _speakCurrentSentence();
    debugPrint('TTS skipForward: done — index=$_currentSentenceIndex, suppress=$_suppressCompletion');
  }

  /// Skip backward by one sentence.
  Future<void> skipBackward() async {
    debugPrint('TTS skipBackward() — index=$_currentSentenceIndex/${_sentences.length}, state=$_state, suppress=$_suppressCompletion');
    if (!_isAvailable || _state == TtsPlaybackState.idle) {
      debugPrint('TTS skipBackward: aborted — idle or unavailable');
      return;
    }
    if (_currentSentenceIndex <= 0) {
      debugPrint('TTS skipBackward: aborted — already at first sentence');
      return;
    }
    _suppressCompletion = true;
    debugPrint('TTS skipBackward: stopping engine...');
    try {
      await _tts.stop();
    } catch (_) {}
    debugPrint('TTS skipBackward: engine stopped — index=$_currentSentenceIndex, suppress=$_suppressCompletion');
    _currentSentenceIndex--;
    debugPrint('TTS skipBackward: index now=$_currentSentenceIndex, speaking sentence: "${_sentences[_currentSentenceIndex].substring(0, _sentences[_currentSentenceIndex].length.clamp(0, 40))}"');
    _emitProgress();
    _state = TtsPlaybackState.playing;
    _stateController.add(_state);
    await _speakCurrentSentence();
    debugPrint('TTS skipBackward: done — index=$_currentSentenceIndex, suppress=$_suppressCompletion');
  }

  Future<void> _speakCurrentSentence() async {
    debugPrint('TTS _speakCurrentSentence() — index=$_currentSentenceIndex/${_sentences.length}, suppress=$_suppressCompletion');
    if (_currentSentenceIndex >= _sentences.length) return;
    try {
      await _tts.speak(_sentences[_currentSentenceIndex]);
    } catch (e) {
      debugPrint('TTS speak failed: $e');
      _state = TtsPlaybackState.idle;
      _stateController.add(_state);
    }
    // Only now is it safe to honour completion callbacks — the new utterance
    // is registered with the engine, so any callback that arrives belongs to it.
    debugPrint('TTS _speakCurrentSentence: resetting suppress to false (was=$_suppressCompletion), index=$_currentSentenceIndex');
    _suppressCompletion = false;
  }

  void _loadSpeed() {
    try {
      final box = Hive.box<String>('app_settings');
      final stored = box.get(_speedKey);
      if (stored != null) {
        final index = int.tryParse(stored);
        if (index != null && index >= 0 && index < TtsSpeed.values.length) {
          _speed = TtsSpeed.values[index];
        }
      }
    } catch (_) {
      // Box not open yet or other Hive error — use default speed.
    }
  }

  void _saveSpeed() {
    try {
      final box = Hive.box<String>('app_settings');
      box.put(_speedKey, TtsSpeed.values.indexOf(_speed).toString());
    } catch (_) {
      // Silently fail — speed will just not persist.
    }
  }

  void _emitProgress() {
    if (_sentences.isEmpty) return;
    final progress = _currentSentenceIndex / _sentences.length;
    _progressController.add(progress.clamp(0.0, 1.0));
  }

  String _stripHtml(String html) {
    return html
        .replaceAll(RegExp(r'<br\s*/?>'), '\n')
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll(RegExp(r'&nbsp;'), ' ')
        .replaceAll(RegExp(r'&amp;'), '&')
        .replaceAll(RegExp(r'&lt;'), '<')
        .replaceAll(RegExp(r'&gt;'), '>')
        .replaceAll(RegExp(r'&quot;'), '"')
        .replaceAll(RegExp(r'\n{3,}'), '\n\n')
        .trim();
  }

  List<String> _splitSentences(String text) {
    final sentences = text
        .split(RegExp(r'(?<=[.!?。\n])\s+'))
        .where((s) => s.trim().isNotEmpty)
        .toList();

    if (sentences.length <= 1 && text.length > 200) {
      final chunks = <String>[];
      final words = text.split(' ');
      var current = StringBuffer();
      for (final word in words) {
        if (current.length + word.length > 150 && current.isNotEmpty) {
          chunks.add(current.toString().trim());
          current = StringBuffer();
        }
        current.write('$word ');
      }
      if (current.isNotEmpty) {
        chunks.add(current.toString().trim());
      }
      return chunks;
    }

    return sentences;
  }

  @disposeMethod
  Future<void> dispose() async {
    try {
      await _tts.stop();
    } catch (_) {}
    await _stateController.close();
    await _progressController.close();
    await _speedController.close();
  }
}
