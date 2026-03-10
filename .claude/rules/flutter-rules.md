# Flutter Rules (apps/mobile)

## Clean Architecture — every feature follows this structure:
```
features/{feature_name}/
├── data/
│   ├── datasources/     # Remote (API) + Local (Hive cache)
│   ├── models/          # @JsonSerializable DTOs with toEntity()
│   └── repositories/    # Repository implementations
├── domain/
│   ├── entities/        # Immutable business objects
│   ├── repositories/    # Abstract contracts (interfaces)
│   └── usecases/        # Single-purpose use cases returning Either<Failure, T>
└── presentation/
    ├── bloc/            # BLoC + Events + States
    ├── pages/           # Screen-level widgets
    └── widgets/         # Feature-specific widgets
```

## BLoC Pattern (sealed classes + Equatable):
- Events: `sealed class {Feature}Event extends Equatable` with concrete subclasses
- States: `sealed class {Feature}State extends Equatable` with concrete subclasses (Initial, Loading, Loaded, Error)
- Manual `props` override for equality, manual `copyWith()` for states
- NO @freezed — we use sealed classes + Equatable throughout
- Use `Either<Failure, T>` from dartz for error handling
- One BLoC per feature, provided at the page level
- No BLoC-to-BLoC direct communication — use streams or shared use cases

## Dependency Injection:
- `get_it` as service locator, `injectable` for auto-registration
- `@injectable` for transient, `@lazySingleton` for singletons
- All DI configured in `app/di.dart` -> auto-generated `di.config.dart`

## Naming Conventions:
- Files: `snake_case.dart`
- Classes: `PascalCase`
- BLoC files: `{feature}_bloc.dart`, `{feature}_event.dart`, `{feature}_state.dart`
- Models: `{entity}_model.dart` (data layer)
- Entities: `{entity}.dart` (domain layer)
- Use cases: `get_{noun}.dart`, `toggle_{noun}.dart`, `record_{noun}.dart`

## RTL & Localization:
- Always use `EdgeInsetsDirectional` (start/end, NOT left/right)
- `TextDirection.rtl` as default
- All user-facing strings in `assets/l10n/he.json` first, then `en.json`
- Use `.tr()` from easy_localization (remove `const` from parent widgets when using)
- `easy_localization` exports `TextDirection` — add `hide TextDirection` when file uses `TextDirection.rtl`

## Navigation:
- go_router with StatefulShellRoute for 5 bottom tabs
- Router config: `apps/mobile/lib/app/router.dart`

## Common Pitfalls:
- Use `Color.withValues(alpha:)` not deprecated `withOpacity()`
- Use `Share.share()` not deprecated `Share.shareWithResult()` (share_plus ^10)
- BLoC stream callbacks: use internal events (e.g., `_SseDisconnected`) to emit state
- No direct API calls from UI: always UseCase -> Repository -> DataSource
