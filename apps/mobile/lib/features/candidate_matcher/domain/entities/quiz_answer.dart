/// User's answer to a policy statement.
///
/// Maps to the backend `QuizAnswer` enum values: agree, disagree, skip.
enum QuizAnswer {
  agree('agree'),
  disagree('disagree'),
  skip('skip');

  final String value;
  const QuizAnswer(this.value);
}
