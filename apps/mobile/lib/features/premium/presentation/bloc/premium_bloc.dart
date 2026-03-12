import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/usecases/get_subscription.dart';
import '../../domain/repositories/premium_repository.dart';
import 'premium_event.dart';
import 'premium_state.dart';

/// Manages the state of the Premium subscription screen.
///
/// Handles loading subscription info, displaying benefits,
/// and processing cancellation requests.
@injectable
class PremiumBloc extends Bloc<PremiumEvent, PremiumState> {
  final GetSubscription _getSubscription;
  final PremiumRepository _premiumRepository;

  PremiumBloc(
    this._getSubscription,
    this._premiumRepository,
  ) : super(const PremiumInitial()) {
    on<LoadSubscription>(_onLoadSubscription);
    on<CancelSubscription>(_onCancelSubscription);
  }

  /// Loads the user's subscription info and VIP benefits.
  Future<void> _onLoadSubscription(
    LoadSubscription event,
    Emitter<PremiumState> emit,
  ) async {
    emit(const PremiumLoading());

    final result = await _getSubscription(const NoParams());

    result.fold(
      (failure) => emit(PremiumError(
        message: failure.message ?? 'Failed to load subscription info',
      )),
      (info) => emit(PremiumLoaded(
        subscriptionInfo: info,
        benefits: info?.benefits ?? [],
      )),
    );
  }

  /// Cancels the user's active subscription.
  Future<void> _onCancelSubscription(
    CancelSubscription event,
    Emitter<PremiumState> emit,
  ) async {
    final currentState = state;
    if (currentState is! PremiumLoaded) return;

    emit(const PremiumLoading());

    final result = await _premiumRepository.cancelSubscription();

    result.fold(
      (failure) => emit(PremiumError(
        message: failure.message ?? 'Failed to cancel subscription',
      )),
      (cancelledInfo) => emit(PremiumLoaded(
        subscriptionInfo: cancelledInfo,
        benefits: currentState.benefits,
      )),
    );
  }
}
